'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trash2, Download, Upload, Plus, Eye, Edit2, FileText, FolderOpen } from 'lucide-react'
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
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper
      title="Manajemen Dokumen"
      subtitle="Kelola dokumen dan file yang dapat diakses oleh member"
      backButton={false}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Dokumen</p>
                <p className="text-2xl font-bold text-blue-700">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Total Views</p>
                <p className="text-2xl font-bold text-green-700">
                  {documents.reduce((acc, doc) => acc + doc.views, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Total Downloads</p>
                <p className="text-2xl font-bold text-purple-700">
                  {documents.reduce((acc, doc) => acc + doc.downloads, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600">Aktif</p>
                <p className="text-2xl font-bold text-orange-700">
                  {documents.filter(d => d.active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mb-4">
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
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Dokumen</CardTitle>
          <CardDescription>Total {documents.length} dokumen</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Memuat dokumen...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Tidak ada dokumen</p>
              <p className="text-sm text-gray-400">Klik tombol "Unggah Dokumen" untuk menambah</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="hidden md:table-cell">Ukuran</TableHead>
                    <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Downloads</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="font-medium line-clamp-1">{doc.title}</p>
                            <p className="text-xs text-gray-500 md:hidden">{doc.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{doc.category}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {doc.visibility}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {formatDate(doc.uploadDate)}
                      </TableCell>
                      <TableCell className="text-center">{doc.views}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell">{doc.downloads}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditForm(doc)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
    </ResponsivePageWrapper>
  )
}
