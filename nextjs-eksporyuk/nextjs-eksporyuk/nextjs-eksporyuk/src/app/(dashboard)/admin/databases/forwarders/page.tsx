'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Truck, Search, Plus, Edit, Trash2, CheckCircle, XCircle, 
  Eye, Save, X, MapPin, Phone, Mail, User, Globe, FileText, ArrowLeft,
  DollarSign, Ship, Package, Loader2, RefreshCw
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'

type Forwarder = {
  id: string
  companyName: string
  country: string
  city: string
  address?: string
  contactPerson?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  serviceType?: string
  routes?: string
  services?: string
  priceRange?: string
  minShipment?: string
  tags?: string
  notes?: string
  isVerified: boolean
  rating: number
  totalShipments: number
  viewCount: number
  createdAt: string
  addedByUser?: {
    name: string
    email: string
  }
}

const COUNTRIES = [
  'Indonesia', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines',
  'China', 'Japan', 'South Korea', 'Taiwan', 'Hong Kong',
  'USA', 'UK', 'Germany', 'Netherlands', 'Australia',
  'UAE', 'Saudi Arabia', 'India', 'Other'
]

const SERVICE_TYPES = [
  'Freight Forwarder', 'Shipping Agent', 'Customs Broker', 'Logistics Provider',
  'NVOCC', 'Express Courier', 'Air Cargo', 'Sea Freight', 'Land Transport', 'Multimodal'
]

