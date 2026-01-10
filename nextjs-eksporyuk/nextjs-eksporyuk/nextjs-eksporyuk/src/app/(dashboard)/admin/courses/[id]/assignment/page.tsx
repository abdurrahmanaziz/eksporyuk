'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, Plus, Edit, Trash2, Save, Clock, FileText,
  CheckCircle, AlertCircle, ClipboardList, Calendar, Upload,
  Link as LinkIcon, X, Download, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

type AttachmentFile = {
  name: string
  url: string
  size?: number
  type?: string
}

type ExternalLink = {
  title: string
  url: string
}

type Assignment = {
  id: string
  title: string
  description: string
  instructions?: string
  maxScore: number
  dueDate?: string
  allowLateSubmission: boolean
  allowedFileTypes?: string
  maxFileSize?: number
  attachments?: string // JSON string
  links?: string // JSON string
  isActive: boolean
  lessonId?: string
  _count?: {
    submissions: number
  }
}

export default function AdminCourseAssignmentPage() {
  const params = useParams()
  const courseId = params.id as string
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchAssignments()
    }
  }, [status, session, router, courseId])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/courses/${courseId}/assignments`)
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments || [])
      } else {
        toast.error('Gagal memuat data assignment')
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = () => {
    setEditingAssignment({
      id: '',
      title: '',
      description: '',
      instructions: '',
      maxScore: 100,
      dueDate: '',
      allowLateSubmission: false,
      allowedFileTypes: 'pdf,docx,zip',
      maxFileSize: 10,
      attachments: '[]',
      links: '[]',
      isActive: true
    })
    setNewLink({ title: '', url: '' })
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!editingAssignment) return

    try {
      setUploadingFiles(true)
      
      const currentAttachments: AttachmentFile[] = editingAssignment.attachments 
        ? JSON.parse(editingAssignment.attachments)
        : []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'assignment')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          currentAttachments.push({
            name: file.name,
            url: data.url,
            size: file.size,
            type: file.type
          })
        } else {
          toast.error(`Gagal upload ${file.name}`)
        }
      }

      setEditingAssignment({
        ...editingAssignment,
        attachments: JSON.stringify(currentAttachments)
      })
      toast.success(`${files.length} file berhasil diupload`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Terjadi kesalahan saat upload file')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleRemoveAttachment = (index: number) => {
    if (!editingAssignment) return
    
    const currentAttachments: AttachmentFile[] = editingAssignment.attachments 
      ? JSON.parse(editingAssignment.attachments)
      : []
    
    currentAttachments.splice(index, 1)
    
    setEditingAssignment({
      ...editingAssignment,
      attachments: JSON.stringify(currentAttachments)
    })
    toast.success('File dihapus')
  }

  const handleAddLink = () => {
    if (!editingAssignment) return
    if (!newLink.title || !newLink.url) {
      toast.error('Judul dan URL link wajib diisi')
      return
    }

    const currentLinks: ExternalLink[] = editingAssignment.links 
      ? JSON.parse(editingAssignment.links)
      : []

    currentLinks.push({ ...newLink })
    
    setEditingAssignment({
      ...editingAssignment,
      links: JSON.stringify(currentLinks)
    })
    
    setNewLink({ title: '', url: '' })
    toast.success('Link ditambahkan')
  }

  const handleRemoveLink = (index: number) => {
    if (!editingAssignment) return
    
    const currentLinks: ExternalLink[] = editingAssignment.links 
      ? JSON.parse(editingAssignment.links)
      : []
    
    currentLinks.splice(index, 1)
    
    setEditingAssignment({
      ...editingAssignment,
      links: JSON.stringify(currentLinks)
    })
    toast.success('Link dihapus')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`
  }

  const handleSaveAssignment = async () => {
    if (!editingAssignment) return

    if (!editingAssignment.title || !editingAssignment.description) {
      toast.error('Judul dan deskripsi wajib diisi')
      return
    }

    try {
      const url = editingAssignment.id 
        ? `/api/admin/courses/${params.id}/assignments/${editingAssignment.id}`
        : `/api/admin/courses/${params.id}/assignments`
      
      const method = editingAssignment.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAssignment)
      })

      if (res.ok) {
        toast.success(editingAssignment.id ? 'Assignment berhasil diupdate' : 'Assignment berhasil dibuat')
        setEditingAssignment(null)
        fetchAssignments()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan assignment')
      }
    } catch (error) {
      console.error('Save assignment error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Yakin ingin menghapus assignment ini? Semua submission akan terhapus.')) return

    try {
      const res = await fetch(`/api/admin/courses/${params.id}/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Assignment berhasil dihapus')
        fetchAssignments()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus assignment')
      }
    } catch (error) {
      console.error('Delete assignment error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Tidak ada deadline'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data assignment...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${params.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kursus
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Assignment Management</h1>
            <p className="text-muted-foreground mt-1">Kelola assignment dan tugas untuk kursus ini</p>
          </div>
        </div>
        <Button onClick={handleCreateAssignment}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Assignment Baru
        </Button>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada assignment. Klik "Buat Assignment Baru" untuk memulai.</p>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {assignment.title}
                      {assignment.isActive ? (
                        <Badge variant="default">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingAssignment(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Max Score</div>
                    <div className="font-semibold">{assignment.maxScore} poin</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Deadline</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(assignment.dueDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Late Submission</div>
                    <div className="font-semibold">
                      {assignment.allowLateSubmission ? (
                        <Badge variant="outline" className="text-green-600">Diizinkan</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">Tidak Diizinkan</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Submissions</div>
                    <div className="font-semibold">{assignment._count?.submissions || 0} siswa</div>
                  </div>
                </div>
                
                {assignment.allowedFileTypes && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">File types: </span>
                    <Badge variant="outline">{assignment.allowedFileTypes}</Badge>
                    {assignment.maxFileSize && (
                      <span className="text-muted-foreground ml-2">Max: {assignment.maxFileSize}MB</span>
                    )}
                  </div>
                )}

                {/* Display Attachments */}
                {assignment.attachments && JSON.parse(assignment.attachments).length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <div className="text-sm font-medium mb-2">File Materials:</div>
                    <div className="space-y-1">
                      {(JSON.parse(assignment.attachments) as AttachmentFile[]).map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FileText className="h-3 w-3 text-blue-500" />
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {file.name}
                          </a>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Links */}
                {assignment.links && JSON.parse(assignment.links).length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <div className="text-sm font-medium mb-2">External Links:</div>
                    <div className="space-y-1">
                      {(JSON.parse(assignment.links) as ExternalLink[]).map((link, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-3 w-3 text-green-500" />
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            {link.title}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Assignment Dialog */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl mx-4 my-8">
            <CardHeader>
              <CardTitle>{editingAssignment.id ? 'Edit Assignment' : 'Buat Assignment Baru'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Judul Assignment *</Label>
                  <Input
                    value={editingAssignment.title}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                    placeholder="Contoh: Tugas Module 1 - Membuat Website Sederhana"
                  />
                </div>

                <div>
                  <Label>Deskripsi *</Label>
                  <Textarea
                    value={editingAssignment.description}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                    rows={3}
                    placeholder="Deskripsi singkat tentang assignment ini..."
                  />
                </div>

                <div>
                  <Label>Instruksi Pengerjaan</Label>
                  <Textarea
                    value={editingAssignment.instructions || ''}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, instructions: e.target.value })}
                    rows={5}
                    placeholder="Tulis instruksi detail untuk siswa..."
                  />
                </div>

                {/* File Attachments */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">File Tugas / Materials</Label>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        disabled={uploadingFiles}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFiles ? 'Uploading...' : 'Upload File'}
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </label>
                  </div>
                  
                  {editingAssignment.attachments && JSON.parse(editingAssignment.attachments).length > 0 && (
                    <div className="space-y-2">
                      {(JSON.parse(editingAssignment.attachments) as AttachmentFile[]).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium">{file.name}</div>
                              <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost">
                                <Download className="h-3 w-3" />
                              </Button>
                            </a>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleRemoveAttachment(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload soal, template, atau material pendukung untuk siswa
                  </p>
                </div>

                {/* External Links */}
                <div className="border rounded-lg p-4 space-y-3">
                  <Label className="text-base">Link Eksternal</Label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Judul link (e.g., Google Docs)"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      />
                      <Button 
                        type="button"
                        size="sm" 
                        onClick={handleAddLink}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingAssignment.links && JSON.parse(editingAssignment.links).length > 0 && (
                    <div className="space-y-2">
                      {(JSON.parse(editingAssignment.links) as ExternalLink[]).map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="text-sm font-medium">{link.title}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-xs">{link.url}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleRemoveLink(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Tambahkan link ke Google Drive, Docs, atau resource eksternal lainnya
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Score</Label>
                    <Input
                      type="number"
                      value={editingAssignment.maxScore}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, maxScore: parseInt(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Deadline</Label>
                    <Input
                      type="datetime-local"
                      value={editingAssignment.dueDate ? new Date(editingAssignment.dueDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipe File yang Diizinkan</Label>
                    <Input
                      value={editingAssignment.allowedFileTypes || ''}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, allowedFileTypes: e.target.value })}
                      placeholder="pdf,docx,zip"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Pisahkan dengan koma</p>
                  </div>
                  <div>
                    <Label>Max File Size (MB)</Label>
                    <Input
                      type="number"
                      value={editingAssignment.maxFileSize || ''}
                      onChange={(e) => setEditingAssignment({ 
                        ...editingAssignment, 
                        maxFileSize: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowLateSubmission"
                      checked={editingAssignment.allowLateSubmission}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, allowLateSubmission: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="allowLateSubmission">Izinkan late submission</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingAssignment.isActive}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isActive">Assignment aktif (dapat diakses siswa)</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveAssignment}>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Assignment
                  </Button>
                  <Button variant="outline" onClick={() => setEditingAssignment(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
