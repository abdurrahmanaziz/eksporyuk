'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Edit, Trash2, ArrowLeft, Clock, Mail, MessageCircle, Bell, Inbox, 
  Check, X, Info, Copy, Calendar, Settings, FileText, Loader2 
} from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

export interface Reminder {
  id: string
  title: string
  description: string | null
  triggerType: 'AFTER_PURCHASE' | 'BEFORE_EXPIRY' | 'ON_SPECIFIC_DATE' | 'CONDITIONAL'
  delayAmount: number
  delayUnit: string
  emailEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  emailSubject: string | null
  emailBody: string | null
  emailCTA: string | null
  emailCTALink: string | null
  whatsappMessage: string | null
  whatsappCTA: string | null
  whatsappCTALink: string | null
  pushTitle: string | null
  pushBody: string | null
  pushIcon: string | null
  pushClickAction: string | null
  inAppTitle: string | null
  inAppBody: string | null
  inAppLink: string | null
  preferredTime: string | null
  timezone: string
  daysOfWeek: any
  avoidWeekends: boolean
  conditions: any
  stopIfCondition: any
  stopOnAction: boolean
  sequenceOrder: number
  isActive: boolean
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  failedCount: number
  createdAt: string
  updatedAt: string
}

interface ReminderManagerProps {
  entityType: 'product' | 'course' | 'event' | 'membership'
  entityId: string
  entityName: string
  apiBasePath: string
  backPath: string
  shortcodes?: Array<{ code: string; desc: string }>
}

const defaultShortcodes = [
  { code: '{name}', desc: 'Nama user' },
  { code: '{email}', desc: 'Email user' },
  { code: '{phone}', desc: 'No. telepon' },
  { code: '{item_name}', desc: 'Nama item' },
  { code: '{purchase_date}', desc: 'Tanggal beli' },
  { code: '{payment_link}', desc: 'Link pembayaran' },
  { code: '{dashboard_link}', desc: 'Link dashboard' },
]

const defaultFormData = {
  title: '',
  description: '',
  triggerType: 'AFTER_PURCHASE' as const,
  delayAmount: 1,
  delayUnit: 'days',
  emailEnabled: true,
  whatsappEnabled: false,
  pushEnabled: false,
  inAppEnabled: false,
  emailSubject: '',
  emailBody: '',
  emailCTA: '',
  emailCTALink: '',
  whatsappMessage: '',
  whatsappCTA: '',
  whatsappCTALink: '',
  pushTitle: '',
  pushBody: '',
  pushIcon: '',
  pushClickAction: '',
  inAppTitle: '',
  inAppBody: '',
  inAppLink: '',
  preferredTime: '09:00',
  timezone: 'Asia/Jakarta',
  daysOfWeek: [1, 2, 3, 4, 5],
  avoidWeekends: true,
  conditions: {},
  stopIfCondition: {},
  stopOnAction: false,
  sequenceOrder: 1,
  isActive: true,
}

