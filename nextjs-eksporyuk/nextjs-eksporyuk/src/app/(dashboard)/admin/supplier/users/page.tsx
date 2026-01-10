'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
  Eye,
  Package,
  Star,
  Ban,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface Supplier {
  id: string
  companyName: string
  slug: string
  logo?: string
  email?: string
  phone?: string
  province: string
  city: string
  isVerified: boolean
  isSuspended: boolean
  rating?: number
  totalProducts: number
  totalChats: number
  viewCount: number
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  supplierMembership: {
    isActive: boolean
    package: {
      name: string
      type: string
    }
  } | null
  affiliateSource?: {
    affiliateName: string
    affiliateEmail: string | null
    affiliateWhatsapp: string | null
    commissionAmount: number | null
    paidOut: boolean
  } | null
  _count: {
    products: number
  }
}

export default function AdminSupplierUsersPage() {
  const { data: session } = useSession()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  })

  useEffect(() => {
    fetchSuppliers()
  }, [statusFilter])

  useEffect(() => {
    filterSuppliers()
  }, [suppliers, searchQuery])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/supplier/users?status=${statusFilter}`)
      
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data || [])
        setStats(data.stats || { total: 0, active: 0, inactive: 0, suspended: 0 })
      } else {
        toast.error('Gagal memuat data supplier')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const filterSuppliers = () => {
    if (!searchQuery) {
      setFilteredSuppliers(suppliers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = suppliers.filter(
      s =>
        s.companyName.toLowerCase().includes(query) ||
        s.user.name.toLowerCase().includes(query) ||
        s.user.email.toLowerCase().includes(query) ||
        (s.province && s.province.toLowerCase().includes(query)) ||
        (s.city && s.city.toLowerCase().includes(query))
    )
    setFilteredSuppliers(filtered)
  }

  const handleAction = async (supplierId: string, action: string, reason?: string) => {
    const confirmMessages: Record<string, string> = {
      suspend: 'Apakah Anda yakin ingin menangguhkan supplier ini?',
      unsuspend: 'Apakah Anda yakin ingin mengaktifkan kembali supplier ini?',
      verify: 'Apakah Anda yakin ingin verifikasi supplier ini?',
      unverify: 'Apakah Anda yakin ingin mencabut verifikasi supplier ini?',
    }

    if (!confirm(confirmMessages[action] || 'Lanjutkan aksi ini?')) return

    try {
      const response = await fetch('/api/admin/supplier/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action, reason }),
      })

      if (response.ok) {
        toast.success('Berhasil mengupdate supplier')
        fetchSuppliers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengupdate supplier')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <p className="text-gray-500">Akses ditolak. Hanya admin.</p>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Kelola Supplier Users</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua supplier yang terdaftar di platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Supplier</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aktif</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tidak Aktif</p>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ditangguhkan</p>
                  <p className="text-2xl font-bold">{stats.suspended}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Daftar Supplier</CardTitle>
                <CardDescription>Filter dan kelola supplier users</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="suspended">Ditangguhkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Memuat data...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada supplier ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Perusahaan</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Sumber Affiliate</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {supplier.logo ? (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={supplier.logo}
                                  alt={supplier.companyName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{supplier.companyName}</p>
                              <p className="text-xs text-gray-500">{supplier.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{supplier.user.name}</p>
                            <p className="text-xs text-gray-500">{supplier.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{supplier.province}</p>
                          <p className="text-xs text-gray-500">{supplier.city}</p>
                        </TableCell>
                        <TableCell>
                          {supplier.supplierMembership ? (
                            <div>
                              <Badge
                                variant={
                                  supplier.supplierMembership.package.type === 'FREE'
                                    ? 'secondary'
                                    : 'default'
                                }
                              >
                                {supplier.supplierMembership.package.name}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {supplier.supplierMembership.isActive ? 'Aktif' : 'Tidak Aktif'}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="outline">No Membership</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.affiliateSource ? (
                            <div className="min-w-[150px]">
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  Via Affiliate
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mt-1">
                                {supplier.affiliateSource.affiliateName}
                              </p>
                              {supplier.affiliateSource.commissionAmount && (
                                <p className="text-xs text-gray-500">
                                  Komisi: Rp {supplier.affiliateSource.commissionAmount.toLocaleString('id-ID')}
                                  {supplier.affiliateSource.paidOut ? (
                                    <Badge variant="default" className="ml-1 text-xs">Paid</Badge>
                                  ) : (
                                    <Badge variant="outline" className="ml-1 text-xs">Pending</Badge>
                                  )}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Daftar Langsung</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>{supplier._count.products}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>{supplier.rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {supplier.isVerified && (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Terverifikasi
                              </Badge>
                            )}
                            {supplier.isSuspended && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="w-3 h-3 mr-1" />
                                Ditangguhkan
                              </Badge>
                            )}
                            {!supplier.isVerified && !supplier.isSuspended && (
                              <Badge variant="outline" className="text-xs">
                                Belum Verifikasi
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/supplier/${supplier.slug}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            {!supplier.isVerified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(supplier.id, 'verify')}
                                title="Verifikasi"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            
                            {supplier.isVerified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(supplier.id, 'unverify')}
                                title="Cabut Verifikasi"
                              >
                                <ShieldOff className="w-4 h-4 text-amber-600" />
                              </Button>
                            )}
                            
                            {supplier.isSuspended ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(supplier.id, 'unsuspend')}
                                title="Aktifkan Kembali"
                              >
                                <RotateCcw className="w-4 h-4 text-blue-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt('Alasan penangguhan:')
                                  if (reason) handleAction(supplier.id, 'suspend', reason)
                                }}
                                title="Tangguhkan"
                              >
                                <Ban className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
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
      </div>
    </ResponsivePageWrapper>
  )
}
