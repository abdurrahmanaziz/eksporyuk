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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Clock,
  Mail,
  TrendingUp,
  Loader2,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

interface AutomationStep {
  id: string
  stepOrder: number
  delayHours: number
  emailSubject: string
  emailBody: string
  isActive: boolean
  sentCount: number
  openedCount: number
  clickedCount: number
}

interface Automation {
  id: string
  name: string
  triggerType: string
  isActive: boolean
  createdAt: string
  steps: AutomationStep[]
}

interface EmailTemplate {
  id: string
  name: string
  slug: string
  category: string
  subject: string
  body: string
}

const TRIGGER_TYPES = {
  AFTER_OPTIN: {
    label: 'Setelah Optin',
    description: 'Triggered saat lead mengisi form optin',
    icon: '📝',
    color: 'bg-blue-100 text-blue-800',
  },
  AFTER_ZOOM: {
    label: 'Setelah Zoom',
    description: 'Triggered setelah webinar/zoom selesai',
    icon: '🎥',
    color: 'bg-purple-100 text-purple-800',
  },
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    description: 'Triggered saat checkout tapi belum bayar',
    icon: '💳',
    color: 'bg-orange-100 text-orange-800',
  },
  WELCOME: {
    label: 'Welcome Series',
    description: 'Email series untuk lead baru',
    icon: '👋',
    color: 'bg-green-100 text-green-800',
  },
}

