'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Loader2,
  Search,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  name: string
  slug: string
  category: string
  subject: string
  body: string
  previewText: string | null
  thumbnailUrl: string | null
  isActive: boolean
  useCount: number
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  { value: 'WELCOME', label: 'Welcome / Selamat Datang' },
  { value: 'FOLLOWUP', label: 'Follow Up' },
  { value: 'PROMO', label: 'Promosi / Penawaran' },
  { value: 'REMINDER', label: 'Reminder / Pengingat' },
  { value: 'EDUCATION', label: 'Edukasi / Tips' },
  { value: 'ZOOM', label: 'Zoom / Webinar' },
  { value: 'PAYMENT', label: 'Payment Reminder' },
]

const DEFAULT_TEMPLATES = [
  {
    name: 'Welcome Lead Baru',
    category: 'WELCOME',
    subject: 'Selamat datang di Ekspor Yuk! 🎉',
    body: `Halo {name},

Terima kasih sudah bergabung! Kami sangat senang Anda tertarik untuk belajar ekspor.

Perkenalkan, saya [Nama Affiliate] yang akan menemani perjalanan ekspor Anda.

Langkah pertama yang bisa Anda lakukan:
1. Join grup WhatsApp kami untuk update terbaru
2. Ikuti webinar gratis "Cara Mulai Ekspor dari Nol"
3. Download e-book panduan ekspor

Ada pertanyaan? Langsung balas email ini ya!

Salam sukses,
[Nama Affiliate]`,
    previewText: 'Langkah pertama memulai ekspor Anda'
  },
  {
    name: 'Reminder Zoom H-1',
    category: 'ZOOM',
    subject: 'Reminder: Webinar BESOK 🎯',
    body: `Halo {name},

JANGAN LUPA!

Webinar "Strategi Ekspor untuk Pemula" akan dimulai BESOK.

📅 Tanggal: [TANGGAL]
⏰ Jam: [JAM]
🔗 Link Zoom: [LINK]

Tips agar maksimal:
- Siapkan catatan
- Join 5 menit lebih awal
- Siapkan pertanyaan

Sampai jumpa besok!

Salam,
[Nama Affiliate]`,
    previewText: 'Webinar dimulai besok, jangan sampai ketinggalan!'
  },
  {
    name: 'Follow Up After Zoom',
    category: 'FOLLOWUP',
    subject: 'Terima kasih sudah join webinar! 🙏',
    body: `Halo {name},

Terima kasih sudah hadir di webinar tadi!

Berikut rangkuman materi:
1. [Poin 1]
2. [Poin 2]
3. [Poin 3]

BONUS khusus peserta:
🎁 Diskon 20% untuk membership Ekspor Yuk (berlaku 48 jam)
🔗 Klaim di: [LINK PROMO]

Ada pertanyaan lanjutan? Reply email ini ya!

Salam sukses,
[Nama Affiliate]`,
    previewText: 'Rangkuman materi + bonus khusus untuk Anda'
  },
  {
    name: 'Payment Reminder 30 Menit',
    category: 'PAYMENT',
    subject: 'Checkout Anda menunggu! ⏰',
    body: `Halo {name},

Kami lihat Anda tadi sudah hampir checkout membership Ekspor Yuk!

Jangan khawatir, pesanan Anda masih kami simpan.

Butuh bantuan untuk menyelesaikan pembayaran? 
Balas email ini atau hubungi WhatsApp kami.

Sampai jumpa di dalam member area!

Salam,
[Nama Affiliate]`,
    previewText: 'Pesanan Anda menunggu pembayaran'
  },
  {
    name: 'Last Call Promo',
    category: 'PROMO',
    subject: '⚠️ TERAKHIR! Promo berakhir malam ini',
    body: `Halo {name},

Ini pengingat TERAKHIR!

Promo spesial untuk Anda akan berakhir MALAM INI jam 23:59.

Jangan sampai menyesal ketinggalan:
✅ Diskon [XX]%
✅ Bonus eksklusif
✅ Akses selamanya

🔗 Klaim sekarang: [LINK]

Setelah promo berakhir, harga kembali normal.

Salam,
[Nama Affiliate]`,
    previewText: 'Promo berakhir malam ini!'
  }
]

