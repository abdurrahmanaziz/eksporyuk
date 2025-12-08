'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Heart, Package, TrendingUp, Calendar, Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  title: string
  slug: string
  description?: string
  images?: any
  category?: string
  price?: number
  minOrder?: string
  status: string
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
}

export default function ProductStatsPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const productId = params?.id as string

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProduct()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/supplier/products')
    }
  }, [status, productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/supplier/products/${productId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProduct(data.data)
      } else {
        toast.error('Produk tidak ditemukan')
        router.push('/supplier/products')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700'
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-700'
      case 'INACTIVE':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif'
      case 'DRAFT':
        return 'Draft'
      case 'PENDING_REVIEW':
        return 'Pending Review'
      case 'INACTIVE':
        return 'Tidak Aktif'
      default:
        return status
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!product) {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Produk Tidak Ditemukan</h3>
          <Link href="/supplier/products">
            <Button>Kembali ke Daftar Produk</Button>
          </Link>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href="/supplier/products" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Daftar Produk
            </Link>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Statistik dan performa produk</p>
          </div>
          <Link href={`/supplier/products/${product.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Produk
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-2xl font-bold">{product.viewCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Likes</p>
                  <p className="text-2xl font-bold">{product.likeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Engagement</p>
                  <p className="text-2xl font-bold">
                    {product.viewCount > 0 ? Math.round((product.likeCount / product.viewCount) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusColor(product.status)}>
                    {getStatusText(product.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Details */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detail Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Deskripsi</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {product.description || 'Tidak ada deskripsi'}
                  </p>
                </div>

                {product.category && (
                  <div>
                    <h3 className="font-semibold mb-2">Kategori</h3>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                )}

                {product.price && (
                  <div>
                    <h3 className="font-semibold mb-2">Harga</h3>
                    <p className="text-lg font-bold text-blue-600">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                )}

                {product.minOrder && (
                  <div>
                    <h3 className="font-semibold mb-2">Minimum Order</h3>
                    <p className="text-gray-700">{product.minOrder}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Dibuat: {new Date(product.createdAt).toLocaleDateString('id-ID')}
                  </div>
                  {product.updatedAt !== product.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Diupdate: {new Date(product.updatedAt).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Images Gallery */}
            {product.images && Array.isArray(product.images) && product.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Galeri Foto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images.map((image: string, index: number) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`${product.title} ${index + 1}`}
                          fill
                          className="object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/supplier/products/${product.id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Produk
                  </Button>
                </Link>
                <Link href={`/supplier/${product.slug}`} className="block" target="_blank">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat di Public
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips Meningkatkan Views</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Gunakan judul yang menarik dan deskriptif</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Upload foto produk berkualitas tinggi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Lengkapi deskripsi dengan detail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Update harga secara berkala</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Aktifkan status produk</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
