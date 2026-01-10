'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Factory, Search, Plus, Edit, Trash2, CheckCircle, XCircle, 
  Eye, Save, X, MapPin, Phone, Mail, User, Globe, FileText, Upload, ArrowLeft
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
import { SearchableSelect } from '@/components/ui/searchable-select'

type Supplier = {
  id: string
  companyName: string
  province: string
  city: string
  address?: string
  contactPerson?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  businessType?: string
  products: string
  capacity?: string
  certifications?: string
  legalityDoc?: string
  nibDoc?: string
  tags?: string
  notes?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  viewCount: number
  createdAt: string
}

const PROVINCES = [
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta',
  'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
  'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara',
  'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara',
  'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya',
  'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat',
  'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara',
  'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara'
]

const BUSINESS_TYPES = [
  'Manufacturer', 'Producer', 'Supplier', 'Distributor', 'Agent', 'Cooperative', 'Other'
]

export default function AdminSuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProvince, setFilterProvince] = useState('all')
  const [filterVerified, setFilterVerified] = useState('all')
  const [activeTab, setActiveTab] = useState('list')
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)
  const [legalityFile, setLegalityFile] = useState<File | null>(null)
  const [nibFile, setNibFile] = useState<File | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [syncProfiles, setSyncProfiles] = useState<any[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    province: '',
    city: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    businessType: '',
    products: '',
    capacity: '',
    certifications: '',
    tags: '',
    notes: '',
    isVerified: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    } else {
      fetchSuppliers()
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      const debounce = setTimeout(() => {
        fetchSuppliers()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterProvince, filterVerified, status, session])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterProvince && filterProvince !== 'all') params.append('province', filterProvince)
      if (filterVerified === 'verified') params.append('isVerified', 'true')
      if (filterVerified === 'unverified') params.append('isVerified', 'false')
      params.append('limit', '1000')

      const res = await fetch(`/api/databases/suppliers?${params}`)
      const data = await res.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingSupplier(null)
    setFormData({
      companyName: '',
      province: '',
      city: '',
      address: '',
      contactPerson: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      businessType: '',
      products: '',
      capacity: '',
      certifications: '',
      tags: '',
      notes: '',
      isVerified: false,
    })
    setLegalityFile(null)
    setNibFile(null)
    setActiveTab('form')
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      companyName: supplier.companyName,
      province: supplier.province,
      city: supplier.city || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      website: supplier.website || '',
      businessType: supplier.businessType || '',
      products: supplier.products,
      capacity: supplier.capacity || '',
      certifications: supplier.certifications || '',
      tags: supplier.tags || '',
      notes: supplier.notes || '',
      isVerified: supplier.isVerified,
    })
    setLegalityFile(null)
    setNibFile(null)
    setActiveTab('form')
  }

  const handleDelete = async () => {
    if (!supplierToDelete) return

    try {
      const res = await fetch(`/api/databases/suppliers/${supplierToDelete}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete supplier')

      await fetchSuppliers()
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Failed to delete supplier')
    }
  }

  const fetchSyncProfiles = async () => {
    try {
      setLoadingProfiles(true)
      const res = await fetch('/api/admin/databases/suppliers/sync-profiles')
      const data = await res.json()
      setSyncProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error fetching sync profiles:', error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const handleSyncProfile = async (profileId: string) => {
    try {
      setSyncing(profileId)
      const res = await fetch('/api/admin/databases/suppliers/sync-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to sync profile')
        return
      }

      alert('Profile synced successfully!')
      await fetchSyncProfiles()
      await fetchSuppliers()
    } catch (error) {
      console.error('Error syncing profile:', error)
      alert('Failed to sync profile')
    } finally {
      setSyncing(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const method = editingSupplier ? 'PUT' : 'POST'
      const url = editingSupplier 
        ? `/api/databases/suppliers/${editingSupplier.id}`
        : '/api/databases/suppliers'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save supplier')
      }

      const savedSupplier = await res.json()

      // Upload files if any
      if (legalityFile || nibFile) {
        await uploadFiles(savedSupplier.id)
      }

      await fetchSuppliers()
      resetForm()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert(error instanceof Error ? error.message : 'Failed to save supplier')
    } finally {
      setSaving(false)
    }
  }

  const uploadFiles = async (supplierId: string) => {
    try {
      setUploadingFiles(true)
      const formData = new FormData()

      if (legalityFile) {
        formData.append('legalityFile', legalityFile)
      }
      if (nibFile) {
        formData.append('nibFile', nibFile)
      }

      const res = await fetch(`/api/databases/suppliers/${supplierId}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to upload files')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Supplier saved but failed to upload files')
    } finally {
      setUploadingFiles(false)
    }
  }

  const resetForm = () => {
    setFormData({
      companyName: '',
      province: '',
      city: '',
      address: '',
      contactPerson: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      businessType: '',
      products: '',
      capacity: '',
      certifications: '',
      tags: '',
      notes: '',
      isVerified: false,
    })
    setEditingSupplier(null)
    setLegalityFile(null)
    setNibFile(null)
    setActiveTab('list')
  }

  if (loading && suppliers.length === 0) {
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Factory className="w-8 h-8" />
                Admin - Manage Suppliers
              </h1>
              <p className="text-gray-600 mt-2">Kelola database supplier dan produsen lokal</p>
            </div>
            {activeTab === 'list' && (
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            )}
            {activeTab !== 'list' && (
              <Button variant="outline" onClick={() => setActiveTab('list')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            )}
          </div>

          {/* Tabs */}
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="list">
              <Factory className="w-4 h-4 mr-2" />
              Supplier List
            </TabsTrigger>
            <TabsTrigger 
              value="sync" 
              onClick={() => {
                setActiveTab('sync')
                fetchSyncProfiles()
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Sync Profiles
            </TabsTrigger>
            <TabsTrigger value="form" disabled={activeTab !== 'form' && activeTab !== 'documents' && activeTab !== 'notes'}>
              <Edit className="w-4 h-4 mr-2" />
              {editingSupplier ? 'Edit' : 'Add'} Supplier
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={activeTab !== 'form' && activeTab !== 'documents' && activeTab !== 'notes'}>
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="notes" disabled={activeTab !== 'form' && activeTab !== 'documents' && activeTab !== 'notes'}>
              <User className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Delete Confirmation */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the supplier from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* LIST TAB */}
          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <SearchableSelect
                    options={PROVINCES.map(p => ({ value: p, label: p }))}
                    value={filterProvince === 'all' ? '' : filterProvince}
                    onValueChange={(val) => setFilterProvince(val || 'all')}
                    placeholder="All Provinces"
                    searchPlaceholder="Search province..."
                  />
                  <Select value={filterVerified} onValueChange={setFilterVerified}>
                    <SelectTrigger>
                      <SelectValue placeholder="Verification Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Unverified Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{suppliers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {suppliers.filter(s => s.isVerified).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Provinces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(suppliers.map(s => s.province)).size}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {suppliers.reduce((sum, s) => sum + s.viewCount, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suppliers Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stats</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{supplier.companyName}</div>
                            {supplier.businessType && (
                              <div className="text-xs text-gray-500">{supplier.businessType}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {supplier.city}, {supplier.province}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {supplier.products}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {supplier.contactPerson && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <User className="w-3 h-3" />
                                  {supplier.contactPerson}
                                </div>
                              )}
                              {supplier.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {supplier.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {supplier.isVerified ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {supplier.viewCount}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(supplier)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSupplierToDelete(supplier.id)
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

                {suppliers.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <Factory className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No suppliers found</p>
                    <p className="text-sm mt-2">Add your first supplier to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYNC PROFILES TAB */}
          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Sync Verified Supplier Profiles
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Verified supplier profiles that are not yet in the public database
                    </p>
                  </div>
                  <Button onClick={fetchSyncProfiles} disabled={loadingProfiles} variant="outline">
                    {loadingProfiles ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProfiles ? (
                  <div className="py-8 text-center text-gray-500">Loading profiles...</div>
                ) : syncProfiles.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No profiles to sync</p>
                    <p className="text-sm mt-2">All verified supplier profiles are already in the database</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {syncProfiles.map((profile: any) => (
                      <Card key={profile.id} className="border-l-4 border-l-green-500">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{profile.companyName}</h3>
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span>{profile.city}, {profile.province}</span>
                                </div>
                                {profile.email && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span>{profile.email}</span>
                                  </div>
                                )}
                                {profile.phone && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{profile.phone}</span>
                                  </div>
                                )}
                                {profile.businessCategory && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Factory className="w-4 h-4" />
                                    <span>{profile.businessCategory}</span>
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                <span>User: {profile.user.name}</span>
                                <span>•</span>
                                <span>Products: {profile.totalProducts}</span>
                                <span>•</span>
                                <span>Views: {profile.viewCount}</span>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleSyncProfile(profile.id)}
                              disabled={syncing === profile.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {syncing === profile.id ? 'Syncing...' : 'Add to Database'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORM TAB */}
          <TabsContent value="form" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Factory className="w-5 h-5 text-blue-600" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        placeholder="PT. Example Company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select value={formData.businessType} onValueChange={(val) => setFormData({...formData, businessType: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <SearchableSelect
                        options={PROVINCES.map(p => ({ value: p, label: p }))}
                        value={formData.province}
                        onValueChange={(val) => setFormData({...formData, province: val || ''})}
                        placeholder="Select province"
                        searchPlaceholder="Search province..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Enter city"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      placeholder="Full address..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+62 xxx xxx xxx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                        placeholder="+62 xxx xxx xxx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products & Business */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-600" />
                    Products & Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="products">Products *</Label>
                    <Textarea
                      id="products"
                      required
                      value={formData.products}
                      onChange={(e) => setFormData({...formData, products: e.target.value})}
                      rows={3}
                      placeholder="Deskripsi produk yang diproduksi..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="capacity">Production Capacity</Label>
                      <Input
                        id="capacity"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                        placeholder="e.g., 1000 units/month"
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications</Label>
                      <Input
                        id="certifications"
                        value={formData.certifications}
                        onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                        placeholder="e.g., ISO 9001, Halal"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="e.g., organic, handmade, wholesale"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="isVerified"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({...formData, isVerified: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isVerified" className="cursor-pointer">Mark as Verified</Label>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={saving || uploadingFiles}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : uploadingFiles ? 'Uploading...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="space-y-6">
            {/* Legalitas PT */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Legalitas PT (Kemenkumham)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingSupplier?.legalityDoc && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-900">File saat ini:</div>
                    <a 
                      href={editingSupplier.legalityDoc} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 underline hover:text-green-800 flex items-center gap-2 mt-1"
                    >
                      <FileText className="w-4 h-4" />
                      Lihat Dokumen Legalitas
                    </a>
                  </div>
                )}
                <div>
                  <Label htmlFor="legalityFile">
                    {editingSupplier?.legalityDoc ? 'Upload Dokumen Baru (Opsional)' : 'Upload Akta Pendirian PT'}
                  </Label>
                  <Input
                    id="legalityFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setLegalityFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
                {legalityFile && (
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    File dipilih: {legalityFile.name}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NIB OSS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  NIB (Nomor Induk Berusaha) - OSS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editingSupplier?.nibDoc && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-900">File saat ini:</div>
                    <a 
                      href={editingSupplier.nibDoc} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 underline hover:text-green-800 flex items-center gap-2 mt-1"
                    >
                      <FileText className="w-4 h-4" />
                      Lihat NIB Certificate
                    </a>
                  </div>
                )}
                <div>
                  <Label htmlFor="nibFile">
                    {editingSupplier?.nibDoc ? 'Upload Dokumen Baru (Opsional)' : 'Upload NIB Certificate'}
                  </Label>
                  <Input
                    id="nibFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setNibFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
                {nibFile && (
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    File dipilih: {nibFile.name}
                  </div>
                )}
              </CardContent>
            </Card>

            {uploadingFiles && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Upload className="w-4 h-4 animate-pulse" />
                Uploading files...
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1" disabled={saving || uploadingFiles}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : uploadingFiles ? 'Uploading...' : 'Save & Upload Documents'}
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('form')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
            </div>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="notes">Notes (Admin Only)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={8}
                    placeholder="Add internal notes, verification details, or any other relevant information..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes are only visible to admins
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1" disabled={saving || uploadingFiles}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('form')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsivePageWrapper>
  )
}
