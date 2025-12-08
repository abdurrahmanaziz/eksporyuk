'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Factory, Search, MapPin, CheckCircle, TrendingUp, AlertCircle, Eye, Star } from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
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
  tags?: string
  isVerified: boolean
  rating: number
  totalDeals: number
  viewCount: number
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

const PRODUCT_CATEGORIES = [
  'Agriculture', 'Food & Beverage', 'Textiles & Apparel', 'Furniture & Handicraft',
  'Electronics', 'Automotive', 'Machinery', 'Chemical', 'Pharmaceutical',
  'Cosmetics', 'Jewelry', 'Leather & Footwear', 'Paper & Printing', 'Fishery & Marine',
  'Rubber & Plastic', 'Metal & Mining', 'Wood & Forestry', 'Other'
]

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProvince, setFilterProvince] = useState('all')
  const [filterProduct, setFilterProduct] = useState('all')
  const [filterBusinessType, setFilterBusinessType] = useState('all')
  const [quota, setQuota] = useState({ used: 0, total: 5, remaining: 5 })
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchSuppliers()
    }
  }, [status, router, page])

  useEffect(() => {
    if (status === 'authenticated') {
      const debounce = setTimeout(() => {
        setPage(1)
        fetchSuppliers()
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchTerm, filterProvince, filterProduct, filterBusinessType, status])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterProvince && filterProvince !== 'all') params.append('province', filterProvince)
      if (filterProduct && filterProduct !== 'all') params.append('productName', filterProduct)
      if (filterBusinessType && filterBusinessType !== 'all') params.append('businessType', filterBusinessType)
      params.append('page', page.toString())
      params.append('limit', '12')

      const res = await fetch(`/api/databases/suppliers?${params}`)
      const data = await res.json()
      
      setSuppliers(data.suppliers || [])
      setPagination(data.pagination || { total: 0, totalPages: 0 })
      setQuota(data.quota || { used: 0, total: 5, remaining: 5 })
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getQuotaColor = () => {
    const percentage = (quota.remaining / quota.total) * 100
    if (percentage <= 20) return 'text-red-600'
    if (percentage <= 50) return 'text-orange-600'
    return 'text-green-600'
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Database Supplier Lokal</h1>
        <p className="text-gray-600 mt-2">Direktori supplier dan produsen terverifikasi dari berbagai daerah di Indonesia</p>
      </div>

      {/* Quota Banner - Hide for Admin */}
      {session?.user?.role !== 'ADMIN' && (
      <Card className="mb-6 border-l-4 border-l-green-600">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Quota Viewing Bulan Ini</div>
                <div className="text-sm text-gray-600">
                  Anda telah melihat <span className="font-semibold">{quota.used}</span> dari <span className="font-semibold">{quota.total === 999999 ? 'Unlimited' : quota.total}</span> supplier detail
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getQuotaColor()}`}>
                {quota.total === 999999 ? '∞' : quota.remaining}
              </div>
              <div className="text-xs text-gray-500">Tersisa</div>
            </div>
          </div>
          {quota.remaining <= 5 && quota.total !== 999999 && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-orange-900">Quota hampir habis!</div>
                <div className="text-orange-700 mt-1">
                  Upgrade membership Anda untuk akses unlimited ke database supplier.{' '}
                  <Link href="/dashboard/upgrade" className="underline font-semibold">
                    Upgrade Sekarang
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Input
              placeholder="Filter by product..."
              value={filterProduct === 'all' ? '' : filterProduct}
              onChange={(e) => setFilterProduct(e.target.value || 'all')}
            />
            <Select value={filterBusinessType} onValueChange={setFilterBusinessType}>
              <SelectTrigger>
                <SelectValue placeholder="Business Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PRODUCT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Verified Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Provinces Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(suppliers.map(s => s.province)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {PRODUCT_CATEGORIES.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Factory className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{supplier.companyName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {supplier.isVerified && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {supplier.rating > 0 && (
                      <div className="flex items-center text-xs text-yellow-600">
                        <Star className="w-3 h-3 fill-current mr-1" />
                        {supplier.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                {supplier.city}, {supplier.province}
              </div>

              {supplier.products && (
                <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                  <div className="font-semibold text-gray-700 mb-1">Produk:</div>
                  <p className="line-clamp-2">{supplier.products}</p>
                </div>
              )}

              {supplier.businessType && (
                <Badge variant="outline" className="text-xs">
                  {supplier.businessType}
                </Badge>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {supplier.viewCount || 0}
                </div>
                {supplier.certifications && (
                  <Badge variant="outline" className="text-xs">Certified</Badge>
                )}
              </div>

              <Link href={`/databases/suppliers/${supplier.id}`}>
                <Button className="w-full mt-2">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {suppliers.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Factory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setFilterProvince('all')
              setFilterProduct('all')
              setFilterBusinessType('all')
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
