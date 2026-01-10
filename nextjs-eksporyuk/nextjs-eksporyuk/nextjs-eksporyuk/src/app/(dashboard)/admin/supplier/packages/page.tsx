'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Users, DollarSign, Plus, Edit, Trash2, Eye, Check, X, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierPackage {
  id: string
  name: string
  slug: string
  type: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  duration: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
  price: number
  originalPrice?: number
  features: Record<string, any>
  description?: string
  isActive: boolean
  displayOrder: number
  activeSubscriptions: number
  totalSubscriptions: number
  createdAt: string
  updatedAt: string
}

export default function AdminSupplierPackagesPage() {
  const { data: session } = useSession()
  const [packages, setPackages] = useState<SupplierPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [editMode, setEditMode] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<SupplierPackage | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    name: string
    slug: string
    type: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
    duration: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
    price: number
    originalPrice: number
    description: string
    isActive: boolean
    displayOrder: number
    features: {
      maxProducts: number
      maxImages: number
      maxDocuments: number
      chatEnabled: boolean
      maxChatsPerMonth: number
      verifiedBadge: boolean
      customURL: boolean
      customLogo: boolean
      statistics: boolean
      ranking: boolean
      priority: boolean
      catalogDownload: boolean
      multiLanguage: boolean
      featuredListing: boolean
      supportPriority: string
    }
  }>({
    name: '',
    slug: '',
    type: 'FREE',
    duration: 'MONTHLY',
    price: 0,
    originalPrice: 0,
    description: '',
    isActive: true,
    displayOrder: 0,
    features: {
      maxProducts: 1,
      maxImages: 3,
      maxDocuments: 1,
      chatEnabled: false,
      maxChatsPerMonth: 0,
      verifiedBadge: false,
      customURL: false,
      customLogo: false,
      statistics: false,
      ranking: false,
      priority: false,
      catalogDownload: false,
      multiLanguage: false,
      featuredListing: false,
      supportPriority: 'normal',
    },
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/supplier/packages')
      if (response.ok) {
        const data = await response.json()
        setPackages(data.data || [])
      } else {
        toast.error('Failed to load packages')
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Error loading packages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditMode(false)
    setSelectedPackage(null)
    setFormData({
      name: '',
      slug: '',
      type: 'FREE',
      duration: 'MONTHLY',
      price: 0,
      originalPrice: 0,
      description: '',
      isActive: true,
      displayOrder: 0,
      features: {
        maxProducts: 1,
        maxImages: 3,
        maxDocuments: 1,
        chatEnabled: false,
        maxChatsPerMonth: 0,
        verifiedBadge: false,
        customURL: false,
        customLogo: false,
        statistics: false,
        ranking: false,
        priority: false,
        catalogDownload: false,
        multiLanguage: false,
        featuredListing: false,
        supportPriority: 'normal',
      },
    })
    setActiveTab('form')
  }

  const handleEdit = (pkg: SupplierPackage) => {
    setEditMode(true)
    setSelectedPackage(pkg)
    setFormData({
      name: pkg.name,
      slug: pkg.slug,
      type: pkg.type,
      duration: pkg.duration,
      price: pkg.price,
      originalPrice: pkg.originalPrice || 0,
      description: pkg.description || '',
      isActive: pkg.isActive,
      displayOrder: pkg.displayOrder,
      features: {
        maxProducts: pkg.features.maxProducts ?? 1,
        maxImages: pkg.features.maxImages ?? 3,
        maxDocuments: pkg.features.maxDocuments ?? 1,
        chatEnabled: pkg.features.chatEnabled ?? false,
        maxChatsPerMonth: pkg.features.maxChatsPerMonth ?? 0,
        verifiedBadge: pkg.features.verifiedBadge ?? false,
        customURL: pkg.features.customURL ?? false,
        customLogo: pkg.features.customLogo ?? false,
        statistics: pkg.features.statistics ?? false,
        ranking: pkg.features.ranking ?? false,
        priority: pkg.features.priority ?? false,
        catalogDownload: pkg.features.catalogDownload ?? false,
        multiLanguage: pkg.features.multiLanguage ?? false,
        featuredListing: pkg.features.featuredListing ?? false,
        supportPriority: pkg.features.supportPriority ?? 'normal',
      },
    })
    setActiveTab('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editMode
        ? `/api/admin/supplier/packages/${selectedPackage?.id}`
        : '/api/admin/supplier/packages'

      const method = editMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(`Package ${editMode ? 'updated' : 'created'} successfully`)
        setActiveTab('list')
        fetchPackages()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const response = await fetch(`/api/admin/supplier/packages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Package deleted successfully')
        fetchPackages()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete package')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    }
  }

  const handleCancel = () => {
    setActiveTab('list')
    setEditMode(false)
    setSelectedPackage(null)
  }

  const totalRevenue = packages.reduce(
    (sum, pkg) => sum + pkg.activeSubscriptions * Number(pkg.price),
    0
  )

  if (session?.user?.role !== 'ADMIN') {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <p className="text-gray-500">Access denied. Admin only.</p>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Paket Membership Supplier</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola paket langganan dan fitur supplier</p>
          </div>
          {activeTab === 'list' && (
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Package
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="form">{editMode ? 'Edit' : 'Create'} Package</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Tab: List */}
          <TabsContent value="list" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold">{packages.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Subscribers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold">
                      {packages.reduce((sum, pkg) => sum + pkg.activeSubscriptions, 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold">
                      Rp {totalRevenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Packages Table */}
            <Card>
              <CardHeader>
                <CardTitle>Semua Paket</CardTitle>
                <CardDescription>Kelola harga dan fitur untuk membership supplier</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading packages...</p>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No packages found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Features</TableHead>
                          <TableHead>Subscribers</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{pkg.name}</p>
                                <p className="text-xs text-gray-500">{pkg.slug}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  pkg.type === 'FREE'
                                    ? 'secondary'
                                    : pkg.type === 'PREMIUM'
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {pkg.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{pkg.duration}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  Rp {Number(pkg.price).toLocaleString('id-ID')}
                                </p>
                                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                  <p className="text-xs text-gray-500 line-through">
                                    Rp {Number(pkg.originalPrice).toLocaleString('id-ID')}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <p>
                                  Products:{' '}
                                  {pkg.features.maxProducts === -1
                                    ? 'Unlimited'
                                    : pkg.features.maxProducts}
                                </p>
                                <p>Verified: {pkg.features.verifiedBadge ? '✓' : '✗'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{pkg.activeSubscriptions} active</p>
                                <p className="text-xs text-gray-500">
                                  {pkg.totalSubscriptions} total
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {pkg.isActive ? (
                                <Badge variant="default" className="bg-green-500">
                                  <Check className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <X className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(pkg)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(pkg.id)}
                                  disabled={pkg.activeSubscriptions > 0}
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
          </TabsContent>

          {/* Tab: Form */}
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle>{editMode ? 'Edit' : 'Buat'} Paket Supplier</CardTitle>
                    <CardDescription>
                      {editMode ? 'Perbarui' : 'Buat'} paket membership supplier
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Informasi Dasar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Paket *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Supplier Premium"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="supplier-premium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                            <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Select
                          value={formData.duration}
                          onValueChange={(value: any) => setFormData({ ...formData, duration: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                            <SelectItem value="YEARLY">YEARLY</SelectItem>
                            <SelectItem value="LIFETIME">LIFETIME</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (Rp) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          placeholder="299000"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="originalPrice">Original Price (Rp)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          value={formData.originalPrice}
                          onChange={(e) =>
                            setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })
                          }
                          placeholder="399000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Premium package with full features"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayOrder">Display Order</Label>
                      <Input
                        id="displayOrder"
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Fitur & Batasan</h3>
                    
                    {/* Limits */}
                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Batasan Kuota</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxProducts" className="text-sm">
                            Maks Produk (-1 = unlimited)
                          </Label>
                          <Input
                            id="maxProducts"
                            type="number"
                            value={formData.features.maxProducts}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                features: { ...formData.features, maxProducts: parseInt(e.target.value) || 1 },
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxImages" className="text-sm">
                            Maks Gambar/Produk
                          </Label>
                          <Input
                            id="maxImages"
                            type="number"
                            value={formData.features.maxImages}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                features: { ...formData.features, maxImages: parseInt(e.target.value) || 3 },
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxDocuments" className="text-sm">
                            Maks Dokumen/Produk
                          </Label>
                          <Input
                            id="maxDocuments"
                            type="number"
                            value={formData.features.maxDocuments}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                features: { ...formData.features, maxDocuments: parseInt(e.target.value) || 1 },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chat Settings */}
                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Fitur Chat</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="chatEnabled"
                            checked={formData.features.chatEnabled}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                features: { ...formData.features, chatEnabled: e.target.checked },
                              })
                            }
                            className="rounded"
                          />
                          <Label htmlFor="chatEnabled" className="text-sm cursor-pointer">
                            Aktifkan Chat
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxChatsPerMonth" className="text-sm">
                            Maks Chat/Bulan (-1 = unlimited)
                          </Label>
                          <Input
                            id="maxChatsPerMonth"
                            type="number"
                            value={formData.features.maxChatsPerMonth}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                features: { ...formData.features, maxChatsPerMonth: parseInt(e.target.value) || 0 },
                              })
                            }
                            disabled={!formData.features.chatEnabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badge & Visibility */}
                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Badge & Visibilitas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="verifiedBadge"
                              checked={formData.features.verifiedBadge}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, verifiedBadge: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="verifiedBadge" className="text-sm cursor-pointer">
                              Verified Badge
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="featuredListing"
                              checked={formData.features.featuredListing}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, featuredListing: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="featuredListing" className="text-sm cursor-pointer">
                              Featured Listing
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="priority"
                              checked={formData.features.priority}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, priority: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="priority" className="text-sm cursor-pointer">
                              Priority Ranking
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="customURL"
                              checked={formData.features.customURL}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, customURL: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="customURL" className="text-sm cursor-pointer">
                              Custom URL
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="customLogo"
                              checked={formData.features.customLogo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, customLogo: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="customLogo" className="text-sm cursor-pointer">
                              Custom Logo/Banner
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="ranking"
                              checked={formData.features.ranking}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, ranking: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="ranking" className="text-sm cursor-pointer">
                              Tampil di Ranking
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tools & Analytics */}
                    <div className="p-4 border rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Tools & Analytics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="statistics"
                              checked={formData.features.statistics}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, statistics: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="statistics" className="text-sm cursor-pointer">
                              Statistik & Analytics
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="catalogDownload"
                              checked={formData.features.catalogDownload}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, catalogDownload: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="catalogDownload" className="text-sm cursor-pointer">
                              Download Katalog PDF
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="multiLanguage"
                              checked={formData.features.multiLanguage}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, multiLanguage: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="multiLanguage" className="text-sm cursor-pointer">
                              Multi Bahasa
                            </Label>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="supportPriority" className="text-sm">
                              Support Priority
                            </Label>
                            <Select
                              value={formData.features.supportPriority}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  features: { ...formData.features, supportPriority: value },
                                })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High Priority</SelectItem>
                                <SelectItem value="vip">VIP Support</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active
                    </Label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      {editMode ? 'Update' : 'Create'} Package
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Pendaftaran Supplier</CardTitle>
                <CardDescription>Konfigurasi pendaftaran dan onboarding supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Registration Links</h4>
                      <p className="text-sm text-gray-500 mt-1">Share these links to attract suppliers</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">Public: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/register-supplier</code></p>
                        <p className="text-xs text-gray-600">Members: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/become-supplier</code></p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        const link = `${window.location.origin}/register-supplier`
                        navigator.clipboard.writeText(link)
                        toast.success('Public link copied!')
                      }}>
                        Copy Public
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const link = `${window.location.origin}/become-supplier`
                        navigator.clipboard.writeText(link)
                        toast.success('Member link copied!')
                      }}>
                        Copy Member
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div>
                      <h4 className="font-medium text-blue-900">Supplier Registration Forms</h4>
                      <p className="text-sm text-blue-700 mt-1">Two registration flows available:</p>
                      <div className="mt-2 space-y-1">
                        <div>
                          <code className="text-xs bg-white px-2 py-1 rounded">/register-supplier</code>
                          <span className="text-xs text-blue-600 ml-2">- For new users (public)</span>
                        </div>
                        <div>
                          <code className="text-xs bg-white px-2 py-1 rounded">/become-supplier</code>
                          <span className="text-xs text-blue-600 ml-2">- For existing members</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => window.open('/register-supplier', '_blank')}>
                        New User Form
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open('/become-supplier', '_blank')}>
                        Member Upgrade
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Registration Process</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">New User Flow (/register-supplier):</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-2">
                          <li>Fill user account data (name, email, password)</li>
                          <li>Fill company basic info (company name, location)</li>
                          <li>Select package (FREE or PREMIUM)</li>
                          <li>Submit → auto register & login</li>
                          <li>If PREMIUM: redirect to payment</li>
                          <li>Access dashboard → complete profile (logo, products, etc)</li>
                        </ol>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Existing Member Flow (/become-supplier):</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-2">
                          <li>Member login required</li>
                          <li>Fill company info & upload documents</li>
                          <li>Select package</li>
                          <li>Submit → create supplier profile</li>
                          <li>If PREMIUM: redirect to payment</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Auto-Applied Benefits</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>FREE Package:</strong></p>
                      <ul className="list-disc list-inside ml-4 text-gray-600">
                        <li>1 product listing</li>
                        <li>Basic profile page</li>
                        <li>No chat support</li>
                        <li>No verified badge</li>
                      </ul>
                      <p className="mt-3"><strong>PREMIUM Package:</strong></p>
                      <ul className="list-disc list-inside ml-4 text-gray-600">
                        <li>Unlimited product listings</li>
                        <li>Chat enabled</li>
                        <li>Verified badge (after document verification)</li>
                        <li>Custom URL</li>
                        <li>Statistics & analytics</li>
                        <li>Priority ranking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}