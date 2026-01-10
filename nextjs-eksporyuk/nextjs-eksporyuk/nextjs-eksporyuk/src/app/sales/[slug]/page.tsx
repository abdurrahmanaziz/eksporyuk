'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle,
  Clock,
  Star,
  Users,
  ShieldCheck,
  Gift,
  CreditCard,
  Phone,
  Mail,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface SalesPageData {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  originalPrice: number
  currentPrice: number
  discount: number
  features: string[]
  testimonials: {
    name: string
    avatar: string
    rating: number
    comment: string
    position: string
  }[]
  bonuses: string[]
  urgency: {
    type: 'countdown' | 'limited' | 'none'
    endDate?: string
    remaining?: number
  }
  product?: {
    id: string
    name: string
    description: string
    price: number
    images: string[]
  }
  membership?: {
    id: string
    name: string
    duration: string
    price: number
    features: string[]
  }
  type: 'PRODUCT' | 'MEMBERSHIP'
  status: 'ACTIVE' | 'INACTIVE'
}

interface CustomerData {
  name: string
  email: string
  phone: string
  whatsapp: string
  notes: string
}

export default function SalesPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<SalesPageData | null>(null)
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    notes: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [finalPrice, setFinalPrice] = useState(0)
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Get affiliate code from URL
  const affiliateCode = searchParams.get('aff') || searchParams.get('ref') || ''

  // Set affiliate cookie when page loads with ref param
  useEffect(() => {
    if (affiliateCode && typeof window !== 'undefined') {
      // Set cookie for 30 days
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      document.cookie = `affiliate_ref=${affiliateCode}; path=/; expires=${expires.toUTCString()}`
      
      // Track click via API
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: affiliateCode }),
      }).catch(err => console.error('Failed to track click:', err))
    }
  }, [affiliateCode])

  useEffect(() => {
    fetchSalesPage()
  }, [slug])

  useEffect(() => {
    if (salesData) {
      setFinalPrice(salesData.currentPrice)
      
      // Setup countdown if needed
      if (salesData.urgency.type === 'countdown' && salesData.urgency.endDate) {
        const interval = setInterval(() => {
          const now = new Date().getTime()
          const end = new Date(salesData.urgency.endDate!).getTime()
          const distance = end - now

          if (distance > 0) {
            setTimeLeft({
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            })
          } else {
            setTimeLeft(null)
            clearInterval(interval)
          }
        }, 1000)

        return () => clearInterval(interval)
      }
    }
  }, [salesData])

  const fetchSalesPage = async () => {
    try {
      setLoading(true)
      
      // For now, use dummy data based on slug
      const dummyData: SalesPageData = {
        id: 'sales-' + slug,
        slug,
        title: slug === 'webinar-ekspor-nov-2025' ? 'Webinar Ekspor 28 November 2025' : 
               slug === 'membership-lifetime' ? 'Paket Ekspor Yuk Lifetime' :
               slug === 'membership-6-months' ? 'Paket Ekspor Yuk 6 Bulan' :
               'Premium Export Package',
        subtitle: slug === 'webinar-ekspor-nov-2025' ? 'Belajar Ekspor dari Nol hingga Mahir' :
                  'Akses Lengkap ke Komunitas & Materi Ekspor',
        description: `Bergabunglah dengan ribuan eksportir sukses dan dapatkan akses ke:
        
• Materi lengkap ekspor dari A-Z
• Komunitas eksportir aktif 24/7  
• Mentoring langsung dengan expert
• Template dokumen ekspor
• Update reguler tentang peluang ekspor
• Networking dengan buyer internasional`,
        originalPrice: slug === 'webinar-ekspor-nov-2025' ? 50000 : 
                      slug === 'membership-lifetime' ? 1299000 : 
                      slug === 'membership-6-months' ? 799000 : 999000,
        currentPrice: slug === 'webinar-ekspor-nov-2025' ? 35000 : 
                     slug === 'membership-lifetime' ? 999000 : 
                     slug === 'membership-6-months' ? 699000 : 799000,
        discount: slug === 'webinar-ekspor-nov-2025' ? 30 : 23,
        features: [
          'Akses seumur hidup ke semua materi',
          'Group WhatsApp eksklusif',
          'Live mentoring mingguan',
          'Template dokumen ekspor',
          'Database buyer internasional',
          'Sertifikat completion',
          'Update materi terbaru',
          'Support 24/7'
        ],
        testimonials: [
          {
            name: 'Deni Sutandi',
            avatar: '/avatars/deni.jpg',
            rating: 5,
            comment: 'Berkat program ini, ekspor saya meningkat 300% dalam 6 bulan!',
            position: 'Eksportir Furniture'
          },
          {
            name: 'Yoga Andrian', 
            avatar: '/avatars/yoga.jpg',
            rating: 5,
            comment: 'Materi sangat lengkap dan mentor sangat responsif.',
            position: 'Eksportir Handicraft'
          },
          {
            name: 'Supyanto',
            avatar: '/avatars/supyanto.jpg',
            rating: 5,
            comment: 'Investasi terbaik untuk bisnis ekspor saya!',
            position: 'Eksportir Food & Beverage'
          }
        ],
        bonuses: [
          'E-book "101 Peluang Ekspor Terbaru"',
          'Template Email untuk Buyer',
          'Checklist Quality Control',
          'Video Tutorial Packaging Export',
          'Konsultasi 1-on-1 dengan Expert'
        ],
        urgency: {
          type: 'countdown',
          endDate: '2025-11-30T23:59:59',
        },
        type: slug.includes('membership') ? 'MEMBERSHIP' : slug.includes('webinar') ? 'MEMBERSHIP' : 'PRODUCT',
        status: 'ACTIVE',
        membership: slug.includes('membership') || slug.includes('webinar') ? {
          id: 'mem-' + slug,
          name: slug === 'webinar-ekspor-nov-2025' ? 'Webinar Ekspor 28 November 2025' : 
                slug === 'membership-lifetime' ? 'Paket Ekspor Yuk Lifetime' :
                'Paket Ekspor Yuk 6 Bulan',
          duration: slug === 'membership-lifetime' ? 'LIFETIME' : 
                   slug === 'membership-6-months' ? 'SIX_MONTHS' : 
                   'ONE_MONTH',
          price: slug === 'webinar-ekspor-nov-2025' ? 35000 : 
                slug === 'membership-lifetime' ? 999000 : 699000,
          features: [
            'Akses ke semua materi pembelajaran',
            'Group WhatsApp eksklusif',
            'Live mentoring',
            'Template dan tools'
          ]
        } : undefined,
        product: !slug.includes('membership') && !slug.includes('webinar') ? {
          id: 'prod-' + slug,
          name: 'Premium Export Package',
          description: 'Paket lengkap untuk eksportir',
          price: 799000,
          images: ['/products/export-package.jpg']
        } : undefined
      }
      
      setSalesData(dummyData)
    } catch (error) {
      console.error('Error fetching sales page:', error)
      toast.error('Gagal memuat halaman sales')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode || !salesData) return

    try {
      // Simulate coupon validation
      if (couponCode === 'DISCOUNT10') {
        const discount = salesData.currentPrice * 0.1
        setAppliedCoupon({
          code: couponCode,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          discountAmount: discount
        })
        setFinalPrice(salesData.currentPrice - discount)
        toast.success('Kupon berhasil diterapkan!')
      } else {
        toast.error('Kode kupon tidak valid')
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      toast.error('Gagal menerapkan kupon')
    }
  }

  const handleCheckout = async () => {
    if (!salesData || !customerData.name || !customerData.email) {
      toast.error('Mohon lengkapi data pembeli')
      return
    }

    try {
      setSubmitting(true)

      const orderData = {
        type: salesData.type,
        productId: salesData.product?.id,
        membershipId: salesData.membership?.id,
        amount: finalPrice,
        customerData,
        couponCode: appliedCoupon?.code,
        affiliateCode,
        salesPageId: salesData.id,
        notes: customerData.notes
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to payment page or show payment instructions
        router.push(`/payment/va/${result.transactionId}?redirect_url=${window.location.origin}/checkout/success`)
      } else {
        throw new Error(result.error || 'Checkout failed')
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      toast.error('Gagal memproses checkout')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat halaman...</p>
        </div>
      </div>
    )
  }

  if (!salesData || salesData.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-6">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Halaman Tidak Tersedia</h2>
            <p className="text-gray-600 mb-4">
              Maaf, halaman sales yang Anda cari tidak tersedia atau sudah berakhir.
            </p>
            <Button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-600">
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-ekspor-yuk.png" 
              alt="Ekspor Yuk" 
              className="h-8"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
              }}
            />
            <span className="font-bold text-orange-500">Ekspor Yuk</span>
          </div>
          
          {timeLeft && (
            <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-lg">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-semibold text-sm">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Badge className="mb-3 bg-red-100 text-red-600">
                    🔥 PENAWARAN TERBATAS
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    {salesData.title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-4">
                    {salesData.subtitle}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl text-gray-400 line-through">
                        Rp {salesData.originalPrice.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-gray-500">Harga Normal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-orange-500">
                        Rp {salesData.currentPrice.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded">
                        Hemat {salesData.discount}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Apa yang Akan Anda Dapatkan?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-gray-700 mb-6">
                  {salesData.description}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {salesData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bonuses */}
            {salesData.bonuses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-500" />
                    Bonus Eksklusif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesData.bonuses.map((bonus, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Gift className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">{bonus}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Testimoni Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{testimonial.name}</p>
                            <div className="flex">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{testimonial.comment}</p>
                          <p className="text-xs text-gray-500">{testimonial.position}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    Form Pemesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Data Form */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nama Lengkap*
                      </Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                        placeholder="Masukkan nama lengkap"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email*
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                        placeholder="email@example.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        No. Telepon*
                      </Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                        placeholder="08xxxxxxxxxx"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp (Opsional)</Label>
                      <Input
                        id="whatsapp"
                        value={customerData.whatsapp}
                        onChange={(e) => setCustomerData({...customerData, whatsapp: e.target.value})}
                        placeholder="08xxxxxxxxxx"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Catatan (Opsional)</Label>
                      <Textarea
                        id="notes"
                        value={customerData.notes}
                        onChange={(e) => setCustomerData({...customerData, notes: e.target.value})}
                        placeholder="Catatan tambahan..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="border-t pt-4">
                    <Label>Kode Kupon (Opsional)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="DISCOUNT10"
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={!couponCode}
                      >
                        Terapkan
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Kupon {appliedCoupon.code} diterapkan (-Rp {appliedCoupon.discountAmount.toLocaleString('id-ID')})
                      </p>
                    )}
                  </div>

                  {/* Affiliate Info */}
                  {affiliateCode && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-600">
                        <strong>Referral:</strong> {affiliateCode}
                      </p>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Harga Produk:</span>
                      <span>Rp {salesData.currentPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon Kupon:</span>
                        <span>-Rp {appliedCoupon.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-orange-500">Rp {finalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={submitting || !customerData.name || !customerData.email}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Pesan Sekarang - Rp {finalPrice.toLocaleString('id-ID')}
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Pembayaran aman & terpercaya
                    </p>
                  </div>

                  {/* Affiliate Partner Badge */}
                  <AffiliatePartnerBadge className="mt-2" />
                </CardContent>
              </Card>

              {/* Urgency */}
              {timeLeft && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6 text-center">
                    <p className="text-red-600 font-semibold mb-2">
                      ⏰ Penawaran berakhir dalam:
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-red-600 text-white p-2 rounded">
                        <p className="font-bold">{timeLeft.days}</p>
                        <p className="text-xs">Hari</p>
                      </div>
                      <div className="bg-red-600 text-white p-2 rounded">
                        <p className="font-bold">{timeLeft.hours}</p>
                        <p className="text-xs">Jam</p>
                      </div>
                      <div className="bg-red-600 text-white p-2 rounded">
                        <p className="font-bold">{timeLeft.minutes}</p>
                        <p className="text-xs">Menit</p>
                      </div>
                      <div className="bg-red-600 text-white p-2 rounded">
                        <p className="font-bold">{timeLeft.seconds}</p>
                        <p className="text-xs">Detik</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="mb-4">© 2025 CV. Ekspor Yuk Indonesia. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            Terpercaya oleh ribuan eksportir di seluruh Indonesia
          </p>
        </div>
      </footer>
    </div>
  )
}