# 🔨 PUSHER & ONESIGNAL - IMPLEMENTATION GUIDE

Panduan lengkap untuk mengaktifkan Pusher dan OneSignal di Eksporyuk.

---

## PHASE 1: Enable OneSignal Push Notifications

### Step 1: Add OneSignal SDK to Root Layout

**File**: `/src/app/layout.tsx`

```typescript
import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        {/* OneSignal Web SDK */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.js"
          onLoad={() => {
            if (typeof window !== 'undefined' && (window as any).OneSignal) {
              (window as any).OneSignal.init({
                appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
              })
              
              // Request permission
              if ((window as any).OneSignal.NotificationPermission.permission === false) {
                (window as any).OneSignal.Slidedown.promptPush()
              }
            }
          }}
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Step 2: Capture OneSignal Player ID

**File**: `/src/hooks/use-onesignal.ts` (NEW)

```typescript
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useOneSignal() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id || typeof window === 'undefined') return

    const capturePlayerId = async () => {
      if (!(window as any).OneSignal) return

      try {
        const playerId = await (window as any).OneSignal.getUserId()
        
        if (playerId && session.user.id) {
          // Save to user profile
          await fetch('/api/user/onesignal-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId })
          })
        }
      } catch (error) {
        console.error('[OneSignal] Failed to capture player ID:', error)
      }
    }

    // Give OneSignal time to initialize
    const timer = setTimeout(capturePlayerId, 2000)
    return () => clearTimeout(timer)
  }, [session?.user?.id])
}
```

### Step 3: API Endpoint to Store Player ID

**File**: `/src/app/api/user/onesignal-id/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: 'PlayerId required' }, { status: 400 })
    }

    // Save player ID to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { oneSignalPlayerId: playerId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[OneSignal API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save player ID' },
      { status: 500 }
    )
  }
}
```

### Step 4: Use Hook in App

**File**: `/src/app/layout.tsx`

```typescript
'use client'

import { useOneSignal } from '@/hooks/use-onesignal'

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  useOneSignal() // Capture player ID on mount

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootLayoutContent>{children}</RootLayoutContent>
}
```

---

## PHASE 2: Wire Pusher Channels

### Step 1: Create Pusher Subscription Hook

**File**: `/src/hooks/use-pusher-notification.ts` (NEW)

```typescript
import { useEffect, useCallback } from 'react'
import Pusher from 'pusher-js'

interface NotificationData {
  id: string
  title: string
  content: string
  type: 'mention' | 'comment' | 'like' | 'purchase' | 'message'
  url?: string
  data?: Record<string, any>
}

export function usePusherNotification(
  userId: string | undefined,
  onNotification: (notification: NotificationData) => void
) {
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      console.warn('[Pusher] Not configured')
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true
    })

    // Subscribe to user-specific channel
    const channel = pusher.subscribe(`user-${userId}`)

    // Listen for notifications
    channel.bind('notification', (data: NotificationData) => {
      console.log('[Pusher] Notification received:', data)
      onNotification(data)
    })

    return () => {
      pusher.unsubscribe(`user-${userId}`)
      pusher.disconnect()
    }
  }, [userId, onNotification])
}
```

### Step 2: Create Notification UI Component

**File**: `/src/components/notifications/NotificationCenter.tsx` (NEW)

```typescript
'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePusherNotification } from '@/hooks/use-pusher-notification'
import { useSession } from 'next-auth/react'

interface Notification {
  id: string
  title: string
  content: string
  type: string
  url?: string
  timestamp: number
}

