'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Users,
  CheckCircle,
  Clock,
  Download,
  Share2,
  Heart,
  Gift,
  Lock,
  Unlock,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  FileText,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Helper function to safely parse JSON
function safeParseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  thumbnail?: string
  productType: string
  productStatus: string
  accessLevel: string
  isActive: boolean
  isFeatured: boolean
  soldCount: number
  createdAt: string
  updatedAt: string
  group?: {
    id: string
    name: string
  }
  courses?: Array<{
    course: {
      id: string
      title: string
      slug: string
    }
  }>
  downloadableFiles?: string
  tags?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userProducts, setUserProducts] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        // Fetch product by slug
        const response = await fetch(`/api/products/${slug}`)
        if (response.ok) {
          const data = await response.json()
          const fetchedProduct = data.product || data
          
          // Redirect EVENT type to /events/[slug]
          if (fetchedProduct.productType === 'EVENT') {
            router.replace(`/events/${fetchedProduct.slug}`)
            return
          }
          
          setProduct(fetchedProduct)
        } else {
          toast.error('Produk tidak ditemukan')
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Gagal memuat produk')
      } finally {
        setLoading(false)
      }
    }

    const fetchUserProducts = async () => {
      try {
        const response = await fetch('/api/user/products')
        if (response.ok) {
          const data = await response.json()
          const productIds = data.products?.map((p: any) => p.id) || []
          setUserProducts(productIds)
        }
      } catch (error) {
        console.error('Error fetching user products:', error)
      }
    }

    fetchProduct()
    fetchUserProducts()
  }, [slug])

  useEffect(() => {
    if (product && userProducts.length > 0) {
      setHasAccess(userProducts.includes(product.id))
    }
  }, [product, userProducts])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-lg bg-white/10 mb-4">
            <div className="animate-spin">
              <Zap className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <p className="text-white">Memuat produk...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 mb-8">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-white mb-4">Produk Tidak Ditemukan</h1>
            <p className="text-gray-300 mb-6">Produk yang Anda cari tidak tersedia</p>
            <Button asChild>
              <Link href="/products">Lihat Semua Produk</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const downloadableFilesList = product.downloadableFiles
    ? typeof product.downloadableFiles === 'string'
      ? safeParseJSON(product.downloadableFiles, [])
      : product.downloadableFiles
    : []

  const tags = product.tags
    ? typeof product.tags === 'string'
      ? (product.tags.startsWith('[') ? safeParseJSON(product.tags, []) : product.tags.split(',').map((t: string) => t.trim()).filter(Boolean))
      : product.tags
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <Button variant="ghost" asChild className="text-white hover:bg-white/10 mb-8">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Produk
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Image & Details */}
          <div className="lg:col-span-2">
            {/* Product Image */}
            <Card className="overflow-hidden border-0 shadow-2xl mb-6">
              <div className="relative w-full aspect-video bg-slate-700">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-16 w-16 text-slate-500" />
                  </div>
                )}
                {product.isFeatured && (
                  <Badge className="absolute top-4 right-4 bg-yellow-500 text-black">
                    Featured
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                    -{discount}%
                  </Badge>
                )}
              </div>
            </Card>

            {/* Product Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{product.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {product.productType === 'DIGITAL'
                        ? '📱 Produk Digital'
                        : product.productType === 'EVENT'
                          ? '🎉 Event'
                          : product.productType === 'PHYSICAL'
                            ? '📦 Produk Fisik'
                            : 'Produk'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="text-red-500"
                  >
                    <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {product.soldCount > 0 && (
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4" />
                      {product.soldCount} terjual
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(product.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <h3 className="font-semibold mb-2">Deskripsi</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </div>

                {/* Group Info */}
                {product.group && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Akses Grup</h3>
                    <Card className="border-0 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Unlock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">{product.group.name}</p>
                            <p className="text-sm text-blue-700">
                              Dapatkan akses eksklusif ke grup ini
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Courses */}
                {product.courses && product.courses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Kelas Terpilih</h3>
                    <div className="space-y-2">
                      {product.courses.map((pc) => (
                        <Link
                          key={pc.course.id}
                          href={`/courses/${pc.course.slug}`}
                          className="block p-3 border rounded-lg hover:bg-slate-50 transition"
                        >
                          <p className="font-medium text-sm">{pc.course.title}</p>
                          <p className="text-xs text-gray-500">Klik untuk melihat detail</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {downloadableFilesList.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">File yang Tersedia</h3>
                    <div className="space-y-2">
                      {downloadableFilesList.map((file: any, i: number) => (
                        <a
                          key={i}
                          href={file.url || '#'}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.size || 'Unknown'}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {hasAccess ? 'Buka' : 'Terkunci'}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <Card className="border-0 shadow-2xl sticky top-6">
              <CardContent className="p-6">
                {/* Price */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">Harga</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-slate-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        Rp {product.originalPrice.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Access Status */}
                {hasAccess ? (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Anda sudah memiliki akses</span>
                    </div>
                  </div>
                ) : null}

                {/* Buttons */}
                <div className="space-y-3 mb-6">
                  {hasAccess ? (
                    <>
                      <Button className="w-full" size="lg" asChild>
                        <Link href={`/member/products/${product.id}`}>
                          <Unlock className="h-4 w-4 mr-2" />
                          Akses Sekarang
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full" size="lg" asChild>
                        <Link href={`/checkout/product/${product.slug}`}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Beli Sekarang
                        </Link>
                      </Button>
                    </>
                  )}

                  <Button variant="outline" className="w-full" size="lg">
                    <Share2 className="h-4 w-4 mr-2" />
                    Bagikan
                  </Button>
                </div>

                <Separator className="my-6" />

                {/* Features */}
                <div className="space-y-3">
                  {product.accessLevel === 'PRIVATE' ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Akses Terbatas</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Unlock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Akses Publik</span>
                    </div>
                  )}

                  {product.productStatus === 'PUBLISHED' && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Produk Aktif</span>
                    </div>
                  )}

                  {product.group && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Grup Komunitas</span>
                    </div>
                  )}

                  {product.courses && product.courses.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {product.courses.length} Kelas Included
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
