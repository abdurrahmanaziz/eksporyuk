'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, Edit, Trash2, ArrowLeft, 
  Copy, Code, Users, Info, Sparkles,
  Save, X
} from 'lucide-react'
import { toast } from 'sonner'

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

interface Shortcode {
  code: string
  description: string
  example: string
}

interface FollowUp {
  id: string
  membershipId: string
  title: string
  description: string | null
  whatsappMessage: string
  shortcodes: Shortcode[]
  sequenceOrder: number
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

interface Membership {
  id: string
  name: string
  slug: string
}

export default function MembershipFollowUpsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const membershipId = params.id as string

  const [membership, setMembership] = useState<Membership | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'shortcodes'>('list')
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  // Form state - Hanya WhatsApp
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    whatsappMessage: '',
    sequenceOrder: 1,
    isActive: true,
  })

  useEffect(() => {
    if (membershipId) {
      fetchMembership()
      fetchFollowUps()
    }
  }, [membershipId])

  const fetchMembership = async () => {
    try {
      const res = await fetch(`/api/admin/membership-plans/${membershipId}`)
      if (res.ok) {
        const data = await res.json()
        setMembership(data)
      }
    } catch (error) {
      console.error('Error fetching membership:', error)
      toast.error('Gagal memuat data membership')
    }
  }

  const fetchFollowUps = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/membership-plans/${membershipId}/follow-ups`)
      if (res.ok) {
        const data = await res.json()
        setFollowUps(Array.isArray(data.followUps) ? data.followUps : [])
        setShortcodes(data.shortcodes || [])
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error)
      toast.error('Gagal memuat follow-ups')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      whatsappMessage: '',
      sequenceOrder: followUps.length + 1,
      isActive: true,
    })
    setEditingFollowUp(null)
  }

  const openCreateForm = () => {
    resetForm()
    setActiveTab('form')
  }

  const openEditForm = (followUp: FollowUp) => {
    setEditingFollowUp(followUp)
    setFormData({
      title: followUp.title,
      description: followUp.description || '',
      whatsappMessage: followUp.whatsappMessage || '',
      sequenceOrder: followUp.sequenceOrder,
      isActive: followUp.isActive,
    })
    setActiveTab('form')
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul follow-up wajib diisi')
      return
    }
    if (!formData.whatsappMessage.trim()) {
      toast.error('Pesan WhatsApp wajib diisi')
      return
    }

    try {
      setSaving(true)
      const url = editingFollowUp
        ? `/api/admin/membership-plans/${membershipId}/follow-ups/${editingFollowUp.id}`
        : `/api/admin/membership-plans/${membershipId}/follow-ups`
      
      const res = await fetch(url, {
        method: editingFollowUp ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Set default email fields (required by DB but not used)
          emailSubject: formData.title,
          emailBody: formData.whatsappMessage,
        }),
      })

      if (res.ok) {
        toast.success(editingFollowUp ? 'Template berhasil diupdate' : 'Template berhasil dibuat')
        resetForm()
        fetchFollowUps()
        setActiveTab('list')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menyimpan template')
      }
    } catch (error) {
      console.error('Error saving follow-up:', error)
      toast.error('Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/admin/membership-plans/${membershipId}/follow-ups/${id}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        toast.success('Template berhasil dihapus')
        setDeleteConfirmId(null)
        fetchFollowUps()
      } else {
        toast.error('Gagal menghapus template')
      }
    } catch (error) {
      console.error('Error deleting follow-up:', error)
      toast.error('Gagal menghapus template')
    }
  }

  const toggleActive = async (followUp: FollowUp) => {
    try {
      const res = await fetch(
        `/api/admin/membership-plans/${membershipId}/follow-ups/${followUp.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...followUp, 
            isActive: !followUp.isActive,
            emailSubject: followUp.title,
            emailBody: followUp.whatsappMessage,
          }),
        }
      )

      if (res.ok) {
        toast.success(followUp.isActive ? 'Template dinonaktifkan' : 'Template diaktifkan')
        fetchFollowUps()
      }
    } catch (error) {
      console.error('Error toggling follow-up:', error)
    }
  }

  const insertShortcode = (code: string) => {
    setFormData(prev => ({
      ...prev,
      whatsappMessage: prev.whatsappMessage + code
    }))
    toast.success(`Shortcode ${code} ditambahkan`)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  const generateDefaults = async () => {
    try {
      const res = await fetch(`/api/admin/membership-plans/${membershipId}/follow-ups/generate-defaults`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Template default berhasil dibuat!')
        fetchFollowUps()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal generate template')
      }
    } catch (e) {
      toast.error('Gagal generate template')
    }
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <ResponsivePageWrapper>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Akses ditolak</p>
          </CardContent>
        </Card>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <WhatsAppIcon className="h-6 w-6 text-green-600" />
                Template Follow Up WhatsApp
              </h1>
              <p className="text-muted-foreground">
                {membership?.name || 'Loading...'} - Template pesan WA untuk affiliate follow up lead
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium mb-1">Tentang Template Follow Up WhatsApp</p>
              <p>
                Template ini digunakan oleh <strong>affiliate</strong> dan <strong>sales admin</strong> untuk follow up lead secara manual via WhatsApp. 
                Buat template seperti: "Hari Pertama", "Hari Kedua", "Hari Ketiga", dll. 
                Email reminder otomatis sudah dihandle terpisah oleh sistem.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5 text-green-600" />
                Kelola Template WhatsApp
              </CardTitle>
              <div className="flex items-center gap-2">
                {followUps.length === 0 && (
                  <Button variant="outline" onClick={generateDefaults} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Default
                  </Button>
                )}
                <Button onClick={openCreateForm} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                  Tambah Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">
                  <WhatsAppIcon className="h-4 w-4 mr-2" />
                  Daftar Template ({followUps.length})
                </TabsTrigger>
                <TabsTrigger value="form">
                  <Edit className="h-4 w-4 mr-2" />
                  {editingFollowUp ? 'Edit Template' : 'Buat Template'}
                </TabsTrigger>
                <TabsTrigger value="shortcodes">
                  <Code className="h-4 w-4 mr-2" />
                  Shortcodes
                </TabsTrigger>
              </TabsList>

              {/* List Tab */}
              <TabsContent value="list" className="mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : followUps.length === 0 ? (
                  <div className="text-center py-12">
                    <WhatsAppIcon className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Template WhatsApp</h3>
                    <p className="text-muted-foreground mb-4">
                      Buat template seperti: Hari Pertama, Hari Kedua, Hari Ketiga, dll.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button onClick={openCreateForm} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4" />
                        Buat Template
                      </Button>
                      <Button variant="outline" onClick={generateDefaults} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate Default
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((followUp, index) => (
                      <div 
                        key={followUp.id} 
                        className={`border rounded-lg p-4 transition-colors ${
                          !followUp.isActive ? 'opacity-60 bg-muted/30' : 'hover:border-green-300 bg-green-50/30'
                        } ${deleteConfirmId === followUp.id ? 'border-red-300 bg-red-50' : ''}`}
                      >
                        {deleteConfirmId === followUp.id ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Trash2 className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="font-medium text-red-700">Hapus "{followUp.title}"?</p>
                                <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                                Batal
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(followUp.id)}>
                                Ya, Hapus
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold">{followUp.title}</h3>
                                  {!followUp.isActive && (
                                    <Badge variant="secondary">Nonaktif</Badge>
                                  )}
                                </div>
                                {followUp.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {followUp.description}
                                  </p>
                                )}
                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 mt-2">
                                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                                    {followUp.whatsappMessage}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm mt-2">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{followUp.usageCount || 0}x digunakan</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <Switch
                                checked={followUp.isActive}
                                onCheckedChange={() => toggleActive(followUp)}
                              />
                              <Button variant="ghost" size="icon" onClick={() => openEditForm(followUp)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => copyToClipboard(followUp.whatsappMessage || '', 'Pesan WA')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirmId(followUp.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Form Tab - WhatsApp Only */}
              <TabsContent value="form" className="mt-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Informasi Template</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Judul Template <span className="text-red-500">*</span></Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Contoh: Hari Pertama, Hari Kedua, Hari Ketiga"
                        />
                        <p className="text-xs text-muted-foreground">
                          Judul ini akan muncul di dropdown pilihan affiliate & sales
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Urutan</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.sequenceOrder}
                            onChange={(e) => setFormData({ ...formData, sequenceOrder: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          />
                          <Label>Aktif</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Deskripsi (Opsional)</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Contoh: Digunakan untuk follow up di hari pertama setelah checkout"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Message */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                      <WhatsAppIcon className="h-5 w-5 text-green-600" />
                      Pesan WhatsApp <span className="text-red-500">*</span>
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Isi Pesan</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Code className="h-3 w-3" />
                              Tambah Shortcode
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {shortcodes.map((sc) => (
                              <DropdownMenuItem 
                                key={sc.code}
                                onClick={() => insertShortcode(sc.code)}
                              >
                                <code className="mr-2 text-green-600">{sc.code}</code>
                                <span className="text-muted-foreground text-xs">{sc.description}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Textarea
                        value={formData.whatsappMessage}
                        onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
                        placeholder={`Halo {name}! 👋

Saya {affiliate_name} dari EksporYuk. Saya mau follow up mengenai pendaftaran {plan_name} Anda kemarin.

Apakah ada kendala saat melakukan pembayaran? Saya siap bantu jika ada pertanyaan.

Link pembayaran: {payment_link}

Terima kasih! 🙏`}
                        rows={12}
                        className="bg-green-50 dark:bg-green-950/20 border-green-200 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pesan ini akan dikirim oleh affiliate/sales ke lead via WhatsApp. Gunakan shortcode untuk personalisasi.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        resetForm()
                        setActiveTab('list')
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                      {saving ? (
                        <>Menyimpan...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingFollowUp ? 'Update Template' : 'Simpan Template'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Shortcodes Tab */}
              <TabsContent value="shortcodes" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Shortcodes yang Tersedia</h3>
                    <p className="text-sm text-muted-foreground">
                      Klik untuk menyalin. Shortcode akan otomatis diganti dengan data lead saat digunakan.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {shortcodes.map((sc) => (
                      <div 
                        key={sc.code}
                        className="p-4 border rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                        onClick={() => copyToClipboard(sc.code, sc.code)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono text-green-600 bg-green-100 px-2 py-1 rounded">
                            {sc.code}
                          </code>
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{sc.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Contoh: {sc.example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
