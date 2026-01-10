'use client'

import { useState, useEffect } from 'react'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Check,
  X,
  Palette,
  Settings,
  FileText,
  MousePointerClick,
  Clock,
  Gift,
  HelpCircle,
  Sparkles,
  Users,
  TrendingUp
} from 'lucide-react'

interface OptinForm {
  id: string
  slug: string | null
  formName: string
  headline: string
  description: string | null
  submitButtonText: string
  successMessage: string
  redirectType: string
  redirectUrl: string | null
  redirectWhatsapp: string | null
  collectName: boolean
  collectEmail: boolean
  collectPhone: boolean
  submissionCount: number
  isActive: boolean
  bannerTitle: string | null
  bannerSubtitle: string | null
  bannerBadgeText: string | null
  primaryColor: string | null
  secondaryColor: string | null
  showCountdown: boolean
  countdownEndDate: string | null
  benefits: any
  faqs: any
  viewCount?: number
  createdAt?: string
  _count?: {
    leads: number
  }
}

const defaultFormData = {
  formName: '',
  headline: '',
  description: '',
  submitButtonText: 'Daftar Sekarang',
  successMessage: 'Terima kasih! Data Anda telah kami terima.',
  redirectType: 'message',
  redirectUrl: '',
  redirectWhatsapp: '',
  collectName: true,
  collectEmail: true,
  collectPhone: true,
  bannerTitle: '',
  bannerSubtitle: '',
  bannerBadgeText: 'Event Terbatas - Daftar Sekarang!',
  primaryColor: '#2563eb',
  secondaryColor: '#4f46e5',
  showCountdown: false,
  countdownEndDate: '',
  benefits: [] as string[],
  faqs: [] as { question: string; answer: string }[],
  thankYouHeadline: "You're In! 🎉",
  thankYouDescription: 'Selamat! Pendaftaran Anda berhasil. Silakan cek email/WhatsApp untuk informasi selanjutnya.',
  thankYouCtaText: 'Gabung Komunitas',
  thankYouCtaUrl: '',
  showSocialProof: true
}

