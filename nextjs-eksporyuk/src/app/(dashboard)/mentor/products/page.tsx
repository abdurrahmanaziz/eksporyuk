'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ShoppingBag, 
  Plus, 
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface Product {
  id: string
  title: string
  description?: string
  price: number
  salePrice?: number
  thumbnail?: string
  type: 'COURSE' | 'DIGITAL' | 'PHYSICAL' | 'SERVICE'
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  salesCount: number
  revenue: number
  createdAt: string
}

export default function MentorProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'MENTOR' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchProducts()
    }
  }, [status, session, router])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      COURSE: 'bg-blue-100 text-blue-800',
      DIGITAL: 'bg-purple-100 text-purple-800',
      PHYSICAL: 'bg-green-100 text-green-800',
      SERVICE: 'bg-orange-100 text-orange-800',
    }
    const labels: Record<string, string> = {
      COURSE: 'Kursus',
      DIGITAL: 'Digital',
      PHYSICAL: 'Fisik',
      SERVICE: 'Jasa',
    }
    return <Badge className={colors[type]}>{labels[type] || type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'INACTIVE':
        return <Badge className="bg-red-100 text-red-800">Nonaktif</Badge>
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || prod.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0)

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produk Saya</h1>
            <p className="text-gray-600 mt-1">Kelola produk dan layanan yang Anda jual</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-gray-600">Total Produk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSales}</p>
                  <p className="text-sm text-gray-600">Terjual</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatPrice(totalRevenue)}</p>
                  <p className="text-sm text-gray-600">Total Pendapatan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.status === 'ACTIVE').length}
                  </p>
                  <p className="text-sm text-gray-600">Produk Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'COURSE', 'DIGITAL', 'PHYSICAL', 'SERVICE'].map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                onClick={() => setTypeFilter(type)}
                size="sm"
              >
                {type === 'all' ? 'Semua' : type === 'COURSE' ? 'Kursus' : type === 'DIGITAL' ? 'Digital' : type === 'PHYSICAL' ? 'Fisik' : 'Jasa'}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Produk
              </h3>
              <p className="text-gray-600 mb-4">
                Mulai jual produk atau layanan Anda
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow overflow-hidden">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeBadge(product.type)}
                    {getStatusBadge(product.status)}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.title}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      {product.salePrice ? (
                        <div>
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(product.salePrice)}
                          </span>
                          <span className="text-sm text-gray-400 line-through ml-2">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{product.salesCount} terjual</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Lihat
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
