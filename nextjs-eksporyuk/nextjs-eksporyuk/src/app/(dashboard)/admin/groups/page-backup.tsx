'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, Edit, Trash2, Users, Search, Eye, MoreVertical, 
  Settings, Shield, MessageSquare, Image as ImageIcon,
  FileText, BarChart3, Filter, Download, Upload,
  BookOpen, Package, AlertCircle, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

type Group = {
  id: string
  name: string
  slug: string
  description: string
  type: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
  avatar?: string
  coverImage?: string
  isActive: boolean
  requireApproval: boolean
  bannedWords?: any
  _count?: {
    members: number
    posts: number
    courses: number
    products: number
  }
  owner?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminGroupsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
    avatar: '',
    coverImage: '',
    requireApproval: false,
    bannedWords: '',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    public: 0,
    private: 0,
    hidden: 0,
    totalMembers: 0,
    totalPosts: 0
  })

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [groups])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/groups/all')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch groups')
      }
      const data = await res.json()
      console.log('Fetched groups:', data)
      
      // Ensure data structure is correct
      const groupsData = Array.isArray(data.groups) ? data.groups : []
      setGroups(groupsData)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Gagal memuat data grup')
      setGroups([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    // Ensure groups is an array
    if (!Array.isArray(groups)) {
      console.warn('Groups is not an array:', groups)
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        public: 0,
        private: 0,
        hidden: 0,
        totalMembers: 0,
        totalPosts: 0
      })
      return
    }

    const total = groups.length
    const active = groups.filter(g => g?.isActive).length
    const inactive = groups.filter(g => !g?.isActive).length
    const publicGroups = groups.filter(g => g?.type === 'PUBLIC').length
    const privateGroups = groups.filter(g => g?.type === 'PRIVATE').length
    const hiddenGroups = groups.filter(g => g?.type === 'HIDDEN').length
    const totalMembers = groups.reduce((sum, g) => sum + (g?._count?.members || 0), 0)
    const totalPosts = groups.reduce((sum, g) => sum + (g?._count?.posts || 0), 0)

    setStats({
      total,
      active,
      inactive,
      public: publicGroups,
      private: privateGroups,
      hidden: hiddenGroups,
      totalMembers,
      totalPosts
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create group')
      }

      toast.success('Grup berhasil dibuat!')
      setShowCreateDialog(false)
      resetForm()
      fetchGroups()
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error(error.message || 'Gagal membuat grup')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/admin/groups/${selectedGroup.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update group')
      }

      toast.success('Grup berhasil diperbarui!')
      setShowEditDialog(false)
      resetForm()
      setSelectedGroup(null)
      fetchGroups()
    } catch (error: any) {
      console.error('Error updating group:', error)
      toast.error(error.message || 'Gagal memperbarui grup')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedGroup) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/admin/groups/${selectedGroup.slug}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete group')
      }

      toast.success('Grup berhasil dihapus!')
      setShowDeleteDialog(false)
      setSelectedGroup(null)
      fetchGroups()
    } catch (error: any) {
      console.error('Error deleting group:', error)
      toast.error(error.message || 'Gagal menghapus grup')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      type: group.type,
      avatar: group.avatar || '',
      coverImage: group.coverImage || '',
      requireApproval: group.requireApproval || false,
      bannedWords: group.bannedWords ? JSON.stringify(group.bannedWords) : '',
      isActive: group.isActive
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (group: Group) => {
    setSelectedGroup(group)
    setShowDeleteDialog(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PUBLIC',
      avatar: '',
      coverImage: '',
      requireApproval: false,
      bannedWords: '',
      isActive: true
    })
  }

  const filteredGroups = Array.isArray(groups) ? groups.filter(group => {
    // Safety check
    if (!group) return false
    
    // Search filter
    const matchesSearch = (group.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    // Type filter
    const matchesType = typeFilter === 'all' || group.type === typeFilter
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && group.isActive) ||
      (statusFilter === 'inactive' && !group.isActive)
    
    // Tab filter
    let matchesTab = true
    if (activeTab === 'active') matchesTab = group.isActive
    else if (activeTab === 'inactive') matchesTab = !group.isActive
    else if (activeTab === 'public') matchesTab = group.type === 'PUBLIC'
    else if (activeTab === 'private') matchesTab = group.type === 'PRIVATE'
    else if (activeTab === 'hidden') matchesTab = group.type === 'HIDDEN'
    
    return matchesSearch && matchesType && matchesStatus && matchesTab
  }) : []

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      PUBLIC: 'default',
      PRIVATE: 'secondary',
      HIDDEN: 'outline'
    }
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data grup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Grup</h1>
          <p className="text-muted-foreground mt-1">
            Kelola semua grup komunitas dalam satu tempat
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => {
            resetForm()
            setSelectedGroup(null)
            setShowCreateDialog(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Grup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grup</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} aktif, {stats.inactive} nonaktif
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Dari semua grup
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Postingan</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Aktivitas komunitas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipe Grup</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Publik:</span>
                <span className="font-semibold">{stats.public}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Privat:</span>
                <span className="font-semibold">{stats.private}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tersembunyi:</span>
                <span className="font-semibold">{stats.hidden}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Grup</CardTitle>
              <CardDescription>Kelola dan monitor semua grup komunitas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">
                  Semua ({groups.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Aktif ({stats.active})
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Nonaktif ({stats.inactive})
                </TabsTrigger>
                <TabsTrigger value="public">
                  Publik ({stats.public})
                </TabsTrigger>
                <TabsTrigger value="private">
                  Privat ({stats.private})
                </TabsTrigger>
                <TabsTrigger value="hidden">
                  Hidden ({stats.hidden})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari grup..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="p-2">
                      <Label className="text-xs font-semibold">Tipe</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Tipe</SelectItem>
                          <SelectItem value="PUBLIC">Publik</SelectItem>
                          <SelectItem value="PRIVATE">Privat</SelectItem>
                          <SelectItem value="HIDDEN">Tersembunyi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-2">
                      <Label className="text-xs font-semibold">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Grup</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-center">Anggota</TableHead>
                      <TableHead className="text-center">Post</TableHead>
                      <TableHead className="text-center">Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchQuery ? 'Tidak ada grup yang cocok' : 'Belum ada grup'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGroups.map((group) => {
                        if (!group || !group.id) return null
                        
                        return (
                        <TableRow key={group.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {group.avatar ? (
                                <img
                                  src={group.avatar}
                                  alt={group.name || 'Group'}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {(group.name || 'G').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{group.name || 'Unnamed Group'}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {group.description || 'Tidak ada deskripsi'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(group.type || 'PUBLIC')}</TableCell>
                          <TableCell>
                            {group.owner ? (
                              <div className="text-sm">
                                <div className="font-medium">{group.owner.name || 'Unknown'}</div>
                                <div className="text-muted-foreground text-xs">{group.owner.email || '-'}</div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No owner
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {group._count?.members || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {group._count?.posts || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {group._count?.courses || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={group.isActive ? 'default' : 'secondary'}>
                              {group.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(group.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/community/groups/${group.slug}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Lihat Detail
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(group)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Grup
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedGroup(group)
                                  setShowSettingsDialog(true)
                                }}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Pengaturan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(group)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Buat Grup Baru</DialogTitle>
              <DialogDescription>
                Buat grup komunitas baru untuk member Anda
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nama Grup *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Komunitas Ekspor Jepang"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan tentang grup ini..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipe Grup *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Publik - Semua orang bisa bergabung</SelectItem>
                    <SelectItem value="PRIVATE">Privat - Perlu persetujuan</SelectItem>
                    <SelectItem value="HIDDEN">Tersembunyi - Hanya undangan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="avatar">URL Avatar</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="coverImage">URL Cover Image</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="bannedWords">Kata Terlarang (pisahkan dengan koma)</Label>
                <Textarea
                  id="bannedWords"
                  value={formData.bannedWords}
                  onChange={(e) => setFormData({ ...formData, bannedWords: e.target.value })}
                  placeholder="spam, iklan, promo, dll"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Post yang mengandung kata-kata ini akan ditolak otomatis
                </p>
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Pengaturan Grup</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Status Aktif</Label>
                    <p className="text-xs text-muted-foreground">
                      Grup aktif dapat diakses oleh anggota
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireApproval">Persetujuan Admin</Label>
                    <p className="text-xs text-muted-foreground">
                      Anggota baru harus disetujui dulu
                    </p>
                  </div>
                  <Switch
                    id="requireApproval"
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  resetForm()
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Membuat...' : 'Buat Grup'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Grup</DialogTitle>
              <DialogDescription>
                Perbarui informasi grup {selectedGroup?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Nama Grup *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Deskripsi *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipe Grup *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Publik</SelectItem>
                    <SelectItem value="PRIVATE">Privat</SelectItem>
                    <SelectItem value="HIDDEN">Tersembunyi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-avatar">URL Avatar</Label>
                <Input
                  id="edit-avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-coverImage">URL Cover Image</Label>
                <Input
                  id="edit-coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-bannedWords">Kata Terlarang (pisahkan dengan koma)</Label>
                <Textarea
                  id="edit-bannedWords"
                  value={formData.bannedWords}
                  onChange={(e) => setFormData({ ...formData, bannedWords: e.target.value })}
                  placeholder="spam, iklan, promo, dll"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Post yang mengandung kata-kata ini akan ditolak otomatis
                </p>
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Pengaturan Grup</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-isActive">Status Aktif</Label>
                    <p className="text-xs text-muted-foreground">
                      Grup aktif dapat diakses oleh anggota
                    </p>
                  </div>
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-requireApproval">Persetujuan Admin</Label>
                    <p className="text-xs text-muted-foreground">
                      Anggota baru harus disetujui dulu
                    </p>
                  </div>
                  <Switch
                    id="edit-requireApproval"
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setSelectedGroup(null)
                  resetForm()
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Grup</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus grup <strong>{selectedGroup?.name}</strong>?
              <br />
              <span className="text-red-600">Semua data termasuk postingan dan anggota akan terhapus permanen!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedGroup(null)
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pengaturan Lengkap Grup</DialogTitle>
            <DialogDescription>
              Kelola pengaturan dan monitor aktivitas grup {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-6 py-4">
              {/* Group Info Header */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                {selectedGroup.avatar ? (
                  <img
                    src={selectedGroup.avatar}
                    alt={selectedGroup.name || 'Group'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {(selectedGroup.name || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedGroup.name || 'Unnamed Group'}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedGroup.description || 'Tidak ada deskripsi'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getTypeBadge(selectedGroup.type || 'PUBLIC')}
                    <Badge variant={selectedGroup.isActive ? 'default' : 'secondary'}>
                      {selectedGroup.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {selectedGroup.requireApproval && (
                      <Badge variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        Perlu Approval
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Anggota
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedGroup._count?.members || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Postingan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedGroup._count?.posts || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Kursus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedGroup._count?.courses || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      Produk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedGroup._count?.products || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Sections */}
              <div className="space-y-4">
                {/* Owner Information */}
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Informasi Owner
                  </h4>
                  {selectedGroup.owner ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {(selectedGroup.owner.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{selectedGroup.owner.name || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{selectedGroup.owner.email || '-'}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tidak ada informasi owner</p>
                  )}
                </div>

                {/* Content Moderation */}
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Moderasi Konten
                  </h4>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5 flex-1">
                      <Label>Persetujuan Post</Label>
                      <p className="text-xs text-muted-foreground">
                        Post harus disetujui admin sebelum tampil
                      </p>
                    </div>
                    <Badge variant={selectedGroup.requireApproval ? 'default' : 'secondary'}>
                      {selectedGroup.requireApproval ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label>Kata Terlarang</Label>
                    {selectedGroup.bannedWords ? (
                      <div className="p-3 rounded-md bg-muted text-sm">
                        {selectedGroup.bannedWords}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Tidak ada kata terlarang yang diatur
                      </p>
                    )}
                  </div>
                </div>

                {/* Time Information */}
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Informasi Waktu
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Dibuat</Label>
                      <p className="mt-1 font-medium">
                        {new Date(selectedGroup.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'long',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Terakhir Update</Label>
                      <p className="mt-1 font-medium">
                        {new Date(selectedGroup.updatedAt).toLocaleString('id-ID', {
                          dateStyle: 'long',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="text-sm font-semibold">Aksi Cepat</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        openEditDialog(selectedGroup)
                        setShowSettingsDialog(false)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Grup
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link href={`/community/groups/${selectedGroup.slug}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Grup
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/groups/${selectedGroup.slug}/members`}>
                        <Users className="w-4 h-4 mr-2" />
                        Kelola Anggota
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        openDeleteDialog(selectedGroup)
                        setShowSettingsDialog(false)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Grup
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
