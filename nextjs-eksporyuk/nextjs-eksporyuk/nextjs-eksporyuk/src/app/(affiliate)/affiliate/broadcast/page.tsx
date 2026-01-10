'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Mail,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
  Copy,
  CheckCircle2,
  Clock,
  MailOpen,
  MousePointerClick,
  XCircle,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface Broadcast {
  id: string
  name: string
  subject: string
  body: string
  status: string
  totalRecipients: number
  sentCount: number
  openedCount: number
  clickedCount: number
  failedCount: number
  creditUsed: number
  isScheduled: boolean
  scheduledAt: string | null
  recurringConfig?: any
  sentAt: string | null
  createdAt: string
  template: {
    name: string
    category: string
  } | null
}

interface EmailTemplate {
  id: string
  name: string
  slug: string
  category: string
  subject: string
  body: string
  previewText: string | null
}

export default function AffiliateBroadcastPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null)
  const [sendingBroadcast, setSendingBroadcast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [modalTab, setModalTab] = useState('content')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    templateId: '',
    templateName: '',
    targetStatus: '',
    targetSource: '',
    targetTags: '',
    scheduledAt: '',
    recurring: {
      enabled: false,
      frequency: 'DAILY',
      interval: 1,
      timeOfDay: '09:00',
      endDate: '',
      daysOfWeek: [] as number[]
    }
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [broadcastRes, templatesRes] = await Promise.all([
        fetch('/api/affiliate/broadcast'),
        fetch('/api/affiliate/email-templates'),
      ])

      const broadcastData = await broadcastRes.json()
      const templatesData = await templatesRes.json()

      if (broadcastRes.ok) setBroadcasts(broadcastData.broadcasts)
      if (templatesRes.ok) setTemplates(templatesData.templates)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load broadcast data')
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (template: EmailTemplate) => {
    setFormData({
      ...formData,
      subject: template.subject,
      body: template.body,
      templateId: template.id,
      templateName: template.name,
    })
    
    // Track template usage
    try {
      await fetch(`/api/admin/affiliate/email-templates/${template.id}/use`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error tracking template usage:', error)
    }
    
    // Switch to content tab
    setModalTab('content')
    
    toast.success(`Template "${template.name}" berhasil dimuat`)
  }

  const handleSaveDraft = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.body) {
        toast.error('Name, subject, and body are required')
        return
      }

      // Parse target segment
      const targetSegment: any = {}
      if (formData.targetStatus) {
        targetSegment.status = [formData.targetStatus]
      }
      if (formData.targetSource) {
        targetSegment.source = [formData.targetSource]
      }
      if (formData.targetTags) {
        targetSegment.tags = formData.targetTags.split(',').map(t => t.trim()).filter(Boolean)
      }

      // Prepare payload
      const payload: any = {
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        templateId: formData.templateId || null,
        targetSegment: Object.keys(targetSegment).length > 0 ? targetSegment : null,
        scheduledAt: formData.scheduledAt || null,
      }

      // Add recurring config if scheduling is enabled
      if (formData.scheduledAt && formData.recurring.enabled) {
        payload.recurring = {
          enabled: true,
          frequency: formData.recurring.frequency,
          interval: formData.recurring.interval,
          timeOfDay: formData.recurring.timeOfDay,
          endDate: formData.recurring.endDate || null,
          daysOfWeek: formData.recurring.daysOfWeek.length > 0 ? formData.recurring.daysOfWeek : null
        }
      }

      const url = editingBroadcast
        ? `/api/affiliate/broadcast/${editingBroadcast.id}`
        : '/api/affiliate/broadcast'

      const res = await fetch(url, {
        method: editingBroadcast ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        if (formData.scheduledAt) {
          toast.success(
            formData.recurring.enabled 
              ? `Broadcast dijadwalkan dengan pengulangan ${formData.recurring.frequency}!`
              : 'Broadcast berhasil dijadwalkan!'
          )
        } else {
          toast.success(editingBroadcast ? 'Broadcast updated' : 'Draft saved')
        }
        setShowCreateModal(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save broadcast')
      }
    } catch (error) {
      console.error('Error saving broadcast:', error)
      toast.error('Failed to save broadcast')
    }
  }

  const handleSendBroadcast = async (broadcastId: string) => {
    try {
      setSendingBroadcast(broadcastId)

      const res = await fetch(`/api/affiliate/broadcast/${broadcastId}/send`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Broadcast sent to ${data.recipients} recipients!`)
        toast.info(`${data.creditUsed} credits used. Balance: ${data.creditBalance}`)
        fetchData()
      } else {
        if (data.error === 'Insufficient credits') {
          toast.error(`Insufficient credits! Need ${data.required}, have ${data.available}`)
          router.push('/affiliate/credits')
        } else {
          toast.error(data.error || 'Failed to send broadcast')
        }
      }
    } catch (error) {
      console.error('Error sending broadcast:', error)
      toast.error('Failed to send broadcast')
    } finally {
      setSendingBroadcast(null)
    }
  }

  const handleDeleteBroadcast = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return

    try {
      const res = await fetch(`/api/affiliate/broadcast/${broadcastId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Broadcast deleted')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete broadcast')
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error)
      toast.error('Failed to delete broadcast')
    }
  }

  const handleCancelSchedule = async (broadcastId: string) => {
    if (!confirm('Batalkan jadwal broadcast ini?')) return

    try {
      const res = await fetch(`/api/affiliate/broadcast/${broadcastId}/schedule`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Jadwal broadcast dibatalkan. Status kembali ke Draft.')
        fetchData()
      } else {
        toast.error(data.error || 'Failed to cancel schedule')
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error)
      toast.error('Failed to cancel schedule')
    }
  }

  const handleEditBroadcast = (broadcast: Broadcast) => {
    setEditingBroadcast(broadcast)
    
    // Parse recurring config if exists
    const recurringConfig = broadcast.recurringConfig as any
    
    setFormData({
      name: broadcast.name,
      subject: broadcast.subject,
      body: broadcast.body,
      templateId: broadcast.template?.name || '',
      templateName: broadcast.template?.name || '',
      targetStatus: '',
      targetSource: '',
      targetTags: '',
      scheduledAt: broadcast.scheduledAt || '',
      recurring: {
        enabled: recurringConfig?.enabled || false,
        frequency: recurringConfig?.frequency || 'DAILY',
        interval: recurringConfig?.interval || 1,
        timeOfDay: recurringConfig?.timeOfDay || '09:00',
        endDate: recurringConfig?.endDate || '',
        daysOfWeek: recurringConfig?.daysOfWeek || []
      }
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      templateId: '',
      templateName: '',
      targetStatus: '',
      targetSource: '',
      targetTags: '',
      scheduledAt: '',
      recurring: {
        enabled: false,
        frequency: 'DAILY',
        interval: 1,
        timeOfDay: '09:00',
        endDate: '',
        daysOfWeek: []
      }
    })
    setEditingBroadcast(null)
    setModalTab('content')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800'
      case 'SENDING':
        return 'bg-blue-100 text-blue-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBroadcasts = broadcasts.filter(b => {
    if (activeTab === 'all') return true
    if (activeTab === 'draft') return b.status === 'DRAFT'
    if (activeTab === 'sent') return b.status === 'SENT'
    if (activeTab === 'scheduled') return b.isScheduled && b.status === 'DRAFT'
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="broadcast">
    <ResponsivePageWrapper>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Mail className="w-8 h-8 text-blue-600" />
              Broadcast Email
            </h1>
            <p className="text-gray-600">
              Kirim email massal ke leads Anda dengan mudah
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Buat Broadcast Baru
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{broadcasts.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Email Terkirim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {broadcasts.reduce((sum, b) => sum + b.sentCount, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {broadcasts.reduce((sum, b) => sum + b.sentCount, 0) > 0
                  ? Math.round(
                      (broadcasts.reduce((sum, b) => sum + b.openedCount, 0) /
                        broadcasts.reduce((sum, b) => sum + b.sentCount, 0)) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Click Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {broadcasts.reduce((sum, b) => sum + b.sentCount, 0) > 0
                  ? Math.round(
                      (broadcasts.reduce((sum, b) => sum + b.clickedCount, 0) /
                        broadcasts.reduce((sum, b) => sum + b.sentCount, 0)) *
                        100
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Broadcasts List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="scheduled">Terjadwal</TabsTrigger>
                <TabsTrigger value="sent">Terkirim</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filteredBroadcasts.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {activeTab === 'all'
                    ? 'Belum ada broadcast'
                    : `Belum ada broadcast ${activeTab}`}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Broadcast Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBroadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{broadcast.name}</h3>
                          <Badge className={getStatusColor(broadcast.status)}>
                            {broadcast.status}
                          </Badge>
                          {broadcast.isScheduled && (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              Terjadwal
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Subject:</strong> {broadcast.subject}
                        </p>
                        {broadcast.template && (
                          <p className="text-sm text-gray-500">
                            Template: {broadcast.template.name}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/affiliate/broadcast/${broadcast.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {broadcast.status === 'DRAFT' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBroadcast(broadcast)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSendBroadcast(broadcast.id)}
                              disabled={sendingBroadcast === broadcast.id}
                            >
                              {sendingBroadcast === broadcast.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              Kirim
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBroadcast(broadcast.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {broadcast.status === 'SCHEDULED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelSchedule(broadcast.id)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Batalkan Jadwal
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Recipients</p>
                        <p className="text-lg font-semibold flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {broadcast.totalRecipients}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Sent</p>
                        <p className="text-lg font-semibold text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {broadcast.sentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Opened</p>
                        <p className="text-lg font-semibold text-blue-600 flex items-center gap-1">
                          <MailOpen className="w-4 h-4" />
                          {broadcast.openedCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Clicked</p>
                        <p className="text-lg font-semibold text-purple-600 flex items-center gap-1">
                          <MousePointerClick className="w-4 h-4" />
                          {broadcast.clickedCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Credits Used</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {broadcast.creditUsed}
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>
                          Created: {new Date(broadcast.createdAt).toLocaleDateString('id-ID')}
                        </span>
                        {broadcast.sentAt && (
                          <span>
                            Sent: {new Date(broadcast.sentAt).toLocaleString('id-ID')}
                          </span>
                        )}
                        {broadcast.scheduledAt && !broadcast.sentAt && (
                          <span className="text-purple-600 font-medium">
                            Scheduled: {new Date(broadcast.scheduledAt).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBroadcast ? 'Edit Broadcast' : 'Buat Broadcast Baru'}
              </DialogTitle>
              <DialogDescription>
                Buat email broadcast untuk dikirim ke leads Anda
              </DialogDescription>
            </DialogHeader>

            <Tabs value={modalTab} onValueChange={setModalTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Konten</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="targeting">Target & Jadwal</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                {formData.templateName ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">
                            Template Aktif
                          </p>
                          <p className="text-sm text-green-700">
                            Menggunakan template: <strong>{formData.templateName}</strong>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, templateId: '', templateName: '' })}
                        className="text-green-700 hover:text-green-900"
                      >
                        Hapus Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          Belum punya konten? Gunakan template profesional yang sudah disediakan
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setModalTab('templates')}
                        className="whitespace-nowrap"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Pilih Template
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Nama Broadcast *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="contoh: Follow up leads Zoom 10 Desember"
                  />
                </div>

                <div>
                  <Label>Subject Email *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="contoh: Terima kasih sudah join Webinar Ekspor"
                  />
                </div>

                <div>
                  <Label>Isi Email *</Label>
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={12}
                    placeholder="Tulis konten email di sini..."
                    className="font-mono text-sm"
                  />
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      💡 Variabel yang tersedia (otomatis diganti):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <code className="bg-white px-2 py-1 rounded border">
                        {'{'}name{'}'}
                      </code>
                      <code className="bg-white px-2 py-1 rounded border">
                        {'{'}email{'}'}
                      </code>
                      <code className="bg-white px-2 py-1 rounded border">
                        {'{'}phone{'}'}
                      </code>
                      <code className="bg-white px-2 py-1 rounded border">
                        {'{'}affiliate_name{'}'}
                      </code>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Template Center
                      </h4>
                      <p className="text-sm text-blue-700">
                        Pilih template profesional yang sudah disediakan admin untuk mempercepat pembuatan email
                      </p>
                    </div>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada template tersedia</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold group-hover:text-blue-600 transition-colors">
                                {template.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                              {template.previewText && (
                                <span className="text-xs text-gray-500">
                                  • {template.previewText.length} karakter
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Gunakan
                          </Button>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-700 mb-2">
                            <strong className="text-gray-900">Subject:</strong> {template.subject}
                          </p>
                          {template.previewText && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {template.previewText}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="targeting" className="space-y-4">
                <div>
                  <Label>Filter Status Lead</Label>
                  <Select
                    value={formData.targetStatus || "all"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, targetStatus: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="join_zoom">Join Zoom</SelectItem>
                      <SelectItem value="click_membership">Click Membership</SelectItem>
                      <SelectItem value="pending_payment">Pending Payment</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Filter Sumber Lead</Label>
                  <Select
                    value={formData.targetSource || "all"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, targetSource: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="optin">Optin Form</SelectItem>
                      <SelectItem value="zoom">Zoom/Webinar</SelectItem>
                      <SelectItem value="ig">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Filter Tag (pisahkan dengan koma)</Label>
                  <Input
                    value={formData.targetTags}
                    onChange={(e) => setFormData({ ...formData, targetTags: e.target.value })}
                    placeholder="contoh: warm,interested,buyer"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base">Jadwalkan Pengiriman</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.scheduledAt 
                          ? 'Email akan dikirim secara otomatis pada waktu yang ditentukan'
                          : 'Kosongkan untuk kirim sekarang'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Tanggal & Waktu Pengiriman</Label>
                      <Input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledAt: e.target.value })
                        }
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    {formData.scheduledAt && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="recurring-enabled"
                            checked={formData.recurring.enabled}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                recurring: { ...formData.recurring, enabled: e.target.checked }
                              })
                            }
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <Label htmlFor="recurring-enabled" className="cursor-pointer">
                            🔄 Ulangi secara otomatis (Recurring)
                          </Label>
                        </div>

                        {formData.recurring.enabled && (
                          <div className="space-y-4 pl-6 border-l-2 border-purple-300">
                            <div>
                              <Label>Frekuensi</Label>
                              <Select
                                value={formData.recurring.frequency}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    recurring: { ...formData.recurring, frequency: value }
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DAILY">Harian</SelectItem>
                                  <SelectItem value="WEEKLY">Mingguan</SelectItem>
                                  <SelectItem value="MONTHLY">Bulanan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Interval</Label>
                              <Input
                                type="number"
                                min="1"
                                max="30"
                                value={formData.recurring.interval}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    recurring: { ...formData.recurring, interval: parseInt(e.target.value) || 1 }
                                  })
                                }
                                placeholder="1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {formData.recurring.frequency === 'DAILY' && `Setiap ${formData.recurring.interval} hari`}
                                {formData.recurring.frequency === 'WEEKLY' && `Setiap ${formData.recurring.interval} minggu`}
                                {formData.recurring.frequency === 'MONTHLY' && `Setiap ${formData.recurring.interval} bulan`}
                              </p>
                            </div>

                            <div>
                              <Label>Waktu Pengiriman</Label>
                              <Input
                                type="time"
                                value={formData.recurring.timeOfDay}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    recurring: { ...formData.recurring, timeOfDay: e.target.value }
                                  })
                                }
                              />
                            </div>

                            {formData.recurring.frequency === 'WEEKLY' && (
                              <div>
                                <Label>Hari dalam Seminggu</Label>
                                <div className="grid grid-cols-7 gap-2 mt-2">
                                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => {
                                        const days = formData.recurring.daysOfWeek
                                        const newDays = days.includes(index)
                                          ? days.filter(d => d !== index)
                                          : [...days, index]
                                        setFormData({
                                          ...formData,
                                          recurring: { ...formData.recurring, daysOfWeek: newDays }
                                        })
                                      }}
                                      className={`p-2 text-xs rounded border ${
                                        formData.recurring.daysOfWeek.includes(index)
                                          ? 'bg-purple-600 text-white border-purple-600'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <Label>Tanggal Berakhir (opsional)</Label>
                              <Input
                                type="date"
                                value={formData.recurring.endDate}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    recurring: { ...formData.recurring, endDate: e.target.value }
                                  })
                                }
                                min={new Date().toISOString().split('T')[0]}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Kosongkan untuk tidak ada batas waktu
                              </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs text-yellow-800">
                                ⚠️ <strong>Perhatian:</strong> Setiap pengiriman otomatis akan memotong kredit sesuai jumlah penerima.
                                Pastikan saldo kredit Anda mencukupi.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSaveDraft}>
                {editingBroadcast ? 'Update' : 'Simpan Draft'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
    </FeatureLock>
  )
}