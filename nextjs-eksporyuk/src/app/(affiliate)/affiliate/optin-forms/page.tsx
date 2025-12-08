'use client'

import { useState, useEffect } from 'react'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
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
  ExternalLink
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
  _count?: {
    leads: number
  }
}

export default function OptinFormsPage() {
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState<OptinForm[]>([])
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingForm, setEditingForm] = useState<OptinForm | null>(null)
  const [deletingForm, setDeletingForm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    formName: '',
    headline: '',
    description: '',
    submitButtonText: 'Submit',
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
    faqs: [] as { question: string; answer: string }[]
  })

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

  const handleOpenModal = (form?: OptinForm) => {
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
        countdownEndDate: form.countdownEndDate ? form.countdownEndDate.split('T')[0] + 'T' + form.countdownEndDate.split('T')[1].substring(0, 5) : '',
        benefits: parsedBenefits,
        faqs: parsedFaqs
      })
    } else {
      setEditingForm(null)
      setFormData({
        formName: '',
        headline: '',
        description: '',
        submitButtonText: 'Submit',
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
        benefits: [],
        faqs: []
      })
    }
    setShowFormModal(true)
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
        setShowFormModal(false)
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

  const copyEmbedCode = (form: OptinForm) => {
    const identifier = form.slug || form.id
    const embedCode = `<iframe src="${window.location.origin}/optin/${identifier}" width="100%" height="500" frameborder="0"></iframe>`
    navigator.clipboard.writeText(embedCode)
    toast.success('Embed code berhasil disalin!')
  }

  const copyFormLink = (form: OptinForm) => {
    const identifier = form.slug || form.id
    const link = `${window.location.origin}/optin/${identifier}`
    navigator.clipboard.writeText(link)
    toast.success('Link form berhasil disalin!')
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
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
      <div className="px-6 sm:px-8 lg:px-12 py-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Optin Forms</h1>
                <p className="text-gray-600">Buat form untuk mengumpulkan leads dan kontak prospek</p>
              </div>
            </div>
            <Button onClick={() => handleOpenModal()} className="h-11">
              <Plus className="h-4 w-4 mr-2" />
              Buat Form Baru
            </Button>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Belum ada Optin Form</h3>
                <p className="text-gray-500 mb-6">
                  Buat form pertama Anda untuk mulai mengumpulkan leads
                </p>
                <Button onClick={() => handleOpenModal()} className="h-11">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Form Pertama
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 truncate">{form.formName}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {form.headline}
                      </CardDescription>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                      form.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {form.isActive ? 'Aktif' : 'Nonaktif'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Submissions</p>
                        <p className="text-2xl font-bold text-blue-600">{form.submissionCount}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Leads</p>
                        <p className="text-2xl font-bold text-green-600">{form._count?.leads || 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form.collectName && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">Nama</span>
                      )}
                      {form.collectEmail && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">Email</span>
                      )}
                      {form.collectPhone && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">Phone</span>
                      )}
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10"
                        onClick={() => copyFormLink(form)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Salin Link Form
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10"
                          onClick={() => handleOpenModal(form)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingForm(form.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
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

        {/* Form Modal */}
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-2xl px-6 py-6">
            <DialogHeader className="space-y-1 pb-4">
              <DialogTitle className="text-xl">
                {editingForm ? 'Edit Optin Form' : 'Buat Optin Form Baru'}
              </DialogTitle>
              <DialogDescription>
                Buat form untuk mengumpulkan data leads dari prospek Anda
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="action">Action</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="formName" className="text-sm mb-2 block">Nama Form *</Label>
                  <Input
                    id="formName"
                    value={formData.formName}
                    onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
                    placeholder="Contoh: Download Ebook Gratis"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="headline" className="text-sm mb-2 block">Headline *</Label>
                  <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="Judul yang menarik untuk form Anda"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm mb-2 block">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat tentang apa yang akan didapat"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4 mt-0">
                <div>
                  <Label className="text-sm mb-3 block">Field yang Dikumpulkan *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Label htmlFor="collectName" className="cursor-pointer font-normal">Nama</Label>
                      <Switch
                        id="collectName"
                        checked={formData.collectName}
                        onCheckedChange={(checked) => setFormData({ ...formData, collectName: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Label htmlFor="collectEmail" className="cursor-pointer font-normal">Email</Label>
                      <Switch
                        id="collectEmail"
                        checked={formData.collectEmail}
                        onCheckedChange={(checked) => setFormData({ ...formData, collectEmail: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Label htmlFor="collectPhone" className="cursor-pointer font-normal">Nomor WhatsApp</Label>
                      <Switch
                        id="collectPhone"
                        checked={formData.collectPhone}
                        onCheckedChange={(checked) => setFormData({ ...formData, collectPhone: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="submitButtonText" className="text-sm mb-2 block">Teks Tombol Submit</Label>
                  <Input
                    id="submitButtonText"
                    value={formData.submitButtonText}
                    onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
                    placeholder="Submit"
                    className="h-11"
                  />
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-4 mt-0 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Banner Hero</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="bannerBadgeText" className="text-xs mb-1 block text-gray-600">Teks Badge</Label>
                        <Input
                          id="bannerBadgeText"
                          value={formData.bannerBadgeText}
                          onChange={(e) => setFormData({ ...formData, bannerBadgeText: e.target.value })}
                          placeholder="Event Terbatas - Daftar Sekarang!"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-semibold mb-3 block">Warna Theme</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="primaryColor" className="text-xs mb-2 block text-gray-600">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="h-10 w-16 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            placeholder="#2563eb"
                            className="h-10 flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor" className="text-xs mb-2 block text-gray-600">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            className="h-10 w-16 p-1 cursor-pointer"
                          />
                          <Input
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            placeholder="#4f46e5"
                            className="h-10 flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-semibold mb-3 block">Countdown Timer</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showCountdown" className="text-xs text-gray-600">
                          Tampilkan Countdown Timer
                        </Label>
                        <Switch
                          id="showCountdown"
                          checked={formData.showCountdown}
                          onCheckedChange={(checked) => setFormData({ ...formData, showCountdown: checked })}
                        />
                      </div>
                      
                      {formData.showCountdown && (
                        <div>
                          <Label htmlFor="countdownEndDate" className="text-xs mb-2 block text-gray-600">
                            Waktu Berakhir
                          </Label>
                          <Input
                            id="countdownEndDate"
                            type="datetime-local"
                            value={formData.countdownEndDate}
                            onChange={(e) => setFormData({ ...formData, countdownEndDate: e.target.value })}
                            className="h-10"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold">Benefits</Label>
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
                      {formData.benefits.map((benefit, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={benefit}
                            onChange={(e) => {
                              const newBenefits = [...formData.benefits]
                              newBenefits[index] = e.target.value
                              setFormData({ ...formData, benefits: newBenefits })
                            }}
                            placeholder="Contoh: Akses penuh ke event eksklusif"
                            className="h-10 flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newBenefits = formData.benefits.filter((_, i) => i !== index)
                              setFormData({ ...formData, benefits: newBenefits })
                            }}
                            className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {formData.benefits.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded border-2 border-dashed">
                          Belum ada benefits. Klik tombol Add untuk menambah.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-semibold">FAQs</Label>
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
                      {formData.faqs.map((faq, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Label className="text-xs text-gray-600">FAQ #{index + 1}</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newFaqs = formData.faqs.filter((_, i) => i !== index)
                                setFormData({ ...formData, faqs: newFaqs })
                              }}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
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
                        <p className="text-xs text-gray-500 text-center py-4 bg-white rounded border-2 border-dashed">
                          Belum ada FAQs. Klik tombol Add untuk menambah.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="action" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="redirectType" className="text-sm mb-2 block">Setelah Submit</Label>
                  <Select
                    value={formData.redirectType}
                    onValueChange={(value) => setFormData({ ...formData, redirectType: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">Tampilkan Pesan</SelectItem>
                      <SelectItem value="url">Redirect ke URL</SelectItem>
                      <SelectItem value="whatsapp">Redirect ke WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.redirectType === 'message' && (
                  <div>
                    <Label htmlFor="successMessage" className="text-sm mb-2 block">Pesan Sukses</Label>
                    <Textarea
                      id="successMessage"
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
                    <Label htmlFor="redirectUrl" className="text-sm mb-2 block">URL Redirect</Label>
                    <Input
                      id="redirectUrl"
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      placeholder="https://..."
                      className="h-11"
                    />
                  </div>
                )}

                {formData.redirectType === 'whatsapp' && (
                  <div>
                    <Label htmlFor="redirectWhatsapp" className="text-sm mb-2 block">Nomor WhatsApp</Label>
                    <Input
                      id="redirectWhatsapp"
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
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowFormModal(false)} className="flex-1 h-11">
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-11">
                {saving ? 'Menyimpan...' : editingForm ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
          <AlertDialogContent className="max-w-md">
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