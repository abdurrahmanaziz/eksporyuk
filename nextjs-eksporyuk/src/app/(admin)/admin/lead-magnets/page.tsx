'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  FileText, 
  Video, 
  Calendar, 
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Users,
  AlertCircle
} from 'lucide-react'

type LeadMagnetType = 'PDF' | 'VIDEO' | 'EVENT' | 'WHATSAPP'

interface LeadMagnet {
  id: string
  title: string
  description: string | null
  type: LeadMagnetType
  fileUrl: string | null
  eventLink: string | null
  whatsappUrl: string | null
  thumbnailUrl: string | null
  isActive: boolean
  createdAt: string
  _count?: {
    optinForms: number
  }
}

const TYPE_CONFIG = {
  PDF: {
    icon: FileText,
    label: 'PDF Download',
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  VIDEO: {
    icon: Video,
    label: 'Video',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  EVENT: {
    icon: Calendar,
    label: 'Event/Webinar',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  WHATSAPP: {
    icon: MessageCircle,
    label: 'WhatsApp Group',
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200'
  }
}

export default function AdminLeadMagnetsPage() {
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PDF' as LeadMagnetType,
    fileUrl: '',
    eventLink: '',
    whatsappUrl: '',
    thumbnailUrl: '',
    isActive: true
  })

  useEffect(() => {
    fetchLeadMagnets()
  }, [])

  const fetchLeadMagnets = async () => {
    try {
      const res = await fetch('/api/admin/lead-magnets')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLeadMagnets(data.leadMagnets)
    } catch (error) {
      toast.error('Gagal memuat lead magnets')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'PDF',
      fileUrl: '',
      eventLink: '',
      whatsappUrl: '',
      thumbnailUrl: '',
      isActive: true
    })
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error('Judul harus diisi')
      return
    }

    // Type-specific validation
    if (formData.type === 'PDF' && !formData.fileUrl) {
      toast.error('URL file PDF harus diisi')
      return
    }
    if (formData.type === 'VIDEO' && !formData.fileUrl) {
      toast.error('URL video harus diisi')
      return
    }
    if (formData.type === 'EVENT' && !formData.eventLink) {
      toast.error('Link event harus diisi')
      return
    }
    if (formData.type === 'WHATSAPP' && !formData.whatsappUrl) {
      toast.error('URL WhatsApp harus diisi')
      return
    }

    try {
      const res = await fetch('/api/admin/lead-magnets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create')
      }

      toast.success('Lead magnet berhasil dibuat')
      resetForm()
      setActiveTab('list')
      fetchLeadMagnets()
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat lead magnet')
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return

    try {
      const res = await fetch(`/api/admin/lead-magnets/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update')
      }

      toast.success('Lead magnet berhasil diupdate')
      resetForm()
      setActiveTab('list')
      fetchLeadMagnets()
    } catch (error: any) {
      toast.error(error.message || 'Gagal update lead magnet')
    }
  }

  const handleEdit = (lm: LeadMagnet) => {
    setFormData({
      title: lm.title,
      description: lm.description || '',
      type: lm.type,
      fileUrl: lm.fileUrl || '',
      eventLink: lm.eventLink || '',
      whatsappUrl: lm.whatsappUrl || '',
      thumbnailUrl: lm.thumbnailUrl || '',
      isActive: lm.isActive
    })
    setEditingId(lm.id)
    setActiveTab('edit')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lead magnet ini?')) return

    try {
      const res = await fetch(`/api/admin/lead-magnets/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      const data = await res.json()
      toast.success(data.message)
      fetchLeadMagnets()
    } catch (error) {
      toast.error('Gagal menghapus lead magnet')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/lead-magnets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!res.ok) throw new Error('Failed to toggle')

      toast.success(currentStatus ? 'Lead magnet dinonaktifkan' : 'Lead magnet diaktifkan')
      fetchLeadMagnets()
    } catch (error) {
      toast.error('Gagal mengubah status')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Magnet Management</h1>
        <p className="text-muted-foreground">
          Kelola konten lead magnet yang bisa dipilih affiliate untuk optin form mereka
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list">Daftar Lead Magnets</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Buat Baru
          </TabsTrigger>
          {editingId && <TabsTrigger value="edit">Edit</TabsTrigger>}
        </TabsList>

        {/* LIST VIEW */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Memuat...</p>
              </CardContent>
            </Card>
          ) : leadMagnets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Belum ada lead magnet</p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Lead Magnet Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {leadMagnets.map((lm) => {
                const config = TYPE_CONFIG[lm.type]
                const Icon = config.icon
                
                return (
                  <Card key={lm.id} className={!lm.isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${config.bg} ${config.border} border`}>
                            <Icon className={`w-6 h-6 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{lm.title}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color} border ${config.border}`}>
                                {config.label}
                              </span>
                              {!lm.isActive && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            
                            {lm.description && (
                              <p className="text-sm text-muted-foreground mb-3">{lm.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{lm._count?.optinForms || 0} form menggunakan</span>
                              </div>
                              <span>•</span>
                              <span>Dibuat {new Date(lm.createdAt).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(lm.id, lm.isActive)}
                            title={lm.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {lm.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lm)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lm.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* CREATE/EDIT FORM */}
        {['create', 'edit'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{tab === 'create' ? 'Buat Lead Magnet Baru' : 'Edit Lead Magnet'}</CardTitle>
                <CardDescription>
                  Isi informasi lead magnet yang akan ditawarkan ke affiliate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Judul *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Contoh: Ebook Panduan Export Pemula"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Jelaskan isi lead magnet ini..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Tipe Lead Magnet *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as LeadMagnetType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                          const Icon = config.icon
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Type-specific fields */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Konten {TYPE_CONFIG[formData.type].label}</h4>
                  
                  {(formData.type === 'PDF' || formData.type === 'VIDEO') && (
                    <div>
                      <Label htmlFor="fileUrl">
                        URL {formData.type === 'PDF' ? 'File PDF' : 'Video'} *
                      </Label>
                      <Input
                        id="fileUrl"
                        type="url"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        placeholder={
                          formData.type === 'PDF' 
                            ? 'https://example.com/ebook.pdf' 
                            : 'https://youtube.com/watch?v=...'
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.type === 'PDF' 
                          ? 'Upload file ke storage (Google Drive/Dropbox/S3) dan paste link direct download'
                          : 'Link YouTube, Vimeo, atau platform video lainnya'
                        }
                      </p>
                    </div>
                  )}

                  {formData.type === 'EVENT' && (
                    <div>
                      <Label htmlFor="eventLink">Link Event/Webinar *</Label>
                      <Input
                        id="eventLink"
                        type="url"
                        value={formData.eventLink}
                        onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Link Zoom, Google Meet, atau platform event lainnya
                      </p>
                    </div>
                  )}

                  {formData.type === 'WHATSAPP' && (
                    <div>
                      <Label htmlFor="whatsappUrl">URL Join WhatsApp Group *</Label>
                      <Input
                        id="whatsappUrl"
                        type="url"
                        value={formData.whatsappUrl}
                        onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                        placeholder="https://chat.whatsapp.com/..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Link invite WhatsApp Group
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="thumbnailUrl">URL Thumbnail (Opsional)</Label>
                    <Input
                      id="thumbnailUrl"
                      type="url"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Gambar preview untuk ditampilkan di form builder dan thank you page
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label htmlFor="isActive">Status Aktif</Label>
                    <p className="text-sm text-muted-foreground">
                      Hanya lead magnet aktif yang bisa dipilih affiliate
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {tab === 'create' ? (
                    <>
                      <Button onClick={handleCreate} className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Lead Magnet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForm()
                          setActiveTab('list')
                        }}
                      >
                        Batal
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleUpdate} className="flex-1">
                        Simpan Perubahan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForm()
                          setActiveTab('list')
                        }}
                      >
                        Batal
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
