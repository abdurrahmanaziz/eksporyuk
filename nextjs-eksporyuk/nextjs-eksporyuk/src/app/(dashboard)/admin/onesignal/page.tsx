'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Bell,
  Users,
  Send,
  BarChart3,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Target,
  MapPin,
  Crown,
  User,
  Loader2,
  AlertCircle,
  Calendar,
  FileText,
  Zap,
  Plus,
  Trash2,
  Edit,
  Copy,
  Settings,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Stats {
  totalUsers: number
  subscribedUsers: number
  subscriptionRate: number
  recentSubscriptions: number
  tierCounts: Array<{ role: string; count: number }>
  provinceCounts: Array<{ province: string; count: number }>
}

interface Subscriber {
  id: string
  name: string
  email: string
  role: string
  province: string | null
  city: string | null
  avatar: string | null
  oneSignalPlayerId: string
  oneSignalSubscribedAt: string
  oneSignalTags: Record<string, string> | null
  lastActiveAt: string | null
  isOnline: boolean
}

interface NotificationHistory {
  id: string
  headings: { en?: string }
  contents: { en?: string }
  completed_at: number | string
  successful: number
  failed: number
  remaining: number
  url?: string
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  message: string
  url?: string
  imageUrl?: string
  targetType: string
  targetValue?: string
  createdAt: string
}

interface AutoNotification {
  id: string
  name: string
  trigger: string
  title: string
  message: string
  url?: string
  enabled: boolean
  delayMinutes: number
  targetType: string
}

interface NotificationAnalytics {
  id: string
  headings: { en: string }
  contents: { en: string }
  sent: number
  successful: number
  failed: number
  converted: number
  errored: number
  remaining: number
  queued_at: number
  send_after: number
  completed_at?: number
  platform_delivery_stats?: {
    ios?: { successful: number; failed: number; errored: number }
    android?: { successful: number; failed: number; errored: number }
    web?: { successful: number; failed: number; errored: number }
  }
}

