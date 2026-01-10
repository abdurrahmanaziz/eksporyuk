'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, CheckCircle2, Building2, Package, Loader2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface Supplier {
  id: string
  slug: string
  companyName: string
  bio?: string
  logo?: string
  city?: string
  province?: string
  isVerified: boolean
  viewCount: number
  _count: {
    products: number
  }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const [filters, setFilters] = useState({
    search: '',
    province: '',
    verified: false,
    page: 1
  })

  useEffect(() => {
    fetchSuppliers()
  }, [filters])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.province) params.append('province', filters.province)
      if (filters.verified) params.append('verified', 'true')
      params.append('page', filters.page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/suppliers?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data)
        setPagination(data.pagination)
        setStats(data.stats)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Direktori Supplier</h1>
          <p className="text-xl text-blue-100 mb-8">
            Temukan supplier terpercaya untuk kebutuhan ekspor Anda
          </p>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Total Supplier</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="text-sm text-blue-100">Terverifikasi</p>
                    <p className="text-2xl font-bold">{stats.verified}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Cari nama perusahaan..."
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filters.province || "all"}
                onValueChange={(value) => setFilters({ ...filters, province: value === "all" ? "" : value, page: 1 })}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Semua Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Provinsi</SelectItem>
                  <SelectItem value="Jawa Barat">Jawa Barat</SelectItem>
                  <SelectItem value="Jawa Tengah">Jawa Tengah</SelectItem>
                  <SelectItem value="Jawa Timur">Jawa Timur</SelectItem>
                  <SelectItem value="DKI Jakarta">DKI Jakarta</SelectItem>
                  <SelectItem value="Banten">Banten</SelectItem>
                  <SelectItem value="Sumatera Utara">Sumatera Utara</SelectItem>
                  <SelectItem value="Sumatera Barat">Sumatera Barat</SelectItem>
                  <SelectItem value="Bali">Bali</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={filters.verified ? 'default' : 'outline'}
                onClick={() => setFilters({ ...filters, verified: !filters.verified, page: 1 })}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verified
              </Button>
              <Button type="submit">Cari</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Tidak ada supplier</h3>
            <p className="text-gray-500">Coba ubah filter pencarian Anda</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {suppliers.map((supplier) => (
                <Link key={supplier.id} href={`/supplier/${supplier.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      {/* Logo */}
                      <div className="aspect-square relative bg-gray-100">
                        {supplier.logo ? (
                          <Image
                            src={supplier.logo}
                            alt={supplier.companyName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        {supplier.isVerified && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                          {supplier.companyName}
                        </h3>
                        
                        {supplier.bio && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {supplier.bio}
                          </p>
                        )}

                        {(supplier.city || supplier.province) && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">
                              {[supplier.city, supplier.province].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Package className="w-4 h-4" />
                            <span>{supplier._count.products} Produk</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <TrendingUp className="w-4 h-4" />
                            <span>{supplier.viewCount} Views</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-gray-600">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={filters.page === pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
