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
  ArrowLeft
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
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit' | 'preview'>('list')
  const [editForm, setEditForm] = useState<Partial<BrandedTemplate>>({})
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())

  const categoryIcons: Record<string, string> = {
    'SYSTEM': '⚙️',
    'MEMBERSHIP': '👑',
    'AFFILIATE': '🤝',
    'COURSE': '📚',
    'PAYMENT': '💳',
    'MARKETING': '📢',
    'NOTIFICATION': '🔔',
  }

  const typeIcons: Record<string, string> = {
    'EMAIL': '📧',
    'WHATSAPP': '💬',
    'SMS': '📱',
    'PUSH': '🔔',
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
  }, [selectedCategory, selectedType])

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
            </select>
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
          <Label htmlFor="content">Konten Template *</Label>
          <Textarea
            id="content"
            value={editForm.content || ''}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            placeholder="Tulis konten template di sini. Gunakan shortcode seperti {name}, {email}, dll."
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Shortcode tersedia: {'{name}'}, {'{email}'}, {'{membership_plan}'}, {'{amount}'}, {'{affiliate_code}'}, dll.
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
                    className="px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="SYSTEM">⚙️ System</option>
                    <option value="MEMBERSHIP">👑 Membership</option>
                    <option value="AFFILIATE">🤝 Affiliate</option>
                    <option value="COURSE">📚 Course</option>
                    <option value="PAYMENT">💳 Payment</option>
                    <option value="MARKETING">📢 Marketing</option>
                    <option value="NOTIFICATION">🔔 Notification</option>
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

            {/* Preview Tab */}
            {activeTab === 'preview' && selectedTemplate && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview Template: {selectedTemplate.name}
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

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Konten</Label>
                      <div className="bg-gray-50 p-4 rounded border">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {selectedTemplate.content}
                        </pre>
                      </div>
                    </div>

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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Template Info */}
          {(activeTab === 'create' || activeTab === 'edit' || activeTab === 'preview') && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Panduan Shortcode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">👤 User</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><code className="bg-gray-100 px-1 rounded">{'{name}'}</code> - Nama user</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{email}'}</code> - Email user</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{phone}'}</code> - Nomor telepon</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">👑 Membership</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><code className="bg-gray-100 px-1 rounded">{'{membership_plan}'}</code> - Paket membership</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{expiry_date}'}</code> - Tanggal expired</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{membership_status}'}</code> - Status membership</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">💳 Transaksi</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><code className="bg-gray-100 px-1 rounded">{'{invoice_number}'}</code> - Nomor invoice</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{amount}'}</code> - Jumlah pembayaran</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{payment_method}'}</code> - Metode bayar</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">🤝 Affiliate</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><code className="bg-gray-100 px-1 rounded">{'{affiliate_code}'}</code> - Kode affiliate</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{commission}'}</code> - Komisi affiliate</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{referrer_name}'}</code> - Nama referrer</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">⚙️ System</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><code className="bg-gray-100 px-1 rounded">{'{site_name}'}</code> - Nama website</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{site_url}'}</code> - URL website</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{support_email}'}</code> - Email support</p>
                      <p><code className="bg-gray-100 px-1 rounded">{'{current_date}'}</code> - Tanggal sekarang</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Implementation Status */}
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
                  <li>• Template preview system</li>
                  <li>• Analytics dan usage tracking</li>
                  <li>• Helper functions untuk integrasi notifikasi</li>
                  <li>• Sample templates untuk semua kategori</li>
                  <li>• Tab interface dengan form edit dan preview</li>
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
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}