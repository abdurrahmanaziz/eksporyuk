'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Plus,
  Send,
  Image,
  FileText,
  MoreVertical,
  Eye,
  CheckCircle2
} from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface ScheduledPost {
  id: string
  content: string
  image?: string
  scheduledAt: string
  status: 'pending' | 'published' | 'failed'
  publishedAt?: string
  createdAt: string
  author: {
    id: string
    name: string
    avatar?: string
  }
}

interface ScheduledPostsProps {
  groupId: string
  groupSlug: string
  isAdmin: boolean
  userRole?: string
  userMembershipRole?: string
}

export default function ScheduledPosts({ groupId, groupSlug, isAdmin, userRole, userMembershipRole }: ScheduledPostsProps) {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPost, setEditPost] = useState<ScheduledPost | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  
  // Form states
  const [content, setContent] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [groupSlug, activeTab])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/scheduled-posts?status=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.scheduledPosts || [])
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setContent('')
    setScheduledDate('')
    setScheduledTime('')
    setImage(null)
    setImagePreview(null)
    setEditPost(null)
  }

  const handleCreate = async () => {
    if (!content.trim()) {
      toast.error('Konten tidak boleh kosong')
      return
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error('Pilih tanggal dan waktu')
      return
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    
    if (new Date(scheduledAt) < new Date()) {
      toast.error('Waktu harus di masa depan')
      return
    }

    setSubmitting(true)
    try {
      // Handle image upload first if exists
      let imageUrl = null
      if (image) {
        const formData = new FormData()
        formData.append('file', image)
        formData.append('type', 'post')
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          imageUrl = uploadData.url
        }
      }

      const res = await fetch(`/api/groups/${groupSlug}/scheduled-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduledAt,
          image: imageUrl
        })
      })

      if (res.ok) {
        toast.success('Post berhasil dijadwalkan!')
        setCreateOpen(false)
        resetForm()
        fetchPosts()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menjadwalkan post')
      }
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editPost) return
    if (!content.trim()) {
      toast.error('Konten tidak boleh kosong')
      return
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error('Pilih tanggal dan waktu')
      return
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

    setSubmitting(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/scheduled-posts/${editPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduledAt
        })
      })

      if (res.ok) {
        toast.success('Post berhasil diupdate!')
        setEditPost(null)
        resetForm()
        fetchPosts()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengupdate post')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Yakin ingin menghapus post terjadwal ini?')) return

    try {
      const res = await fetch(`/api/groups/${groupSlug}/scheduled-posts/${postId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Post berhasil dihapus')
        fetchPosts()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menghapus post')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handlePublishNow = async (postId: string) => {
    if (!confirm('Publikasikan post ini sekarang?')) return

    try {
      const res = await fetch(`/api/groups/${groupSlug}/scheduled-posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success('Post akan segera dipublikasikan')
        fetchPosts()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const openEdit = (post: ScheduledPost) => {
    setEditPost(post)
    setContent(post.content)
    const date = parseISO(post.scheduledAt)
    setScheduledDate(format(date, 'yyyy-MM-dd'))
    setScheduledTime(format(date, 'HH:mm'))
    if (post.image) {
      setImagePreview(post.image)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Terjadwal</Badge>
      case 'published':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Terkirim</Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Gagal</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const canSchedulePosts = isAdmin || userRole === 'MENTOR' || userMembershipRole === 'ADMIN' || userMembershipRole === 'OWNER'

  if (!canSchedulePosts) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Hanya admin, mentor, dan pemilik grup yang dapat mengelola post terjadwal</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Post Terjadwal</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Jadwalkan Post
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Jadwalkan Post Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Konten</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis konten post..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label>Waktu</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Gambar (opsional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-32 rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => {
                        setImage(null)
                        setImagePreview(null)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCreateOpen(false)
                resetForm()
              }}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Menjadwalkan...' : 'Jadwalkan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-1" />
            Terjadwal
          </TabsTrigger>
          <TabsTrigger value="published">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Terkirim
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {activeTab === 'pending' 
                ? 'Belum ada post terjadwal' 
                : 'Belum ada post yang terkirim'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Content Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(post.status)}
                        <span className="text-sm text-gray-500">
                          {format(parseISO(post.scheduledAt), "d MMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                        </span>
                      </div>
                      
                      {post.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(post)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePublishNow(post.id)}>
                              <Send className="w-4 h-4 mr-2" />
                              Kirim Sekarang
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(post.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <p className="text-gray-800 line-clamp-3 mb-2">{post.content}</p>

                    {post.image && (
                      <div className="mt-2">
                        <img 
                          src={post.image} 
                          alt="Post image" 
                          className="max-h-20 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>
                        Dibuat {formatDistanceToNow(parseISO(post.createdAt), { addSuffix: true, locale: idLocale })}
                      </span>
                      {post.publishedAt && (
                        <span>
                          Terkirim {format(parseISO(post.publishedAt), "d MMM yyyy HH:mm", { locale: idLocale })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post Terjadwal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Konten</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis konten post..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Waktu</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            {imagePreview && (
              <div>
                <Label>Gambar</Label>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-32 rounded-lg mt-2"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditPost(null)
              resetForm()
            }}>
              Batal
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