export default function OptinFormsPage() {
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState<OptinForm[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingForm, setEditingForm] = useState<OptinForm | null>(null)
  const [deletingForm, setDeletingForm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState(defaultFormData)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/affiliate/optin-forms')
      const data = await res.json()

      if (res.ok) {
        setForms(data.optinForms)
      } else {
        toast.error('Gagal memuat Optin Forms')
      }
    } catch (error) {
      console.error('Error fetching optin forms:', error)
      toast.error('Gagal memuat Optin Forms')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditor = (form?: OptinForm) => {
    if (form) {
      setEditingForm(form)
      const parsedBenefits = Array.isArray(form.benefits) ? form.benefits : []
      const parsedFaqs = Array.isArray(form.faqs) ? form.faqs : []
      
      setFormData({
        formName: form.formName,
        headline: form.headline,
        description: form.description || '',
        submitButtonText: form.submitButtonText,
        successMessage: form.successMessage,
        redirectType: form.redirectType,
        redirectUrl: form.redirectUrl || '',
        redirectWhatsapp: form.redirectWhatsapp || '',
        collectName: form.collectName,
        collectEmail: form.collectEmail,
        collectPhone: form.collectPhone,
        bannerTitle: form.bannerTitle || '',
        bannerSubtitle: form.bannerSubtitle || '',
        bannerBadgeText: form.bannerBadgeText || 'Event Terbatas - Daftar Sekarang!',
        primaryColor: form.primaryColor || '#2563eb',
        secondaryColor: form.secondaryColor || '#4f46e5',
        showCountdown: form.showCountdown || false,
        countdownEndDate: form.countdownEndDate ? form.countdownEndDate.split('T')[0] + 'T' + (form.countdownEndDate.split('T')[1]?.substring(0, 5) || '00:00') : '',
        benefits: parsedBenefits,
        faqs: parsedFaqs,
        thankYouHeadline: "You're In! 🎉",
        thankYouDescription: form.successMessage || 'Selamat! Pendaftaran Anda berhasil.',
        thankYouCtaText: 'Gabung Komunitas',
        thankYouCtaUrl: form.redirectUrl || '',
        showSocialProof: true
      })
    } else {
      setEditingForm(null)
      setFormData(defaultFormData)
    }
    setActiveTab('basic')
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formData.formName.trim() || !formData.headline.trim()) {
      toast.error('Nama form dan headline harus diisi')
      return
    }

    setSaving(true)
    try {
      const url = editingForm 
        ? `/api/affiliate/optin-forms/${editingForm.id}`
        : '/api/affiliate/optin-forms'
      
      const res = await fetch(url, {
        method: editingForm ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(editingForm ? 'Form berhasil diupdate!' : 'Form berhasil dibuat!')
        setShowEditor(false)
        await fetchForms()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan form')
      }
    } catch (error) {
      console.error('Error saving form:', error)
      toast.error('Gagal menyimpan form')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (formId: string) => {
    try {
      const res = await fetch(`/api/affiliate/optin-forms/${formId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Form berhasil dihapus!')
        setDeletingForm(null)
        await fetchForms()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus form')
      }
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Gagal menghapus form')
    }
  }

  const copyFormLink = (form: OptinForm) => {
    const identifier = form.slug || form.id
    const link = `${window.location.origin}/optin/${identifier}`
    navigator.clipboard.writeText(link)
    toast.success('Link form berhasil disalin!')
  }

  const openFormLink = (form: OptinForm) => {
    const identifier = form.slug || form.id
    window.open(`/optin/${identifier}`, '_blank')
  }

  const calculateConversionRate = (form: OptinForm) => {
    const views = form.viewCount || form.submissionCount * 3 || 1
    const rate = (form.submissionCount / views) * 100
    return rate.toFixed(1)
  }

  // Form Preview Component
  const FormPreview = () => (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'} mx-auto`}>
      <div 
        className="text-white p-4 sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
        }}
      >
        {formData.bannerBadgeText && (
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-xs font-medium">{formData.bannerBadgeText}</span>
          </div>
        )}
        
        <h2 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
          {formData.headline || 'Headline Form Anda'}
        </h2>
        
        {formData.description && (
          <p className="text-sm text-blue-100 opacity-90">
            {formData.description}
          </p>
        )}
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
          {formData.collectName && (
            <div>
              <Label className="text-xs mb-1 block text-gray-600">Nama</Label>
              <Input placeholder="Masukkan nama Anda" className="h-9 text-sm" disabled />
            </div>
          )}
          {formData.collectEmail && (
            <div>
              <Label className="text-xs mb-1 block text-gray-600">Email</Label>
              <Input placeholder="email@example.com" className="h-9 text-sm" disabled />
            </div>
          )}
          {formData.collectPhone && (
            <div>
              <Label className="text-xs mb-1 block text-gray-600">WhatsApp</Label>
              <Input placeholder="628123456789" className="h-9 text-sm" disabled />
            </div>
          )}
          <Button 
            className="w-full h-10 text-sm font-medium"
            style={{ backgroundColor: formData.primaryColor }}
            disabled
          >
            {formData.submitButtonText || 'Submit'}
          </Button>
        </div>

        {formData.benefits.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-600" />
              Apa Yang Anda Dapatkan
            </h4>
            <ul className="space-y-1.5">
              {formData.benefits.slice(0, 3).map((benefit: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
              {formData.benefits.length > 3 && (
                <li className="text-xs text-gray-400">+{formData.benefits.length - 3} lainnya</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )

  // Thank You Page Preview
  const ThankYouPreview = () => (
    <div className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'} mx-auto p-6`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {formData.thankYouHeadline || "You're In! 🎉"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {formData.thankYouDescription || formData.successMessage}
        </p>
        {formData.thankYouCtaText && (
          <Button 
            className="h-10"
            style={{ backgroundColor: formData.primaryColor }}
            disabled
          >
            {formData.thankYouCtaText}
          </Button>
        )}
        
        {formData.showSocialProof && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
                ))}
              </div>
              <span className="text-xs text-gray-500">+500 orang sudah bergabung</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-4 sm:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Memuat Optin Forms...</p>
            </div>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="optin-forms">
    <ResponsivePageWrapper>
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Optin Forms</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Buat form untuk mengumpulkan leads</p>
              </div>
            </div>
            <Button onClick={() => handleOpenEditor()} className="h-10 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Buat Form Baru
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        {forms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Forms</p>
                  <p className="text-lg font-bold">{forms.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Leads</p>
                  <p className="text-lg font-bold">{forms.reduce((acc, f) => acc + f.submissionCount, 0)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded">
                  <Check className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Aktif</p>
                  <p className="text-lg font-bold">{forms.filter(f => f.isActive).length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Conversion</p>
                  <p className="text-lg font-bold">
                    {forms.length > 0 
                      ? (forms.reduce((acc, f) => acc + parseFloat(calculateConversionRate(f)), 0) / forms.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {forms.length === 0 ? (
          <Card>
            <CardContent className="py-12 sm:py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                  <ClipboardList className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Belum ada Optin Form</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Buat form pertama Anda untuk mulai mengumpulkan leads
                </p>
                <Button onClick={() => handleOpenEditor()} className="h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Form Pertama
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div 
                  className="h-2"
                  style={{ background: `linear-gradient(90deg, ${form.primaryColor || '#2563eb'}, ${form.secondaryColor || '#4f46e5'})` }}
                />
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1 truncate">{form.formName}</CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">
                        {form.headline}
                      </CardDescription>
                    </div>
                    <Badge variant={form.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {form.isActive ? 'Aktif' : 'Draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500">Leads</p>
                        <p className="text-base font-bold text-blue-600">{form.submissionCount}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500">Conversion</p>
                        <p className="text-base font-bold text-green-600">{calculateConversionRate(form)}%</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500">Fields</p>
                        <p className="text-base font-bold text-purple-600">
                          {[form.collectName, form.collectEmail, form.collectPhone].filter(Boolean).length}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {form.collectName && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">Nama</span>
                      )}
                      {form.collectEmail && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">Email</span>
                      )}
                      {form.collectPhone && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">Phone</span>
                      )}
                      {form.showCountdown && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">⏰ Countdown</span>
                      )}
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs"
                          onClick={() => copyFormLink(form)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Salin Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs"
                          onClick={() => openFormLink(form)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Preview
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-9 text-xs"
                          onClick={() => handleOpenEditor(form)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit Form
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingForm(form.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Editor Sheet (Mobile-friendly) */}
        <Sheet open={showEditor} onOpenChange={setShowEditor}>
          <SheetContent side="bottom" className="h-[95vh] sm:h-[90vh] p-0 rounded-t-2xl">
            <div className="flex flex-col h-full">
              {/* Editor Header */}
              <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {editingForm ? 'Edit Form' : 'Form Baru'}
                      </h3>
                      <p className="text-xs text-gray-500 hidden sm:block">
                        {formData.formName || 'Untitled Form'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="hidden sm:inline ml-1">Preview</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Editor Content */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col lg:flex-row">
                  {/* Left: Form Settings */}
                  <div className={`flex-1 overflow-hidden ${showPreview ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {/* Mobile Tab Navigation */}
                        <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
                          <div className="flex gap-2 min-w-max">
                            {[
                              { id: 'basic', icon: FileText, label: 'Basic' },
                              { id: 'fields', icon: Settings, label: 'Fields' },
                              { id: 'design', icon: Palette, label: 'Design' },
                              { id: 'action', icon: MousePointerClick, label: 'Action' },
                              { id: 'thankyou', icon: Sparkles, label: 'Thank You' }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                  activeTab === tab.id 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tab Contents */}
                        {activeTab === 'basic' && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm mb-2 block">Nama Form *</Label>
                              <Input
                                value={formData.formName}
                                onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
                                placeholder="Contoh: Download Ebook Gratis"
                                className="h-11"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-2 block">Headline *</Label>
                              <Input
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                placeholder="Judul yang menarik untuk form Anda"
                                className="h-11"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-2 block">Deskripsi</Label>
                              <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Deskripsi singkat tentang apa yang akan didapat"
                                rows={3}
                                className="resize-none"
                              />
                            </div>
                            <div>
                              <Label className="text-sm mb-2 block">Badge Text</Label>
                              <Input
                                value={formData.bannerBadgeText}
                                onChange={(e) => setFormData({ ...formData, bannerBadgeText: e.target.value })}
                                placeholder="Event Terbatas - Daftar Sekarang!"
                                className="h-11"
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'fields' && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm mb-3 block font-medium">Field yang Dikumpulkan</Label>
                              <div className="space-y-2">
                                {[
                                  { key: 'collectName', label: 'Nama', desc: 'Nama lengkap pengunjung' },
                                  { key: 'collectEmail', label: 'Email', desc: 'Alamat email untuk follow-up' },
                                  { key: 'collectPhone', label: 'WhatsApp', desc: 'Nomor WA untuk kontak langsung' }
                                ].map((field) => (
                                  <div key={field.key} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                    <div>
                                      <p className="font-medium text-sm">{field.label}</p>
                                      <p className="text-xs text-gray-500">{field.desc}</p>
                                    </div>
                                    <Switch
                                      checked={formData[field.key as keyof typeof formData] as boolean}
                                      onCheckedChange={(checked) => setFormData({ ...formData, [field.key]: checked })}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm mb-2 block">Teks Tombol Submit</Label>
                              <Input
                                value={formData.submitButtonText}
                                onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
                                placeholder="Daftar Sekarang"
                                className="h-11"
                              />
                            </div>
                          </div>
                        )}

                        {activeTab === 'design' && (
                          <div className="space-y-4">
                            {/* Colors */}
                            <div>
                              <Label className="text-sm mb-3 block font-medium">Warna Theme</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs mb-1.5 block text-gray-500">Primary</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={formData.primaryColor}
                                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                      className="h-10 w-14 p-1 cursor-pointer"
                                    />
                                    <Input
                                      value={formData.primaryColor}
                                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                      className="h-10 flex-1 font-mono text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs mb-1.5 block text-gray-500">Secondary</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={formData.secondaryColor}
                                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                      className="h-10 w-14 p-1 cursor-pointer"
                                    />
                                    <Input
                                      value={formData.secondaryColor}
                                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                      className="h-10 flex-1 font-mono text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Countdown */}
                            <div className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-amber-600" />
                                  <Label className="text-sm font-medium">Countdown Timer</Label>
                                </div>
                                <Switch
                                  checked={formData.showCountdown}
                                  onCheckedChange={(checked) => setFormData({ ...formData, showCountdown: checked })}
                                />
                              </div>
                              {formData.showCountdown && (
                                <Input
                                  type="datetime-local"
                                  value={formData.countdownEndDate}
                                  onChange={(e) => setFormData({ ...formData, countdownEndDate: e.target.value })}
                                  className="h-10"
                                />
                              )}
                            </div>

                            {/* Benefits */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-green-600" />
                                  <Label className="text-sm font-medium">Benefits</Label>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setFormData({ ...formData, benefits: [...formData.benefits, ''] })}
                                  className="h-8"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {formData.benefits.map((benefit: string, index: number) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      value={benefit}
                                      onChange={(e) => {
                                        const newBenefits = [...formData.benefits]
                                        newBenefits[index] = e.target.value
                                        setFormData({ ...formData, benefits: newBenefits })
                                      }}
                                      placeholder="Contoh: Akses ke grup eksklusif"
                                      className="h-10 flex-1"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const newBenefits = formData.benefits.filter((_: string, i: number) => i !== index)
                                        setFormData({ ...formData, benefits: newBenefits })
                                      }}
                                      className="h-10 w-10 p-0 text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                {formData.benefits.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded border-dashed border-2">
                                    Tambahkan benefit untuk menarik pengunjung
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* FAQs */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <HelpCircle className="h-4 w-4 text-amber-600" />
                                  <Label className="text-sm font-medium">FAQs</Label>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setFormData({ ...formData, faqs: [...formData.faqs, { question: '', answer: '' }] })}
                                  className="h-8"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                              <div className="space-y-3">
                                {formData.faqs.map((faq: { question: string; answer: string }, index: number) => (
                                  <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <Label className="text-xs text-gray-500">FAQ #{index + 1}</Label>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const newFaqs = formData.faqs.filter((_: { question: string; answer: string }, i: number) => i !== index)
                                          setFormData({ ...formData, faqs: newFaqs })
                                        }}
                                        className="h-6 w-6 p-0 text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      value={faq.question}
                                      onChange={(e) => {
                                        const newFaqs = [...formData.faqs]
                                        newFaqs[index].question = e.target.value
                                        setFormData({ ...formData, faqs: newFaqs })
                                      }}
                                      placeholder="Pertanyaan..."
                                      className="h-9 bg-white"
                                    />
                                    <Textarea
                                      value={faq.answer}
                                      onChange={(e) => {
                                        const newFaqs = [...formData.faqs]
                                        newFaqs[index].answer = e.target.value
                                        setFormData({ ...formData, faqs: newFaqs })
                                      }}
                                      placeholder="Jawaban..."
                                      rows={2}
                                      className="resize-none bg-white text-sm"
                                    />
                                  </div>
                                ))}
                                {formData.faqs.length === 0 && (
                                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded border-dashed border-2">
                                    Tambahkan FAQ untuk menjawab pertanyaan umum
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'action' && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm mb-2 block">Setelah Submit</Label>
                              <Select
                                value={formData.redirectType}
                                onValueChange={(value) => setFormData({ ...formData, redirectType: value })}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="message">Tampilkan Pesan Sukses</SelectItem>
                                  <SelectItem value="url">Redirect ke URL</SelectItem>
                                  <SelectItem value="whatsapp">Redirect ke WhatsApp</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {formData.redirectType === 'message' && (
                              <div>
                                <Label className="text-sm mb-2 block">Pesan Sukses</Label>
                                <Textarea
                                  value={formData.successMessage}
                                  onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                                  placeholder="Terima kasih! Data Anda telah kami terima."
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>
                            )}

                            {formData.redirectType === 'url' && (
                              <div>
                                <Label className="text-sm mb-2 block">URL Redirect</Label>
                                <Input
                                  value={formData.redirectUrl}
                                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                                  placeholder="https://..."
                                  className="h-11"
                                />
                              </div>
                            )}

                            {formData.redirectType === 'whatsapp' && (
                              <div>
                                <Label className="text-sm mb-2 block">Nomor WhatsApp</Label>
                                <Input
                                  value={formData.redirectWhatsapp}
                                  onChange={(e) => setFormData({ ...formData, redirectWhatsapp: e.target.value })}
                                  placeholder="628123456789"
                                  className="h-11"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Format: 628xxx (tanpa +, tanpa spasi)
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'thankyou' && (
                          <div className="space-y-4">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-green-800">
                                <Sparkles className="h-4 w-4 inline mr-1" />
                                Kustomisasi halaman Thank You setelah submit berhasil
                              </p>
                            </div>

                            <div>
                              <Label className="text-sm mb-2 block">Headline Thank You</Label>
                              <Input
                                value={formData.thankYouHeadline}
                                onChange={(e) => setFormData({ ...formData, thankYouHeadline: e.target.value })}
                                placeholder="You're In! 🎉"
                                className="h-11"
                              />
                            </div>

                            <div>
                              <Label className="text-sm mb-2 block">Deskripsi</Label>
                              <Textarea
                                value={formData.thankYouDescription}
                                onChange={(e) => setFormData({ ...formData, thankYouDescription: e.target.value })}
                                placeholder="Selamat! Pendaftaran Anda berhasil..."
                                rows={3}
                                className="resize-none"
                              />
                            </div>

                            <div>
                              <Label className="text-sm mb-2 block">CTA Button Text</Label>
                              <Input
                                value={formData.thankYouCtaText}
                                onChange={(e) => setFormData({ ...formData, thankYouCtaText: e.target.value })}
                                placeholder="Gabung Komunitas"
                                className="h-11"
                              />
                            </div>

                            <div>
                              <Label className="text-sm mb-2 block">CTA Button URL</Label>
                              <Input
                                value={formData.thankYouCtaUrl}
                                onChange={(e) => setFormData({ ...formData, thankYouCtaUrl: e.target.value })}
                                placeholder="https://wa.me/628xxx"
                                className="h-11"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">Social Proof</p>
                                <p className="text-xs text-gray-500">Tampilkan avatar & jumlah bergabung</p>
                              </div>
                              <Switch
                                checked={formData.showSocialProof}
                                onCheckedChange={(checked) => setFormData({ ...formData, showSocialProof: checked })}
                              />
                            </div>
                          </div>
                        )}

                        {/* Bottom padding for mobile safe area */}
                        <div className="h-20 lg:h-4" />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right: Preview Panel */}
                  <div className={`bg-gray-100 border-l ${showPreview ? 'flex-1 lg:w-1/2' : 'hidden lg:block lg:w-1/2'}`}>
                    <div className="p-4 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Preview</span>
                          <Badge variant="outline" className="text-xs">
                            {activeTab === 'thankyou' ? 'Thank You Page' : 'Opt-in Form'}
                          </Badge>
                        </div>
                        <div className="flex gap-1 bg-white rounded-lg p-1 border">
                          <Button
                            variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setPreviewMode('mobile')}
                            className="h-7 px-2"
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setPreviewMode('desktop')}
                            className="h-7 px-2"
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="py-4">
                          {activeTab === 'thankyou' ? <ThankYouPreview /> : <FormPreview />}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Optin Form?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus form ini? Semua data submission akan tetap tersimpan di Leads.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="h-10">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingForm && handleDelete(deletingForm)}
                className="bg-red-600 hover:bg-red-700 h-10"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ResponsivePageWrapper>
    </FeatureLock>
  )
}
