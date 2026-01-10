'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

declare global {
  interface Window {
    OneSignal?: any
    oneSignalInitialized?: boolean
  }
}

export default function NotificationPrompt() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [oneSignalReady, setOneSignalReady] = useState(false)

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check if OneSignal is configured
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId || appId === 'your-onesignal-app-id') {
      return
    }

    // Wait for OneSignal to be ready (max 10 seconds)
    let attempts = 0
    const maxAttempts = 20 // 20 * 500ms = 10 seconds
    
    const checkOneSignal = setInterval(() => {
      attempts++
      
      if (window.OneSignal && window.oneSignalInitialized) {
        setOneSignalReady(true)
        clearInterval(checkOneSignal)
      } else if (attempts >= maxAttempts) {
        console.warn('[NotificationPrompt] OneSignal not ready after 10s')
        clearInterval(checkOneSignal)
      }
    }, 500)

    return () => clearInterval(checkOneSignal)
  }, [])

  useEffect(() => {
    // Show prompt if user is logged in, OneSignal ready, and hasn't granted permission
    if (session && oneSignalReady && permission === 'default') {
      // Check if user dismissed before
      const dismissed = localStorage.getItem('notification-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      // Show again after 7 days
      if (!dismissed || daysSinceDismissed > 7) {
        // Wait 5 seconds before showing prompt
        const timer = setTimeout(() => {
          setShow(true)
        }, 5000)

        return () => clearTimeout(timer)
      }
    }
  }, [session, permission, oneSignalReady])

  const handleSubscribe = async () => {
    try {
      if (!window.OneSignal) {
        console.error('[NotificationPrompt] OneSignal not initialized')
        alert('OneSignal belum siap. Silakan coba lagi dalam beberapa detik.')
        return
      }

      // Check if OneSignal is initialized
      const isPushSupported = await window.OneSignal.Notifications.isPushSupported()
      if (!isPushSupported) {
        alert('Browser Anda tidak mendukung push notifications.')
        return
      }

      // Request permission
      const permissionStatus = await window.OneSignal.Notifications.requestPermission()
      
      // Update permission state
      setPermission(permissionStatus ? 'granted' : 'denied')
      
      if (permissionStatus) {
        setShow(false)
        
        // Get player ID, tags and save to database
        try {
          const { id: playerId } = await window.OneSignal.User.PushSubscription
          const currentTags = await window.OneSignal.User.getTags()
          
          if (playerId && session?.user?.id) {
            const response = await fetch('/api/users/onesignal-subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId,
                userId: session.user.id,
                tags: currentTags || {}
              })
            })

            if (response.ok) {
              console.log('[NotificationPrompt] Subscription saved successfully')
            }
          }
        } catch (error) {
          console.error('[NotificationPrompt] Error saving subscription:', error)
        }
      }
    } catch (error) {
      console.error('[NotificationPrompt] Subscribe error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const handleDismiss = () => {
    setShow(false)
    // Store dismissal in localStorage
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString())
  }

  // Don't show if:
  // - User not logged in
  // - Permission already granted or denied
  // - Prompt manually dismissed
  // - OneSignal not ready
  if (!session || permission !== 'default' || !show || !oneSignalReady) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Aktifkan Notifikasi
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Dapatkan update terbaru tentang pesan, transaksi, dan info penting lainnya langsung ke perangkat Anda.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSubscribe}
                  className="flex-1"
                >
                  Aktifkan
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDismiss}
                >
                  Nanti
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