export default function AdminForwardersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [forwarders, setForwarders] = useState<Forwarder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterVerified, setFilterVerified] = useState('all')
  const [activeTab, setActiveTab] = useState('list')
  const [editingForwarder, setEditingForwarder] = useState<Forwarder | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [forwarderToDelete, setForwarderToDelete] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    country: 'Indonesia',
    city: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    serviceType: '',
    routes: '',
    services: '',
    priceRange: '',
    minShipment: '',
    tags: '',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    fetchForwarders()
  }, [session, status, router])

  const fetchForwarders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/databases/forwarders')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setForwarders(data.forwarders || [])
    } catch (error) {
      console.error('Error fetching forwarders:', error)
      toast.error('Gagal memuat data forwarder')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName || !formData.city) {
      toast.error('Nama perusahaan dan kota wajib diisi')
      return
    }

    setSaving(true)
    try {
      const url = editingForwarder 
        ? `/api/admin/databases/forwarders/${editingForwarder.id}`
        : '/api/admin/databases/forwarders'
      
      const res = await fetch(url, {
        method: editingForwarder ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to save')
      
      toast.success(editingForwarder ? 'Forwarder berhasil diupdate' : 'Forwarder berhasil ditambahkan')
      fetchForwarders()
      resetForm()
      setActiveTab('list')
    } catch (error) {
      console.error('Error saving forwarder:', error)
      toast.error('Gagal menyimpan data forwarder')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (forwarder: Forwarder) => {
    setEditingForwarder(forwarder)
    setFormData({
      companyName: forwarder.companyName || '',
      country: forwarder.country || 'Indonesia',
      city: forwarder.city || '',
      address: forwarder.address || '',
      contactPerson: forwarder.contactPerson || '',
      email: forwarder.email || '',
      phone: forwarder.phone || '',
      whatsapp: forwarder.whatsapp || '',
      website: forwarder.website || '',
      serviceType: forwarder.serviceType || '',
      routes: forwarder.routes || '',
      services: forwarder.services || '',
      priceRange: forwarder.priceRange || '',
      minShipment: forwarder.minShipment || '',
      tags: forwarder.tags || '',
      notes: forwarder.notes || ''
    })
    setActiveTab('form')
  }

  const handleDelete = async () => {
    if (!forwarderToDelete) return
    
    try {
      const res = await fetch(`/api/admin/databases/forwarders/${forwarderToDelete}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete')
      
      toast.success('Forwarder berhasil dihapus')
      fetchForwarders()
    } catch (error) {
      console.error('Error deleting forwarder:', error)
      toast.error('Gagal menghapus forwarder')
    } finally {
      setDeleteDialogOpen(false)
      setForwarderToDelete(null)
    }
  }

  const handleToggleVerify = async (forwarder: Forwarder) => {
    try {
      const res = await fetch(`/api/admin/databases/forwarders/${forwarder.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !forwarder.isVerified })
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      toast.success(forwarder.isVerified ? 'Verifikasi dibatalkan' : 'Forwarder terverifikasi')
      fetchForwarders()
    } catch (error) {
      console.error('Error updating verification:', error)
      toast.error('Gagal mengupdate status verifikasi')
    }
  }

  const resetForm = () => {
    setEditingForwarder(null)
    setFormData({
      companyName: '',
      country: 'Indonesia',
      city: '',
      address: '',
      contactPerson: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      serviceType: '',
      routes: '',
      services: '',
      priceRange: '',
      minShipment: '',
      tags: '',
      notes: ''
    })
  }

  // Filter logic
  const filteredForwarders = forwarders.filter(forwarder => {
    const matchesSearch = 
      forwarder.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      forwarder.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      forwarder.services?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      forwarder.routes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCountry = filterCountry === 'all' || forwarder.country === filterCountry
    const matchesVerified = filterVerified === 'all' || 
      (filterVerified === 'verified' && forwarder.isVerified) ||
      (filterVerified === 'unverified' && !forwarder.isVerified)
    
    return matchesSearch && matchesCountry && matchesVerified
  })

  // Stats
  const stats = {
    total: forwarders.length,
    verified: forwarders.filter(f => f.isVerified).length,
    unverified: forwarders.filter(f => !f.isVerified).length,
    totalViews: forwarders.reduce((sum, f) => sum + (f.viewCount || 0), 0)
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Database Forwarder</h1>
            <p className="text-gray-600">Kelola database freight forwarder dan shipping agent</p>
          </div>
          <Button onClick={fetchForwarders} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-xl font-bold text-green-600">{stats.verified}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unverified</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.unverified}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-xl font-bold text-purple-600">{stats.totalViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">Daftar Forwarder</TabsTrigger>
            <TabsTrigger value="form">
              {editingForwarder ? 'Edit Forwarder' : 'Tambah Forwarder'}
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cari nama perusahaan, kota, atau layanan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterCountry} onValueChange={setFilterCountry}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Negara" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Negara</SelectItem>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterVerified} onValueChange={setFilterVerified}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="verified">Terverifikasi</SelectItem>
                      <SelectItem value="unverified">Belum Verifikasi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => { resetForm(); setActiveTab('form') }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Forwarder</CardTitle>
                <CardDescription>
                  {filteredForwarders.length} dari {forwarders.length} forwarder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Perusahaan</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Tipe Layanan</TableHead>
                        <TableHead>Rute</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForwarders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Truck className="h-8 w-8 text-gray-400" />
                              <p className="text-gray-500">Tidak ada data forwarder</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredForwarders.map((forwarder) => (
                          <TableRow key={forwarder.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{forwarder.companyName}</p>
                                {forwarder.contactPerson && (
                                  <p className="text-sm text-gray-500">{forwarder.contactPerson}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{forwarder.city}, {forwarder.country}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{forwarder.serviceType || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{forwarder.routes || '-'}</span>
                            </TableCell>
                            <TableCell>
                              {forwarder.isVerified ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleVerify(forwarder)}
                                >
                                  {forwarder.isVerified ? (
                                    <XCircle className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(forwarder)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setForwarderToDelete(forwarder.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { resetForm(); setActiveTab('list') }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <div>
                    <CardTitle>
                      {editingForwarder ? 'Edit Forwarder' : 'Tambah Forwarder Baru'}
                    </CardTitle>
                    <CardDescription>
                      Isi informasi forwarder dengan lengkap
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Informasi Perusahaan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nama Perusahaan *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder="PT Forwarder Indonesia"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceType">Tipe Layanan</Label>
                        <Select
                          value={formData.serviceType}
                          onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe layanan" />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Lokasi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Negara</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => setFormData({ ...formData, country: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih negara" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Kota *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Jakarta"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Alamat</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Alamat lengkap"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kontak
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Nama Kontak</Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="info@forwarder.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telepon</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+62 21 1234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="+62 812 3456 7890"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://www.forwarder.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Ship className="h-4 w-4" />
                      Layanan & Rute
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="routes">Rute Pengiriman</Label>
                        <Textarea
                          id="routes"
                          value={formData.routes}
                          onChange={(e) => setFormData({ ...formData, routes: e.target.value })}
                          placeholder="Indonesia - China, Indonesia - USA, dll"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="services">Layanan yang Ditawarkan</Label>
                        <Textarea
                          id="services"
                          value={formData.services}
                          onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                          placeholder="FCL, LCL, Air Freight, Customs Clearance"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priceRange">Range Harga</Label>
                        <Input
                          id="priceRange"
                          value={formData.priceRange}
                          onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                          placeholder="$500 - $2000 / container"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minShipment">Minimum Pengiriman</Label>
                        <Input
                          id="minShipment"
                          value={formData.minShipment}
                          onChange={(e) => setFormData({ ...formData, minShipment: e.target.value })}
                          placeholder="1 CBM atau 100 kg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Informasi Tambahan
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="Pisahkan dengan koma: reliable, fast, cheap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Catatan internal..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      {editingForwarder ? 'Update Forwarder' : 'Simpan Forwarder'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => { resetForm(); setActiveTab('list') }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Forwarder?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Data forwarder akan dihapus secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ResponsivePageWrapper>
  )
}
