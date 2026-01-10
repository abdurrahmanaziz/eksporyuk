import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Hook to capture and save OneSignal Player ID to user profile
 * Runs once per session, stores playerId in database
 */
export function useOneSignal() {
  const { data: session, status } = useSession()
  const syncRef = useRef(false)
  const initRef = useRef(false)

  useEffect(() => {
    // Skip if not authenticated or already synced
    if (status !== 'authenticated' || !session?.user?.id || syncRef.current) {
      return
    }

    // Prevent double execution
    if (initRef.current) {
      return
    }
    initRef.current = true

    const capturePlayerId = async () => {
      try {
        if (typeof window === 'undefined') return

        // Wait for OneSignal to initialize (max 5 seconds)
        let attempts = 0
        const maxAttempts = 50
        
        while (!window.OneSignal && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!window.OneSignal) {
          console.warn('[useOneSignal] OneSignal SDK not available after timeout')
          return
        }

        // Get current subscription status
        const subscription = await window.OneSignal.User.pushSubscription.getPushSubscriptionId()

        if (!subscription) {
          console.log('[useOneSignal] No push subscription yet')
          return
        }

        console.log('[useOneSignal] Got subscription ID:', subscription.substring(0, 10) + '...')

        // Save to database
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oneSignalPlayerId: subscription
          })
        })

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        console.log('[useOneSignal] Player ID saved successfully')
        syncRef.current = true

      } catch (error) {
        console.error('[useOneSignal] Error capturing player ID:', error)
        // Don't fail silently, but continue app execution
      }
    }

    // Wait a bit for OneSignal initialization
    const timer = setTimeout(capturePlayerId, 2000)
    return () => clearTimeout(timer)

  }, [session?.user?.id, status])
}
