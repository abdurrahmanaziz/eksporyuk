'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, Upload, Edit, Trash2, Eye, Download, CheckCircle, 
  XCircle, Search, Filter, FileDown, AlertCircle 
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
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

type Document = {
  id: string
  title: string
  description?: string
  category: string
  minimumLevel: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  isActive: boolean
  viewCount: number
  downloadCount: number
  createdAt: string
  uploader: {
    id: string
    name: string
    email: string
  }
  _count?: {
    downloadLogs: number
  }
}

type DownloadLog = {
  id: string
  membershipLevel: string
  downloadedAt: string
  ipAddress?: string
  userAgent?: string
  status: string
  adminVerified: boolean
  notes?: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  document: {
    id: string
    title: string
    category: string
    minimumLevel: string
  }
}

const CATEGORIES = [
  'Panduan',
  'Template',
  'Buyer Data',
  'Legalitas',
  'Pelatihan',
  'Referensi',
  'Lainnya',
]

const LEVELS = ['FREE', 'SILVER', 'GOLD', 'PLATINUM', 'LIFETIME']

export default function AdminMembershipDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [logs, setLogs] = useState<DownloadLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('list')
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Panduan',
    minimumLevel: 'FREE',
    isActive: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      fetchDocuments()
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      const debounce = setTimeout(() => {
        fetchDocuments()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterCategory, status, session])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory)

      const res = await fetch(`/api/admin/membership-documents?${params}`)
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/membership-documents/download-logs')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 50MB')
        return
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
      ]
      if (!allowedTypes.includes(file.type)) {
        alert('Tipe file tidak didukung! Gunakan PDF, DOCX, XLSX, atau ZIP')
        return
      }

      setUploadFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadFile && !editingDoc) {
      alert('Pilih file untuk diupload')
      return
    }

    try {
      setSaving(true)

      if (editingDoc) {
        // Update existing document (without file)
        const res = await fetch(`/api/admin/membership-documents/${editingDoc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Gagal update dokumen')
        }
      } else {
        // Create new document
        const formDataObj = new FormData()
        formDataObj.append('title', formData.title)
        formDataObj.append('description', formData.description)
        formDataObj.append('category', formData.category)
        formDataObj.append('minimumLevel', formData.minimumLevel)
        formDataObj.append('isActive', formData.isActive.toString())
        formDataObj.append('file', uploadFile!)

        const res = await fetch('/api/admin/membership-documents', {
          method: 'POST',
          body: formDataObj,
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Gagal upload dokumen')
        }
      }

      await fetchDocuments()
      resetForm()
      alert(editingDoc ? 'Dokumen berhasil diupdate!' : 'Dokumen berhasil diupload!')
    } catch (error: any) {
      console.error('Error saving document:', error)
      alert(error.message || 'Gagal menyimpan dokumen')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Panduan',
      minimumLevel: 'FREE',
      isActive: true,
    })
    setUploadFile(null)
    setEditingDoc(null)
    setActiveTab('list')
  }

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc)
    setFormData({
      title: doc.title,
      description: doc.description || '',
      category: doc.category,
      minimumLevel: doc.minimumLevel,
      isActive: doc.isActive,
    })
    setActiveTab('form')
  }

  const handleDelete = async () => {
    if (!docToDelete) return

    try {
      const res = await fetch(`/api/admin/membership-documents/${docToDelete}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Gagal menghapus dokumen')

      await fetchDocuments()
      setDeleteDialogOpen(false)
      setDocToDelete(null)
      alert('Dokumen berhasil dihapus!')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Gagal menghapus dokumen')
    }
  }

  const handleExportLogs = async () => {
    try {
      const res = await fetch('/api/admin/membership-documents/download-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) throw new Error('Gagal export logs')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `download-logs-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting logs:', error)
      alert('Gagal export logs')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (loading && documents.length === 0) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="text-center">Loading...</div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Dokumen Membership</h1>
          <p className="text-gray-600 mt-2">Manajemen dokumen eksklusif untuk member dengan log aktivitas lengkap</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">
              <FileText className="w-4 h-4 mr-2" />
              Daftar Dokumen
            </TabsTrigger>
            <TabsTrigger value="form">
              <Upload className="w-4 h-4 mr-2" />
              {editingDoc ? 'Edit Dokumen' : 'Upload Dokumen'}
            </TabsTrigger>
            <TabsTrigger value="logs" onClick={() => fetchLogs()}>
              <Eye className="w-4 h-4 mr-2" />
              Log Download
            </TabsTrigger>
          </TabsList>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Dokumen dan semua log download akan dihapus permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDocToDelete(null)}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* LIST TAB */}
          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari dokumen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setActiveTab('form')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Baru
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Dokumen</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Kategori</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Level</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">View</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Download</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              <div className="text-xs text-gray-500">
                                {doc.fileName} • {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{doc.category}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge>{doc.minimumLevel}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {doc.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                Nonaktif
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="w-3 h-3 text-gray-400" />
                              {doc.viewCount}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Download className="w-3 h-3 text-gray-400" />
                              {doc.downloadCount}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(doc)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDocToDelete(doc.id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {documents.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Belum ada dokumen</p>
                    <p className="text-sm mt-2">Upload dokumen pertama Anda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORM TAB */}
          <TabsContent value="form" className="space-y-6">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    {editingDoc ? 'Edit Dokumen' : 'Upload Dokumen Baru'}
                  </CardTitle>
                  <CardDescription>
                    {editingDoc ? 'Update informasi dokumen' : 'Upload dokumen eksklusif untuk member'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Judul Dokumen *</Label>
                      <Input
                        id="title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Contoh: Panduan Ekspor ke Jepang 2025"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Deskripsi singkat tentang dokumen ini..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Kategori *</Label>
                      <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="minimumLevel">Level Minimum *</Label>
                      <Select value={formData.minimumLevel} onValueChange={(val) => setFormData({...formData, minimumLevel: val})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!editingDoc && (
                      <div className="md:col-span-2">
                        <Label htmlFor="file">File Dokumen * (PDF, DOCX, XLSX, ZIP - Max 50MB)</Label>
                        <Input
                          id="file"
                          type="file"
                          required
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.xlsx,.zip"
                        />
                        {uploadFile && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                          </div>
                        )}
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="isActive" className="text-sm cursor-pointer">
                          Aktifkan dokumen (dapat diakses member)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Menyimpan...' : editingDoc ? 'Update Dokumen' : 'Upload Dokumen'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          {/* LOGS TAB */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Log Download Dokumen</CardTitle>
                    <CardDescription>Riwayat aktivitas download user dengan detail lengkap</CardDescription>
                  </div>
                  <Button onClick={handleExportLogs} variant="outline">
                    <FileDown className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Dokumen</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Level</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Waktu</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{log.user.name}</div>
                              <div className="text-xs text-gray-500">{log.user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{log.document.title}</div>
                              <div className="text-xs text-gray-500">{log.document.category}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{log.membershipLevel}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              {new Date(log.downloadedAt).toLocaleString('id-ID')}
                            </div>
                            {log.ipAddress && (
                              <div className="text-xs text-gray-500">{log.ipAddress}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.status === 'SUCCESS' ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </Badge>
                            ) : log.status === 'FAILED' ? (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.adminVerified ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {logs.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Belum ada aktivitas download</p>
                    <p className="text-sm mt-2">Log akan muncul setelah member download dokumen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}