export default function AdminOneSignalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subscriberPagination, setSubscriberPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1
  })
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [autoNotifications, setAutoNotifications] = useState<AutoNotification[]>([])
  const [analytics, setAnalytics] = useState<NotificationAnalytics[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [autoDialogOpen, setAutoDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [savingAuto, setSavingAuto] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [editingAuto, setEditingAuto] = useState<AutoNotification | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterProvince, setFilterProvince] = useState<string>('')

  // Notification form
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifUrl, setNotifUrl] = useState('')
  const [notifImageUrl, setNotifImageUrl] = useState('')
  const [notifTarget, setNotifTarget] = useState('all')
  const [notifTargetValue, setNotifTargetValue] = useState('')
  const [notifScheduled, setNotifScheduled] = useState(false)
  const [notifScheduleDate, setNotifScheduleDate] = useState('')
  const [notifScheduleTime, setNotifScheduleTime] = useState('')

  // Template form
  const [templateName, setTemplateName] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateMessage, setTemplateMessage] = useState('')
  const [templateUrl, setTemplateUrl] = useState('')
  const [templateImageUrl, setTemplateImageUrl] = useState('')
  const [templateTarget, setTemplateTarget] = useState('all')
  const [templateTargetValue, setTemplateTargetValue] = useState('')

  // Auto notification form
  const [autoName, setAutoName] = useState('')
  const [autoTrigger, setAutoTrigger] = useState('welcome')
  const [autoTitle, setAutoTitle] = useState('')
  const [autoMessage, setAutoMessage] = useState('')
  const [autoUrl, setAutoUrl] = useState('')
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [autoDelay, setAutoDelay] = useState(0)
  const [autoTarget, setAutoTarget] = useState('user')

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/onesignal?type=stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Gagal memuat statistik')
    }
  }, [])

  const fetchSubscribers = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        type: 'subscribers',
        page: page.toString(),
        limit: '20'
      })
      if (searchQuery) params.set('search', searchQuery)
      if (filterTier && filterTier !== 'all') params.set('tier', filterTier)
      if (filterProvince) params.set('province', filterProvince)

      const res = await fetch(`/api/admin/onesignal?${params}`)
      if (!res.ok) throw new Error('Failed to fetch subscribers')
      const data = await res.json()
      setSubscribers(data.subscribers)
      setSubscriberPagination({
        page: data.pagination.page,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      })
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      toast.error('Gagal memuat daftar subscriber')
    }
  }, [searchQuery, filterTier, filterProvince])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/onesignal/history?limit=10')
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      setHistory(data.notifications || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/onesignal/templates', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[fetchTemplates] Error response:', res.status, errorData)
        throw new Error(`Failed to fetch templates: ${errorData.error || res.statusText}`)
      }
      
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      // Don't show toast on initial load, only on manual refresh
      if (templates.length > 0) {
        toast.error('Gagal memuat templates')
      }
    }
  }, [templates.length])

  const fetchAutoNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/onesignal/auto', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[fetchAutoNotifications] Error response:', res.status, errorData)
        throw new Error(`Failed to fetch auto notifications: ${errorData.error || res.statusText}`)
      }
      
      const data = await res.json()
      setAutoNotifications(data.autoNotifications || [])
    } catch (error) {
      console.error('Error fetching auto notifications:', error)
      if (autoNotifications.length > 0) {
        toast.error('Gagal memuat auto notifications')
      }
    }
  }, [autoNotifications.length])

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/admin/onesignal/analytics', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[fetchAnalytics] Error response:', res.status, errorData)
        throw new Error(`Failed to fetch analytics: ${errorData.error || res.statusText}`)
      }
      
      const data = await res.json()
      setAnalytics(data.notifications || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Gagal memuat analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchSubscribers(), fetchHistory(), fetchTemplates(), fetchAutoNotifications(), fetchAnalytics()])
    setRefreshing(false)
    toast.success('Data diperbarui')
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
      router.push('/dashboard')
      return
    }

    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchSubscribers(), fetchHistory(), fetchTemplates(), fetchAutoNotifications(), fetchAnalytics()])
      setLoading(false)
    }
    loadData()
  }, [session, status, router, fetchStats, fetchSubscribers, fetchHistory, fetchTemplates, fetchAutoNotifications, fetchAnalytics])

  useEffect(() => {
    if (!loading) {
      fetchSubscribers(1)
    }
  }, [searchQuery, filterTier, filterProvince])

  const handleSendNotification = async () => {
    if (!notifTitle || !notifMessage) {
      toast.error('Judul dan pesan harus diisi')
      return
    }

    if (notifTarget !== 'all' && !notifTargetValue) {
      toast.error('Target value harus diisi')
      return
    }

    // Validate scheduled time if enabled
    let scheduleAt: string | undefined
    if (notifScheduled) {
      if (!notifScheduleDate || !notifScheduleTime) {
        toast.error('Tanggal dan waktu jadwal harus diisi')
        return
      }
      scheduleAt = new Date(`${notifScheduleDate}T${notifScheduleTime}`).toISOString()
      if (new Date(scheduleAt) <= new Date()) {
        toast.error('Waktu jadwal harus di masa depan')
        return
      }
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/onesignal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          url: notifUrl || undefined,
          imageUrl: notifImageUrl || undefined,
          targetType: notifTarget,
          targetValue: notifTargetValue || undefined,
          scheduleAt
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send')
      }

      const successMsg = scheduleAt 
        ? `Notifikasi dijadwalkan untuk ${format(new Date(scheduleAt), 'dd MMM yyyy HH:mm', { locale: localeId })}`
        : `Notifikasi terkirim ke ${data.data.recipientCount} subscriber`
      
      toast.success(successMsg)
      setSendDialogOpen(false)
      resetNotificationForm()
      
      // Refresh history
      fetchHistory()
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim notifikasi')
    } finally {
      setSending(false)
    }
  }

  const resetNotificationForm = () => {
    setNotifTitle('')
    setNotifMessage('')
    setNotifUrl('')
    setNotifImageUrl('')
    setNotifTarget('all')
    setNotifTargetValue('')
    setNotifScheduled(false)
    setNotifScheduleDate('')
    setNotifScheduleTime('')
  }

  const useTemplate = (template: NotificationTemplate) => {
    setNotifTitle(template.title)
    setNotifMessage(template.message)
    setNotifUrl(template.url || '')
    setNotifImageUrl(template.imageUrl || '')
    setNotifTarget(template.targetType)
    setNotifTargetValue(template.targetValue || '')
    setSendDialogOpen(true)
    toast.success(`Template "${template.name}" dimuat`)
  }

  const handleSaveTemplate = async () => {
    if (!templateName || !templateTitle || !templateMessage) {
      toast.error('Nama, judul, dan pesan template harus diisi')
      return
    }

    setSavingTemplate(true)
    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const body = {
        id: editingTemplate?.id,
        name: templateName,
        title: templateTitle,
        message: templateMessage,
        url: templateUrl || undefined,
        imageUrl: templateImageUrl || undefined,
        targetType: templateTarget,
        targetValue: templateTargetValue || undefined
      }

      const res = await fetch('/api/admin/onesignal/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save template')

      toast.success(editingTemplate ? 'Template diperbarui' : 'Template disimpan')
      setTemplateDialogOpen(false)
      resetTemplateForm()
      fetchTemplates()
    } catch (error) {
      toast.error('Gagal menyimpan template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const resetTemplateForm = () => {
    setEditingTemplate(null)
    setTemplateName('')
    setTemplateTitle('')
    setTemplateMessage('')
    setTemplateUrl('')
    setTemplateImageUrl('')
    setTemplateTarget('all')
    setTemplateTargetValue('')
  }

  const editTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateTitle(template.title)
    setTemplateMessage(template.message)
    setTemplateUrl(template.url || '')
    setTemplateImageUrl(template.imageUrl || '')
    setTemplateTarget(template.targetType)
    setTemplateTargetValue(template.targetValue || '')
    setTemplateDialogOpen(true)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Hapus template ini?')) return

    try {
      const res = await fetch(`/api/admin/onesignal/templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Template dihapus')
      fetchTemplates()
    } catch (error) {
      toast.error('Gagal menghapus template')
    }
  }

  const handleSaveAutoNotification = async () => {
    if (!autoName || !autoTitle || !autoMessage) {
      toast.error('Nama, judul, dan pesan harus diisi')
      return
    }

    setSavingAuto(true)
    try {
      const method = editingAuto ? 'PUT' : 'POST'
      const body = {
        id: editingAuto?.id,
        name: autoName,
        trigger: autoTrigger,
        title: autoTitle,
        message: autoMessage,
        url: autoUrl || undefined,
        enabled: autoEnabled,
        delayMinutes: autoDelay,
        targetType: autoTarget
      }

      const res = await fetch('/api/admin/onesignal/auto', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(editingAuto ? 'Auto notification diperbarui' : 'Auto notification disimpan')
      setAutoDialogOpen(false)
      resetAutoForm()
      fetchAutoNotifications()
    } catch (error) {
      toast.error('Gagal menyimpan auto notification')
    } finally {
      setSavingAuto(false)
    }
  }

  const resetAutoForm = () => {
    setEditingAuto(null)
    setAutoName('')
    setAutoTrigger('welcome')
    setAutoTitle('')
    setAutoMessage('')
    setAutoUrl('')
    setAutoEnabled(true)
    setAutoDelay(0)
    setAutoTarget('user')
  }

  const editAutoNotification = (auto: AutoNotification) => {
    setEditingAuto(auto)
    setAutoName(auto.name)
    setAutoTrigger(auto.trigger)
    setAutoTitle(auto.title)
    setAutoMessage(auto.message)
    setAutoUrl(auto.url || '')
    setAutoEnabled(auto.enabled)
    setAutoDelay(auto.delayMinutes)
    setAutoTarget(auto.targetType)
    setAutoDialogOpen(true)
  }

  const deleteAutoNotification = async (id: string) => {
    if (!confirm('Hapus auto notification ini?')) return

    try {
      const res = await fetch(`/api/admin/onesignal/auto?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Auto notification dihapus')
      fetchAutoNotifications()
    } catch (error) {
      toast.error('Gagal menghapus auto notification')
    }
  }

  const toggleAutoNotification = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/onesignal/auto', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled })
      })
      if (!res.ok) throw new Error('Failed to toggle')
      toast.success(enabled ? 'Auto notification diaktifkan' : 'Auto notification dinonaktifkan')
      fetchAutoNotifications()
    } catch (error) {
      toast.error('Gagal mengubah status')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    if (role.includes('LIFETIME')) return 'bg-amber-500'
    if (role.includes('PRO')) return 'bg-purple-500'
    if (role.includes('STARTER')) return 'bg-blue-500'
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'bg-red-500'
    return 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            OneSignal Push Notifications
          </h1>
          <p className="text-muted-foreground">
            Kelola push notification dan subscriber
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setSendDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Kirim Notifikasi
            </Button>
          <Dialog open={sendDialogOpen} onOpenChange={(open) => { setSendDialogOpen(open); if (!open) resetNotificationForm() }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Kirim Push Notification</DialogTitle>
                <DialogDescription>
                  Kirim notifikasi ke subscriber OneSignal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Judul *</Label>
                  <Input
                    placeholder="Judul notifikasi"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pesan *</Label>
                  <Textarea
                    placeholder="Isi pesan notifikasi"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL (opsional)</Label>
                    <Input
                      placeholder="https://..."
                      value={notifUrl}
                      onChange={(e) => setNotifUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gambar URL (opsional)</Label>
                    <Input
                      placeholder="https://..."
                      value={notifImageUrl}
                      onChange={(e) => setNotifImageUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={notifTarget} onValueChange={setNotifTarget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Subscriber</SelectItem>
                      <SelectItem value="membership">Membership Tier</SelectItem>
                      <SelectItem value="province">Provinsi</SelectItem>
                      <SelectItem value="affiliate">Affiliate Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {notifTarget === 'membership' && (
                  <div className="space-y-2">
                    <Label>Pilih Tier</Label>
                    <Select value={notifTargetValue} onValueChange={setNotifTargetValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free Member</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="LIFETIME">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {notifTarget === 'province' && (
                  <div className="space-y-2">
                    <Label>Nama Provinsi</Label>
                    <Input
                      placeholder="Contoh: Jawa Barat"
                      value={notifTargetValue}
                      onChange={(e) => setNotifTargetValue(e.target.value)}
                    />
                  </div>
                )}
                
                {/* Schedule Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label>Jadwalkan Pengiriman</Label>
                    </div>
                    <Switch
                      checked={notifScheduled}
                      onCheckedChange={setNotifScheduled}
                    />
                  </div>
                  {notifScheduled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                          type="date"
                          value={notifScheduleDate}
                          onChange={(e) => setNotifScheduleDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Waktu</Label>
                        <Input
                          type="time"
                          value={notifScheduleTime}
                          onChange={(e) => setNotifScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSendNotification}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {notifScheduled ? 'Menjadwalkan...' : 'Mengirim...'}
                    </>
                  ) : (
                    <>
                      {notifScheduled ? (
                        <><Calendar className="h-4 w-4 mr-2" />Jadwalkan Notifikasi</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" />Kirim Sekarang</>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subscriber</p>
                <p className="text-2xl font-bold">{stats?.subscribedUsers || 0}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscription Rate</p>
                <p className="text-2xl font-bold">{stats?.subscriptionRate || 0}%</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-full">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total User</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <User className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30 Hari Terakhir</p>
                <p className="text-2xl font-bold">+{stats?.recentSubscriptions || 0}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscribers" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Subscribers</span>
          </TabsTrigger>
          <TabsTrigger value="segments" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Segments</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="auto" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Auto</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Semua Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tier</SelectItem>
                    <SelectItem value="MEMBER_FREE">Free</SelectItem>
                    <SelectItem value="MEMBER_STARTER">Starter</SelectItem>
                    <SelectItem value="MEMBER_PRO">Pro</SelectItem>
                    <SelectItem value="MEMBER_LIFETIME">Lifetime</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filter provinsi..."
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Tidak ada subscriber</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={sub.avatar || undefined} />
                              <AvatarFallback>{sub.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{sub.name}</p>
                              <p className="text-xs text-muted-foreground">{sub.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(sub.role)} text-white text-xs`}>
                            {sub.role.replace('MEMBER_', '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sub.province ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {sub.city ? `${sub.city}, ${sub.province}` : sub.province}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.isOnline ? 'default' : 'secondary'} className="text-xs">
                            {sub.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.oneSignalSubscribedAt
                            ? format(new Date(sub.oneSignalSubscribedAt), 'dd MMM yyyy', { locale: localeId })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {subscriberPagination.totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {subscriberPagination.total} subscriber total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={subscriberPagination.page <= 1}
                    onClick={() => fetchSubscribers(subscriberPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={subscriberPagination.page >= subscriberPagination.totalPages}
                    onClick={() => fetchSubscribers(subscriberPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Membership */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  By Membership Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.tierCounts?.length ? (
                  <div className="space-y-3">
                    {stats.tierCounts.map((tier) => (
                      <div key={tier.role} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRoleBadgeColor(tier.role)} text-white`}>
                            {tier.role.replace('MEMBER_', '')}
                          </Badge>
                        </div>
                        <span className="font-medium">{tier.count} subscriber</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Belum ada data segment</p>
                )}
              </CardContent>
            </Card>

            {/* By Province */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Top 10 Provinsi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.provinceCounts?.length ? (
                  <div className="space-y-3">
                    {stats.provinceCounts.map((prov, idx) => (
                      <div key={prov.province} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="text-sm">{prov.province}</span>
                        </div>
                        <span className="font-medium text-sm">{prov.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Belum ada data lokasi</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Template Notifikasi
                </CardTitle>
                <CardDescription>Template yang sering digunakan untuk quick send</CardDescription>
              </div>
              <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Template
                </Button>
              <Dialog open={templateDialogOpen} onOpenChange={(open) => { setTemplateDialogOpen(open); if (!open) resetTemplateForm() }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTemplate ? 'Edit Template' : 'Buat Template Baru'}</DialogTitle>
                    <DialogDescription>
                      Simpan template untuk digunakan kembali
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama Template *</Label>
                      <Input
                        placeholder="Contoh: Promo Bulanan"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Judul Notifikasi *</Label>
                      <Input
                        placeholder="Judul notifikasi"
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pesan *</Label>
                      <Textarea
                        placeholder="Isi pesan notifikasi"
                        value={templateMessage}
                        onChange={(e) => setTemplateMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>URL (opsional)</Label>
                        <Input
                          placeholder="https://..."
                          value={templateUrl}
                          onChange={(e) => setTemplateUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gambar URL (opsional)</Label>
                        <Input
                          placeholder="https://..."
                          value={templateImageUrl}
                          onChange={(e) => setTemplateImageUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Default</Label>
                      <Select value={templateTarget} onValueChange={setTemplateTarget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Subscriber</SelectItem>
                          <SelectItem value="membership">Membership Tier</SelectItem>
                          <SelectItem value="province">Provinsi</SelectItem>
                          <SelectItem value="affiliate">Affiliate Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {templateTarget === 'membership' && (
                      <div className="space-y-2">
                        <Label>Pilih Tier</Label>
                        <Select value={templateTargetValue} onValueChange={setTemplateTargetValue}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">Free Member</SelectItem>
                            <SelectItem value="STARTER">Starter</SelectItem>
                            <SelectItem value="PRO">Pro</SelectItem>
                            <SelectItem value="LIFETIME">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                      {savingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {editingTemplate ? 'Update' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Belum ada template</p>
                  <p className="text-sm text-muted-foreground">Buat template untuk mempercepat pengiriman notifikasi</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="relative group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.targetType === 'all' ? 'Semua' : template.targetType}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{template.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {template.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" className="flex-1" onClick={() => useTemplate(template)}>
                            <Send className="h-3 w-3 mr-1" />
                            Kirim
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => editTemplate(template)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteTemplate(template.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto Notifications Tab */}
        <TabsContent value="auto" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Auto Notifications
                </CardTitle>
                <CardDescription>Notifikasi otomatis berdasarkan trigger tertentu</CardDescription>
              </div>
              <Button size="sm" onClick={() => setAutoDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Auto Notif
                </Button>
              <Dialog open={autoDialogOpen} onOpenChange={(open) => { setAutoDialogOpen(open); if (!open) resetAutoForm() }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingAuto ? 'Edit Auto Notification' : 'Buat Auto Notification'}</DialogTitle>
                    <DialogDescription>
                      Notifikasi akan dikirim otomatis saat trigger terpenuhi
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama *</Label>
                      <Input
                        placeholder="Contoh: Welcome Member Baru"
                        value={autoName}
                        onChange={(e) => setAutoName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trigger</Label>
                      <Select value={autoTrigger} onValueChange={setAutoTrigger}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome (User Baru Daftar)</SelectItem>
                          <SelectItem value="subscription">Subscription Aktif</SelectItem>
                          <SelectItem value="course_enrolled">Enroll Kursus Baru</SelectItem>
                          <SelectItem value="course_complete">Selesai Kursus</SelectItem>
                          <SelectItem value="payment_success">Pembayaran Sukses</SelectItem>
                          <SelectItem value="payment_pending">Pembayaran Pending (24 jam)</SelectItem>
                          <SelectItem value="inactive_7d">Tidak Aktif 7 Hari</SelectItem>
                          <SelectItem value="inactive_30d">Tidak Aktif 30 Hari</SelectItem>
                          <SelectItem value="membership_expiring">Membership Akan Berakhir</SelectItem>
                          <SelectItem value="birthday">Ulang Tahun User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Judul Notifikasi *</Label>
                      <Input
                        placeholder="Judul notifikasi"
                        value={autoTitle}
                        onChange={(e) => setAutoTitle(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Gunakan {'{name}'} untuk nama user, {'{email}'} untuk email
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Pesan *</Label>
                      <Textarea
                        placeholder="Isi pesan notifikasi"
                        value={autoMessage}
                        onChange={(e) => setAutoMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL (opsional)</Label>
                      <Input
                        placeholder="https://..."
                        value={autoUrl}
                        onChange={(e) => setAutoUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delay (menit)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={autoDelay}
                        onChange={(e) => setAutoDelay(parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Waktu tunggu sebelum notifikasi dikirim setelah trigger
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Aktifkan</Label>
                      <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAutoDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSaveAutoNotification} disabled={savingAuto}>
                      {savingAuto ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {editingAuto ? 'Update' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {autoNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Belum ada auto notification</p>
                  <p className="text-sm text-muted-foreground">Buat auto notification untuk otomatis kirim berdasarkan trigger</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {autoNotifications.map((auto) => (
                    <div key={auto.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={auto.enabled} 
                            onCheckedChange={(enabled) => toggleAutoNotification(auto.id, enabled)}
                          />
                          <div>
                            <h4 className="font-medium">{auto.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Trigger: {auto.trigger} {auto.delayMinutes > 0 && `(delay ${auto.delayMinutes} menit)`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={auto.enabled ? 'default' : 'secondary'}>
                            {auto.enabled ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => editAutoNotification(auto)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteAutoNotification(auto.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded p-3 mt-2">
                        <p className="text-sm font-medium">{auto.title}</p>
                        <p className="text-xs text-muted-foreground">{auto.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification History</CardTitle>
              <CardDescription>10 notifikasi terakhir dari OneSignal</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((notif) => (
                    <div key={notif.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{notif.headings?.en || 'No title'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {notif.contents?.en || 'No content'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {notif.completed_at
                            ? format(new Date(Number(notif.completed_at) * 1000), 'dd MMM HH:mm')
                            : 'Pending'
                          }
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {notif.successful || 0} sukses
                        </div>
                        {notif.failed > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {notif.failed} gagal
                          </div>
                        )}
                        {notif.url && (
                          <a
                            href={notif.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {notif.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Notification Analytics</CardTitle>
                  <CardDescription>Detail statistik per notifikasi</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={analyticsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : analytics.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Belum ada data analytics</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {analytics.map((notif) => {
                    const deliveryRate = notif.sent > 0 ? ((notif.successful / notif.sent) * 100).toFixed(1) : '0'
                    const conversionRate = notif.successful > 0 ? ((notif.converted / notif.successful) * 100).toFixed(1) : '0'
                    const failedRate = notif.sent > 0 ? ((notif.failed / notif.sent) * 100).toFixed(1) : '0'

                    return (
                      <Card key={notif.id} className="border-2">
                        <CardContent className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4 pb-4 border-b">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                {notif.headings?.en || 'No title'}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notif.contents?.en || 'No content'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {notif.completed_at
                                  ? format(new Date(Number(notif.completed_at) * 1000), 'dd MMM yyyy HH:mm')
                                  : notif.send_after
                                  ? `Scheduled: ${format(new Date(Number(notif.send_after) * 1000), 'dd MMM yyyy HH:mm')}`
                                  : 'Pending'
                                }
                              </div>
                            </div>
                          </div>

                          {/* Main Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{notif.sent}</div>
                              <div className="text-xs text-muted-foreground mt-1">Total Sent</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{notif.successful}</div>
                              <div className="text-xs text-muted-foreground mt-1">Delivered</div>
                              <div className="text-xs font-medium text-green-600 mt-1">{deliveryRate}%</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">{notif.converted}</div>
                              <div className="text-xs text-muted-foreground mt-1">Clicked/Converted</div>
                              <div className="text-xs font-medium text-purple-600 mt-1">{conversionRate}%</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">{notif.failed}</div>
                              <div className="text-xs text-muted-foreground mt-1">Failed</div>
                              <div className="text-xs font-medium text-red-600 mt-1">{failedRate}%</div>
                            </div>
                          </div>

                          {/* Platform Stats */}
                          {notif.platform_delivery_stats && (
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium mb-3">Platform Breakdown</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {notif.platform_delivery_stats.android && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <div className="font-medium text-sm mb-2">Android</div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivered:</span>
                                        <span className="font-medium text-green-600">
                                          {notif.platform_delivery_stats.android.successful}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Failed:</span>
                                        <span className="font-medium text-red-600">
                                          {notif.platform_delivery_stats.android.failed}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {notif.platform_delivery_stats.ios && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <div className="font-medium text-sm mb-2">iOS</div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivered:</span>
                                        <span className="font-medium text-green-600">
                                          {notif.platform_delivery_stats.ios.successful}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Failed:</span>
                                        <span className="font-medium text-red-600">
                                          {notif.platform_delivery_stats.ios.failed}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {notif.platform_delivery_stats.web && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <div className="font-medium text-sm mb-2">Web</div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivered:</span>
                                        <span className="font-medium text-green-600">
                                          {notif.platform_delivery_stats.web.successful}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Failed:</span>
                                        <span className="font-medium text-red-600">
                                          {notif.platform_delivery_stats.web.failed}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Additional Stats */}
                          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
                            {notif.remaining > 0 && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-muted-foreground">Remaining:</span>
                                <span className="font-medium">{notif.remaining}</span>
                              </div>
                            )}
                            {notif.errored > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                <span className="text-muted-foreground">Errored:</span>
                                <span className="font-medium">{notif.errored}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ResponsivePageWrapper>
  )
}