export default function ReminderManager({
  entityType,
  entityId,
  entityName,
  apiBasePath,
  backPath,
  shortcodes = defaultShortcodes,
}: ReminderManagerProps) {
  const router = useRouter()
  
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)

  useEffect(() => {
    if (entityId) {
      fetchReminders()
    }
  }, [entityId])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBasePath}/${entityId}/reminders`)
      if (res.ok) {
        const data = await res.json()
        setReminders(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Gagal memuat reminders')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder)
      setFormData({
        title: reminder.title,
        description: reminder.description || '',
        triggerType: reminder.triggerType as any,
        delayAmount: reminder.delayAmount,
        delayUnit: reminder.delayUnit,
        emailEnabled: reminder.emailEnabled,
        whatsappEnabled: reminder.whatsappEnabled,
        pushEnabled: reminder.pushEnabled,
        inAppEnabled: reminder.inAppEnabled,
        emailSubject: reminder.emailSubject || '',
        emailBody: reminder.emailBody || '',
        emailCTA: reminder.emailCTA || '',
        emailCTALink: reminder.emailCTALink || '',
        whatsappMessage: reminder.whatsappMessage || '',
        whatsappCTA: reminder.whatsappCTA || '',
        whatsappCTALink: reminder.whatsappCTALink || '',
        pushTitle: reminder.pushTitle || '',
        pushBody: reminder.pushBody || '',
        pushIcon: reminder.pushIcon || '',
        pushClickAction: reminder.pushClickAction || '',
        inAppTitle: reminder.inAppTitle || '',
        inAppBody: reminder.inAppBody || '',
        inAppLink: reminder.inAppLink || '',
        preferredTime: reminder.preferredTime || '09:00',
        timezone: reminder.timezone,
        daysOfWeek: reminder.daysOfWeek || [1, 2, 3, 4, 5],
        avoidWeekends: reminder.avoidWeekends,
        conditions: reminder.conditions || {},
        stopIfCondition: reminder.stopIfCondition || {},
        stopOnAction: reminder.stopOnAction,
        sequenceOrder: reminder.sequenceOrder,
        isActive: reminder.isActive,
      })
    } else {
      setEditingReminder(null)
      setFormData({ ...defaultFormData, sequenceOrder: reminders.length + 1 })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingReminder(null)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul reminder wajib diisi')
      return
    }

    if (!formData.emailEnabled && !formData.whatsappEnabled && !formData.pushEnabled && !formData.inAppEnabled) {
      toast.error('Minimal 1 channel harus diaktifkan')
      return
    }

    if (formData.emailEnabled && (!formData.emailSubject || !formData.emailBody)) {
      toast.error('Email subject dan body wajib diisi')
      return
    }

    if (formData.pushEnabled && (!formData.pushTitle || !formData.pushBody)) {
      toast.error('Push notification title dan body wajib diisi')
      return
    }

    if (formData.inAppEnabled && (!formData.inAppTitle || !formData.inAppBody)) {
      toast.error('In-app notification title dan body wajib diisi')
      return
    }

    try {
      const url = editingReminder
        ? `${apiBasePath}/${entityId}/reminders/${editingReminder.id}`
        : `${apiBasePath}/${entityId}/reminders`
      
      const method = editingReminder ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(editingReminder ? 'Reminder berhasil diperbarui' : 'Reminder berhasil dibuat')
        closeDialog()
        fetchReminders()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menyimpan reminder')
      }
    } catch (error) {
      console.error('Error saving reminder:', error)
      toast.error('Terjadi kesalahan saat menyimpan reminder')
    }
  }

  const handleDelete = async (id: string) => {
    setReminderToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!reminderToDelete) return

    try {
      const res = await fetch(
        `${apiBasePath}/${entityId}/reminders/${reminderToDelete}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        toast.success('Reminder berhasil dihapus')
        fetchReminders()
      } else {
        toast.error('Gagal menghapus reminder')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error('Terjadi kesalahan saat menghapus reminder')
    } finally {
      setDeleteConfirmOpen(false)
      setReminderToDelete(null)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiBasePath}/${entityId}/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (res.ok) {
        toast.success(`Reminder ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
        fetchReminders()
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
      toast.error('Gagal mengubah status reminder')
    }
  }

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'AFTER_PURCHASE': return 'Setelah Pembelian'
      case 'BEFORE_EXPIRY': return 'Sebelum Event'
      case 'ON_SPECIFIC_DATE': return 'Tanggal Spesifik'
      case 'CONDITIONAL': return 'Conditional'
      default: return type
    }
  }

  const getChannelBadges = (reminder: Reminder) => {
    const badges = []
    if (reminder.emailEnabled) badges.push(<Badge key="email" variant="secondary" className="gap-1"><Mail className="h-3 w-3" /> Email</Badge>)
    if (reminder.whatsappEnabled) badges.push(<Badge key="wa" variant="secondary" className="gap-1"><MessageCircle className="h-3 w-3" /> WA</Badge>)
    if (reminder.pushEnabled) badges.push(<Badge key="push" variant="secondary" className="gap-1"><Bell className="h-3 w-3" /> Push</Badge>)
    if (reminder.inAppEnabled) badges.push(<Badge key="inapp" variant="secondary" className="gap-1"><Inbox className="h-3 w-3" /> In-App</Badge>)
    return badges
  }

  const copyShortcode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Shortcode ${code} copied!`)
  }

  const getEntityLabel = () => {
    switch (entityType) {
      case 'product': return 'Produk'
      case 'course': return 'Kursus'
      case 'event': return 'Event'
      case 'membership': return 'Membership'
      default: return entityType
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backPath)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-3xl font-bold">Automation & Reminders</h1>
          </div>
          <p className="text-muted-foreground">
            Setup automated reminders untuk {getEntityLabel()}: <strong>{entityName}</strong>
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Reminder
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Cara Kerja Smart Reminder System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Trigger Otomatis</p>
                <p className="text-xs text-muted-foreground">Schedule berdasarkan event (purchase, etc)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Multi-Channel</p>
                <p className="text-xs text-muted-foreground">Email, Push, In-App dalam 1 reminder</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Smart Timing</p>
                <p className="text-xs text-muted-foreground">Atur jam kirim sesuai timezone</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Track sent, delivered, opened, clicked</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders List */}
      <div className="grid gap-4">
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Belum ada reminder</p>
              <p className="text-sm text-muted-foreground mb-4">
                Buat reminder pertama untuk mengautomasi komunikasi
              </p>
              <Button onClick={() => openDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Buat Reminder Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className={!reminder.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{reminder.title}</h3>
                          {reminder.isActive ? (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" /> Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <X className="h-3 w-3" /> Nonaktif
                            </Badge>
                          )}
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {getTriggerLabel(reminder.triggerType)} +{reminder.delayAmount} {reminder.delayUnit}
                          </Badge>
                          {getChannelBadges(reminder)}
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {reminder.preferredTime}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    {(reminder.sentCount > 0 || reminder.deliveredCount > 0) && (
                      <div className="flex items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
                        <span>Sent: <strong>{reminder.sentCount}</strong></span>
                        <span>Delivered: <strong>{reminder.deliveredCount}</strong></span>
                        <span>Opened: <strong>{reminder.openedCount}</strong></span>
                        <span>Clicked: <strong>{reminder.clickedCount}</strong></span>
                        {reminder.failedCount > 0 && (
                          <span className="text-red-600">Failed: <strong>{reminder.failedCount}</strong></span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={reminder.isActive} 
                      onCheckedChange={() => toggleActive(reminder.id, reminder.isActive)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(reminder)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? 'Edit Reminder' : 'Buat Reminder Baru'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Judul Reminder *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Welcome Email, Reminder 7 Hari"
                  />
                </div>

                <div>
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi internal untuk reminder ini..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Trigger Type *</Label>
                    <Select
                      value={formData.triggerType}
                      onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AFTER_PURCHASE">Setelah Pembelian</SelectItem>
                        <SelectItem value="BEFORE_EXPIRY">Sebelum Event</SelectItem>
                        <SelectItem value="ON_SPECIFIC_DATE">Tanggal Spesifik</SelectItem>
                        <SelectItem value="CONDITIONAL">Conditional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Delay Amount *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.delayAmount}
                      onChange={(e) => setFormData({ ...formData, delayAmount: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Delay Unit *</Label>
                    <Select
                      value={formData.delayUnit}
                      onValueChange={(value) => setFormData({ ...formData, delayUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <Label>Channels *</Label>
                  <p className="text-xs text-muted-foreground">Pilih minimal 1 channel</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={formData.emailEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, emailEnabled: !!checked })}
                      />
                      <label htmlFor="email" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="push"
                        checked={formData.pushEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, pushEnabled: !!checked })}
                      />
                      <label htmlFor="push" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <Bell className="h-4 w-4" />
                        Push Notification
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inapp"
                        checked={formData.inAppEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, inAppEnabled: !!checked })}
                      />
                      <label htmlFor="inapp" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <Inbox className="h-4 w-4" />
                        In-App Notification
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <Label>Status Reminder</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan reminder untuk automasi</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {/* Shortcodes Reference */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Shortcodes yang Tersedia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {shortcodes.map((sc) => (
                      <button
                        key={sc.code}
                        onClick={() => copyShortcode(sc.code)}
                        className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded border hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                        title={sc.desc}
                      >
                        <code className="font-mono text-blue-700 dark:text-blue-300">{sc.code}</code>
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email Content */}
              {formData.emailEnabled && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Email Content</h4>
                  </div>
                  
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      value={formData.emailSubject}
                      onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                      placeholder="e.g. Terima kasih {name}!"
                    />
                  </div>

                  <div>
                    <Label>Body (HTML support) *</Label>
                    <Textarea
                      value={formData.emailBody}
                      onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                      placeholder="Hi {name}, ..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CTA Button Text</Label>
                      <Input
                        value={formData.emailCTA}
                        onChange={(e) => setFormData({ ...formData, emailCTA: e.target.value })}
                        placeholder="e.g. Akses Sekarang"
                      />
                    </div>
                    <div>
                      <Label>CTA Button Link</Label>
                      <Input
                        value={formData.emailCTALink}
                        onChange={(e) => setFormData({ ...formData, emailCTALink: e.target.value })}
                        placeholder="e.g. {dashboard_link}"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Push Notification Content */}
              {formData.pushEnabled && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold">Push Notification Content</h4>
                  </div>
                  
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.pushTitle}
                      onChange={(e) => setFormData({ ...formData, pushTitle: e.target.value })}
                      placeholder="e.g. Hai {name}!"
                    />
                  </div>

                  <div>
                    <Label>Body *</Label>
                    <Textarea
                      value={formData.pushBody}
                      onChange={(e) => setFormData({ ...formData, pushBody: e.target.value })}
                      placeholder="Jangan lupa akses materi Anda!"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* In-App Notification Content */}
              {formData.inAppEnabled && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">In-App Notification Content</h4>
                  </div>
                  
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.inAppTitle}
                      onChange={(e) => setFormData({ ...formData, inAppTitle: e.target.value })}
                      placeholder="e.g. Selamat datang!"
                    />
                  </div>

                  <div>
                    <Label>Body *</Label>
                    <Textarea
                      value={formData.inAppBody}
                      onChange={(e) => setFormData({ ...formData, inAppBody: e.target.value })}
                      placeholder="Klik di sini untuk memulai..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Internal Link</Label>
                    <Input
                      value={formData.inAppLink}
                      onChange={(e) => setFormData({ ...formData, inAppLink: e.target.value })}
                      placeholder="/dashboard"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Smart Scheduling
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Preferred Send Time</Label>
                      <Input
                        type="time"
                        value={formData.preferredTime}
                        onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Timezone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                          <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                          <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Avoid Weekends</Label>
                      <p className="text-xs text-muted-foreground">
                        Skip Sabtu & Minggu
                      </p>
                    </div>
                    <Switch
                      checked={formData.avoidWeekends}
                      onCheckedChange={(checked) => setFormData({ ...formData, avoidWeekends: checked })}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced Controls
                  </h4>
                  
                  <div>
                    <Label>Sequence Order</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.sequenceOrder}
                      onChange={(e) => setFormData({ ...formData, sequenceOrder: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Urutan eksekusi reminder
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stop on Action</Label>
                      <p className="text-xs text-muted-foreground">
                        Stop sequence jika user klik CTA
                      </p>
                    </div>
                    <Switch
                      checked={formData.stopOnAction}
                      onCheckedChange={(checked) => setFormData({ ...formData, stopOnAction: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingReminder ? 'Perbarui Reminder' : 'Buat Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Reminder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus reminder ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
