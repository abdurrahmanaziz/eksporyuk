'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOneSignalPushNotification } from '@/hooks/use-onesignal-push'
import { Bell, Send } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Demo component untuk test push notifications
 * Bisa send test push ke browser dan HP
 */
export function OneSignalPushDemo() {
  const { sendPushNotification, checkPermission, requestPermission } = useOneSignalPushNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null)

  const handleSendTestPush = async () => {
    try {
      setIsLoading(true)
      await sendPushNotification({
        heading: '✅ Test Notification',
        contents: 'Ini adalah test push notification dari OneSignal',
        url: 'https://localhost:3000'
      })
      toast.success('Push notification sent! Check your browser & phone')
    } catch (error) {
      toast.error('Failed to send push notification')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckPermission = async () => {
    try {
      const status = await checkPermission()
      setPermissionStatus(status)
      toast.success(`Permission status: ${status}`)
    } catch (error) {
      toast.error('Failed to check permission')
      console.error(error)
    }
  }

  const handleRequestPermission = async () => {
    try {
      setIsLoading(true)
      const granted = await requestPermission()
      if (granted) {
        toast.success('Notification permission granted!')
      } else {
        toast.error('Permission denied')
      }
    } catch (error) {
      toast.error('Failed to request permission')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-sm">Push Notification Tester</h3>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-600">
          Test push notifications yang akan muncul di browser dan HP Anda
        </p>

        <div className="grid grid-cols-1 gap-2">
          {/* Check Permission */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckPermission}
            className="text-xs justify-start"
          >
            Check Permission Status
          </Button>

          {/* Request Permission */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="text-xs justify-start"
          >
            Request Permission
          </Button>

          {/* Send Test Push */}
          <Button
            onClick={handleSendTestPush}
            disabled={isLoading}
            className="text-xs justify-start bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Test Push Notification
          </Button>
        </div>

        {permissionStatus && (
          <div className="text-xs bg-white p-2 rounded border border-gray-200">
            <span className="font-mono">Permission: {permissionStatus}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 bg-white p-2 rounded border-l-2 border-blue-600">
        <p className="font-semibold mb-1">📱 Expected Behavior:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Browser: Notifikasi akan muncul di top-right browser</li>
          <li>HP: Push notification akan muncul di notification center</li>
          <li>Klik notifikasi: Buka tab browser atau app</li>
        </ul>
      </div>
    </div>
  )
}
