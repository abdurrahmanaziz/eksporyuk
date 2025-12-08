# OneSignal - Missing Features Implementation Guide

## 1️⃣ BROWSER SUBSCRIPTION SYNC (Player ID → Database)

### Current Issue
- OneSignal generates Player ID on browser
- Player ID is NOT automatically synced to backend
- Admin sees subscriber but can't link to user account

### Solution: Add API Endpoint for Subscription Sync

**File:** `/src/app/api/users/onesignal-sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { playerId, tags } = body

    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
    }

    // Update user with OneSignal Player ID
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        oneSignalPlayerId: playerId,
        oneSignalSubscribedAt: new Date(),
        oneSignalTags: tags || {}
      },
      select: {
        id: true,
        oneSignalPlayerId: true,
        oneSignalSubscribedAt: true
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error syncing OneSignal:', error)
    return NextResponse.json(
      { error: 'Failed to sync' },
      { status: 500 }
    )
  }
}
```

### Update OneSignalProvider to Call This

**File:** `/src/components/providers/OneSignalProvider.tsx`

```typescript
'use client'

import { useEffect, useSession } from '@next-auth/react'

export default function OneSignalProvider() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!window.OneSignal) return
    if (!session?.user?.id) return

    const initOneSignal = async () => {
      try {
        // Set external user ID
        await window.OneSignal.login(session.user.id)

        // Get player ID
        const playerId = await window.OneSignal.User.onesignalId

        if (playerId) {
          // Sync to backend
          await fetch('/api/users/onesignal-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId,
              tags: {
                email: session.user.email,
                role: session.user.role,
                userId: session.user.id
              }
            })
          })
        }
      } catch (error) {
        console.error('OneSignal sync error:', error)
      }
    }

    initOneSignal()
  }, [session?.user?.id])

  return null
}
```

---

## 2️⃣ EVENT WEBHOOKS (Track Opens, Clicks, Conversions)

### Current Issue
- Can't track who opened/clicked notifications
- No conversion attribution
- Analytics incomplete

### Solution: Implement Webhook Handler

**File:** `/src/app/api/webhooks/onesignal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Verify OneSignal webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-OneSignal-Signature')
    const body = await request.text()

    // Verify signature
    const secret = process.env.ONESIGNAL_WEBHOOK_SECRET || ''
    if (!verifyWebhookSignature(body, signature || '', secret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    // Handle different event types
    switch (event.type) {
      case 'notification.delivered':
        await handleNotificationDelivered(event)
        break
      case 'notification.opened':
        await handleNotificationOpened(event)
        break
      case 'notification.clicked':
        await handleNotificationClicked(event)
        break
      case 'notification.bounced':
        await handleNotificationBounced(event)
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleNotificationDelivered(event: any) {
  // Log delivery event
  await prisma.notificationDeliveryLog.create({
    data: {
      notificationId: event.notification_id,
      playerIds: event.player_ids,
      status: 'delivered',
      timestamp: new Date(event.timestamp * 1000)
    }
  })
}

async function handleNotificationOpened(event: any) {
  // Update notification stats
  const data = JSON.parse(event.data)
  await prisma.notificationDeliveryLog.updateMany({
    where: {
      notificationId: event.notification_id,
      playerIds: { has: data.player_id }
    },
    data: {
      status: 'opened',
      openedAt: new Date()
    }
  })
}

async function handleNotificationClicked(event: any) {
  const data = JSON.parse(event.data)
  
  // Track click event
  await prisma.notificationClickLog.create({
    data: {
      notificationId: event.notification_id,
      playerId: data.player_id,
      url: data.url,
      timestamp: new Date()
    }
  })

  // Find user by player ID and track action
  const user = await prisma.user.findFirst({
    where: { oneSignalPlayerId: data.player_id }
  })

  if (user) {
    // Could trigger conversion/event tracking here
    await prisma.conversionEvent.create({
      data: {
        userId: user.id,
        type: 'notification_click',
        notificationId: event.notification_id,
        url: data.url,
        timestamp: new Date()
      }
    })
  }
}

async function handleNotificationBounced(event: any) {
  // Handle failed delivery
  const data = JSON.parse(event.data)
  
  // Unsubscribe user if bounced
  await prisma.user.updateMany({
    where: { oneSignalPlayerId: data.player_id },
    data: {
      oneSignalPlayerId: null,
      oneSignalSubscribedAt: null
    }
  })
}
```

