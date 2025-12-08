'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Archive,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Filter,
  Download,
  Upload,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Documentation {
  id: string
  slug: string
  title: string
  content: string
  excerpt?: string
  category: string
  targetRoles: string[]
  status: string
  isPublic: boolean
  icon?: string
  order: number
  parentId?: string
  publishedAt?: string
  viewCount: number
  author: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  lastEditedBy?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  children?: { id: string; title: string; slug: string; status: string }[]
  _count?: {
    revisions: number
  }
}

const CATEGORIES = [
  { value: 'ROLES', label: 'Peran & Akses' },
  { value: 'FEATURES', label: 'Fitur' },
  { value: 'API', label: 'API Dokumentasi' },
  { value: 'ADMIN', label: 'Panel Admin' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'GUIDES', label: 'Panduan' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'TROUBLESHOOTING', label: 'Troubleshooting' },
  { value: 'GLOSSARY', label: 'Glosarium' },
  { value: 'GETTING_STARTED', label: 'Memulai' },
]

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FOUNDER', label: 'Founder' },
  { value: 'CO_FOUNDER', label: 'Co-Founder' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'AFFILIATE', label: 'Affiliate' },
  { value: 'MEMBER_PREMIUM', label: 'Member Premium' },
  { value: 'MEMBER_FREE', label: 'Member Free' },
]

const STATUS_COLORS = {
  DRAFT: 'bg-gray-500',
  PUBLISHED: 'bg-green-500',
  ARCHIVED: 'bg-orange-500',
}