export default function AdminEmailTemplatesPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject: '',
    body: '',
    previewText: '',
    thumbnailUrl: '',
    isActive: true,
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTemplates()
    }
  }, [status])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/affiliate/email-templates')
      const data = await res.json()

      if (res.ok) {
        setTemplates(data.templates)
      } else {
        toast.error(data.error || 'Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        category: template.category,
        subject: template.subject,
        body: template.body,
        previewText: template.previewText || '',
        thumbnailUrl: template.thumbnailUrl || '',
        isActive: template.isActive,
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        name: '',
        category: '',
        subject: '',
        body: '',
        previewText: '',
        thumbnailUrl: '',
        isActive: true,
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.category || !formData.subject || !formData.body) {
        toast.error('Please fill all required fields')
        return
      }

      setSaving(true)

      const url = editingTemplate
        ? `/api/admin/affiliate/email-templates/${editingTemplate.id}`
        : '/api/admin/affiliate/email-templates'

      const res = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(editingTemplate ? 'Template updated' : 'Template created')
        setShowModal(false)
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/admin/affiliate/email-templates/${deletingId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Template deleted')
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateDefaultTemplates = async () => {
    try {
      setSaving(true)
      
      for (const template of DEFAULT_TEMPLATES) {
        await fetch('/api/admin/affiliate/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...template,
            isActive: true,
          }),
        })
      }

      toast.success('Default templates created!')
      fetchTemplates()
    } catch (error) {
      console.error('Error creating default templates:', error)
      toast.error('Failed to create default templates')
    } finally {
      setSaving(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || template.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value
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
    <ResponsivePageWrapper>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Template Email Affiliate
            </h1>
            <p className="text-gray-600">
              Kelola template email yang dapat digunakan oleh affiliate
            </p>
          </div>

          <div className="flex gap-3">
            {templates.length === 0 && (
              <Button variant="outline" onClick={handleCreateDefaultTemplates} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Buat Template Default
              </Button>
            )}
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-5 h-5 mr-2" />
              Tambah Template
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{templates.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Template Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {templates.filter(t => t.isActive).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Digunakan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {templates.reduce((sum, t) => sum + t.useCount, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {new Set(templates.map(t => t.category)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Cari template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter || "all"} onValueChange={(val) => setCategoryFilter(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardContent className="pt-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Belum ada template</p>
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Template Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          <Badge variant="outline">
                            {getCategoryLabel(template.category)}
                          </Badge>
                          {template.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">Nonaktif</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        {template.previewText && (
                          <p className="text-sm text-gray-500">{template.previewText}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Digunakan {template.useCount}x
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenModal(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingId(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Buat Template Baru'}
              </DialogTitle>
              <DialogDescription>
                Template ini akan tersedia untuk semua affiliate
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Template *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="contoh: Welcome Lead Baru"
                  />
                </div>

                <div>
                  <Label>Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Subject Email *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="contoh: Selamat datang di Ekspor Yuk! 🎉"
                />
              </div>

              <div>
                <Label>Preview Text</Label>
                <Input
                  value={formData.previewText}
                  onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                  placeholder="Teks yang muncul di preview email (opsional)"
                />
              </div>

              <div>
                <Label>Isi Email *</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={15}
                  placeholder="Tulis konten email..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Variabel tersedia: {'{'}name{'}'}, {'{'}email{'}'}, {'{'}phone{'}'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Template Aktif</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingTemplate ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            </DialogHeader>

            {previewTemplate && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-500">Subject:</p>
                  <p className="font-semibold">{previewTemplate.subject}</p>
                </div>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {previewTemplate.body}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setPreviewTemplate(null)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
              <AlertDialogDescription>
                Template yang dihapus tidak dapat dikembalikan. Affiliate tidak akan bisa menggunakan template ini lagi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ResponsivePageWrapper>
  )
}
