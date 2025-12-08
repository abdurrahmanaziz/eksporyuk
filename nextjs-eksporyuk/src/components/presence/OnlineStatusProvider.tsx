'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'

/**
 * ONLINE STATUS PROVIDER
 * Komponen untuk auto-update status online user dengan Pusher
 * Automatically set online on mount, offline on unmount
 */
export default function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    let pusher: Pusher | null = null
    let heartbeatInterval: NodeJS.Timeout | null = null

    const updatePresence = async (isOnline: boolean) => {
      try {
        const response = await fetch('/api/users/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline })
        })
        
        if (!response.ok) {
          // Silently ignore 404 or other errors - presence is optional feature
          return
        }
      } catch (error) {
        // Silently ignore network errors - presence is optional feature
        // console.error('[PRESENCE_UPDATE_ERROR]', error)
      }
    }

    // Set online on mount
    updatePresence(true)

    // Setup Pusher for real-time presence
    try {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        authEndpoint: '/api/pusher/auth',
        forceTLS: true
      })

      // Subscribe to personal channel (must match server-side notifyUser)
      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[PUSHER] Connected to presence channel')
      })

      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[PUSHER] Subscription error:', error)
        // Try to reconnect after delay
        setTimeout(() => {
          updatePresence(false)
        }, 5000)
      })

      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[PUSHER] Successfully subscribed to presence channel')
      })
    } catch (error) {
      console.error('[PUSHER_INIT_ERROR]', error)
    }

    // Heartbeat every 30 seconds to maintain online status
    heartbeatInterval = setInterval(() => {
      updatePresence(true)
    }, 30000)

    // Set offline on page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline signal
      const blob = new Blob(
        [JSON.stringify({ isOnline: false })],
        { type: 'application/json' }
      )
      navigator.sendBeacon('/api/users/presence', blob)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      updatePresence(false)
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
      
      if (pusher) {
        pusher.disconnect()
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session?.user?.id, status])

  return <>{children}</>
}
