'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Download,
  Copy,
  CheckCircle,
  FileText,
  Mail,
  Share2,
  Search,
  Filter,
  Eye,
  EyeOff,
  X,
  Upload,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Material {
  id: string
  title: string
  description: string
  type: 'banner' | 'social' | 'email' | 'copy'
  category: string
  fileUrl: string | null
  content: string | null
  thumbnailUrl: string | null
  downloadCount: number
  isActive: boolean
  createdAt: string
}

const MATERIAL_TYPES = [
  { value: 'banner', label: 'Banner', icon: ImageIcon },
  { value: 'social', label: 'Social Media', icon: Share2 },
  { value: 'email', label: 'Email Template', icon: Mail },
  { value: 'copy', label: 'Sales Copy', icon: FileText },
]

const DEFAULT_CATEGORIES = [
  'Membership',
  'Kursus',
  'Produk',
  'Promo',
  'Seasonal',
  'General',
]

export default function AdminMarketingKitPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploadingFile, setUploadingFile] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'banner' as 'banner' | 'social' | 'email' | 'copy',
    category: 'General',
    content: '',
    fileUrl: '',
    thumbnailUrl: '',
    isActive: true,
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchMaterials()
    }
  }, [status, session])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/marketing-kit')
      const data = await response.json()
      if (response.ok) {
        setMaterials(data.materials || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Judul wajib diisi')
      return
    }

    try {
      setSaving(true)
      const url = editingMaterial 
        ? `/api/admin/marketing-kit/${editingMaterial.id}`
        : '/api/admin/marketing-kit'
      
      const response = await fetch(url, {
        method: editingMaterial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingMaterial ? 'Materi berhasil diupdate' : 'Materi berhasil ditambahkan')
        setShowModal(false)
        resetForm()
        fetchMaterials()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus materi ini?')) return

    try {
      const response = await fetch(`/api/admin/marketing-kit/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Materi berhasil dihapus')
        fetchMaterials()
      } else {
        toast.error('Gagal menghapus')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleToggleActive = async (material: Material) => {
    try {
      const response = await fetch(`/api/admin/marketing-kit/${material.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...material, isActive: !material.isActive }),
      })

      if (response.ok) {
        toast.success(material.isActive ? 'Materi dinonaktifkan' : 'Materi diaktifkan')
        fetchMaterials()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      category: material.category,
      content: material.content || '',
      fileUrl: material.fileUrl || '',
      thumbnailUrl: material.thumbnailUrl || '',
      isActive: material.isActive,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingMaterial(null)
    setFormData({
      title: '',
      description: '',
      type: 'banner',
      category: 'General',
      content: '',
      fileUrl: '',
      thumbnailUrl: '',
      isActive: true,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'fileUrl' | 'thumbnailUrl') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, [field]: data.url }))
        toast.success('File berhasil diupload')
      } else {
        toast.error('Gagal upload file')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploadingFile(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner': return <ImageIcon className="w-4 h-4" />
      case 'social': return <Share2 className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'copy': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'banner': return 'bg-purple-100 text-purple-700'
      case 'social': return 'bg-blue-100 text-blue-700'
      case 'email': return 'bg-green-100 text-green-700'
      case 'copy': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       m.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = typeFilter === 'all' || m.type === typeFilter
    return matchSearch && matchType
  })

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Kit</h1>
            <p className="text-gray-600">Kelola materi promosi untuk affiliate</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Materi
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Banner</p>
                  <p className="text-xl font-bold">{materials.filter(m => m.type === 'banner').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Social Media</p>
                  <p className="text-xl font-bold">{materials.filter(m => m.type === 'social').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Template</p>
                  <p className="text-xl font-bold">{materials.filter(m => m.type === 'email').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sales Copy</p>
                  <p className="text-xl font-bold">{materials.filter(m => m.type === 'copy').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">Semua Tipe</option>
                {MATERIAL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        {filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className={`overflow-hidden ${!material.isActive ? 'opacity-60' : ''}`}>
                {/* Thumbnail */}
                {material.thumbnailUrl ? (
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={material.thumbnailUrl}
                      alt={material.title}
                      className="w-full h-full object-cover"
                    />
                    {!material.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary">Nonaktif</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {getTypeIcon(material.type)}
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getTypeBadgeColor(material.type)}`}>
                      {getTypeIcon(material.type)}
                      {MATERIAL_TYPES.find(t => t.value === material.type)?.label}
                    </span>
                    <Badge variant="outline">{material.category}</Badge>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{material.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{material.description}</p>

                  {material.content && (
                    <div className="bg-gray-50 rounded-lg p-2 mb-3">
                      <p className="text-xs text-gray-600 line-clamp-2 font-mono">{material.content}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>📥 {material.downloadCount} download</span>
                    <span>{new Date(material.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(material)}
                      className="flex-1"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(material)}
                    >
                      {material.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">
                  {searchQuery || typeFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada materi'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'Coba ubah filter pencarian'
                    : 'Mulai dengan menambahkan materi marketing pertama'}
                </p>
                {!searchQuery && typeFilter === 'all' && (
                  <Button onClick={() => { resetForm(); setShowModal(true) }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Materi
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Type Selection */}
                <div>
                  <Label className="mb-2 block">Tipe Materi</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {MATERIAL_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Judul</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Banner Promo Membership"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      {DEFAULT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi singkat tentang materi ini"
                    rows={2}
                  />
                </div>

                {/* Content (for copy/email) */}
                {(formData.type === 'copy' || formData.type === 'email') && (
                  <div>
                    <Label htmlFor="content">Konten / Template</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={formData.type === 'email' 
                        ? 'Template email...' 
                        : 'Sales copy yang bisa di-copy affiliate...\n\n🔥 PROMO TERBATAS!\n\nDaftar membership sekarang...'}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {/* File Upload (for banner/social) */}
                {(formData.type === 'banner' || formData.type === 'social') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>File Banner</Label>
                      <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                        {formData.fileUrl ? (
                          <div className="space-y-2">
                            <img src={formData.fileUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData(prev => ({ ...prev, fileUrl: '' }))}
                            >
                              Hapus
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'fileUrl')}
                              disabled={uploadingFile}
                            />
                            <div className="flex flex-col items-center gap-2 py-4">
                              {uploadingFile ? (
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-gray-400" />
                                  <span className="text-sm text-gray-500">Klik untuk upload</span>
                                  <span className="text-xs text-gray-400">Max 5MB</span>
                                </>
                              )}
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Thumbnail (Opsional)</Label>
                      <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                        {formData.thumbnailUrl ? (
                          <div className="space-y-2">
                            <img src={formData.thumbnailUrl} alt="Thumbnail" className="max-h-32 mx-auto rounded" />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                            >
                              Hapus
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'thumbnailUrl')}
                              disabled={uploadingFile}
                            />
                            <div className="flex flex-col items-center gap-2 py-4">
                              {uploadingFile ? (
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-gray-400" />
                                  <span className="text-sm text-gray-500">Thumbnail preview</span>
                                  <span className="text-xs text-gray-400">Max 5MB</span>
                                </>
                              )}
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Or paste URL */}
                <div>
                  <Label>Atau Paste URL File</Label>
                  <Input
                    value={formData.fileUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Aktif (Tampilkan ke affiliate)
                  </Label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingMaterial ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
