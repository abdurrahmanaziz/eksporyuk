'use client'

import { Button } from '@/components/ui/button'
import { useOneSignalPopup } from '@/hooks/use-onesignal-popup'
import { Bell, X } from 'lucide-react'

/**
 * Example component yang menunjukkan cara trigger OneSignal popups
 * 
 * Fitur:
 * - Trigger custom in-app messages
 * - Show/hide notification bell
 * - Test notifikasi popup
 */
export function OneSignalPopupDemo() {
  const { triggerPopup, showBell, hideBell } = useOneSignalPopup()

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
      <h3 className="font-semibold text-sm">OneSignal Popup Demo</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Trigger welcome message */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => triggerPopup('welcome_message')}
          className="text-xs"
        >
          Welcome Popup
        </Button>

        {/* Trigger promo message */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => triggerPopup('special_offer')}
          className="text-xs"
        >
          Promo Popup
        </Button>

        {/* Show bell */}
        <Button
          variant="outline"
          size="sm"
          onClick={showBell}
          className="text-xs"
        >
          <Bell className="w-4 h-4 mr-1" />
          Show Bell
        </Button>

        {/* Hide bell */}
        <Button
          variant="outline"
          size="sm"
          onClick={hideBell}
          className="text-xs"
        >
          <X className="w-4 h-4 mr-1" />
          Hide Bell
        </Button>
      </div>

      <p className="text-xs text-gray-600 mt-2">
        💡 Di OneSignal dashboard, buat in-app messages dengan trigger ID:
        <code className="bg-white px-2 py-1 rounded text-xs ml-1">welcome_message</code>
        <code className="bg-white px-2 py-1 rounded text-xs ml-1">special_offer</code>
      </p>
    </div>
  )
}
