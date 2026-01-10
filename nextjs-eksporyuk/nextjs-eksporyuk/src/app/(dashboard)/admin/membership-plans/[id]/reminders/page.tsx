'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertTriangle, Plus, Edit, Trash2, ArrowLeft, Clock, Mail, MessageCircle, Bell, Inbox, Check, X, Info, Copy, Calendar, Settings, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import ReminderTemplatePicker from '@/components/admin/ReminderTemplatePicker'

interface MembershipReminder {
  id: string
  membershipId: string
  title: string
  description: string | null
  
  // Trigger settings
  triggerType: 'AFTER_PURCHASE' | 'BEFORE_EXPIRY' | 'ON_SPECIFIC_DATE' | 'CONDITIONAL'
  delayAmount: number
  delayUnit: string
  
  // Channel toggles
  emailEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  
  // Email content
  emailSubject: string | null
  emailBody: string | null
  emailCTA: string | null
  emailCTALink: string | null
  
  // WhatsApp content
  whatsappMessage: string | null
  whatsappCTA: string | null
  whatsappCTALink: string | null
  
  // Push content
  pushTitle: string | null
  pushBody: string | null
  pushIcon: string | null
  pushClickAction: string | null
  
  // In-app content
  inAppTitle: string | null
  inAppBody: string | null
  inAppLink: string | null
  
  // Advanced settings
  preferredTime: string | null
  timezone: string
  daysOfWeek: any
  avoidWeekends: boolean
  conditions: any
  stopIfCondition: any
  stopOnAction: boolean
  sequenceOrder: number
  
  // Status & Analytics
  isActive: boolean
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  failedCount: number
  
  createdAt: string
  updatedAt: string
}

interface Membership {
  id: string
  name: string
  slug: string
}

