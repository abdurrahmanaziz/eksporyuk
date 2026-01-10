'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Filter,
  Loader2,
  MessageSquare,
  Heart,
  UserPlus,
  Award,
  Calendar,
  ShoppingCart,
  BookOpen,
  AlertCircle,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

// Notification type config
const notificationTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  COMMENT: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-blue-500 bg-blue-50', label: 'Komentar' },
  COMMENT_REPLY: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-blue-500 bg-blue-50', label: 'Balasan' },
  MENTION: { icon: <MessageSquare className="w-5 h-5" />, color: 'text-purple-500 bg-purple-50', label: 'Mention' },
  LIKE: { icon: <Heart className="w-5 h-5" />, color: 'text-red-500 bg-red-50', label: 'Like' },
  REACTION: { icon: <Heart className="w-5 h-5" />, color: 'text-pink-500 bg-pink-50', label: 'Reaksi' },
  FOLLOW: { icon: <UserPlus className="w-5 h-5" />, color: 'text-green-500 bg-green-50', label: 'Follow' },
  COURSE_APPROVED: { icon: <Award className="w-5 h-5" />, color: 'text-yellow-500 bg-yellow-50', label: 'Kursus Disetujui' },
  COURSE_REJECTED: { icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-500 bg-red-50', label: 'Kursus Ditolak' },
  COURSE_ENROLLMENT: { icon: <BookOpen className="w-5 h-5" />, color: 'text-blue-500 bg-blue-50', label: 'Pendaftaran Kursus' },
  CERTIFICATE_EARNED: { icon: <Award className="w-5 h-5" />, color: 'text-yellow-500 bg-yellow-50', label: 'Sertifikat' },
  EVENT_REMINDER: { icon: <Calendar className="w-5 h-5" />, color: 'text-orange-500 bg-orange-50', label: 'Event' },
  TRANSACTION: { icon: <ShoppingCart className="w-5 h-5" />, color: 'text-green-500 bg-green-50', label: 'Transaksi' },
  MEMBERSHIP_ACTIVATED: { icon: <Award className="w-5 h-5" />, color: 'text-purple-500 bg-purple-50', label: 'Membership' },
  STUDY_REMINDER: { icon: <BookOpen className="w-5 h-5" />, color: 'text-blue-500 bg-blue-50', label: 'Pengingat Belajar' },
  GENERAL: { icon: <Bell className="w-5 h-5" />, color: 'text-gray-500 bg-gray-50', label: 'Umum' },
}

const getNotificationConfig = (type: string) => {
  return notificationTypeConfig[type] || notificationTypeConfig.GENERAL
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const limit = 20

  // Fetch notifications
  const fetchNotifications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setOffset(0)
      } else {
        setLoadingMore(true)
      }

      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(currentOffset),
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      })

      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()

      if (reset) {
        setNotifications(data.notifications)
      } else {
        setNotifications(prev => [...prev, ...data.notifications])
      }

      setUnreadCount(data.unreadCount)
      setHasMore(data.pagination.hasMore)
      setOffset(currentOffset + limit)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Gagal memuat notifikasi')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchNotifications(true)
  }, [filter, typeFilter])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead([notification.id])
    }

    // Navigate to link if exists
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Mark notifications as read
  const markAsRead = async (ids: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      })

      if (!res.ok) throw new Error('Failed to mark as read')

      // Update local state
      setNotifications(prev =>
        prev.map(n => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - ids.length))
      setSelectedIds([])
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Gagal menandai sebagai dibaca')
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (!res.ok) throw new Error('Failed to mark all as read')

      const data = await res.json()
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success(`${data.count} notifikasi ditandai dibaca`)
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Gagal menandai semua sebagai dibaca')
    }
  }

  // Delete notifications
  const deleteNotifications = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map(id =>
          fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
        )
      )

      // Update local state
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)))
      setSelectedIds([])
      toast.success(`${ids.length} notifikasi dihapus`)
    } catch (error) {
      console.error('Error deleting notifications:', error)
      toast.error('Gagal menghapus notifikasi')
    }
  }

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Select all visible
  const selectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map(n => n.id))
    }
  }

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let key: string
    if (date.toDateString() === today.toDateString()) {
      key = 'Hari Ini'
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Kemarin'
    } else {
      key = format(date, 'd MMMM yyyy', { locale: idLocale })
    }

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                <TabsList>
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="unread">
                    Belum Dibaca
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="COMMENT">Komentar</SelectItem>
                  <SelectItem value="MENTION">Mention</SelectItem>
                  <SelectItem value="REACTION">Reaksi</SelectItem>
                  <SelectItem value="FOLLOW">Follow</SelectItem>
                  <SelectItem value="COURSE_ENROLLMENT">Kursus</SelectItem>
                  <SelectItem value="TRANSACTION">Transaksi</SelectItem>
                  <SelectItem value="MEMBERSHIP_ACTIVATED">Membership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} dipilih
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(selectedIds)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Tandai Dibaca
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNotifications(selectedIds)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Hapus
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Tandai Semua Dibaca
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada notifikasi</p>
              <p className="text-sm">
                {filter === 'unread'
                  ? 'Semua notifikasi sudah dibaca'
                  : 'Anda belum memiliki notifikasi'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Select All */}
          <div className="flex items-center gap-2 px-2">
            <Checkbox
              checked={selectedIds.length === notifications.length && notifications.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">Pilih Semua</span>
          </div>

          {/* Grouped notifications */}
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
                {date}
              </h3>
              <Card>
                <div className="divide-y">
                  {items.map((notification) => {
                    const config = getNotificationConfig(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className={`
                          flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer
                          ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                        `}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-sm font-medium ${
                                    !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {config.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                    locale: idLocale,
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.isRead && (
                                  <DropdownMenuItem onClick={() => markAsRead([notification.id])}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Tandai Dibaca
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => deleteNotifications([notification.id])}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchNotifications(false)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