export default function NotificationCenter() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  usePusherNotification(session?.user?.id, (notification) => {
    setNotifications(prev => [
      {
        ...notification,
        timestamp: Date.now()
      },
      ...prev
    ].slice(0, 10)) // Keep last 10

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  })

  const unreadCount = notifications.length

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (notif.url) {
                      window.location.href = notif.url
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        {notif.content}
                      </p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setNotifications(prev =>
                          prev.filter(n => n.id !== notif.id)
                        )
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Step 3: Add to App Layout

**File**: `/src/components/layout/Header.tsx`

```typescript
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default function Header() {
  return (
    <header>
      <nav className="flex items-center justify-end gap-4">
        <NotificationCenter />
        {/* Other nav items */}
      </nav>
    </header>
  )
}
```

---

## PHASE 3: Wire Notification Events

### Step 1: Send Mention Notifications (Already has Pusher)

**File**: `/src/app/api/notifications/mention/route.ts` (UPDATE)

```typescript
import { pusherService } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  try {
    const { postId, mentionedUserIds } = await request.json()

    // Send Pusher notification (real-time for online users)
    for (const userId of mentionedUserIds) {
      await pusherService.notifyUser(userId, 'notification', {
        id: `mention-${postId}`,
        title: 'New Mention',
        content: 'Someone mentioned you in a post',
        type: 'mention',
        url: `/posts/${postId}`
      })
    }

    // Also send OneSignal for offline users
    await Promise.all(
      mentionedUserIds.map(userId =>
        smartNotificationService.send(userId, {
          title: 'New Mention',
          content: 'Someone mentioned you in a post',
          url: `/posts/${postId}`,
          channels: {
            pusher: true,
            onesignal: true
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
```

### Step 2: Send Comment Notifications (NEW)

**File**: `/src/app/api/comments/[id]/notify/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { pusherService } from '@/lib/pusher'
import { smartNotificationService } from '@/lib/services/smartNotificationService'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { commentText, authorId, postId } = await request.json()

    // Get post author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    })

    if (!post || post.authorId === authorId) {
      return NextResponse.json({ success: true })
    }

    // Notify post author
    await pusherService.notifyUser(post.authorId, 'notification', {
      id: `comment-${params.id}`,
      title: 'New Comment',
      content: commentText.substring(0, 50) + '...',
      type: 'comment',
      url: `/posts/${postId}`
    })

    // Also send OneSignal
    await smartNotificationService.send(post.authorId, {
      title: 'New Comment',
      content: commentText.substring(0, 100),
      url: `/posts/${postId}`,
      channels: { pusher: true, onesignal: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Comment Notify]', error)
    return NextResponse.json(
      { error: 'Failed to notify' },
      { status: 500 }
    )
  }
}
```

### Step 3: Send Purchase Notifications

**File**: `/src/app/api/webhooks/payment-success/route.ts` (UPDATE)

```typescript
import { pusherService } from '@/lib/pusher'
import { smartNotificationService } from '@/lib/services/smartNotificationService'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, productName } = await request.json()

    // Real-time for online
    await pusherService.notifyUser(userId, 'notification', {
      id: `purchase-${Date.now()}`,
      title: 'Payment Confirmed',
      content: `Your purchase of ${productName} is confirmed`,
      type: 'purchase',
      url: '/my-purchases'
    })

    // Also offline push
    await smartNotificationService.send(userId, {
      title: 'Payment Confirmed',
      content: `Your purchase of ${productName} (Rp ${amount.toLocaleString('id-ID')}) is confirmed`,
      url: '/my-purchases',
      channels: { pusher: true, onesignal: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Payment Notify]', error)
    return NextResponse.json(
      { error: 'Failed to notify' },
      { status: 500 }
    )
  }
}
```

---

## Environment Variables

```bash
# Pusher (Real-Time)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap1

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap1

# OneSignal (Push Notifications)
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_API_KEY=your_rest_api_key

NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id
```

---

## Testing

### Test Pusher (Real-Time)
```bash
curl -X POST http://localhost:3000/api/test/pusher \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "title": "Test", "content": "Hello"}'
```

### Test OneSignal (Push)
```bash
curl -X POST http://localhost:3000/api/test/onesignal \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "title": "Test", "content": "Hello"}'
```

---

**Effort**: ~2-3 days for full implementation  
**Value**: Real-time user engagement through notifications
