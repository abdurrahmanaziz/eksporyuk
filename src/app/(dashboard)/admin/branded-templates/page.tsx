'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  FileText, 
  Plus, 
  Eye,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Star,
  TrendingUp,
  Calendar,
  Tag,
  Info,
  Lightbulb,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  X,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  ArrowLeft,
  Settings,
  Send,
  Image
} from 'lucide-react'
import { toast } from 'sonner'

interface BrandedTemplate {
  id: string
  name: string
  slug: string
  category: string
  type: string
  subject: string
  content: string
  description?: string
  ctaText?: string
  ctaLink?: string
  isActive: boolean
  isDefault: boolean
  usageCount: number
  tags?: string[] | string
  customBranding?: any  // Add this
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

interface TemplateStats {
  total: number
  active: number
  totalUsage: number
  avgUsage: number
}

export default function AdminBrandedTemplatesPage() {
  const [templates, setTemplates] = useState<BrandedTemplate[]>([])
  const [stats, setStats] = useState<TemplateStats>({ total: 0, active: 0, totalUsage: 0, avgUsage: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<BrandedTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'preview' | 'settings'>('list')
  const [editForm, setEditForm] = useState<Partial<BrandedTemplate>>({})
  const [settings, setSettings] = useState<any>({})
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const categoryIcons: Record<string, string> = {
    'SYSTEM': '⚙️',
    'MEMBERSHIP': '👑',
    'AFFILIATE': '🤝',
    'COURSE': '📚',
    'PAYMENT': '💳',
    'MARKETING': '📢',
    'NOTIFICATION': '🔔',
    'TRANSACTION': '💸',
  }

  // Deskripsi kategori yang lebih detail untuk memudahkan admin
  const categoryDescriptions: Record<string, string> = {
    'SYSTEM': '🔐 Verifikasi Email, Reset Password, 2FA, Login Baru, Akun Locked/Unlocked, Welcome New User',
    'MEMBERSHIP': '💎 Aktivasi Member, Upgrade/Downgrade, Perpanjangan, Kadaluarsa, Welcome Member Premium',
    'AFFILIATE': '💰 Pendaftaran Affiliate, Approval, Komisi Masuk, Withdraw, Leaderboard, Referral',
    'COURSE': '🎓 Enrollment Kelas, Progress Belajar, Sertifikat, Reminder Belajar, Kelas Baru',
    'PAYMENT': '💳 Reminder Pembayaran, Invoice, Kwitansi, Payment Success/Failed, Refund',
    'MARKETING': '📣 Promosi, Newsletter, Campaign, Broadcast, Flash Sale, Event Invitation',
    'NOTIFICATION': '🔔 Pengumuman, Update Sistem, Maintenance, Info Penting',
    'TRANSACTION': '🧾 Order Created, Payment Pending, Sukses, Gagal, Expired, Refund',
  }

  // Mapping slug prefix ke kategori untuk referensi cepat
  const categorySlugExamples: Record<string, string[]> = {
    'SYSTEM': ['verify-email', 'reset-password', 'welcome-new-user', '2fa-code', 'account-locked'],
    'MEMBERSHIP': ['membership-activated', 'membership-expired', 'membership-renewal', 'welcome-member'],
    'AFFILIATE': ['affiliate-approved', 'commission-received', 'withdrawal-success', 'referral-signup'],
    'COURSE': ['course-enrolled', 'learning-reminder', 'certificate-ready', 'course-completed'],
    'PAYMENT': ['payment-reminder', 'payment-success', 'invoice-created', 'refund-processed'],
    'MARKETING': ['promo-announcement', 'newsletter', 'flash-sale', 'event-invitation'],
    'NOTIFICATION': ['system-announcement', 'maintenance-notice', 'policy-update'],
    'TRANSACTION': ['order-created', 'order-confirmed', 'order-cancelled', 'order-expired'],
  }

  const typeIcons: Record<string, string> = {
    'EMAIL': '📧',
    'WHATSAPP': '💬',
    'SMS': '📱',
    'PUSH': '🔔',
    'NOTIFICATION': '🔔',
  }

  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedType) params.append('type', selectedType)
      params.append('limit', '50')

      const res = await fetch(`/api/admin/branded-templates?${params.toString()}`)
      const data = await res.json()

      console.log('API Response:', data)
      console.log('Response structure:', Object.keys(data))

      if (res.ok) {
        // Fix response structure - API returns data.data.templates, not data.templates
        const templates = data.data?.templates || data.templates || []
        const pagination = data.data?.pagination || data.pagination || {}
        
        console.log('Templates found:', templates.length)
        console.log('First template:', templates[0])
        
        setTemplates(templates)
        
        // Calculate stats
        const active = templates.filter((t: BrandedTemplate) => t.isActive).length
        const totalUsage = templates.reduce((sum: number, t: BrandedTemplate) => sum + t.usageCount, 0)
        setStats({
          total: pagination.totalCount || templates.length,
          active,
          totalUsage,
          avgUsage: Math.round(totalUsage / (templates.length || 1))
        })
      } else {
        console.error('API Error:', data)
        toast.error(data.error || 'Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
    if (activeTab === 'settings') {
      fetchSettings()
    }
    // Auto-load preview when preview tab is opened for EMAIL templates
    if (activeTab === 'preview' && selectedTemplate && selectedTemplate.type === 'EMAIL') {
      fetchPreviewHtml(selectedTemplate)
    }
  }, [selectedCategory, selectedType, activeTab])

  // Fetch settings from API (admin endpoint for full settings)
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (res.ok && data.settings) {
        setSettings(data.settings)
      } else if (res.ok) {
        // Fallback jika response langsung object settings
        setSettings(data)
      } else {
        console.error('Failed to fetch settings:', data.error)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'logo')

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      
      if (res.ok) {
        setSettings({ ...settings, siteLogo: data.url })
        toast.success('Logo berhasil diupload')
      } else {
        toast.error(data.error || 'Gagal upload logo')
      }
    } catch (error) {
      toast.error('Gagal upload logo')
    } finally {
      setUploading(false)
    }
  }

