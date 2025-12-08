'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Plus, 
  Search, 
  Users, 
  Zap, 
  Shield, 
  Database,
  BarChart3,
  Cog,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface Feature {
  key: string
  name: string
  description: string
  category: string
}

interface UserPermission {
  id: string
  userId: string
  feature: string
  enabled: boolean
  value: any
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

interface FeatureStats {
  totalPermissions: number
  uniqueFeatures: number
  enabledPermissions: number
}

export default function AdminFeaturesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState<Feature[]>([])
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [featureGroups, setFeatureGroups] = useState<any>({})
  const [stats, setStats] = useState<FeatureStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [featureEnabled, setFeatureEnabled] = useState(true)
  const [featureValue, setFeatureValue] = useState('')

  // User search
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Set page title
  useEffect(() => {
    document.title = 'Manajemen Fitur | Admin'
  }, [])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchFeatures()
    }
  }, [session])

  const fetchFeatures = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/features')
      const data = await response.json()

      if (data.success) {
        setFeatures(data.features)
        setFeatureGroups(data.featureGroups)
        setStats(data.stats)
        
        // Flatten permissions for easier display
        const allPermissions: UserPermission[] = []
        Object.values(data.featureGroups).forEach((group: any) => {
          allPermissions.push(...group)
        })
        setPermissions(allPermissions)
      } else {
        toast.error('Gagal memuat fitur')
      }
    } catch (error) {
      console.error('Error fetching features:', error)
      toast.error('Kesalahan memuat fitur')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.users.slice(0, 10)) // Limit to 10 results
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const assignFeature = async () => {
    if (!selectedFeature || !selectedUserId) {
      toast.error('Silakan pilih fitur dan pengguna')
      return
    }

    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          feature: selectedFeature.key,
          enabled: featureEnabled,
          value: featureValue ? JSON.parse(featureValue) : null
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Izin fitur berhasil diperbarui')
        setAssignDialogOpen(false)
        fetchFeatures()
        
        // Reset form
        setSelectedFeature(null)
        setSelectedUserId('')
        setFeatureEnabled(true)
        setFeatureValue('')
      } else {
        toast.error(data.error || 'Gagal menetapkan fitur')
      }
    } catch (error) {
      console.error('Error assigning feature:', error)
      toast.error('Kesalahan menetapkan fitur')
    }
  }

  const togglePermission = async (permission: UserPermission) => {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: permission.userId,
          feature: permission.feature,
          enabled: !permission.enabled,
          value: permission.value
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Fitur ${!permission.enabled ? 'diaktifkan' : 'dinonaktifkan'}`)
        fetchFeatures()
      } else {
        toast.error(data.error || 'Gagal memperbarui izin')
      }
    } catch (error) {
      console.error('Error updating permission:', error)
      toast.error('Kesalahan memperbarui izin')
    }
  }

  const removePermission = async (permission: UserPermission) => {
    if (!confirm('Apakah Anda yakin ingin menghapus izin ini?')) return

    try {
      const response = await fetch(`/api/admin/features?userId=${permission.userId}&feature=${permission.feature}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Izin berhasil dihapus')
        fetchFeatures()
      } else {
        toast.error(data.error || 'Gagal menghapus izin')
      }
    } catch (error) {
      console.error('Error removing permission:', error)
      toast.error('Kesalahan menghapus izin')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Financial': return <BarChart3 className="w-4 h-4" />
      case 'Education': return <Users className="w-4 h-4" />
      case 'Administration': return <Shield className="w-4 h-4" />
      case 'Data': return <Database className="w-4 h-4" />
      case 'Analytics': return <BarChart3 className="w-4 h-4" />
      case 'Operations': return <Cog className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredPermissions = permissions.filter(permission => {
    return permission.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           permission.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           permission.feature.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const categories = [...new Set(features.map(f => f.category))]

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive font-medium">Akses ditolak. Memerlukan peran admin.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat fitur...</p>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Zap className="w-8 h-8" style={{ color: 'var(--button-primary-bg)' }} />
            Manajemen Fitur
          </h1>
          <p className="text-gray-600">Kelola izin pengguna dan akses fitur</p>
        </div>
        
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tetapkan Fitur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-12">
            <DialogHeader>
              <DialogTitle>Tetapkan Izin Fitur</DialogTitle>
              <DialogDescription>
                Berikan atau ubah akses fitur untuk pengguna
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5 px-6 py-2">
              {/* Feature Selection */}
              <div>
                <label className="text-sm font-medium">Fitur</label>
                <Select value={selectedFeature?.key || ''} onValueChange={(value) => {
                  const feature = features.find(f => f.key === value)
                  setSelectedFeature(feature || null)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih fitur" />
                  </SelectTrigger>
                  <SelectContent>
                    {features.map(feature => (
                      <SelectItem key={feature.key} value={feature.key}>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(feature.category)}
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-sm text-muted-foreground">{feature.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Search */}
              <div>
                <label className="text-sm font-medium">Pengguna</label>
                <div className="space-y-2">
                  <Input
                    placeholder="Cari pengguna berdasarkan nama atau email..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value)
                      searchUsers(e.target.value)
                    }}
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map(user => (
                        <div
                          key={user.id}
                          className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${
                            selectedUserId === user.id ? 'bg-accent' : ''
                          }`}
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setUserSearchQuery(`${user.name} (${user.email})`)
                            setSearchResults([])
                          }}
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Aktif</label>
                  <p className="text-xs text-muted-foreground">Apakah fitur aktif untuk pengguna ini</p>
                </div>
                <Switch
                  checked={featureEnabled}
                  onCheckedChange={setFeatureEnabled}
                />
              </div>

              {/* Value (JSON) */}
              <div>
                <label className="text-sm font-medium">Konfigurasi (JSON)</label>
                <Input
                  placeholder='{"percentage": 10, "limit": 100}'
                  value={featureValue}
                  onChange={(e) => setFeatureValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Konfigurasi JSON opsional untuk fitur
                </p>
              </div>

              <div className="flex gap-3 pt-8 pb-4">
                <Button onClick={assignFeature} className="flex-1 btn-primary">
                  Tetapkan Izin
                </Button>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  Batal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Izin</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPermissions}</p>
              </div>
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fitur Unik</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uniqueFeatures}</p>
              </div>
              <Zap className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Izin Aktif</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.enabledPermissions}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.enabledPermissions / Math.max(stats.totalPermissions, 1)) * 100)}% aktif
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Tabs defaultValue="features" className="">
        <div className="border-b border-gray-200 px-6">
        <TabsList className="bg-transparent border-0">
          <TabsTrigger value="features" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">Fitur Tersedia</TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">Izin Pengguna</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="features" className="p-6 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari fitur..."
                className="pl-9 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-gray-300 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Features Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures.map(feature => (
              <div key={feature.key} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(feature.category)}
                    <h3 className="text-base font-semibold text-gray-900">{feature.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">{feature.category}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Pengguna dengan akses: {featureGroups[feature.key]?.length || 0}
                  </span>
                  <Button 
                    size="sm"
                    className="btn-primary"
                    onClick={() => {
                      setSelectedFeature(feature)
                      setAssignDialogOpen(true)
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Tetapkan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari pengguna atau fitur..."
              className="pl-9 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Permissions Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Pengguna</TableHead>
                    <TableHead className="font-semibold text-gray-700">Fitur</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Konfigurasi</TableHead>
                    <TableHead className="font-semibold text-gray-700">Diperbarui</TableHead>
                    <TableHead className="font-semibold text-gray-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map(permission => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.user.name}</div>
                          <div className="text-sm text-muted-foreground">{permission.user.email}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {permission.user.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(features.find(f => f.key === permission.feature)?.category || '')}
                          <div>
                            <div className="font-medium">
                              {features.find(f => f.key === permission.feature)?.name || permission.feature}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {features.find(f => f.key === permission.feature)?.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permission.enabled ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 font-medium">Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-destructive" />
                              <span className="text-destructive font-medium">Nonaktif</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {permission.value ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {JSON.stringify(permission.value)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-sm">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(permission.updatedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePermission(permission)}
                          >
                            {permission.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removePermission(permission)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPermissions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Tidak ada izin yang cocok dengan pencarian Anda.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
