import { useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'

export interface PusherNotification {
  id: string
  title: string
  content: string
  type: 'mention' | 'comment' | 'like' | 'purchase' | 'message' | 'system'
  url?: string
  data?: Record<string, any>
  timestamp: number
}

/**
 * Hook untuk subscribe ke Pusher user channel dan listen untuk notifications
 * Otomatis trigger callback ketika notifikasi diterima
 * 
 * Usage:
 * ```
 * usePusherNotification(userId, (notification) => {
 *   // Handle notification
 *   showToast(notification.title)
 * })
 * ```
 */
export function usePusherNotification(
  userId: string | undefined,
  onNotification: (notification: PusherNotification) => void
) {
  const { data: session, status } = useSession()
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    // Validasi session dan userId
    if (status !== 'authenticated' || !userId || initRef.current) {
      return
    }

    initRef.current = true

    const setupPusher = async () => {
      try {
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

        if (!pusherKey || !pusherCluster) {
          console.warn('[usePusherNotification] Pusher not configured')
          return
        }

        // Initialize Pusher jika belum
        if (!pusherRef.current) {
          pusherRef.current = new Pusher(pusherKey, {
            cluster: pusherCluster,
            authEndpoint: '/api/pusher/auth',
            forceTLS: true
          })
        }

        // Subscribe ke user-specific channel
        const channel = pusherRef.current.subscribe(`user-${userId}`)
        channelRef.current = channel

        // Handle subscription events
        channel.bind('pusher:subscription_succeeded', () => {
          console.log('[usePusherNotification] Subscribed to channel:', `user-${userId}`)
        })

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error('[usePusherNotification] Subscription error:', error)
        })

        // Bind ke notification event
        channel.bind('notification', (data: any) => {
          const notification: PusherNotification = {
            id: data.id || `notif-${Date.now()}`,
            title: data.title,
            content: data.content,
            type: data.type || 'system',
            url: data.url,
            data: data.data,
            timestamp: Date.now()
          }

          console.log('[usePusherNotification] Received:', notification)
          onNotification(notification)
        })

        // Bind ke new-notification (alternative event name)
        channel.bind('new-notification', (data: any) => {
          const notification: PusherNotification = {
            id: data.id || `notif-${Date.now()}`,
            title: data.title,
            content: data.content,
            type: data.type || 'system',
            url: data.url,
            data: data.data,
            timestamp: Date.now()
          }

          console.log('[usePusherNotification] Received (new-notification):', notification)
          onNotification(notification)
        })

      } catch (error) {
        console.error('[usePusherNotification] Setup error:', error)
      }
    }

    setupPusher()

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
      }
      // Tidak disconnect Pusher karena mungkin digunakan di tempat lain
    }

  }, [userId, status, onNotification])
}
