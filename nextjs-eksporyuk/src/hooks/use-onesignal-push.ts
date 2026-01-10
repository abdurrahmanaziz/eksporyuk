import { useCallback } from 'react'

/**
 * Hook untuk mengirim push notifications dari client side
 * Gunakan untuk testing atau trigger notifikasi khusus
 * 
 * @example
 * const { sendPushNotification } = useOneSignalPushNotification()
 * 
 * await sendPushNotification({
 *   heading: 'Test Notification',
 *   contents: 'This is a test push notification',
 *   url: '/products'
 * })
 */
export function useOneSignalPushNotification() {
  const sendPushNotification = useCallback(async (data: {
    heading: string
    contents: string
    url?: string
    bigPicture?: string
    largeIcon?: string
  }) => {
    if (typeof window === 'undefined' || !window.OneSignal) {
      console.warn('[useOneSignalPushNotification] SDK not initialized yet')
      return
    }

    try {
      const userId = window.OneSignal?.User?.onesignalId
      if (!userId) {
        console.warn('[useOneSignalPushNotification] User not logged in')
        return
      }

      // Send push notification ke current user
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          heading: data.heading,
          contents: data.contents,
          url: data.url,
          bigPicture: data.bigPicture,
          largeIcon: data.largeIcon,
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const result = await response.json()
      console.log('[useOneSignalPushNotification] Push sent successfully:', result)
      return result
    } catch (error) {
      console.error('[useOneSignalPushNotification] Error:', error)
      throw error
    }
  }, [])

  const checkPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !window.OneSignal) {
      return 'not-initialized'
    }

    try {
      const permission = await window.OneSignal.Notifications.permission
      return permission // 'granted' | 'denied' | 'default'
    } catch (error) {
      console.error('[useOneSignalPushNotification] Error checking permission:', error)
      return 'error'
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !window.OneSignal) {
      console.warn('[useOneSignalPushNotification] SDK not initialized yet')
      return false
    }

    try {
      const permission = await window.OneSignal.Notifications.requestPermission()
      console.log('[useOneSignalPushNotification] Permission requested:', permission)
      return permission === 'granted'
    } catch (error) {
      console.error('[useOneSignalPushNotification] Error requesting permission:', error)
      return false
    }
  }, [])

  return {
    sendPushNotification,
    checkPermission,
    requestPermission
  }
}