  // Save settings
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteLogo: settings.siteLogo || '',
          emailFooterText: settings.emailFooterText || '',
          emailFooterCompany: settings.emailFooterCompany || '',
          emailFooterAddress: settings.emailFooterAddress || '',
          emailFooterPhone: settings.emailFooterPhone || '',
          emailFooterEmail: settings.emailFooterEmail || '',
          emailFooterWebsiteUrl: settings.emailFooterWebsiteUrl || '',
          emailFooterInstagramUrl: settings.emailFooterInstagramUrl || '',
          emailFooterFacebookUrl: settings.emailFooterFacebookUrl || '',
          emailFooterLinkedinUrl: settings.emailFooterLinkedinUrl || '',
          emailFooterCopyrightText: settings.emailFooterCopyrightText || ''
        })
      })

      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan')
        fetchSettings()
        // Refresh preview if preview tab is active and template is selected
        if (activeTab === 'preview' && selectedTemplate) {
          fetchPreviewHtml(selectedTemplate)
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan')
    }
  }

  // Fetch HTML preview
  const fetchPreviewHtml = async (template: BrandedTemplate) => {
    if (template.type !== 'EMAIL') return
    
    setLoadingPreview(true)
    setPreviewHtml('')
    
    try {
      const res = await fetch(`/api/admin/branded-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customData: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+62812345678',
            membershipPlan: 'Premium Plan',
            expiryDate: '31 Desember 2025',
            amountFormatted: 'Rp 500.000',
            invoiceNumber: 'INV-2025-001',
            affiliateCode: 'JOHNDOE123',
            commissionFormatted: 'Rp 150.000',
            siteName: 'EksporYuk',
            siteUrl: 'https://eksporyuk.com',
            supportEmail: 'support@eksporyuk.com'
          }
        })
      })

      const data = await res.json()
      
      if (res.ok && data.success) {
        setPreviewHtml(data.data?.htmlPreview || '')
      } else {
        console.error('Preview error:', data)
        toast.error(data.error || 'Gagal memuat preview')
        setPreviewHtml('')
      }
    } catch (error) {
      console.error('Preview fetch error:', error)
      toast.error('Gagal memuat preview')
      setPreviewHtml('')
    } finally {
      setLoadingPreview(false)
    }
  }

  // Send test email
  const handleSendTestEmail = async (template: BrandedTemplate | null = selectedTemplate) => {
    if (!template || !testEmail) {
      toast.error('Pilih template dan masukkan email tujuan')
      return
    }

    if (template.type !== 'EMAIL') {
      toast.error('Hanya template EMAIL yang bisa dikirim via email')
      return
    }

    setSendingTest(true)
    try {
      console.log('Sending test email for template:', template.id)
      
      const res = await fetch('/api/admin/branded-templates/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          testEmail: testEmail,
          testData: {
            name: 'John Doe (Test)',
            email: testEmail,
            phone: '+62812345678',
            membership_plan: 'Premium (Test)',
            expiry_date: '31 Desember 2025',
            amount: 'Rp 199.000',
            invoice_number: 'TEST-001',
            affiliate_code: 'TEST123',
            commission: 'Rp 50.000',
            site_name: 'EksporYuk',
            site_url: 'https://eksporyuk.com',
            support_email: 'support@eksporyuk.com',
            current_date: new Date().toLocaleDateString('id-ID')
          }
        })
      })

      const contentType = res.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        toast.error('Server error: Invalid response format')
        return
      }

      const data = await res.json()

      if (res.ok) {
        toast.success(`✅ Email test berhasil dikirim ke ${testEmail}`)
        setTestEmail('')
      } else {
        toast.error(data.error || 'Gagal mengirim email test')
      }
    } catch (error) {
      console.error('Test email error:', error)
      toast.error('Gagal mengirim email test. Cek console untuk detail.')
    } finally {
      setSendingTest(false)
    }
  }

  // Handle edit template
  const handleEdit = (template: BrandedTemplate) => {
    setSelectedTemplate(template)
    setEditForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
      type: template.type,
      subject: template.subject,
      content: template.content,
      ctaText: template.ctaText || '',
      ctaLink: template.ctaLink || '',
      isActive: template.isActive,
      isDefault: template.isDefault
    })
    setActiveTab('edit')
  }

  // Handle view template
  const handleView = (template: BrandedTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('preview')
    // Auto-load preview untuk EMAIL templates
    if (template.type === 'EMAIL') {
      setTimeout(() => {
        fetchPreviewHtml(template)
      }, 300)
    }
  }

  // Save template changes
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const res = await fetch(`/api/admin/branded-templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        toast.success('Template berhasil diperbarui')
        fetchTemplates()
        setActiveTab('list')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui template')
      }
    } catch (error) {
      toast.error('Gagal memperbarui template')
    }
  }

  // Create new template
  const handleCreateTemplate = async () => {
    try {
      const res = await fetch('/api/admin/branded-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        toast.success('Template baru berhasil dibuat')
        fetchTemplates()
        setActiveTab('list')
        setEditForm({})
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat template')
      }
    } catch (error) {
      toast.error('Gagal membuat template')
    }
  }

  // Delete template
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus template "${name}"?`)) return

    try {
      const res = await fetch(`/api/admin/branded-templates/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Template berhasil dihapus')
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus template')
      }
    } catch (error) {
      toast.error('Gagal menghapus template')
    }
  }

  // Duplicate template
  const handleDuplicate = async (template: BrandedTemplate) => {
    try {
      // Handle tags - could be JSON string or array
      let tagsValue = template.tags;
      if (typeof template.tags === 'string') {
        try {
          tagsValue = JSON.parse(template.tags);
        } catch (e) {
          tagsValue = [];
        }
      }

      const res = await fetch('/api/admin/branded-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          category: template.category,
          type: template.type,
          subject: template.subject,
          content: template.content,
          ctaText: template.ctaText,
          ctaLink: template.ctaLink,
          tags: tagsValue,
          isActive: false
        })
      })

      if (res.ok) {
        toast.success('Template berhasil diduplikasi')
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menduplikasi template')
      }
    } catch (error) {
      toast.error('Gagal menduplikasi template')
    }
  }

  // Toggle active status
  const handleToggleActive = async (template: BrandedTemplate) => {
    try {
      const res = await fetch(`/api/admin/branded-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive })
      })

      if (res.ok) {
        toast.success(`Template ${!template.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui template')
      }
    } catch (error) {
      toast.error('Gagal memperbarui template')
    }
  }

  // Get time ago
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Tidak pernah'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hari ini'
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
    return `${Math.floor(diffDays / 30)} bulan lalu`
  }

  // Render template form (for create/edit)
  const renderTemplateForm = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {activeTab === 'create' ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            {activeTab === 'create' ? 'Buat Template Baru' : 'Edit Template'}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('list')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nama Template *</Label>
            <Input
              id="name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Contoh: Welcome Email"
            />
          </div>
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Deskripsi template"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Kategori *</Label>
            <select
              id="category"
              value={editForm.category || ''}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Pilih Kategori</option>
              <option value="SYSTEM">⚙️ System</option>
              <option value="MEMBERSHIP">👑 Membership</option>
              <option value="AFFILIATE">🤝 Affiliate</option>
              <option value="COURSE">📚 Course</option>
              <option value="PAYMENT">💳 Payment</option>
              <option value="MARKETING">📢 Marketing</option>
              <option value="NOTIFICATION">🔔 Notification</option>
              <option value="TRANSACTION">💸 Transaction</option>
            </select>
            {editForm.category && (
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ {categoryDescriptions[editForm.category] || 'Template untuk kategori ini'}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="type">Tipe *</Label>
            <select
              id="type"
              value={editForm.type || ''}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Pilih Tipe</option>
              <option value="EMAIL">📧 Email</option>
              <option value="WHATSAPP">💬 WhatsApp</option>
              <option value="SMS">📱 SMS</option>
              <option value="PUSH">🔔 Push</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="subject">Subject/Judul *</Label>
          <Input
            id="subject"
            value={editForm.subject || ''}
            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
            placeholder="Subject email atau judul pesan"
          />
        </div>

        <div>
          <Label htmlFor="content">Konten Template (Text Editor) *</Label>
          <Textarea
            id="content"
            value={editForm.content || ''}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            placeholder="Tulis konten template dalam format teks biasa...

Contoh:
Halo {{userName}},

Terima kasih atas pembayaran Anda sebesar {{amount}} untuk paket {{membershipPlan}}.

Nomor Invoice: {{invoiceNumber}}

Salam,
Tim Eksporyuk"
            rows={12}
            className="text-sm leading-relaxed"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Gunakan placeholder: {'{'}userName{'}'}, {'{'}userEmail{'}'}, {'{'}membershipPlan{'}'}, {'{'}amount{'}'}, {'{'}invoiceNumber{'}'}, {'{'}affiliateCode{'}'}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            📝 Format teks biasa - Logo header & footer akan diambil dari Settings secara otomatis
          </p>
        </div>

        {/* Background Design Selector */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Background Design</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'simple', name: 'Simple White', preview: 'bg-white border-2 border-gray-200' },
              { id: 'blue', name: 'Professional Blue', preview: 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200' },
              { id: 'green', name: 'Fresh Green', preview: 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200' },
              { id: 'elegant', name: 'Elegant Gray', preview: 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300' },
              { id: 'warm', name: 'Warm Orange', preview: 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200' },
              { id: 'modern', name: 'Modern Dark', preview: 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600' }
            ].map(design => (
              <div
                key={design.id}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  ((editForm.customBranding as any)?.backgroundDesign || 'simple') === design.id 
                    ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-300' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setEditForm(prev => ({
                  ...prev, 
                  customBranding: { ...prev.customBranding as any, backgroundDesign: design.id }
                }))}
              >
                <div className={`h-14 rounded mb-2 flex items-center justify-center text-xs ${design.preview}`}>
                  <span className={design.id === 'modern' ? 'text-white' : 'text-gray-600'}>
                    Sample
                  </span>
                </div>
                <p className="text-xs text-center font-medium">{design.name}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            🎨 Background design akan diterapkan pada email dengan logo & footer dari Settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ctaText">Teks CTA</Label>
            <Input
              id="ctaText"
              value={editForm.ctaText || ''}
              onChange={(e) => setEditForm({ ...editForm, ctaText: e.target.value })}
              placeholder="Contoh: Klik Di Sini"
            />
          </div>
          <div>
            <Label htmlFor="ctaLink">Link CTA</Label>
            <Input
              id="ctaLink"
              value={editForm.ctaLink || ''}
              onChange={(e) => setEditForm({ ...editForm, ctaLink: e.target.value })}
              placeholder="https://eksporyuk.com/..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={editForm.isActive || false}
              onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
            />
            <Label htmlFor="isActive">Template Aktif</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isDefault"
              checked={editForm.isDefault || false}
              onCheckedChange={(checked) => setEditForm({ ...editForm, isDefault: checked })}
            />
            <Label htmlFor="isDefault">Template Default</Label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setActiveTab('list')}
          >
            Batal
          </Button>
          <Button
            onClick={activeTab === 'create' ? handleCreateTemplate : handleSaveTemplate}
            disabled={!editForm.name || !editForm.category || !editForm.type || !editForm.subject || !editForm.content}
          >
            <Save className="w-4 h-4 mr-1" />
            {activeTab === 'create' ? 'Buat Template' : 'Simpan Perubahan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                Template Bermerek
              </h1>
              <p className="text-gray-600">
                Kelola template email dan notifikasi dengan branding konsisten
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={fetchTemplates}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  setEditForm({})
                  setSelectedTemplate(null)
                  setActiveTab('create')
                }}
              >
                <Plus className="w-4 h-4" />
                Buat Template
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Sistem Template Bermerek
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Template ini menggunakan branding konsisten EksporYuk. Admin hanya perlu mengedit konten text, 
                    desain HTML otomatis dihasilkan dengan shortcode system (50+ shortcodes tersedia).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Template</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Template Aktif</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-gray-500">
                    {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% aktif
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Penggunaan</p>
                  <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rata-rata Penggunaan</p>
                  <p className="text-2xl font-bold">{stats.avgUsage}</p>
                  <p className="text-xs text-gray-500">per template</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('list')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Daftar Template ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Buat Template Baru
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Pengaturan Template
              </button>
              {activeTab === 'edit' && selectedTemplate && (
                <button
                  className="whitespace-nowrap py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit: {selectedTemplate.name}
                </button>
              )}
              {activeTab === 'preview' && selectedTemplate && (
                <button
                  className="whitespace-nowrap py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Preview: {selectedTemplate.name}
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={`${activeTab === 'list' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            {activeTab === 'list' && (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Cari template..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchTemplates()}
                      className="pl-10"
                    />
                  </div>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white min-w-[200px]"
                    title={selectedCategory ? categoryDescriptions[selectedCategory] : 'Pilih kategori untuk filter'}
                  >
                    <option value="">📋 Semua Kategori</option>
                    <option value="SYSTEM">⚙️ System (Verifikasi, Reset Password, 2FA)</option>
                    <option value="MEMBERSHIP">👑 Membership (Aktivasi, Perpanjangan)</option>
                    <option value="AFFILIATE">🤝 Affiliate (Komisi, Withdraw)</option>
                    <option value="COURSE">📚 Course (Enrollment, Sertifikat)</option>
                    <option value="PAYMENT">💳 Payment (Invoice, Reminder)</option>
                    <option value="MARKETING">📢 Marketing (Promo, Newsletter)</option>
                    <option value="NOTIFICATION">🔔 Notification (Pengumuman)</option>
                    <option value="TRANSACTION">💸 Transaction (Order, Receipt)</option>
                  </select>
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="EMAIL">📧 Email</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="SMS">📱 SMS</option>
                    <option value="PUSH">🔔 Push</option>
                  </select>
                </div>

                {/* Templates Grid */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Memuat template...</span>
                  </div>
                ) : templates.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Template</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery || selectedCategory || selectedType 
                          ? 'Coba sesuaikan filter Anda'
                          : 'Buat template bermerek pertama Anda'}
                      </p>
                      <Button 
                        className="flex items-center gap-2 mx-auto"
                        onClick={() => setActiveTab('create')}
                      >
                        <Plus className="w-4 h-4" />
                        Buat Template
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {templates.map((template) => (
                      <Card 
                        key={template.id} 
                        className={`relative transition-all hover:shadow-lg ${!template.isActive ? 'opacity-60 border-dashed' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{categoryIcons[template.category] || '📄'}</span>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {template.name}
                                  {template.isDefault && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  )}
                                </CardTitle>
                                <p className="text-xs text-gray-500 font-mono">{template.slug}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleActive(template)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                template.isActive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {template.isActive ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {template.category}
                            </Badge>
                            <Badge variant="outline">
                              {typeIcons[template.type]} {template.type}
                            </Badge>
                          </div>
                          
                          {template.category && categoryDescriptions[template.category] && (
                            <p className="text-xs text-gray-500 mt-2">
                              ℹ️ {categoryDescriptions[template.category]}
                            </p>
                          )}
                        </CardHeader>

                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Subject:</p>
                              <p className="text-sm text-gray-600 truncate">
                                {template.subject}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700">Preview Konten:</p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {template.content.substring(0, 100)}...
                              </p>
                            </div>

                            {template.tags && (() => {
                              // Handle tags - could be JSON string or array
                              let tagsArray = [];
                              try {
                                tagsArray = typeof template.tags === 'string' 
                                  ? JSON.parse(template.tags) 
                                  : template.tags;
                                if (!Array.isArray(tagsArray)) tagsArray = [];
                              } catch (e) {
                                tagsArray = [];
                              }
                              
                              return tagsArray.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {tagsArray.slice(0, 3).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                  {tagsArray.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{tagsArray.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {template.usageCount} penggunaan
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {getTimeAgo(template.lastUsedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 gap-2">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Lihat"
                                onClick={() => handleView(template)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Edit"
                                onClick={() => handleEdit(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Duplikasi"
                                onClick={() => handleDuplicate(template)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(template.id, template.name)}
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Create/Edit Form */}
            {(activeTab === 'create' || activeTab === 'edit') && renderTemplateForm()}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Panduan Kategori Template */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Info className="w-5 h-5" />
                      Panduan Kategori Template
                    </CardTitle>
                    <p className="text-sm text-blue-700">Gunakan kategori yang tepat agar notifikasi terorganisir</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">⚙️ SYSTEM:</span>
                        <span className="text-gray-600 ml-1">Verifikasi Email, Reset Password, 2FA, Login Baru, Welcome User</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">👑 MEMBERSHIP:</span>
                        <span className="text-gray-600 ml-1">Aktivasi Member, Upgrade, Perpanjangan, Kadaluarsa</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">🤝 AFFILIATE:</span>
                        <span className="text-gray-600 ml-1">Pendaftaran, Approval, Komisi Masuk, Withdraw</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">📚 COURSE:</span>
                        <span className="text-gray-600 ml-1">Enrollment Kelas, Progress, Sertifikat, Reminder</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">💳 PAYMENT:</span>
                        <span className="text-gray-600 ml-1">Reminder Bayar, Invoice, Kwitansi, Refund</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">💸 TRANSACTION:</span>
                        <span className="text-gray-600 ml-1">Order Created, Pending, Sukses, Gagal, Expired</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">📢 MARKETING:</span>
                        <span className="text-gray-600 ml-1">Promo, Newsletter, Flash Sale, Event</span>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <span className="font-semibold">🔔 NOTIFICATION:</span>
                        <span className="text-gray-600 ml-1">Pengumuman, Update Sistem, Maintenance</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Service Status */}
                <Card className="border-2 border-green-300 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Status Layanan Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">API Mailketing:</span>
                      <Badge className="bg-green-600">✅ Terhubung</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>✓ Koneksi ke Mailketing API aktif dan aman</p>
                      <p className="text-xs text-gray-500 mt-1">Email akan dikirim menggunakan Mailketing API</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Logo Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Logo Website
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="siteLogo">URL Logo</Label>
                      <Input
                        id="siteLogo"
                        type="url"
                        value={settings.siteLogo || ''}
                        onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">atau</span>
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm transition-colors">
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Image className="w-4 h-4" />
                        )}
                        {uploading ? 'Mengupload...' : 'Upload dari Device'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {settings.siteLogo && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Preview Logo:</p>
                        <img 
                          src={settings.siteLogo} 
                          alt="Logo Preview" 
                          className="h-16 w-auto border border-gray-200 rounded shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Logo yang akan digunakan di header email template. Format: JPG, PNG, GIF (max 2MB)</p>
                  </CardContent>
                </Card>

                {/* Email Footer Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email Footer Settings
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Konfigurasi footer untuk broadcast email</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Company Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emailFooterCompany">Nama Perusahaan</Label>
                        <Input
                          id="emailFooterCompany"
                          value={settings.emailFooterCompany || ''}
                          onChange={(e) => setSettings({ ...settings, emailFooterCompany: e.target.value })}
                          placeholder="EksporYuk"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailFooterAddress">Alamat</Label>
                        <Input
                          id="emailFooterAddress"
                          value={settings.emailFooterAddress || ''}
                          onChange={(e) => setSettings({ ...settings, emailFooterAddress: e.target.value })}
                          placeholder="Jl. Test No. 123, Jakarta"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="emailFooterText">Deskripsi Singkat</Label>
                      <Input
                        id="emailFooterText"
                        value={settings.emailFooterText || ''}
                        onChange={(e) => setSettings({ ...settings, emailFooterText: e.target.value })}
                        placeholder="Platform Edukasi & Mentoring Ekspor Terpercaya"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emailFooterEmail">Email Support</Label>
                        <Input
                          id="emailFooterEmail"
                          type="email"
                          value={settings.emailFooterEmail || ''}
                          onChange={(e) => setSettings({ ...settings, emailFooterEmail: e.target.value })}
                          placeholder="support@eksporyuk.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailFooterWebsiteUrl">Website URL</Label>
                        <Input
                          id="emailFooterWebsiteUrl"
                          type="url"
                          value={settings.emailFooterWebsiteUrl || ''}
                          onChange={(e) => setSettings({ ...settings, emailFooterWebsiteUrl: e.target.value })}
                          placeholder="https://eksporyuk.com"
                        />
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Link Sosial Media (untuk footer email)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">Instagram</Label>
                          <Input
                            type="url"
                            value={settings.emailFooterInstagramUrl || ''}
                            onChange={(e) => setSettings({ ...settings, emailFooterInstagramUrl: e.target.value })}
                            placeholder="https://instagram.com/eksporyuk"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Facebook</Label>
                          <Input
                            type="url"
                            value={settings.emailFooterFacebookUrl || ''}
                            onChange={(e) => setSettings({ ...settings, emailFooterFacebookUrl: e.target.value })}
                            placeholder="https://facebook.com/eksporyuk"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">LinkedIn</Label>
                          <Input
                            type="url"
                            value={settings.emailFooterLinkedinUrl || ''}
                            onChange={(e) => setSettings({ ...settings, emailFooterLinkedinUrl: e.target.value })}
                            placeholder="https://linkedin.com/company/eksporyuk"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="emailFooterCopyrightText">Copyright Text</Label>
                      <Input
                        id="emailFooterCopyrightText"
                        value={settings.emailFooterCopyrightText || ''}
                        onChange={(e) => setSettings({ ...settings, emailFooterCopyrightText: e.target.value })}
                        placeholder="EksporYuk. All rights reserved."
                      />
                    </div>

                    {/* Preview Footer Email */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-3">Preview Footer Email:</p>
                      <div className="bg-white rounded border border-gray-300 p-6 text-center text-sm text-gray-600 space-y-2">
                        <p className="font-semibold text-gray-800">{settings.emailFooterCompany || 'EksporYuk'}</p>
                        <p>{settings.emailFooterText || 'Platform Edukasi & Mentoring Ekspor Terpercaya'}</p>
                        <p>{settings.emailFooterAddress || 'Jl. Test No. 123, Jakarta'} | {settings.emailFooterEmail || 'support@eksporyuk.com'}</p>
                        <div className="flex justify-center gap-4 mt-3">
                          {settings.emailFooterWebsiteUrl && <a href="#" className="text-blue-600 hover:underline">Website</a>}
                          {settings.emailFooterInstagramUrl && <a href="#" className="text-blue-600 hover:underline">Instagram</a>}
                          {settings.emailFooterFacebookUrl && <a href="#" className="text-blue-600 hover:underline">Facebook</a>}
                          {settings.emailFooterLinkedinUrl && <a href="#" className="text-blue-600 hover:underline">LinkedIn</a>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <a href="#" className="text-gray-500 hover:text-gray-700 underline text-xs">
                            Unsubscribe dari email ini
                          </a>
                        </div>
                        <p className="text-gray-400 mt-2">© {new Date().getFullYear()} {settings.emailFooterCopyrightText || 'EksporYuk. All rights reserved.'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Email Section */}
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <Send className="w-5 h-5" />
                      📨 Test Email dengan Mailketing API
                    </CardTitle>
                    <p className="text-sm text-green-700 mt-1">
                      Kirim test email untuk melihat hasil akhir template dengan logo & footer dari Settings
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Template Selection */}
                      <div>
                        <Label htmlFor="testTemplate" className="text-sm font-medium mb-2 block">Pilih Template</Label>
                        <select
                          id="testTemplate"
                          value={selectedTemplate?.id || ''}
                          onChange={(e) => {
                            const template = templates.find(t => t.id === e.target.value)
                            if (template) setSelectedTemplate(template)
                          }}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        >
                          <option value="">-- Pilih Template --</option>
                          {templates.filter(t => t.isActive).map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {templates.filter(t => t.isActive).length} template tersedia
                        </p>
                      </div>
                      
                      {/* Email Input */}
                      <div>
                        <Label htmlFor="testEmail" className="text-sm font-medium mb-2 block">Email Tujuan</Label>
                        <div className="flex gap-2">
                          <Input
                            id="testEmail"
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="masukkan-email@anda.com"
                            className="border-green-300 focus:border-green-500"
                          />
                          <Button
                            onClick={() => handleSendTestEmail()}
                            disabled={!testEmail || !selectedTemplate || sendingTest}
                            className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                          >
                            {sendingTest ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Kirim Test
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Sample Data Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-800 font-medium mb-1">📋 Sample Data yang Digunakan:</p>
                        <ul className="text-xs text-blue-700 space-y-0.5 ml-4">
                          <li>• Nama: John Doe</li>
                          <li>• Email: {testEmail || 'email-anda@example.com'}</li>
                          <li>• Membership Plan: Premium Plan</li>
                          <li>• Amount: Rp 500.000</li>
                          <li>• Invoice: INV-2025-001</li>
                          <li>• Affiliate Code: JOHNDOE123</li>
                        </ul>
                      </div>
                      
                      {/* Status Message */}
                      {selectedTemplate && (
                        <p className="text-xs text-green-700 flex items-center gap-1 bg-green-100 p-2 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Template "{selectedTemplate.name}" siap dikirim ke {testEmail || 'email Anda'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={fetchSettings}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Pengaturan
                  </Button>
                </div>

                {/* Info Box */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Informasi Pengaturan</h4>
                        <ul className="text-blue-800 text-sm space-y-1">
                          <li>• Logo akan otomatis muncul di header semua email template</li>
                          <li>• Footer email akan ditambahkan di akhir setiap template EMAIL</li>
                          <li>• Pengaturan ini berlaku untuk semua template yang aktif</li>
                          <li>• Gunakan fitur test email untuk memastikan tampilan sudah sesuai</li>
                          <li>• Social media links hanya muncul jika diisi</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && selectedTemplate && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview Template: {selectedTemplate.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedTemplate.type === 'EMAIL' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              fetchPreviewHtml(selectedTemplate)
                              setShowPreviewModal(true)
                            }}
                            disabled={loadingPreview}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview HTML Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchPreviewHtml(selectedTemplate)}
                            disabled={loadingPreview}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${loadingPreview ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('list')}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Kembali
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Kategori</Label>
                        <p className="text-sm">{categoryIcons[selectedTemplate.category]} {selectedTemplate.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tipe</Label>
                        <p className="text-sm">{typeIcons[selectedTemplate.type]} {selectedTemplate.type}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Subject/Judul</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded border">{selectedTemplate.subject}</p>
                    </div>

                    {selectedTemplate.type === 'EMAIL' ? (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          📧 Preview Email (Text + Background Design)
                        </Label>
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <div className={`p-6 min-h-[400px] ${
                            ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
                            ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100' :
                            ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'elegant' ? 'bg-gradient-to-br from-gray-50 to-gray-100' :
                            ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'warm' ? 'bg-gradient-to-br from-orange-50 to-orange-100' :
                            ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'modern' ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white' :
                            'bg-white'
                          }`}>
                            {/* Header Logo Placeholder */}
                            <div className="text-center mb-6">
                              <div className={`w-48 h-12 mx-auto rounded flex items-center justify-center text-xs ${ 
                                ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'modern' ? 'bg-slate-700 text-slate-300' : 'bg-blue-600 text-white'
                              }`}>
                                [LOGO DARI SETTINGS]
                              </div>
                            </div>
                            
                            {/* Content Preview */}
                            <div className="max-w-2xl mx-auto">
                              <div className={`text-sm leading-relaxed whitespace-pre-line ${
                                ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'modern' ? 'text-white' : 'text-gray-800'
                              }`}>
                                {selectedTemplate.content
                                  .replace(/\{\{userName\}\}/g, 'John Doe')
                                  .replace(/\{\{userEmail\}\}/g, 'john@example.com')
                                  .replace(/\{\{membershipPlan\}\}/g, 'Premium Plan')
                                  .replace(/\{\{amount\}\}/g, 'Rp 500.000')
                                  .replace(/\{\{invoiceNumber\}\}/g, 'INV-2025-001')
                                  .replace(/\{\{affiliateCode\}\}/g, 'JOHNDOE123')
                                }
                              </div>
                              
                              {/* CTA Button if exists */}
                              {selectedTemplate.ctaText && (
                                <div className="text-center mt-6">
                                  <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium">
                                    {selectedTemplate.ctaText}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Footer Placeholder */}
                            <div className="text-center mt-8 pt-6 border-t border-gray-200">
                              <div className={`text-xs ${
                                ((selectedTemplate.customBranding as any)?.backgroundDesign || 'simple') === 'modern' ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                                [FOOTER DARI SETTINGS]<br/>
                                PT Ekspor Yuk Indonesia | support@eksporyuk.com
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Preview menggunakan sample data. Logo & footer akan diambil dari Settings saat email dikirim.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Konten</Label>
                        <div className="bg-gray-50 p-4 rounded border">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {selectedTemplate.content}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedTemplate.ctaText && selectedTemplate.ctaLink && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Call to Action</Label>
                        <div className="bg-gray-50 p-3 rounded border">
                          <a 
                            href={selectedTemplate.ctaLink}
                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedTemplate.ctaText}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <p className={selectedTemplate.isActive ? 'text-green-600' : 'text-gray-600'}>
                          {selectedTemplate.isActive ? '✅ Aktif' : '⚠️ Nonaktif'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Default</Label>
                        <p className={selectedTemplate.isDefault ? 'text-yellow-600' : 'text-gray-600'}>
                          {selectedTemplate.isDefault ? '⭐ Ya' : '➖ Tidak'}
                        </p>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Penggunaan</Label>
                        <p className="text-gray-600">{selectedTemplate.usageCount || 0}x digunakan</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Terakhir Digunakan</Label>
                        <p className="text-gray-600">
                          {selectedTemplate.lastUsedAt 
                            ? new Date(selectedTemplate.lastUsedAt).toLocaleDateString('id-ID')
                            : 'Belum pernah'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Template Preview */}
          {(activeTab === 'create' || activeTab === 'edit') && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Preview Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editForm.name && editForm.content ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Subject/Judul</Label>
                        <div className="bg-gray-50 p-2 rounded border text-sm">
                          {editForm.subject || 'Tidak ada subject'}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Konten Preview</Label>
                        <div className="bg-white border rounded-lg p-4 min-h-[200px]">
                          <div className="prose prose-sm max-w-none">
                            {editForm.content?.split('\n').map((line, idx) => (
                              <p key={idx} className="mb-2 text-sm">
                                {line.replace(/{(\w+)}/g, (match, key) => {
                                  const sampleData: Record<string, string> = {
                                    name: 'John Doe',
                                    email: 'john@example.com',
                                    phone: '+62812345678',
                                    membership_plan: 'Premium',
                                    expiry_date: '31 Desember 2025',
                                    amount: 'Rp 199.000',
                                    invoice_number: 'INV-001',
                                    affiliate_code: 'JD123',
                                    commission: 'Rp 50.000',
                                    site_name: 'EksporYuk',
                                    site_url: 'https://eksporyuk.com',
                                    support_email: 'support@eksporyuk.com',
                                    current_date: new Date().toLocaleDateString('id-ID')
                                  };
                                  return sampleData[key] || match;
                                })}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {editForm.ctaText && editForm.ctaLink && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Call to Action</Label>
                          <div className="bg-gray-50 p-3 rounded border">
                            <button className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                              {editForm.ctaText}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        💡 Preview menggunakan data contoh. Data sebenarnya akan disesuaikan saat template digunakan.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Mulai mengisi form untuk melihat preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview Tab Full Width */}
          {activeTab === 'preview' && selectedTemplate && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-green-600" />
                    Info Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <Label className="font-medium text-gray-700">Status</Label>
                      <p className={selectedTemplate.isActive ? 'text-green-600' : 'text-gray-600'}>
                        {selectedTemplate.isActive ? '✅ Aktif' : '⚠️ Nonaktif'}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-700">Default</Label>
                      <p className={selectedTemplate.isDefault ? 'text-yellow-600' : 'text-gray-600'}>
                        {selectedTemplate.isDefault ? '⭐ Ya' : '➖ Tidak'}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-700">Penggunaan</Label>
                      <p className="text-gray-800">{selectedTemplate.usageCount} kali</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-700">Dibuat</Label>
                      <p className="text-gray-600">{new Date(selectedTemplate.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <Label className="font-medium text-gray-700">Diperbarui</Label>
                      <p className="text-gray-600">{new Date(selectedTemplate.updatedAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Status Sistem - Moved to bottom */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200 mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Status Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-900 mb-2">✅ Fitur Selesai</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Branded template engine dengan 50+ shortcodes</li>
                  <li>• Database schema dengan Prisma ORM</li>
                  <li>• Admin API endpoints (CRUD operations)</li>
                  <li>• Template preview system dengan real-time preview</li>
                  <li>• Analytics dan usage tracking</li>
                  <li>• Helper functions untuk integrasi notifikasi</li>
                  <li>• Sample templates untuk semua kategori</li>
                  <li>• Tab interface dengan form edit dan preview</li>
                  <li>• Settings untuk logo dan email footer</li>
                  <li>• Test email functionality</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">🚀 Siap Digunakan</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Buat template baru dengan wizard</li>
                  <li>• Edit template dengan real-time preview</li>
                  <li>• Duplikasi template untuk variasi</li>
                  <li>• Aktivasi/deaktivasi template</li>
                  <li>• Filter berdasarkan kategori dan tipe</li>
                  <li>• Search template dengan keyword</li>
                  <li>• Analytics penggunaan template</li>
                  <li>• Integrasi dengan sistem notifikasi</li>
                  <li>• Test email dengan data sample</li>
                  <li>• Pengaturan branding terpusat</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HTML Email Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Preview HTML Email</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-4">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2">Loading preview...</span>
                </div>
              ) : previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border rounded"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <AlertCircle className="w-8 h-8 mr-2" />
                  <span>No preview available</span>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-600">
                💡 Preview menggunakan data sample. Email asli akan menggunakan data real saat dikirim.
              </p>
              <Button
                onClick={() => setShowPreviewModal(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </ResponsivePageWrapper>
  )
}