export default function MembershipRemindersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const membershipId = params.id as string

  const [membership, setMembership] = useState<Membership | null>(null)
  const [reminders, setReminders] = useState<MembershipReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<MembershipReminder | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [testingReminder, setTestingReminder] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
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
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    avoidWeekends: true,
    conditions: {},
    stopIfCondition: {},
    stopOnAction: false,
    sequenceOrder: 1,
    
    isActive: true,
  })

  useEffect(() => {
    if (membershipId) {
      fetchMembership()
      fetchReminders()
    }
  }, [membershipId])

  const fetchMembership = async () => {
    try {
      const res = await fetch(`/api/admin/membership-plans/${membershipId}`)
      if (res.ok) {
        const data = await res.json()
        setMembership(data)
      }
    } catch (error) {
      console.error('Error fetching membership:', error)
      toast.error('Gagal memuat data membership')
    }
  }

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/membership-plans/${membershipId}/reminders`)
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

  const openDialog = (reminder?: MembershipReminder) => {
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
      setFormData({
        title: '',
        description: '',
        triggerType: 'AFTER_PURCHASE',
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
        sequenceOrder: reminders.length + 1,
        
        isActive: true,
      })
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

    // Validate channels
    if (!formData.emailEnabled && !formData.whatsappEnabled && !formData.pushEnabled && !formData.inAppEnabled) {
      toast.error('Minimal 1 channel harus diaktifkan')
      return
    }

    // Validate channel content
    if (formData.emailEnabled && (!formData.emailSubject || !formData.emailBody)) {
      toast.error('Email subject dan body wajib diisi')
      return
    }

    if (formData.whatsappEnabled && !formData.whatsappMessage) {
      toast.error('WhatsApp message wajib diisi')
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
        ? `/api/admin/membership-plans/${membershipId}/reminders/${editingReminder.id}`
        : `/api/admin/membership-plans/${membershipId}/reminders`
      
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
        `/api/admin/membership-plans/${membershipId}/reminders/${reminderToDelete}`,
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
      const res = await fetch(`/api/admin/membership-plans/${membershipId}/reminders/${id}`, {
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

  // Test reminder function
  const testReminder = async (reminderId: string, channel: string = 'IN_APP') => {
    setTestingReminder(reminderId)
    try {
      const res = await fetch('/api/admin/reminders/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId, channel }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`Test reminder berhasil dikirim via ${channel}`)
      } else {
        toast.error(data.error || 'Gagal mengirim test reminder')
      }
    } catch (error) {
      console.error('Error testing reminder:', error)
      toast.error('Gagal mengirim test reminder')
    } finally {
      setTestingReminder(null)
    }
  }

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'AFTER_PURCHASE': return 'Setelah Pembelian'
      case 'BEFORE_EXPIRY': return 'Sebelum Expired'
      case 'ON_SPECIFIC_DATE': return 'Tanggal Spesifik'
      case 'CONDITIONAL': return 'Conditional'
      default: return type
    }
  }

  const getChannelBadges = (reminder: MembershipReminder) => {
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

  const shortcodes = [
    { code: '{name}', desc: 'Nama user' },
    { code: '{email}', desc: 'Email user' },
    { code: '{phone}', desc: 'No. telepon' },
    { code: '{plan_name}', desc: 'Nama paket membership' },
    { code: '{expiry_date}', desc: 'Tanggal expired' },
    { code: '{days_left}', desc: 'Sisa hari aktif' },
    { code: '{payment_link}', desc: 'Link perpanjang' },
    { code: '{community_link}', desc: 'Link komunitas' },
    { code: '{course_link}', desc: 'Link kelas' },
    { code: '{dashboard_link}', desc: 'Link dashboard' },
  ]

  // Handle template selection
  const handleSelectTemplate = (template: any) => {
    setFormData({
      title: template.name,
      description: template.description,
      triggerType: template.triggerType,
      delayAmount: template.delayAmount,
      delayUnit: template.delayUnit,
      
      emailEnabled: template.emailEnabled,
      whatsappEnabled: false, // Disabled since no WA
      pushEnabled: template.pushEnabled,
      inAppEnabled: template.inAppEnabled,
      
      emailSubject: template.emailSubject || '',
      emailBody: template.emailBody || '',
      emailCTA: template.emailCTA || '',
      emailCTALink: template.emailCTALink || '',
      
      whatsappMessage: '',
      whatsappCTA: '',
      whatsappCTALink: '',
      
      pushTitle: template.pushTitle || '',
      pushBody: template.pushBody || '',
      pushIcon: '',
      pushClickAction: '',
      
      inAppTitle: template.inAppTitle || '',
      inAppBody: template.inAppBody || '',
      inAppLink: template.inAppLink || '',
      
      preferredTime: template.preferredTime || '09:00',
      timezone: 'Asia/Jakarta',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      avoidWeekends: template.avoidWeekends || false,
      conditions: {},
      stopIfCondition: {},
      stopOnAction: false,
      sequenceOrder: template.sequenceOrder || reminders.length + 1,
      
      isActive: true,
    })
    setTemplatePickerOpen(false)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/membership-plans')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-3xl font-bold">Automation & Reminders</h1>
          </div>
          <p className="text-muted-foreground">
            Setup automated reminders untuk membership: <strong>{membership?.name}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTemplatePickerOpen(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            Pilih Template
          </Button>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Reminder
          </Button>
        </div>
      </div>

      {/* Template Picker Dialog */}
      <ReminderTemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelectTemplate={handleSelectTemplate}
        membershipId={membershipId}
        onApplyAll={() => fetchReminders()}
      />

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
                <p className="text-xs text-muted-foreground">Schedule berdasarkan event (purchase, expiry)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Multi-Channel</p>
                <p className="text-xs text-muted-foreground">Email, WhatsApp, Push, In-App dalam 1 reminder</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Smart Timing</p>
                <p className="text-xs text-muted-foreground">Atur jam kirim, hindari weekend, sesuai timezone</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Track sent, delivered, opened, clicked per channel</p>
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
                Buat reminder pertama untuk mengautomasi komunikasi dengan member
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testingReminder === reminder.id}
                          className="gap-2"
                        >
                          {testingReminder === reminder.id ? (
                            <>
                              <span className="animate-spin">⏳</span> Testing...
                            </>
                          ) : (
                            <>
                              <Bell className="h-4 w-4" /> Test
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {reminder.inAppEnabled && (
                          <DropdownMenuItem onClick={() => testReminder(reminder.id, 'IN_APP')}>
                            <Inbox className="h-4 w-4 mr-2" /> Test In-App
                          </DropdownMenuItem>
                        )}
                        {reminder.emailEnabled && (
                          <DropdownMenuItem onClick={() => testReminder(reminder.id, 'EMAIL')}>
                            <Mail className="h-4 w-4 mr-2" /> Test Email
                          </DropdownMenuItem>
                        )}
                        {reminder.whatsappEnabled && (
                          <DropdownMenuItem onClick={() => testReminder(reminder.id, 'WHATSAPP')}>
                            <MessageCircle className="h-4 w-4 mr-2" /> Test WhatsApp
                          </DropdownMenuItem>
                        )}
                        {reminder.pushEnabled && (
                          <DropdownMenuItem onClick={() => testReminder(reminder.id, 'PUSH')}>
                            <Bell className="h-4 w-4 mr-2" /> Test Push
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    placeholder="e.g. Welcome Email, Reminder Expiry 7 Hari"
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
                        <SelectItem value="BEFORE_EXPIRY">Sebelum Expired</SelectItem>
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
                  <p className="text-xs text-muted-foreground">Pilih minimal 1 channel untuk reminder ini</p>
                  
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
                        id="whatsapp"
                        checked={formData.whatsappEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, whatsappEnabled: !!checked })}
                      />
                      <label htmlFor="whatsapp" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
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
                  <div className="grid grid-cols-5 gap-2 text-xs">
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Klik shortcode untuk copy. Paste di content untuk personalisasi otomatis.
                  </p>
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
                      placeholder="e.g. Welcome to {plan_name}!"
                    />
                  </div>

                  <div>
                    <Label>Body (HTML support) *</Label>
                    <Textarea
                      value={formData.emailBody}
                      onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                      placeholder="Hi {name}, &#10;&#10;Terima kasih sudah join {plan_name}!..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CTA Button Text</Label>
                      <Input
                        value={formData.emailCTA}
                        onChange={(e) => setFormData({ ...formData, emailCTA: e.target.value })}
                        placeholder="e.g. Akses Dashboard"
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

              {/* WhatsApp Content */}
              {formData.whatsappEnabled && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">WhatsApp Content</h4>
                  </div>
                  
                  <div>
                    <Label>Message *</Label>
                    <Textarea
                      value={formData.whatsappMessage}
                      onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
                      placeholder="Halo {name}! 👋&#10;&#10;Selamat bergabung di {plan_name}..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CTA Button Text</Label>
                      <Input
                        value={formData.whatsappCTA}
                        onChange={(e) => setFormData({ ...formData, whatsappCTA: e.target.value })}
                        placeholder="e.g. Join Group"
                      />
                    </div>
                    <div>
                      <Label>CTA Button Link</Label>
                      <Input
                        value={formData.whatsappCTALink}
                        onChange={(e) => setFormData({ ...formData, whatsappCTALink: e.target.value })}
                        placeholder="e.g. {group_link}"
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
                      placeholder="e.g. Welcome to {plan_name}!"
                    />
                  </div>

                  <div>
                    <Label>Body *</Label>
                    <Textarea
                      value={formData.pushBody}
                      onChange={(e) => setFormData({ ...formData, pushBody: e.target.value })}
                      placeholder="Your membership is now active. Start exploring!"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Icon URL</Label>
                      <Input
                        value={formData.pushIcon}
                        onChange={(e) => setFormData({ ...formData, pushIcon: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Click Action (URL)</Label>
                      <Input
                        value={formData.pushClickAction}
                        onChange={(e) => setFormData({ ...formData, pushClickAction: e.target.value })}
                        placeholder="e.g. {dashboard_link}"
                      />
                    </div>
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
                      placeholder="e.g. Welcome aboard!"
                    />
                  </div>

                  <div>
                    <Label>Body *</Label>
                    <Textarea
                      value={formData.inAppBody}
                      onChange={(e) => setFormData({ ...formData, inAppBody: e.target.value })}
                      placeholder="Click here to start your journey..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Internal Link</Label>
                    <Input
                      value={formData.inAppLink}
                      onChange={(e) => setFormData({ ...formData, inAppLink: e.target.value })}
                      placeholder="/dashboard/memberships"
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Waktu optimal untuk mengirim (default 09:00)
                      </p>
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

                  <div>
                    <Label>Send on Days (opsional - kosongkan untuk semua hari)</Label>
                    <div className="flex gap-2 mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const dayNum = idx + 1
                            const current = formData.daysOfWeek || []
                            setFormData({
                              ...formData,
                              daysOfWeek: current.includes(dayNum)
                                ? current.filter((d: number) => d !== dayNum)
                                : [...current, dayNum]
                            })
                          }}
                          className={`px-3 py-2 text-xs rounded border transition-colors ${
                            (formData.daysOfWeek || []).includes(idx + 1)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Avoid Weekends</Label>
                      <p className="text-xs text-muted-foreground">
                        Skip Sabtu & Minggu, kirim di hari kerja berikutnya
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
                      Urutan eksekusi reminder (1 = pertama, 2 = kedua, dst)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Stop on Action</Label>
                      <p className="text-xs text-muted-foreground">
                        Stop reminder sequence jika user klik CTA
                      </p>
                    </div>
                    <Switch
                      checked={formData.stopOnAction}
                      onCheckedChange={(checked) => setFormData({ ...formData, stopOnAction: checked })}
                    />
                  </div>
                </div>

                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                  <CardContent className="pt-4">
                    <div className="flex gap-2 items-start text-sm">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Conditional Logic & Custom Conditions</p>
                        <p className="text-xs">
                          Feature conditional logic (kirim hanya jika user tidak aktif, sudah selesai kelas tertentu, dll) 
                          akan segera hadir. Untuk saat ini, semua reminder akan dikirim sesuai schedule.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
    </ResponsivePageWrapper>
  )
}