export default function DocumentationPage() {
  const [docs, setDocs] = useState<Documentation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    excerpt: '',
    category: 'GUIDES',
    targetRoles: [] as string[],
    status: 'DRAFT',
    isPublic: false,
    icon: '',
    order: 0,
    parentId: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    featuredImage: '',
  })

  useEffect(() => {
    fetchDocs()
  }, [filterCategory, filterStatus, filterRole])

  const fetchDocs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterRole !== 'all') params.append('role', filterRole)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/documentation?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setDocs(data.docs || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat dokumentasi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)

      const url = selectedDoc
        ? `/api/admin/documentation/${selectedDoc.id}`
        : '/api/admin/documentation'

      const response = await fetch(url, {
        method: selectedDoc ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Berhasil',
        description: selectedDoc
          ? 'Dokumentasi berhasil diperbarui'
          : 'Dokumentasi berhasil dibuat',
      })

      await fetchDocs()
      setActiveTab('list')
      resetForm()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan dokumentasi',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (doc: Documentation) => {
    setSelectedDoc(doc)
    setFormData({
      slug: doc.slug,
      title: doc.title,
      content: doc.content,
      excerpt: doc.excerpt || '',
      category: doc.category,
      targetRoles: doc.targetRoles,
      status: doc.status,
      isPublic: doc.isPublic,
      icon: doc.icon || '',
      order: doc.order,
      parentId: doc.parentId || '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      featuredImage: '',
    })
    setActiveTab('form')
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumentasi ini?')) return

    try {
      const response = await fetch(`/api/admin/documentation/${docId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Berhasil',
        description: 'Dokumentasi berhasil dihapus',
      })

      await fetchDocs()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus dokumentasi',
        variant: 'destructive',
      })
    }
  }

  const handleBulkAction = async (action: string, docIds: string[]) => {
    if (docIds.length === 0) {
      toast({
        title: 'Peringatan',
        description: 'Pilih minimal satu dokumentasi',
        variant: 'destructive',
      })
      return
    }

    const actionLabels: Record<string, string> = {
      publish: 'mempublikasikan',
      archive: 'mengarsipkan',
      draft: 'mengubah ke draft',
      delete: 'menghapus',
    }

    if (!confirm(`Apakah Anda yakin ingin ${actionLabels[action]} ${docIds.length} dokumentasi?`))
      return

    try {
      const response = await fetch('/api/admin/documentation/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, documentIds: docIds }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Berhasil',
        description: `${data.affectedCount} dokumentasi berhasil ${actionLabels[action]}`,
      })

      await fetchDocs()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal melakukan aksi bulk',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setSelectedDoc(null)
    setFormData({
      slug: '',
      title: '',
      content: '',
      excerpt: '',
      category: 'GUIDES',
      targetRoles: [],
      status: 'DRAFT',
      isPublic: false,
      icon: '',
      order: 0,
      parentId: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      featuredImage: '',
    })
  }

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }))
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Dokumentasi Platform</h1>
          </div>
          <p className="text-muted-foreground">
            Kelola dokumentasi role-based untuk semua pengguna platform EksporYuk
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              <FileText className="h-4 w-4 mr-2" />
              Daftar Dokumentasi
            </TabsTrigger>
            <TabsTrigger value="form">
              <Plus className="h-4 w-4 mr-2" />
              {selectedDoc ? 'Edit Dokumentasi' : 'Buat Dokumentasi'}
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filter & Pencarian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari dokumentasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Kategori</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
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

                  <div>
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Semua Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Role Target</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Semua Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Role</SelectItem>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={fetchDocs} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Cari
                </Button>
              </CardContent>
            </Card>

            {/* Documentation List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dokumentasi ({docs.length})</CardTitle>
                  <Button onClick={() => { resetForm(); setActiveTab('form'); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Baru
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : docs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada dokumentasi ditemukan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="border rounded-lg p-4 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{doc.title}</h3>
                              <Badge className={STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS]}>
                                {doc.status}
                              </Badge>
                              {doc.isPublic && (
                                <Badge variant="outline">Public</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {doc.excerpt || 'Tidak ada deskripsi'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Slug: {doc.slug}</span>
                              <span>•</span>
                              <span>Kategori: {CATEGORIES.find(c => c.value === doc.category)?.label}</span>
                              <span>•</span>
                              <span>Views: {doc.viewCount}</span>
                              {doc._count && doc._count.revisions > 0 && (
                                <>
                                  <span>•</span>
                                  <span>Revisi: {doc._count.revisions}</span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.targetRoles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {ROLES.find(r => r.value === role)?.label || role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(doc.id)}
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
          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDoc ? 'Edit Dokumentasi' : 'Buat Dokumentasi Baru'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Informasi Dasar</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Judul *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL) *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          required
                          placeholder="contoh: panduan-admin"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Deskripsi Singkat</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) =>
                          setFormData({ ...formData, excerpt: e.target.value })
                        }
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Konten (MDX) *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        rows={15}
                        required
                        className="font-mono text-sm"
                        placeholder="# Judul

Tulis konten dalam format Markdown + MDX di sini..."
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Pengaturan</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PUBLISHED">Published</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Role Target</Label>
                      <div className="flex flex-wrap gap-2">
                        {ROLES.map((role) => (
                          <Button
                            key={role.value}
                            type="button"
                            variant={
                              formData.targetRoles.includes(role.value)
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() => toggleRole(role.value)}
                            size="sm"
                          >
                            {role.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={formData.isPublic}
                        onChange={(e) =>
                          setFormData({ ...formData, isPublic: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isPublic">
                        Akses Publik (tanpa login)
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="icon">Icon (Emoji)</Label>
                        <Input
                          id="icon"
                          value={formData.icon}
                          onChange={(e) =>
                            setFormData({ ...formData, icon: e.target.value })
                          }
                          placeholder="📖"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="order">Urutan</Label>
                        <Input
                          id="order"
                          type="number"
                          value={formData.order}
                          onChange={(e) =>
                            setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : selectedDoc ? (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {saving
                        ? 'Menyimpan...'
                        : selectedDoc
                        ? 'Update Dokumentasi'
                        : 'Buat Dokumentasi'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setActiveTab('list')
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}