### Schema Changes Needed

```prisma
model NotificationDeliveryLog {
  id                String   @id @default(cuid())
  notificationId    String
  playerIds         String[] // Array of player IDs
  status            String   // delivered, opened, clicked, bounced
  openedAt          DateTime?
  clickedAt         DateTime?
  timestamp         DateTime @default(now())
  
  @@index([notificationId])
  @@index([timestamp])
}

model NotificationClickLog {
  id              String   @id @default(cuid())
  notificationId  String
  playerId        String
  url             String?
  timestamp       DateTime @default(now())
  
  @@index([notificationId])
  @@index([playerId])
}

model ConversionEvent {
  id              String   @id @default(cuid())
  userId          String
  type            String   // notification_click, purchase, etc
  notificationId  String?
  url             String?
  timestamp       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([timestamp])
}
```

---

## 3️⃣ GDPR COMPLIANCE & CONSENT TRACKING

### Current Issue
- No consent tracking for GDPR
- No unsubscribe link
- Privacy not tracked

### Solution: Add Consent Model

**File:** `/src/app/api/users/notification-consent/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { consentGiven, channels, purpose, ipAddress } = body

    // Record consent
    await prisma.notificationConsent.create({
      data: {
        userId: session.user.id,
        consentGiven,
        channels: channels || {},
        purpose: purpose || 'notifications',
        ipAddress,
        userAgent: request.headers.get('user-agent') || '',
        timestamp: new Date(),
        consentExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    })

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationConsentGiven: consentGiven,
        notificationConsentAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording consent:', error)
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consent = await prisma.notificationConsent.findFirst({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'desc' }
    })

    return NextResponse.json({ consent })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch consent' },
      { status: 500 }
    )
  }
}
```

### Schema

```prisma
model NotificationConsent {
  id              String   @id @default(cuid())
  userId          String   @unique
  consentGiven    Boolean
  channels        Json     // { email: true, push: true, sms: false }
  purpose         String   // "marketing", "notifications", "both"
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime @default(now())
  consentExpiry   DateTime // When consent expires
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

---

## 4️⃣ BEHAVIOR-BASED SEGMENTATION

### Current Issue
- Only role/province segmentation
- Can't target active vs inactive users
- Can't segment by engagement level

### Solution: Auto-Segment User Groups

**File:** `/src/lib/services/segmentationService.ts`

```typescript
import { prisma } from '@/lib/prisma'

export async function createBehaviorSegments() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Active Users (logged in last 7 days)
  const activeUsers = await prisma.user.findMany({
    where: {
      lastActiveAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      oneSignalPlayerId: { not: null }
    },
    select: { id: true, oneSignalPlayerId: true }
  })

  // At-Risk Users (inactive 30+ days)
  const atRiskUsers = await prisma.user.findMany({
    where: {
      lastActiveAt: {
        gte: ninetyDaysAgo,
        lte: thirtyDaysAgo
      },
      oneSignalPlayerId: { not: null }
    },
    select: { id: true, oneSignalPlayerId: true }
  })

  // Churned Users (inactive 90+ days)
  const churnedUsers = await prisma.user.findMany({
    where: {
      lastActiveAt: { lte: ninetyDaysAgo },
      oneSignalPlayerId: { not: null }
    },
    select: { id: true, oneSignalPlayerId: true }
  })

  // High Engagement Users (10+ posts in last 30 days)
  const highEngagement = await prisma.user.findMany({
    where: {
      _count: { posts: { gte: 10 } },
      createdAt: { gte: thirtyDaysAgo },
      oneSignalPlayerId: { not: null }
    },
    select: { id: true, oneSignalPlayerId: true }
  })

  // Save segments
  await Promise.all([
    saveSegment('active_users', activeUsers),
    saveSegment('at_risk_users', atRiskUsers),
    saveSegment('churned_users', churnedUsers),
    saveSegment('high_engagement', highEngagement)
  ])
}