export default function AffiliateAutomationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [automations, setAutomations] = useState<Automation[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStepModal, setShowStepModal] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [editingStep, setEditingStep] = useState<AutomationStep | null>(null)
  const [currentAutomationId, setCurrentAutomationId] = useState<string | null>(null)

  // Form state
  const [automationForm, setAutomationForm] = useState({
    name: '',
    triggerType: '',
  })

  const [stepForm, setStepForm] = useState({
    stepOrder: 1,
    delayHours: 0,
    emailSubject: '',
    emailBody: '',
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [automationsRes, templatesRes] = await Promise.all([
        fetch('/api/affiliate/automation'),
        fetch('/api/affiliate/email-templates'),
      ])

      const automationsData = await automationsRes.json()
      const templatesData = await templatesRes.json()

      if (automationsRes.ok) setAutomations(automationsData.automations)
      if (templatesRes.ok) setTemplates(templatesData.templates)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load automation data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAutomation = async () => {
    try {
      if (!automationForm.name || !automationForm.triggerType) {
        toast.error('Name and trigger type are required')
        return
      }

      const res = await fetch('/api/affiliate/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationForm),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Automation created successfully')
        setShowCreateModal(false)
        resetAutomationForm()
        fetchData()
      } else {
        toast.error(data.error || 'Failed to create automation')
      }
    } catch (error) {
      console.error('Error creating automation:', error)
      toast.error('Failed to create automation')
    }
  }

  const handleToggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/affiliate/automation/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.ok) {
        toast.success(`Automation ${!isActive ? 'activated' : 'deactivated'}`)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update automation')
      }
    } catch (error) {
      console.error('Error toggling automation:', error)
      toast.error('Failed to update automation')
    }
  }

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return

    try {
      const res = await fetch(`/api/affiliate/automation/${automationId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Automation deleted')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete automation')
      }
    } catch (error) {
      console.error('Error deleting automation:', error)
      toast.error('Failed to delete automation')
    }
  }

  const handleAddStep = async () => {
    if (!currentAutomationId) return

    try {
      if (!stepForm.emailSubject || !stepForm.emailBody) {
        toast.error('Subject and body are required')
        return
      }

      const res = await fetch(`/api/affiliate/automation/${currentAutomationId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepForm),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Step added successfully')
        setShowStepModal(false)
        resetStepForm()
        fetchData()
      } else {
        toast.error(data.error || 'Failed to add step')
      }
    } catch (error) {
      console.error('Error adding step:', error)
      toast.error('Failed to add step')
    }
  }

  const handleUpdateStep = async () => {
    if (!editingStep || !currentAutomationId) return

    try {
      const res = await fetch(
        `/api/affiliate/automation/${currentAutomationId}/steps/${editingStep.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stepForm),
        }
      )

      if (res.ok) {
        toast.success('Step updated successfully')
        setShowStepModal(false)
        resetStepForm()
        setEditingStep(null)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update step')
      }
    } catch (error) {
      console.error('Error updating step:', error)
      toast.error('Failed to update step')
    }
  }

  const handleDeleteStep = async (automationId: string, stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return

    try {
      const res = await fetch(`/api/affiliate/automation/${automationId}/steps/${stepId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Step deleted')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete step')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      toast.error('Failed to delete step')
    }
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    setStepForm({
      ...stepForm,
      emailSubject: template.subject,
      emailBody: template.body,
    })
    toast.success(`Template "${template.name}" loaded`)
  }

  const openAddStepModal = (automationId: string) => {
    const automation = automations.find((a) => a.id === automationId)
    if (!automation) return

    setCurrentAutomationId(automationId)
    setStepForm({
      stepOrder: automation.steps.length + 1,
      delayHours: 0,
      emailSubject: '',
      emailBody: '',
    })
    setEditingStep(null)
    setShowStepModal(true)
  }

  const openEditStepModal = (automationId: string, step: AutomationStep) => {
    setCurrentAutomationId(automationId)
    setEditingStep(step)
    setStepForm({
      stepOrder: step.stepOrder,
      delayHours: step.delayHours,
      emailSubject: step.emailSubject,
      emailBody: step.emailBody,
    })
    setShowStepModal(true)
  }

  const resetAutomationForm = () => {
    setAutomationForm({
      name: '',
      triggerType: '',
    })
    setEditingAutomation(null)
  }

  const resetStepForm = () => {
    setStepForm({
      stepOrder: 1,
      delayHours: 0,
      emailSubject: '',
      emailBody: '',
    })
    setEditingStep(null)
    setCurrentAutomationId(null)
  }

  const formatDelay = (hours: number) => {
    if (hours === 0) return 'Immediately'
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''}`
  }

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
    <FeatureLock feature="automation">
    <ResponsivePageWrapper>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-600" />
              Automation Sequence
            </h1>
            <p className="text-gray-600">
              Setup email sequences yang berjalan otomatis untuk follow-up leads
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Buat Automation Baru
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Cara Kerja Automation:</strong>
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Pilih trigger type (kapan automation dimulai)</li>
                  <li>Tambahkan step-step email dengan delay yang diinginkan</li>
                  <li>Aktifkan automation, sistem akan menjalankannya otomatis</li>
                  <li>Credit akan dipotong saat setiap email terkirim</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{automations.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {automations.filter((a) => a.isActive).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {automations.reduce((sum, a) => sum + a.steps.length, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Emails Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {automations.reduce(
                  (sum, a) => sum + a.steps.reduce((s, step) => s + step.sentCount, 0),
                  0
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Automations List */}
        {automations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Belum ada automation sequence</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Automation Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {automations.map((automation) => {
              const triggerConfig = TRIGGER_TYPES[automation.triggerType as keyof typeof TRIGGER_TYPES]
              
              return (
                <Card key={automation.id} className={!automation.isActive ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{automation.name}</h3>
                          <Badge className={triggerConfig?.color || 'bg-gray-100 text-gray-800'}>
                            {triggerConfig?.icon} {triggerConfig?.label}
                          </Badge>
                          {automation.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Play className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Pause className="w-3 h-3 mr-1" />
                              Paused
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{triggerConfig?.description}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={automation.isActive ? 'outline' : 'default'}
                          onClick={() =>
                            handleToggleAutomation(automation.id, automation.isActive)
                          }
                        >
                          {automation.isActive ? (
                            <>
                              <Pause className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAutomation(automation.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Steps */}
                    {automation.steps.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-3">Belum ada email step</p>
                        <Button
                          size="sm"
                          onClick={() => openAddStepModal(automation.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Step Pertama
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 mb-4">
                          {automation.steps
                            .sort((a, b) => a.stepOrder - b.stepOrder)
                            .map((step, index) => (
                              <div
                                key={step.id}
                                className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                                      {step.stepOrder}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">
                                          {formatDelay(step.delayHours)}
                                        </span>
                                      </div>
                                      <h4 className="font-semibold">{step.emailSubject}</h4>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEditStepModal(automation.id, step)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleDeleteStep(automation.id, step.id)
                                      }
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                  {step.emailBody.substring(0, 150)}...
                                </p>

                                {/* Step Stats */}
                                <div className="flex gap-6 text-sm">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="text-gray-600">
                                      {step.sentCount} sent
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                    <span className="text-gray-600">
                                      {step.openedCount} opened
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-600">
                                      {step.clickedCount} clicked
                                    </span>
                                  </div>
                                </div>

                                {index < automation.steps.length - 1 && (
                                  <div className="flex justify-center mt-3">
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => openAddStepModal(automation.id)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Step Baru
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Automation Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Automation Baru</DialogTitle>
              <DialogDescription>
                Pilih trigger type untuk memulai automation sequence
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nama Automation *</Label>
                <Input
                  value={automationForm.name}
                  onChange={(e) =>
                    setAutomationForm({ ...automationForm, name: e.target.value })
                  }
                  placeholder="contoh: Welcome Series untuk Lead Baru"
                />
              </div>

              <div>
                <Label>Trigger Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {Object.entries(TRIGGER_TYPES).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setAutomationForm({ ...automationForm, triggerType: key })
                      }
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        automationForm.triggerType === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{config.icon}</span>
                        <span className="font-semibold">{config.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetAutomationForm()
                }}
              >
                Batal
              </Button>
              <Button onClick={handleCreateAutomation}>Buat Automation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Step Modal */}
        <Dialog open={showStepModal} onOpenChange={setShowStepModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStep ? 'Edit Email Step' : 'Tambah Email Step'}
              </DialogTitle>
              <DialogDescription>
                Setup email yang akan dikirim otomatis dalam sequence ini
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Step Order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={stepForm.stepOrder}
                    onChange={(e) =>
                      setStepForm({
                        ...stepForm,
                        stepOrder: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Delay (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stepForm.delayHours}
                    onChange={(e) =>
                      setStepForm({
                        ...stepForm,
                        delayHours: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0 = immediately"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDelay(stepForm.delayHours)} after trigger
                  </p>
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <Label>Gunakan Template (optional)</Label>
                <Accordion type="single" collapsible className="border rounded-lg mt-2">
                  <AccordionItem value="templates">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Browse {templates.length} Templates</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleUseTemplate(template)}
                            className="w-full text-left p-3 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm">{template.name}</p>
                                <p className="text-xs text-gray-600">
                                  {template.subject}
                                </p>
                              </div>
                              <Copy className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div>
                <Label>Subject Email *</Label>
                <Input
                  value={stepForm.emailSubject}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, emailSubject: e.target.value })
                  }
                  placeholder="contoh: Selamat datang di Ekspor Yuk!"
                />
              </div>

              <div>
                <Label>Body Email *</Label>
                <Textarea
                  value={stepForm.emailBody}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, emailBody: e.target.value })
                  }
                  rows={12}
                  placeholder="Tulis isi email di sini..."
                  className="font-mono text-sm"
                />
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    💡 Variabel yang tersedia:
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
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStepModal(false)
                  resetStepForm()
                }}
              >
                Batal
              </Button>
              <Button onClick={editingStep ? handleUpdateStep : handleAddStep}>
                {editingStep ? 'Update Step' : 'Tambah Step'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
    </FeatureLock>
  )
}