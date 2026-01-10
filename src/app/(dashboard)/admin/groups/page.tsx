'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Plus, Edit, Trash2, Users, Search, Eye,
  MessageSquare, BarChart3, Download,
  BookOpen, Package, Clock, X, Upload,
  UserPlus, Shield, UserMinus
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
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

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
  showStats?: boolean
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
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  
  // Dialogs (only delete dialog remains, create moved to tab)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
    avatar: '',
    coverImage: '',
    requireApproval: false,
    bannedWords: '',
    isActive: true,
    showStats: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  
  // Member management
  const [showMemberDialog, setShowMemberDialog] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [searchMember, setSearchMember] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  
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
      
      const groupsData = Array.isArray(data.groups) ? data.groups : []
      setGroups(groupsData)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Gagal memuat data grup')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
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
      setIsCreating(false)
      setActiveTab('all')
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
    if (!editingGroup) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/admin/groups/${editingGroup.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update group')
      }

      toast.success('Grup berhasil diperbarui!')
      setEditingGroup(null)
      setActiveTab('all')
      resetForm()
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

  const openEditTab = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      type: group.type,
      avatar: group.avatar || '',
      coverImage: group.coverImage || '',
      requireApproval: group.requireApproval || false,
      bannedWords: group.bannedWords ? JSON.stringify(group.bannedWords) : '',
      isActive: group.isActive,
      showStats: group.showStats !== false
    })
    setActiveTab('edit')
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
      isActive: true,
      showStats: true
    })
  }

  const cancelEdit = () => {
    setEditingGroup(null)
    setActiveTab('all')
    resetForm()
  }

  const cancelCreate = () => {
    setIsCreating(false)
    setActiveTab('all')
    resetForm()
  }

  const openCreateTab = () => {
    resetForm()
    setEditingGroup(null)
    setIsCreating(true)
    setActiveTab('create')
  }

  // Upload image function
  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    try {
      if (type === 'avatar') setUploadingAvatar(true)
      else setUploadingCover(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      
      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, avatar: data.url }))
      } else {
        setFormData(prev => ({ ...prev, coverImage: data.url }))
      }

      toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover image'} berhasil diupload!`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal upload gambar')
    } finally {
      if (type === 'avatar') setUploadingAvatar(false)
      else setUploadingCover(false)
    }
  }

  // Fetch group members
  const fetchMembers = async (groupId: string) => {
    try {
      setLoadingMembers(true)
      const res = await fetch(`/api/admin/groups/${groupId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Gagal memuat data member')
    } finally {
      setLoadingMembers(false)
    }
  }

  // Update member role
  const handleUpdateMemberRole = async (userId: string, role: string) => {
    if (!editingGroup) return
    
    try {
      const res = await fetch(`/api/admin/groups/${editingGroup.slug}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (!res.ok) throw new Error('Failed to update role')

      toast.success('Role berhasil diperbarui!')
      fetchMembers(editingGroup.id)
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Gagal memperbarui role')
    }
  }

  // Remove member
  const handleRemoveMember = async (userId: string) => {
    if (!editingGroup) return
    
    try {
      const res = await fetch(`/api/admin/groups/${editingGroup.slug}/members/${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to remove member')

      toast.success('Member berhasil dihapus!')
      fetchMembers(editingGroup.id)
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Gagal menghapus member')
    }
  }

  const filteredGroups = Array.isArray(groups) ? groups.filter(group => {
    if (!group) return false
    
    const matchesSearch = (group.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesTab = true
    if (activeTab === 'active') matchesTab = group.isActive
    else if (activeTab === 'inactive') matchesTab = !group.isActive
    else if (activeTab === 'public') matchesTab = group.type === 'PUBLIC'
    else if (activeTab === 'private') matchesTab = group.type === 'PRIVATE'
    else if (activeTab === 'hidden') matchesTab = group.type === 'HIDDEN'
    
    return matchesSearch && matchesTab
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
      <ResponsivePageWrapper>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data grup...</p>
        </div>
      </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manajemen Grup</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola semua grup komunitas dalam satu tempat
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={openCreateTab}>
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList>
                <TabsTrigger value="all">
                  Semua ({stats.total})
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
                {isCreating && (
                  <TabsTrigger value="create" className="bg-green-50">
                    + Buat Grup Baru
                  </TabsTrigger>
                )}
                {editingGroup && (
                  <TabsTrigger value="edit" className="bg-blue-50">
                    Edit: {editingGroup.name}
                  </TabsTrigger>
                )}
              </TabsList>
              
              {activeTab !== 'edit' && activeTab !== 'create' && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari grup..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>

            {/* Table View - All Tabs except Edit and Create */}
            {activeTab !== 'edit' && activeTab !== 'create' && (
              <TabsContent value={activeTab} className="space-y-4">
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px] max-w-[300px]">Grup</TableHead>
                          <TableHead className="w-[100px]">Tipe</TableHead>
                          <TableHead className="w-[120px]">Owner</TableHead>
                          <TableHead className="w-[80px] text-center">Member</TableHead>
                          <TableHead className="w-[70px] text-center">Post</TableHead>
                          <TableHead className="w-[90px]">Status</TableHead>
                          <TableHead className="w-[220px] text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {filteredGroups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
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
                            <TableCell className="max-w-[300px]">
                              <div className="flex items-center gap-3 min-w-0">
                                {group.avatar ? (
                                  <img
                                    src={group.avatar}
                                    alt={group.name || 'Group'}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-semibold text-sm">
                                      {(group.name || 'G').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="font-medium truncate">{group.name || 'Unnamed Group'}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {group.description || 'Tidak ada deskripsi'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(group.type || 'PUBLIC')}</TableCell>
                            <TableCell className="max-w-[120px]">
                              {group.owner ? (
                                <div className="text-sm overflow-hidden">
                                  <div className="font-medium truncate">{group.owner.name || 'Unknown'}</div>
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
                            <TableCell>
                              <Badge variant={group.isActive ? 'default' : 'secondary'}>
                                {group.isActive ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2" 
                                  asChild
                                  title="Lihat grup"
                                >
                                  <Link href={`/community/groups/${group.slug}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2" 
                                  onClick={() => openEditTab(group)}
                                  title="Edit grup"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openDeleteDialog(group)}
                                  title="Hapus grup"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Create Tab Content */}
            {activeTab === 'create' && isCreating && (
              <TabsContent value="create" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Buat Grup Baru
                    </CardTitle>
                    <CardDescription>
                      Buat grup komunitas baru untuk member Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4 max-w-3xl">
                      <div className="w-full">
                        <Label htmlFor="create-name">Nama Grup *</Label>
                        <Input
                          id="create-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Contoh: Komunitas Ekspor Jepang"
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="create-description">Deskripsi *</Label>
                        <Textarea
                          id="create-description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Jelaskan tentang grup ini..."
                          rows={4}
                          required
                          className="resize-none w-full"
                        />
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="create-type">Tipe Grup *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Publik</SelectItem>
                            <SelectItem value="PRIVATE">Privat</SelectItem>
                            <SelectItem value="HIDDEN">Tersembunyi</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.type === 'PUBLIC' && 'Semua orang bisa bergabung'}
                          {formData.type === 'PRIVATE' && 'Perlu persetujuan untuk bergabung'}
                          {formData.type === 'HIDDEN' && 'Hanya dengan undangan'}
                        </p>
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="create-avatar">Avatar Grup</Label>
                        <div className="space-y-2">
                          {formData.avatar && (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                              <Image 
                                src={formData.avatar} 
                                alt="Avatar preview" 
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              id="create-avatar"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'avatar')
                              }}
                              className="w-full"
                              disabled={uploadingAvatar}
                            />
                            {uploadingAvatar && (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Atau masukkan URL:
                          </p>
                          <Input
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="https://..."
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="create-coverImage">Cover Image</Label>
                        <div className="space-y-2">
                          {formData.coverImage && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                              <Image 
                                src={formData.coverImage} 
                                alt="Cover preview" 
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              id="create-coverImage"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'cover')
                              }}
                              className="w-full"
                              disabled={uploadingCover}
                            />
                            {uploadingCover && (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Atau masukkan URL:
                          </p>
                          <Input
                            value={formData.coverImage}
                            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                            placeholder="https://..."
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="create-bannedWords">Kata Terlarang (pisahkan dengan koma)</Label>
                        <Textarea
                          id="create-bannedWords"
                          value={formData.bannedWords}
                          onChange={(e) => setFormData({ ...formData, bannedWords: e.target.value })}
                          placeholder="spam, iklan, promo, dll"
                          rows={2}
                          className="resize-none w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Post yang mengandung kata-kata ini akan ditolak otomatis
                        </p>
                      </div>
                      
                      <div className="space-y-3 rounded-lg border p-4 w-full">
                        <h4 className="text-sm font-semibold">Pengaturan Grup</h4>
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="create-isActive">Status Aktif</Label>
                            <p className="text-xs text-muted-foreground">
                              Grup aktif dapat diakses oleh anggota
                            </p>
                          </div>
                          <Switch
                            id="create-isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="create-requireApproval">Persetujuan Admin</Label>
                            <p className="text-xs text-muted-foreground">
                              Anggota baru harus disetujui dulu
                            </p>
                          </div>
                          <Switch
                            id="create-requireApproval"
                            checked={formData.requireApproval}
                            onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="create-showStats">Tampilkan Statistik</Label>
                            <p className="text-xs text-muted-foreground">
                              Tampilkan jumlah member, post, event, kelas & mentor
                            </p>
                          </div>
                          <Switch
                            id="create-showStats"
                            checked={formData.showStats}
                            onCheckedChange={(checked) => setFormData({ ...formData, showStats: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelCreate}
                          disabled={submitting}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Batal
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? 'Membuat...' : 'Buat Grup'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Edit Tab Content */}
            {activeTab === 'edit' && editingGroup && (
              <TabsContent value="edit" className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Anggota</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{editingGroup._count?.members || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Postingan</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{editingGroup._count?.posts || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Kursus</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{editingGroup._count?.courses || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Produk</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{editingGroup._count?.products || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Group Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informasi Grup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Dibuat</Label>
                        <p className="mt-1 font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(editingGroup.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'long',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Terakhir Update</Label>
                        <p className="mt-1 font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(editingGroup.updatedAt).toLocaleString('id-ID', {
                            dateStyle: 'long',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Grup</CardTitle>
                    <CardDescription>Perbarui informasi grup {editingGroup.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEdit} className="space-y-4 max-w-3xl">
                      <div className="w-full">
                        <Label htmlFor="edit-name">Nama Grup *</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="edit-description">Deskripsi *</Label>
                        <Textarea
                          id="edit-description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          required
                          className="resize-none w-full"
                        />
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="edit-type">Tipe Grup *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Publik</SelectItem>
                            <SelectItem value="PRIVATE">Privat</SelectItem>
                            <SelectItem value="HIDDEN">Tersembunyi</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.type === 'PUBLIC' && 'Semua orang bisa bergabung'}
                          {formData.type === 'PRIVATE' && 'Perlu persetujuan untuk bergabung'}
                          {formData.type === 'HIDDEN' && 'Hanya dengan undangan'}
                        </p>
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="edit-avatar">Avatar Grup</Label>
                        <div className="space-y-2">
                          {formData.avatar && (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                              <Image 
                                src={formData.avatar} 
                                alt="Avatar preview" 
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              id="edit-avatar"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'avatar')
                              }}
                              className="w-full"
                              disabled={uploadingAvatar}
                            />
                            {uploadingAvatar && (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Atau masukkan URL:
                          </p>
                          <Input
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            placeholder="https://..."
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="edit-coverImage">Cover Image</Label>
                        <div className="space-y-2">
                          {formData.coverImage && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                              <Image 
                                src={formData.coverImage} 
                                alt="Cover preview" 
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              id="edit-coverImage"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, 'cover')
                              }}
                              className="w-full"
                              disabled={uploadingCover}
                            />
                            {uploadingCover && (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Atau masukkan URL:
                          </p>
                          <Input
                            value={formData.coverImage}
                            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                            placeholder="https://..."
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <Label htmlFor="edit-bannedWords">Kata Terlarang (pisahkan dengan koma)</Label>
                        <Textarea
                          id="edit-bannedWords"
                          value={formData.bannedWords}
                          onChange={(e) => setFormData({ ...formData, bannedWords: e.target.value })}
                          placeholder="spam, iklan, promo, dll"
                          rows={2}
                          className="resize-none w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Post yang mengandung kata-kata ini akan ditolak otomatis
                        </p>
                      </div>
                      
                      <div className="space-y-3 rounded-lg border p-4 w-full">
                        <h4 className="text-sm font-semibold">Pengaturan Grup</h4>
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="edit-isActive">Status Aktif</Label>
                            <p className="text-xs text-muted-foreground">
                              Grup aktif dapat diakses oleh anggota
                            </p>
                          </div>
                          <Switch
                            id="edit-isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="edit-requireApproval">Persetujuan Admin</Label>
                            <p className="text-xs text-muted-foreground">
                              Anggota baru harus disetujui dulu
                            </p>
                          </div>
                          <Switch
                            id="edit-requireApproval"
                            checked={formData.requireApproval}
                            onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="edit-showStats">Tampilkan Statistik</Label>
                            <p className="text-xs text-muted-foreground">
                              Tampilkan jumlah member, post, event, kelas & mentor
                            </p>
                          </div>
                          <Switch
                            id="edit-showStats"
                            checked={formData.showStats}
                            onCheckedChange={(checked) => setFormData({ ...formData, showStats: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={submitting}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Batal
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Member Management Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Kelola Member</CardTitle>
                        <CardDescription>Atur role dan kelola anggota grup</CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          fetchMembers(editingGroup.id)
                          setShowMemberDialog(true)
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Kelola Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Total Member: {editingGroup._count?.members || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

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

      {/* Member Management Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Kelola Member - {editingGroup?.name}</DialogTitle>
            <DialogDescription>
              Atur role member: MEMBER (biasa), MODERATOR (moderasi post), ADMIN (kelola grup)
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari member..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Members List */}
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada member
              </div>
            ) : (
              <div className="space-y-2">
                {members
                  .filter(m => 
                    m.user.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                    m.user.email.toLowerCase().includes(searchMember.toLowerCase())
                  )
                  .map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {member.user.image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <Image 
                              src={member.user.image} 
                              alt={member.user.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{member.user.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{member.user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateMemberRole(member.userId, value)}
                          disabled={member.role === 'OWNER'}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Member
                              </div>
                            </SelectItem>
                            <SelectItem value="MODERATOR">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Moderator
                              </div>
                            </SelectItem>
                            <SelectItem value="ADMIN">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-orange-600" />
                                Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="OWNER" disabled>
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                Owner
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {member.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Hapus ${member.user.name} dari grup?`)) {
                                handleRemoveMember(member.userId)
                              }
                            }}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowMemberDialog(false)
                setSearchMember('')
              }}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