async function saveSegment(name: string, users: any[]) {
  await prisma.userSegment.upsert({
    where: { name },
    create: {
      name,
      description: `Auto-generated: ${name}`,
      userCount: users.length,
      playerIds: users.map(u => u.oneSignalPlayerId).filter(Boolean),
      updatedAt: new Date()
    },
    update: {
      userCount: users.length,
      playerIds: users.map(u => u.oneSignalPlayerId).filter(Boolean),
      updatedAt: new Date()
    }
  })
}
```

---

## 5️⃣ PERSONALIZATION WITH MERGE TAGS

### Current Issue
- All notifications say "Hi there"
- Can't use user name, role, etc
- Not feeling personal

### Solution: Template Merge Tags

**File:** `/src/lib/onesignal-helper.ts`

```typescript
export interface MergeTagData {
  firstName: string
  lastName: string
  email: string
  role: string
  membershipTier: string
  city: string
  joinDate: string
}

export function replaceMergeTags(
  content: string,
  data: MergeTagData
): string {
  return content
    .replace(/\{firstName\}/g, data.firstName)
    .replace(/\{lastName\}/g, data.lastName)
    .replace(/\{fullName\}/g, `${data.firstName} ${data.lastName}`)
    .replace(/\{email\}/g, data.email)
    .replace(/\{role\}/g, data.role)
    .replace(/\{tier\}/g, data.membershipTier)
    .replace(/\{city\}/g, data.city)
    .replace(/\{joinDate\}/g, data.joinDate)
}

export async function sendPersonalizedNotifications(
  template: {
    title: string
    message: string
    url?: string
  },
  userIds: string[]
) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      city: true,
      createdAt: true,
      membership: { select: { tier: true } },
      oneSignalPlayerId: true
    }
  })

  for (const user of users) {
    const [firstName, ...lastNameParts] = user.name.split(' ')
    const mergeData: MergeTagData = {
      firstName,
      lastName: lastNameParts.join(' '),
      email: user.email,
      role: user.role,
      membershipTier: user.membership?.tier || 'FREE',
      city: user.city || 'Indonesia',
      joinDate: user.createdAt.toLocaleDateString('id-ID')
    }

    const personalizedTitle = replaceMergeTags(template.title, mergeData)
    const personalizedMessage = replaceMergeTags(template.message, mergeData)

    // Send via OneSignal
    await sendOneSignalNotification({
      headings: { en: personalizedTitle },
      contents: { en: personalizedMessage },
      url: template.url,
      include_player_ids: [user.oneSignalPlayerId!]
    })
  }
}
```

---

## 📋 SCHEMA ADDITIONS NEEDED

Add to `prisma/schema.prisma`:

```prisma
model UserSegment {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  userCount   Int      @default(0)
  playerIds   String[] // OneSignal player IDs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([name])
}

model NotificationConsent {
  id            String   @id @default(cuid())
  userId        String   @unique
  consentGiven  Boolean
  channels      Json
  purpose       String
  ipAddress     String?
  userAgent     String?
  timestamp     DateTime @default(now())
  consentExpiry DateTime
  
  user          User     @relation(fields: [userId], references: [id])
}

model NotificationDeliveryLog {
  id              String   @id @default(cuid())
  notificationId  String
  playerIds       String[]
  status          String
  openedAt        DateTime?
  clickedAt       DateTime?
  timestamp       DateTime @default(now())
  
  @@index([notificationId])
  @@index([timestamp])
}

model ConversionEvent {
  id              String   @id @default(cuid())
  userId          String
  type            String
  notificationId  String?
  url             String?
  value           Float?
  timestamp       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

---

## 🚀 IMPLEMENTATION PRIORITY

1. **Week 1:** Browser sync + consent tracking
2. **Week 2:** Webhooks for event tracking
3. **Week 3:** Behavior segmentation
4. **Week 4:** Personalization & merge tags

---

## ✅ TESTING CHECKLIST

- [ ] Test webhook signature verification
- [ ] Test merge tag replacement with special characters
- [ ] Test segment generation with large datasets
- [ ] Test Player ID sync on subscription
- [ ] Test GDPR consent flow
- [ ] Monitor webhook delivery

