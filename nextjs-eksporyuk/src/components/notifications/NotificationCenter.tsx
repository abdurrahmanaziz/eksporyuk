'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, X, MessageSquare, ShoppingCart, Heart, Award, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePusherNotification, PusherNotification } from '@/hooks/use-pusher-notification'

/**
 * NOTIFICATION CENTER
 * Komponen untuk display real-time notifications dengan bell icon
 * - Shows badge count
 * - Dropdown dengan notification list
 * - Click-to-navigate support
 * - Auto-dismiss after 5 seconds
 */
export default function NotificationCenter() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<PusherNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Subscribe to Pusher notifications
  usePusherNotification(session?.user?.id, useCallback((notification: PusherNotification) => {
    // Add notification to list
    setNotifications(prev => [notification, ...prev].slice(0, 20)) // Keep last 20

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setDismissedIds(prev => new Set(prev).add(notification.id))
    }, 5000)

    return () => clearTimeout(timer)
  }, []))

  // Filter out dismissed notifications
  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => !dismissedIds.has(n.id))
  }, [notifications, dismissedIds])

  // Unread count
  const unreadCount = visibleNotifications.length

  // Get icon for notification type
  const getIcon = (type: string) => {
    const iconProps = 'w-4 h-4'
    switch (type) {
      case 'mention':
        return <MessageSquare className={`${iconProps} text-blue-500`} />
      case 'comment':
        return <MessageSquare className={`${iconProps} text-blue-500`} />
      case 'like':
        return <Heart className={`${iconProps} text-red-500`} />
      case 'purchase':
        return <ShoppingCart className={`${iconProps} text-green-500`} />
      case 'message':
        return <MessageSquare className={`${iconProps} text-purple-500`} />
      case 'system':
        return <Award className={`${iconProps} text-yellow-500`} />
      default:
        return <Bell className={`${iconProps} text-gray-500`} />
    }
  }

  // Format relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id))
  }

  const handleNotificationClick = (notification: PusherNotification) => {
    handleDismiss(notification.id)
    
    if (notification.url) {
      window.location.href = notification.url
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-gray-100"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No notifications yet
                </p>
              </div>
            ) : (
              visibleNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(notification.timestamp)}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss(notification.id)
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {visibleNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold w-full text-center">
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
