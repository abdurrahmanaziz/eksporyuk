'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Check,
  X,
  Clock,
  Users,
  Calendar,
  Package,
  Tag,
  Gift,
  Loader2,
  Star,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  discountPrice: number | null
  thumbnail: string | null
  category: string
  type: string
  status: string
  features: string[]
  stock: number | null
  maxParticipants: number | null
  salesPageUrl: string | null
  affiliateCommissionRate: number
  productCourses: Array<{
    course: {
      id: string
      title: string
      thumbnail: string | null
    }
  }>
}

export default function ProductCheckoutPage({ params }: { params: { slug: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  useEffect(() => {
    fetchProduct()
    
    // Check for affiliate/coupon in URL
    const urlParams = new URLSearchParams(window.location.search)
    const affiliate = urlParams.get('ref')
    const coupon = urlParams.get('coupon')
    
    if (affiliate) localStorage.setItem('affiliateRef', affiliate)
    if (coupon) {
      setCouponCode(coupon)
      applyCoupon(coupon)
    }
  }, [params.slug])

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        password: ''
      })
    }
  }, [session])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products?slug=${params.slug}`)
      const data = await response.json()
      
      if (data.success && data.products.length > 0) {
        setProduct(data.products[0])
      } else {
        alert('Produk tidak ditemukan')
        router.push('/products')
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      alert('Gagal memuat produk')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async (code: string) => {
    try {
      const response = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, productId: product?.id })
      })
      
      const data = await response.json()
      
      if (data.valid) {
        setAppliedCoupon(data.coupon)
        alert('Kupon berhasil diterapkan!')
      } else {
        alert(data.message || 'Kupon tidak valid')
      }
    } catch (error) {
      alert('Gagal memvalidasi kupon')
    }
  }

  const calculateFinalPrice = () => {
    if (!product) return 0
    
    let price = product.discountPrice || product.price
    
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        price = price * (1 - appliedCoupon.discountValue / 100)
      } else {
        price = price - appliedCoupon.discountValue
      }
    }
    
    return Math.max(0, price)
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user && (!formData.name || !formData.email || !formData.password)) {
      alert('Silakan lengkapi data registrasi')
      return
    }
    
    setSubmitting(true)
    
    try {
      // Register if new user
      if (!session?.user) {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: 'MEMBER_FREE'
          })
        })
        
        if (!registerResponse.ok) {
          throw new Error('Registrasi gagal')
        }
      }
      
      // Create transaction
      const affiliateRef = localStorage.getItem('affiliateRef')
      
      const transactionResponse = await fetch('/api/products/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          couponCode: appliedCoupon?.code,
          affiliateRef
        })
      })
      
      const transactionData = await transactionResponse.json()
      
      if (transactionData.success && transactionData.paymentUrl) {
        // Redirect to Xendit
        window.location.href = transactionData.paymentUrl
      } else {
        throw new Error(transactionData.error || 'Gagal membuat transaksi')
      }
      
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Produk Tidak Ditemukan</h1>
        <Button onClick={() => router.push('/products')}>Kembali ke Produk</Button>
      </div>
    )
  }

  const finalPrice = calculateFinalPrice()
  const discount = (product.discountPrice || product.price) - finalPrice

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Info - Left */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {product.thumbnail && (
                <div className="relative h-64 w-full">
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge variant="secondary">{product.type}</Badge>
                  {product.discountPrice && (
                    <Badge className="bg-red-500">
                      Diskon {Math.round((1 - product.discountPrice / product.price) * 100)}%
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700">{product.description}</p>
                </div>
                
                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Apa yang akan kamu dapatkan:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Courses */}
                {product.productCourses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Kursus yang termasuk:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.productCourses.map(({ course }) => (
                        <div key={course.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {course.thumbnail && (
                            <Image
                              src={course.thumbnail}
                              alt={course.title}
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                          )}
                          <p className="text-sm font-medium">{course.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.salesPageUrl && (
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => window.open(product.salesPageUrl!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Lihat Sales Page
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Checkout Form - Right */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckout} className="space-y-4">
                  {/* Price Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Harga Normal</span>
                      <span className={product.discountPrice ? "line-through text-gray-400" : "font-bold text-2xl"}>
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {product.discountPrice && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Harga Diskon</span>
                        <span className="font-bold text-2xl text-blue-600">
                          Rp {product.discountPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    
                    {appliedCoupon && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-green-600">Kupon ({appliedCoupon.code})</span>
                        <span className="text-green-600">
                          - Rp {discount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-semibold">Total Pembayaran</span>
                      <span className="font-bold text-2xl text-blue-600">
                        Rp {finalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Coupon Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kode Kupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyCoupon(couponCode)}
                      disabled={!!appliedCoupon || !couponCode}
                    >
                      Pakai
                    </Button>
                  </div>
                  
                  {/* User Form */}
                  {!session?.user ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          No. WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="08123456789"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Min. 6 karakter"
                          minLength={6}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-700 mb-1">Login sebagai:</p>
                      <p className="font-semibold">{session.user.name}</p>
                      <p className="text-sm text-gray-600">{session.user.email}</p>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Bayar Sekarang
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    Dengan melanjutkan, Anda menyetujui syarat & ketentuan kami
                  </p>
                  
                  {/* Affiliate Partner Badge */}
                  <AffiliatePartnerBadge className="mt-4" />
                </form>
              </CardContent>
            </Card>
            
            {/* Trust Badges */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Check className="w-5 h-5 text-green-600" />
                <span>Pembayaran Aman dengan Xendit</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Akses Langsung Setelah Pembayaran</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Garansi 30 Hari Uang Kembali</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
