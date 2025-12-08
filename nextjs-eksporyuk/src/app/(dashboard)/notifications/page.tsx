'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Bell, Check, Trash2, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
  actor?: {
    name: string
    image?: string
  }
}

const notificationTypes = [
  { value: 'ALL', label: 'Semua', icon: '🔔' },
  { value: 'CHAT', label: 'Chat', icon: '💬' },
  { value: 'POST', label: 'Postingan', icon: '📝' },
  { value: 'COMMENT', label: 'Komentar', icon: '💭' },
  { value: 'COURSE', label: 'Kursus', icon: '🎓' },
  { value: 'EVENT', label: 'Event', icon: '📅' },
  { value: 'TRANSACTION', label: 'Transaksi', icon: '💰' },
  { value: 'FOLLOW', label: 'Follow', icon: '👥' },
  { value: 'SYSTEM', label: 'Sistem', icon: '⚙️' },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const router = useRouter()
  const { data: session } = useSession()

  // Fetch notifications with filters
  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(activeFilter !== 'ALL' && { type: activeFilter }),
        ...(unreadOnly && { unreadOnly: 'true' }),
      })

      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Gagal memuat notifikasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [activeFilter, unreadOnly])

  // Setup Pusher real-time
  useEffect(() => {
    if (session?.user?.id) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })

      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      channel.bind('notification', (data: Notification) => {
        setNotifications(prev => [data, ...prev])
        toast.success('Notifikasi baru!')
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user?.id])

  // Mark as read
  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })
      
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) ? { ...n, isRead: true } : n)
      )
      setSelectedIds([])
      toast.success('Ditandai sebagai sudah dibaca')
    } catch (error) {
      toast.error('Gagal menandai notifikasi')
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('Semua notifikasi ditandai sebagai sudah dibaca')
    } catch (error) {
      toast.error('Gagal menandai semua notifikasi')
    }
  }

  // Delete notifications
  const handleDelete = async (notificationIds: string[]) => {
    try {
      for (const id of notificationIds) {
        await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      }
      
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)))
      setSelectedIds([])
      toast.success('Notifikasi dihapus')
    } catch (error) {
      toast.error('Gagal menghapus notifikasi')
    }
  }

  // Click notification
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead([notification.id])
    }

    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      CHAT: '💬',
      POST_NEW: '📝',
      POST_LIKE: '❤️',
      COMMENT: '💭',
      COMMENT_REPLY: '↩️',
      COURSE_ENROLLED: '🎓',
      COURSE_COMPLETED: '🏆',
      COURSE_DISCUSSION: '💬',
      EVENT_REMINDER: '⏰',
      EVENT_START: '▶️',
      TRANSACTION_SUCCESS: '💳',
      TRANSACTION_PENDING: '⏳',
      FOLLOW: '👥',
      ACHIEVEMENT: '🏅',
      SYSTEM: '⚙️',
    }
    return iconMap[type] || '🔔'
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Select all
  const selectAll = () => {
    setSelectedIds(notifications.map(n => n.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedIds([])
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="px-2 sm:px-4 md:px-0">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifikasi</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <Card className="mx-2 sm:mx-4 md:mx-0">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.length > 0 ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(selectedIds)}
                      className="text-xs sm:text-sm"
                    >
                      <Check className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Tandai Dibaca</span>
                      <span className="sm:hidden">Dibaca</span> ({selectedIds.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(selectedIds)}
                      className="text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Hapus</span>
                      <span className="sm:hidden">Del</span> ({selectedIds.length})
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearSelection}
                      className="text-xs sm:text-sm"
                    >
                      <X className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                      Batal
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAll}
                      className="text-xs sm:text-sm"
                    >
                      Pilih Semua
                    </Button>
                    {unreadCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleMarkAllRead}
                        className="text-xs sm:text-sm"
                      >
                        <Check className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Tandai Semua Dibaca</span>
                        <span className="sm:hidden">Semua Dibaca</span>
                      </Button>
                    )}
                  </>
                )}
              </div>

              <Button
                variant={unreadOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnreadOnly(!unreadOnly)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Filter className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                {unreadOnly ? 'Belum Dibaca' : 'Semua'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
          <div className="overflow-x-auto mx-2 sm:mx-4 md:mx-0 -mb-0.5">
            <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full inline-grid min-w-full">
              {notificationTypes.map((type) => (
                <TabsTrigger 
                  key={type.value} 
                  value={type.value} 
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3"
                >
                  <span className="mr-0.5 sm:mr-1">{type.icon}</span>
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeFilter} className="mt-4">
            {notifications.length === 0 ? (
              <Card className="mx-2 sm:mx-4 md:mx-0">
                <CardContent className="py-8 sm:py-12">
                  <div className="flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
                    <Bell className="w-12 sm:w-16 h-12 sm:h-16 mx-auto opacity-30" />
                    <p className="text-base sm:text-lg font-medium">Tidak ada notifikasi</p>
                    <p className="text-xs sm:text-sm">
                      {unreadOnly
                        ? 'Semua notifikasi sudah dibaca'
                        : 'Belum ada notifikasi untuk ditampilkan'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 px-2 sm:px-4 md:px-0">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''
                    } ${
                      selectedIds.includes(notification.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification.id)}
                          onChange={() => toggleSelection(notification.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Icon */}
                        <span className="text-2xl sm:text-3xl flex-shrink-0 leading-none">
                          {getNotificationIcon(notification.type)}
                        </span>

                        {/* Content */}
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h4
                              className={`text-xs sm:text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <Badge variant="default" className="text-xs">
                                Baru
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          {notification.actor && (
                            <div className="flex items-center gap-2 mt-2">
                              {notification.actor.image && (
                                <img
                                  src={notification.actor.image}
                                  alt={notification.actor.name}
                                  className="w-5 sm:w-6 h-5 sm:h-6 rounded-full flex-shrink-0"
                                />
                              )}
                              <span className="text-xs text-gray-500 truncate">
                                {notification.actor.name}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-gray-400 mt-1.5 sm:mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead([notification.id])
                              }}
                              title="Tandai sebagai sudah dibaca"
                            >
                              <Check className="w-3 sm:w-4 h-3 sm:h-4 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete([notification.id])
                            }}
                            title="Hapus notifikasi"
                          >
                            <Trash2 className="w-3 sm:w-4 h-3 sm:h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}
