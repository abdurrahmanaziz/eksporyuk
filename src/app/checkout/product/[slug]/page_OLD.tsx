'use client'

import { Suspense, useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Check,
  Tag,
  Percent,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  Download,
  FileText,
  Zap,
  Package
} from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  thumbnail?: string
  category?: string
  tags?: string | string[]
  productType?: string
  isActive: boolean
  isFeatured: boolean
  downloadableFiles?: string
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
}

function ProductCheckoutContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const slugOrId = params?.slug as string // Can be either slug or ID for backward compatibility

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    whatsapp: '',
  })

  // Affiliate & Coupon
  const [affiliateCode, setAffiliateCode] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isCouponApplied, setIsCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  useEffect(() => {
    // Get affiliate & coupon from URL
    const ref = searchParams.get('ref') || searchParams.get('affiliate')
    const coupon = searchParams.get('coupon')
    
    if (ref) {
      setAffiliateCode(ref)
      // Track click
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      }).catch(err => console.error('Failed to track click:', err))
    }
    if (coupon) {
      setCouponCode(coupon)
    }
  }, [searchParams])

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        // Fetch by slug using the new API endpoint
        const response = await fetch(`/api/products/${slugOrId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()

        if (data.product) {
          // Normalize tags to array
          let tags = data.product.tags || []
          if (typeof tags === 'string') {
            try {
              tags = JSON.parse(tags)
            } catch (e) {
              console.error('Failed to parse tags:', e)
              tags = []
            }
          }
          if (!Array.isArray(tags)) tags = []

          const normalizedProduct = {
            ...data.product,
            tags
          }
          
          setProduct(normalizedProduct)
          
          // Auto-apply coupon if from URL
          if (couponCode && !isCouponApplied) {
            setTimeout(() => applyCoupon(couponCode), 500)
          }
        } else {
          setError('Produk tidak ditemukan')
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        setError('Gagal memuat produk')
      } finally {
        setIsLoading(false)
      }
    }

    if (slugOrId) {
      fetchProduct()
    }
  }, [slugOrId])

  // Update form when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
        phone: (session.user as any).phone || prev.phone,
        whatsapp: (session.user as any).whatsapp || prev.whatsapp,
      }))
    }
  }, [session])

  const applyCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponError('Masukkan kode kupon')
      return
    }

    setIsApplyingCoupon(true)
    setCouponError('')

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          productId: product?.id,
          type: 'PRODUCT'
        }),
      })

      const data = await response.json()

      if (data.success && data.coupon) {
        setIsCouponApplied(true)
        setCouponDiscount(data.discount || 0)
        setCouponError('')
        toast.success(`Kupon berhasil diterapkan! Hemat Rp ${(data.discount || 0).toLocaleString('id-ID')}`)
      } else {
        const errorMsg = data.error || 'Kupon tidak valid'
        setCouponError(errorMsg)
        setIsCouponApplied(false)
        setCouponDiscount(0)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      setCouponError('Gagal memvalidasi kupon')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleCheckout = async () => {
    // Validation
    if (!product) {
      toast.error('Produk tidak ditemukan')
      return
    }

    if (!formData.name || !formData.email) {
      toast.error('Nama dan email harus diisi')
      return
    }

    if (!session) {
      toast.error('Silakan login terlebih dahulu')
      router.push(`/auth/signin?callbackUrl=/checkout/product/${slugOrId}`)
      return
    }

    setIsProcessing(true)

    try {
      // Calculate final price
      const basePrice = product.price
      const finalPrice = Math.max(basePrice - couponDiscount, 0)

      const response = await fetch('/api/checkout/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          couponCode: isCouponApplied ? couponCode : undefined,
          finalPrice,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
        }),
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        toast.success('Redirect ke halaman pembayaran...')
        // Redirect to payment page
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.message || 'Checkout gagal')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Terjadi kesalahan saat checkout')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Produk tidak ditemukan'}</p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/products')}
            >
              Kembali ke Daftar Produk
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const basePrice = product?.price || 0
  const finalPrice = Math.max(basePrice - couponDiscount, 0)
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  // Parse tags and downloadable files
  const tags = Array.isArray(product.tags) ? product.tags : []
  let downloadableFiles: string[] = []
  if (product.downloadableFiles) {
    try {
      downloadableFiles = typeof product.downloadableFiles === 'string' 
        ? JSON.parse(product.downloadableFiles) 
        : product.downloadableFiles
    } catch (e) {
      console.error('Failed to parse downloadableFiles:', e)
    }
  }
  if (!Array.isArray(downloadableFiles)) downloadableFiles = []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {product.name}
                    </CardTitle>
                    {product.shortDescription && (
                      <CardDescription>{product.shortDescription}</CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {product.isFeatured && (
                      <Badge variant="default" className="bg-orange-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Thumbnail */}
                {product.thumbnail && (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden">
                    <Image
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Price Info */}
                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="flex items-baseline gap-2 mb-2">
                    {discount > 0 && product.originalPrice && (
                      <>
                        <span className="text-2xl font-bold line-through text-muted-foreground">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <Badge variant="destructive">{discount}% OFF</Badge>
                      </>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Deskripsi Produk
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Included */}
                {downloadableFiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Download className="w-5 h-5 text-primary" />
                      File yang Didapat
                    </h3>
                    <div className="space-y-2">
                      {downloadableFiles.map((file, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses Included */}
                {product.courses && product.courses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Kelas yang Termasuk
                    </h3>
                    <div className="space-y-2">
                      {product.courses.map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">{item.course.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Info */}
                {product.group && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Package className="w-5 h-5" />
                      <span className="font-semibold">
                        Akses ke Grup: {product.group.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informasi Pembeli
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      placeholder="Nama Anda"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="08123456789"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Coupon Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Punya Kode Kupon?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan kode kupon"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value)
                        setCouponError('')
                      }}
                      disabled={isCouponApplied}
                    />
                    <Button
                      variant="outline"
                      onClick={() => applyCoupon(couponCode)}
                      disabled={isApplyingCoupon || isCouponApplied || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCouponApplied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        'Terapkan'
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-destructive">{couponError}</p>
                  )}
                  {isCouponApplied && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Kupon berhasil diterapkan</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Produk</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Harga</span>
                      <span className="font-medium">{formatPrice(basePrice)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon Kupon</span>
                        <span>-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total Pembayaran</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(finalPrice)}
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Lanjut ke Pembayaran
                        </>
                      )}
                    </Button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span>Transaksi aman dan terenkripsi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Akses langsung setelah pembayaran</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Garansi uang kembali 30 hari</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Support 24/7 via WhatsApp</span>
                  </div>
                  {downloadableFiles.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Download className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{downloadableFiles.length} file dapat diunduh</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>}>
      <ProductCheckoutContent />
    </Suspense>
  )
}