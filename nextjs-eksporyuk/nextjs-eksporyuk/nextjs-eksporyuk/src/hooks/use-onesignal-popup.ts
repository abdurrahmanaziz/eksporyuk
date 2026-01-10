import { useCallback } from 'react'

/**
 * Hook untuk trigger OneSignal popup notifications
 * Gunakan ini dari component manapun untuk show in-app messages atau bell
 * 
 * @example
 * const { triggerPopup, showBell } = useOneSignalPopup()
 * 
 * // Trigger in-app message
 * triggerPopup('welcome_message')
 * 
 * // Show notification bell
 * showBell()
 */
export function useOneSignalPopup() {
  const triggerPopup = useCallback((triggerId: string) => {
    if (typeof window === 'undefined' || !window.OneSignal) {
      console.warn('[useOneSignalPopup] SDK not initialized yet')
      return
    }

    try {
      // Trigger in-app message by ID
      window.OneSignal.inAppMessages.triggerPage(triggerId)
      console.log('[useOneSignalPopup] In-app message triggered:', triggerId)
    } catch (error) {
      console.error('[useOneSignalPopup] Failed to trigger message:', error)
    }
  }, [])

  const showBell = useCallback(() => {
    if (typeof window === 'undefined' || !window.OneSignal) {
      console.warn('[useOneSignalPopup] SDK not initialized yet')
      return
    }

    try {
      // Show notification bell
      window.OneSignal?.notifyButton?.showBell?.()
      console.log('[useOneSignalPopup] Notification bell shown')
    } catch (error) {
      console.error('[useOneSignalPopup] Failed to show bell:', error)
    }
  }, [])

  const hideBell = useCallback(() => {
    if (typeof window === 'undefined' || !window.OneSignal) {
      console.warn('[useOneSignalPopup] SDK not initialized yet')
      return
    }

    try {
      window.OneSignal?.notifyButton?.hideBell?.()
      console.log('[useOneSignalPopup] Notification bell hidden')
    } catch (error) {
      console.error('[useOneSignalPopup] Failed to hide bell:', error)
    }
  }, [])

  return {
    triggerPopup,
    showBell,
    hideBell
  }
}
