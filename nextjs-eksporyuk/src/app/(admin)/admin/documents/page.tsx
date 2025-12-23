'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Trash2, Download, Upload, Plus, Eye, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  title: string
  description: string
  category: string
  visibility: string
  uploadDate: string
  views: number
  downloads: number
  active: boolean
  fileType: string
  fileSize: number
}

export default function AdminDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterVisibility, setFilterVisibility] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    visibility: 'SILVER' as 'SILVER' | 'GOLD' | 'PLATINUM' | 'LIFETIME',
    active: true
  })
  const [file, setFile] = useState<File | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (session?.user && session.user.role !== 'ADMIN')) {
      router.push('/auth/login')
    }
  }, [session, status, router])

  // Fetch documents
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchDocuments()
    }
  }, [session, filterCategory, filterVisibility, filterStatus])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCategory) params.append('category', filterCategory)
      if (filterVisibility && filterVisibility !== 'all') params.append('visibility', filterVisibility)
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/admin/documents?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      toast.error('Gagal mengambil daftar dokumen')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Pilih file terlebih dahulu')
      return
    }

    try {
      setUploading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('visibility', formData.visibility)

      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) throw new Error('Upload failed')

      toast.success('Dokumen berhasil diunggah')
      setOpenUploadDialog(false)
      setFile(null)
      setFormData({
        title: '',
        description: '',
        category: '',
        visibility: 'SILVER',
        active: true
      })
      fetchDocuments()
    } catch (error) {
      toast.error('Gagal mengunggah dokumen')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDocument) return

    try {
      setUploading(true)
      const response = await fetch('/api/admin/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDocument.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          visibility: formData.visibility,
          active: formData.active
        })
      })

      if (!response.ok) throw new Error('Update failed')

      toast.success('Dokumen berhasil diperbarui')
      setOpenEditDialog(false)
      setEditingDocument(null)
      setFormData({
        title: '',
        description: '',
        category: '',
        visibility: 'SILVER',
        active: true
      })
      fetchDocuments()
    } catch (error) {
      toast.error('Gagal memperbarui dokumen')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return

    try {
      const response = await fetch(`/api/admin/documents?id=${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Delete failed')

      toast.success('Dokumen berhasil dihapus')
      fetchDocuments()
    } catch (error) {
      toast.error('Gagal menghapus dokumen')
      console.error(error)
    }
  }

  const openEditForm = (document: Document) => {
    setEditingDocument(document)
    setFormData({
      title: document.title,
      description: document.description,
      category: document.category,
      visibility: document.visibility as any,
      active: document.active
    })
    setOpenEditDialog(true)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Dokumen</h1>
            <p className="mt-2 text-gray-600">Kelola dokumen dan file yang dapat diakses oleh member</p>
          </div>
          <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Unggah Dokumen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Unggah Dokumen Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Judul</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Judul dokumen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Misal: Tutorial, SOP, dll"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Level Akses</label>
                  <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="PLATINUM">Platinum</SelectItem>
                      <SelectItem value="LIFETIME">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File (PDF, DOC, XLS, ZIP - Max 50MB)</label>
                  <Input
                    required
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                  />
                </div>
                <Button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {uploading ? 'Mengunggah...' : 'Unggah'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <Input
              placeholder="Cari kategori..."
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level Akses</label>
            <Select value={filterVisibility} onValueChange={setFilterVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Semua level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua level</SelectItem>
                <SelectItem value="SILVER">Silver</SelectItem>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="PLATINUM">Platinum</SelectItem>
                <SelectItem value="LIFETIME">Lifetime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Memuat dokumen...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Tidak ada dokumen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {doc.visibility}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                    <TableCell>{doc.views}</TableCell>
                    <TableCell>{doc.downloads}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(doc)}
                        className="inline-flex"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(doc.id)}
                        className="inline-flex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Dokumen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Judul</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kategori</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Level Akses</label>
                <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                    <SelectItem value="LIFETIME">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Aktif
                </label>
              </div>
              <Button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700">
                {uploading ? 'Memperbarui...' : 'Perbarui'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
