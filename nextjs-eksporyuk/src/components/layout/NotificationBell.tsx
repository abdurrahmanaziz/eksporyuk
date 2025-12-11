'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, Trash2, X, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'
import FloatingNotification from '@/components/notifications/FloatingNotification'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [floatingNotification, setFloatingNotification] = useState<Notification | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const router = useRouter()
  const { data: session } = useSession()

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundPref = localStorage.getItem('notificationSound')
    if (savedSoundPref !== null) {
      setSoundEnabled(savedSoundPref === 'true')
    }
  }, [])

  // Toggle sound and save preference + test sound
  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('notificationSound', String(newValue))
    
    // Play test sound when enabling
    if (newValue) {
      playTestSound()
    }
  }
  
  // Play test notification sound
  const playTestSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
      
      const now = audioCtx.currentTime
      
      // First tone
      const osc1 = audioCtx.createOscillator()
      const gain1 = audioCtx.createGain()
      osc1.connect(gain1)
      gain1.connect(audioCtx.destination)
      osc1.frequency.setValueAtTime(830, now)
      osc1.type = 'sine'
      gain1.gain.setValueAtTime(0, now)
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.02)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc1.start(now)
      osc1.stop(now + 0.3)
      
      // Second tone
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.frequency.setValueAtTime(1046, now + 0.1)
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0, now + 0.1)
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      osc2.start(now + 0.1)
      osc2.stop(now + 0.5)
      
      setTimeout(() => audioCtx.close(), 600)
    } catch (error) {
      console.log('Audio test error:', error)
    }
  }

  // Dismiss floating notification
  const dismissFloatingNotification = useCallback(() => {
    setFloatingNotification(null)
  }, [])

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Setup Pusher real-time notifications
    if (session?.user?.id) {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
      if (!pusherKey) {
        console.log('[PUSHER] Key not configured in NotificationBell')
        return
      }

      const pusher = new Pusher(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      })

      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      channel.bind('notification', (data: Notification) => {
        // Add new notification to top of list
        setNotifications(prev => [data, ...prev.slice(0, 9)])
        setUnreadCount(prev => prev + 1)
        
        // Show floating notification at bottom right
        setFloatingNotification(data)
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user?.id])

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notification.id] }),
      })
    }

    setIsOpen(false)

    if (notification.link) {
      router.push(notification.link)
    }

    fetchNotifications()
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      await fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all read:', error)
    }
    setLoading(false)
  }

  // Delete notification
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })
      await fetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      COURSE_APPROVED: '🎉',
      COURSE_REJECTED: '❌',
      COURSE_ENROLLMENT: '🎓',
      CERTIFICATE_EARNED: '🏆',
      STUDY_REMINDER: '📚',
      QUIZ_GRADED: '📝',
      ASSIGNMENT_GRADED: '✅',
      MEMBERSHIP_ACTIVATED: '⭐',
      COMMENT: '💬',
      MENTION: '📢',
      LIKE: '❤️',
      REACTION: '😊',
      FOLLOW: '👤',
      GENERAL: '📢',
    }
    return iconMap[type] || '🔔'
  }

  return (
    <>
      {/* Floating Notification at bottom right */}
      <FloatingNotification
        notification={floatingNotification}
        onDismiss={dismissFloatingNotification}
        soundEnabled={soundEnabled}
      />
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-blue-600" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Notifikasi</h3>
              <button
                onClick={toggleSound}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-blue-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Tandai Semua Dibaca
              </Button>
            )}
          </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.isRead
                              ? 'text-gray-900'
                              : 'text-gray-600'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Baru
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/dashboard/notifications')
                setIsOpen(false)
              }}
              className="w-full text-sm"
            >
              Lihat Semua Notifikasi
            </Button>
          </div>
        )}
        </PopoverContent>
      </Popover>
    </>
  )
}
