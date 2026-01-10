'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Upload,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Archive
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface GroupResourcesProps {
  groupId: string
}

export default function GroupResources({ groupId }: GroupResourcesProps) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchResources()
  }, [groupId])

  const fetchResources = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/resources`)
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Fetch resources error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error('File dan judul wajib diisi')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('description', description)

      const res = await fetch(`/api/groups/${groupId}/resources`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        toast.success('Resource berhasil diunggah')
        setShowUploadDialog(false)
        setFile(null)
        setTitle('')
        setDescription('')
        fetchResources()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengunggah resource')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengunggah resource')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-500" />
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5 text-yellow-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Resource Library</h3>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Unggah Resource
          </Button>
        </div>

        {resources.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada resource tersedia</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {resources.map((resource) => {
              const metadata = resource.metadata ? JSON.parse(resource.metadata) : {}
              
              return (
                <Card key={resource.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(metadata.fileType || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{metadata.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{resource.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>oleh {resource.author.name}</span>
                          <span>•</span>
                          <span>{formatFileSize(metadata.fileSize || 0)}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(resource.createdAt), {
                              addSuffix: true,
                              locale: idLocale
                            })}
                          </span>
                        </div>
                      </div>
                      <a
                        href={resource.images[0]}
                        download={metadata.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unggah Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="*/*"
              />
              <p className="text-xs text-gray-500">Maksimal 10MB</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Judul Resource</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nama file atau judul resource"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan tentang resource ini..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={uploading}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !title || uploading}
            >
              {uploading ? 'Mengunggah...' : 'Unggah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
