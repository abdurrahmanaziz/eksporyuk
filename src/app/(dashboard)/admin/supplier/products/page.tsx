'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  FileEdit,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  moq: number
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
  images: string[]
  viewCount: number
  rejectionReason?: string
  supplierProfile: {
    id: string
    companyName: string
    slug: string
    logo?: string
    isVerified: boolean
  }
}

export default function AdminSupplierProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    active: 0,
    inactive: 0,
    pendingReview: 0,
  })

  useEffect(() => {
    fetchProducts()
  }, [statusFilter])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/supplier/products?status=${statusFilter}`)
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
        setStats(data.stats || { total: 0, draft: 0, active: 0, inactive: 0, pendingReview: 0 })
      } else {
        toast.error('Gagal memuat data produk')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = products.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.supplierProfile.companyName.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    )
    setFilteredProducts(filtered)
  }

  const handleAction = async (productId: string, action: string) => {
    const confirmMessages: Record<string, string> = {
      approve: 'Approve produk ini?',
      reject: 'Reject produk ini?',
      suspend: 'Suspend produk ini?',
      activate: 'Aktifkan produk ini?',
      deactivate: 'Nonaktifkan produk ini?',
    }

    if (!confirm(confirmMessages[action] || 'Lanjutkan?')) return

    let reason
    if (action === 'reject' || action === 'suspend') {
      reason = prompt('Alasan:')
      if (!reason) return
    }

    try {
      const response = await fetch('/api/admin/supplier/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action, reason }),
      })

      if (response.ok) {
        toast.success('Berhasil mengupdate produk')
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengupdate produk')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      DRAFT: { variant: 'outline', label: 'Draft', color: 'text-gray-500' },
      ACTIVE: { variant: 'default', label: 'Aktif', color: 'bg-green-500' },
      INACTIVE: { variant: 'secondary', label: 'Tidak Aktif', color: 'text-gray-500' },
      PENDING_REVIEW: { variant: 'outline', label: 'Pending Review', color: 'text-amber-500' },
    }
    const config = variants[status] || variants.DRAFT
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
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
          <h1 className="text-2xl font-bold">Kelola Produk Supplier</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua produk dari supplier</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Draft</p>
                  <p className="text-xl font-bold">{stats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Aktif</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-gray-500">Tidak Aktif</p>
                  <p className="text-xl font-bold">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold">{stats.pendingReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Daftar Produk</CardTitle>
                <CardDescription>Filter dan kelola produk supplier</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari produk..."
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
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                    <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
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
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>MOQ</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {product.description || '-'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.supplierProfile.logo && (
                              <div className="relative w-6 h-6 rounded overflow-hidden">
                                <Image
                                  src={product.supplierProfile.logo}
                                  alt={product.supplierProfile.companyName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{product.supplierProfile.companyName}</p>
                              {product.supplierProfile.isVerified && (
                                <Badge variant="outline" className="text-xs">Verified</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">Rp {product.price.toLocaleString('id-ID')}</p>
                        </TableCell>
                        <TableCell>{product.moq}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span>{product.viewCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product.status)}
                          {product.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1">{product.rejectionReason}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {product.status === 'PENDING_REVIEW' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(product.id, 'approve')}
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(product.id, 'reject')}
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {product.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(product.id, 'suspend')}
                                title="Suspend"
                              >
                                <Ban className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                            {product.status === 'INACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(product.id, 'activate')}
                                title="Aktifkan"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
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
