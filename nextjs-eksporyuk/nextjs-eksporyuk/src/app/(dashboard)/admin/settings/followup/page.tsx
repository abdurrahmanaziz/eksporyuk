'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface FollowUpTemplate {
  id: string
  title: string
  triggerType: string
  delayAmount: number
  delayUnit: string
  emailEnabled: boolean
  emailSubject: string
  emailBody: string
  whatsappEnabled: boolean
  whatsappMessage: string
  pushEnabled: boolean
  pushTitle: string
  pushBody: string
  isActive: boolean
  order: number
}

interface FollowUpSettings {
  globalEnabled: boolean
  defaultDelay: number
  defaultDelayUnit: string
  emailProvider: string
  whatsappProvider: string
  pushProvider: string
  workingHoursStart: string
  workingHoursEnd: string
  avoidWeekends: boolean
}

export default function FollowUpSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<FollowUpSettings>({
    globalEnabled: true,
    defaultDelay: 1,
    defaultDelayUnit: 'DAYS',
    emailProvider: 'mailketing',
    whatsappProvider: 'starsender',
    pushProvider: 'onesignal',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    avoidWeekends: true,
  })
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FollowUpTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<FollowUpTemplate>>({
    title: '',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 1,
    delayUnit: 'DAYS',
    emailEnabled: true,
    emailSubject: '',
    emailBody: '',
    whatsappEnabled: false,
    whatsappMessage: '',
    pushEnabled: false,
    pushTitle: '',
    pushBody: '',
    isActive: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/followup')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSettings(data.settings || settings)
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData()
    }
  }, [session, fetchData])

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings/followup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Pengaturan disimpan')
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTemplate = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/settings/followup/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })
      if (!res.ok) throw new Error('Failed to add')
      toast.success('Template ditambahkan')
      setShowAddDialog(false)
      setNewTemplate({
        title: '',
        triggerType: 'AFTER_PURCHASE',
        delayAmount: 1,
        delayUnit: 'DAYS',
        emailEnabled: true,
        emailSubject: '',
        emailBody: '',
        whatsappEnabled: false,
        whatsappMessage: '',
        pushEnabled: false,
        pushTitle: '',
        pushBody: '',
        isActive: true,
      })
      fetchData()
    } catch (error) {
      toast.error('Gagal menambahkan template')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTemplate = async (template: FollowUpTemplate) => {
    try {
      const res = await fetch(`/api/admin/settings/followup/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Template diperbarui')
      setEditingTemplate(null)
      fetchData()
    } catch (error) {
      toast.error('Gagal memperbarui template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Yakin ingin menghapus template ini?')) return
    try {
      const res = await fetch(`/api/admin/settings/followup/templates/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Template dihapus')
      fetchData()
    } catch (error) {
      toast.error('Gagal menghapus template')
    }
  }

  const handleToggleTemplate = async (template: FollowUpTemplate) => {
    try {
      const res = await fetch(`/api/admin/settings/followup/templates/${template.id}/toggle`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to toggle')
      toast.success(template.isActive ? 'Template dinonaktifkan' : 'Template diaktifkan')
      fetchData()
    } catch (error) {
      toast.error('Gagal mengubah status template')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Follow-Up</h1>
          <p className="text-muted-foreground">Kelola sistem follow-up otomatis</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Global</CardTitle>
          <CardDescription>Konfigurasi umum sistem follow-up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Aktifkan Follow-Up Otomatis</Label>
              <p className="text-sm text-muted-foreground">Semua follow-up akan berjalan otomatis</p>
            </div>
            <Switch
              checked={settings.globalEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, globalEnabled: checked })}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Delay Default</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.defaultDelay}
                  onChange={(e) => setSettings({ ...settings, defaultDelay: parseInt(e.target.value) || 0 })}
                  className="w-24"
                />
                <Select
                  value={settings.defaultDelayUnit}
                  onValueChange={(value) => setSettings({ ...settings, defaultDelayUnit: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURS">Jam</SelectItem>
                    <SelectItem value="DAYS">Hari</SelectItem>
                    <SelectItem value="WEEKS">Minggu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jam Kerja</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={settings.workingHoursStart}
                  onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                  className="w-32"
                />
                <span>-</span>
                <Input
                  type="time"
                  value={settings.workingHoursEnd}
                  onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Hindari Weekend</Label>
              <p className="text-sm text-muted-foreground">Tidak kirim follow-up di Sabtu/Minggu</p>
            </div>
            <Switch
              checked={settings.avoidWeekends}
              onCheckedChange={(checked) => setSettings({ ...settings, avoidWeekends: checked })}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Email Provider</Label>
              <Select
                value={settings.emailProvider}
                onValueChange={(value) => setSettings({ ...settings, emailProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mailketing">Mailketing</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>WhatsApp Provider</Label>
              <Select
                value={settings.whatsappProvider}
                onValueChange={(value) => setSettings({ ...settings, whatsappProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starsender">Starsender</SelectItem>
                  <SelectItem value="fonnte">Fonnte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Push Notification Provider</Label>
              <Select
                value={settings.pushProvider}
                onValueChange={(value) => setSettings({ ...settings, pushProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onesignal">OneSignal</SelectItem>
                  <SelectItem value="firebase">Firebase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Follow-Up</CardTitle>
              <CardDescription>Kelola template pesan follow-up</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Template Follow-Up</DialogTitle>
                  <DialogDescription>Buat template pesan follow-up baru</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Judul Template</Label>
                    <Input
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                      placeholder="Contoh: Welcome Email Day 1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={newTemplate.triggerType}
                        onValueChange={(value) => setNewTemplate({ ...newTemplate, triggerType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AFTER_PURCHASE">Setelah Pembelian</SelectItem>
                          <SelectItem value="BEFORE_EXPIRY">Sebelum Expired</SelectItem>
                          <SelectItem value="AFTER_REGISTRATION">Setelah Registrasi</SelectItem>
                          <SelectItem value="INACTIVE_USER">User Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Delay</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={newTemplate.delayAmount}
                          onChange={(e) => setNewTemplate({ ...newTemplate, delayAmount: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <Select
                          value={newTemplate.delayUnit}
                          onValueChange={(value) => setNewTemplate({ ...newTemplate, delayUnit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOURS">Jam</SelectItem>
                            <SelectItem value="DAYS">Hari</SelectItem>
                            <SelectItem value="WEEKS">Minggu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="email">
                    <TabsList className="w-full">
                      <TabsTrigger value="email" className="flex-1">
                        <Mail className="h-4 w-4 mr-2" /> Email
                      </TabsTrigger>
                      <TabsTrigger value="whatsapp" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
                      </TabsTrigger>
                      <TabsTrigger value="push" className="flex-1">
                        <Smartphone className="h-4 w-4 mr-2" /> Push
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newTemplate.emailEnabled}
                          onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, emailEnabled: checked })}
                        />
                        <Label>Aktifkan Email</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          value={newTemplate.emailSubject}
                          onChange={(e) => setNewTemplate({ ...newTemplate, emailSubject: e.target.value })}
                          placeholder="Selamat datang di {plan_name}!"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                          value={newTemplate.emailBody}
                          onChange={(e) => setNewTemplate({ ...newTemplate, emailBody: e.target.value })}
                          placeholder="Hai {name}, selamat bergabung..."
                          rows={5}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="whatsapp" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newTemplate.whatsappEnabled}
                          onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, whatsappEnabled: checked })}
                        />
                        <Label>Aktifkan WhatsApp</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Pesan</Label>
                        <Textarea
                          value={newTemplate.whatsappMessage}
                          onChange={(e) => setNewTemplate({ ...newTemplate, whatsappMessage: e.target.value })}
                          placeholder="Hai {name}! Terima kasih sudah bergabung..."
                          rows={5}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="push" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newTemplate.pushEnabled}
                          onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, pushEnabled: checked })}
                        />
                        <Label>Aktifkan Push Notification</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={newTemplate.pushTitle}
                          onChange={(e) => setNewTemplate({ ...newTemplate, pushTitle: e.target.value })}
                          placeholder="Selamat datang!"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                          value={newTemplate.pushBody}
                          onChange={(e) => setNewTemplate({ ...newTemplate, pushBody: e.target.value })}
                          placeholder="Hai {name}, jangan lupa cek dashboard..."
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Shortcodes yang tersedia:</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <code className="bg-background px-2 py-1 rounded">{'{name}'}</code>
                      <code className="bg-background px-2 py-1 rounded">{'{email}'}</code>
                      <code className="bg-background px-2 py-1 rounded">{'{phone}'}</code>
                      <code className="bg-background px-2 py-1 rounded">{'{plan_name}'}</code>
                      <code className="bg-background px-2 py-1 rounded">{'{expiry_date}'}</code>
                      <code className="bg-background px-2 py-1 rounded">{'{days_left}'}</code>
                      <code className="bg-background px-2 py-1 rounded">{'{dashboard_link}'}</code>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddTemplate} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Template'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground">Belum ada template follow-up</p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Template Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 ${!template.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.title}</h3>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.triggerType === 'AFTER_PURCHASE' && 'Setelah Pembelian'}
                          {template.triggerType === 'BEFORE_EXPIRY' && 'Sebelum Expired'}
                          {template.triggerType === 'AFTER_REGISTRATION' && 'Setelah Registrasi'}
                          {template.triggerType === 'INACTIVE_USER' && 'User Tidak Aktif'}
                          {' • '}
                          {template.delayAmount} {template.delayUnit === 'HOURS' ? 'jam' : template.delayUnit === 'DAYS' ? 'hari' : 'minggu'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {template.emailEnabled && (
                            <Badge variant="outline"><Mail className="h-3 w-3 mr-1" /> Email</Badge>
                          )}
                          {template.whatsappEnabled && (
                            <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" /> WA</Badge>
                          )}
                          {template.pushEnabled && (
                            <Badge variant="outline"><Smartphone className="h-3 w-3 mr-1" /> Push</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleTemplate(template)}
                      >
                        {template.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
    </ResponsivePageWrapper>
  )
}