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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  Crown,
  Sparkles,
  Calendar,
  Zap
} from 'lucide-react'
import Image from 'next/image'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface Membership {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  discountPrice: number | null
  durationType: string
  duration: number
  formLogo: string | null
  formBanner: string | null
  features: string[]
  benefits: string[]
  isBestSeller: boolean
  isMostPopular: boolean
  isActive: boolean
  trialDays: number | null
  autoRenewal: boolean
}

interface PriceOption {
  label: string
  price: number
  duration: string
  durationType: string
}

function MembershipCheckoutContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const slug = params?.slug as string

  const [membership, setMembership] = useState<Membership | null>(null)
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

  // Price option (for different durations if available)
  const [selectedPriceOption, setSelectedPriceOption] = useState<PriceOption | null>(null)

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

  // Fetch membership
  useEffect(() => {
    const fetchMembership = async () => {
      try {
        setIsLoading(true)
        
        // First check if this is an affiliate/free course
        try {
          const courseCheck = await fetch(`/api/courses?status=PUBLISHED`)
          if (courseCheck.ok) {
            const courseData = await courseCheck.json()
            const courses = courseData.courses || []
            const course = courses.find((c: any) => c.slug === slug)
            
            if (course) {
              // If course is affiliate-only or free, redirect to free enrollment
              if (course.affiliateOnly || course.isAffiliateTraining || course.isAffiliateMaterial || course.monetizationType === 'FREE') {
                // For affiliate users, enroll directly
                if (session?.user?.role === 'AFFILIATE' || session?.user?.role === 'ADMIN' || session?.user?.role === 'CO_FOUNDER' || session?.user?.role === 'FOUNDER') {
                  // Auto-enroll
                  const enrollResponse = await fetch(`/api/courses/${slug}/enroll-free`, {
                    method: 'POST',
                  })
                  
                  if (enrollResponse.ok) {
                    toast.success('Berhasil mendaftar kursus!')
                    router.push(`/courses/${slug}`)
                    return
                  } else {
                    const enrollError = await enrollResponse.json()
                    toast.error(enrollError.error || 'Gagal mendaftar kursus')
                  }
                } else {
                  // Non-affiliate trying to access affiliate course
                  toast.error('Kursus ini khusus untuk affiliate')
                  router.push('/affiliate/register')
                  return
                }
              }
            }
          }
        } catch (courseError) {
          console.error('Error checking course:', courseError)
          // Continue to membership checkout if course check fails
        }
        
        const response = await fetch(`/api/admin/membership-plans`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        // API returns { plans: [...] } format
        const data = result.plans || result || []

        if (!Array.isArray(data)) {
          setError('Format data tidak valid')
          return
        }

        const foundMembership = data.find((m: Membership) => m.slug === slug && m.isActive)

        if (foundMembership) {
          // Normalize features and benefits to arrays
          let features = foundMembership.features || [];
          let benefits = foundMembership.benefits || [];
          
          // Parse if string
          if (typeof features === 'string') {
            try {
              features = JSON.parse(features);
            } catch (e) {
              console.error('Failed to parse features:', e);
              features = [];
            }
          }
          
          if (typeof benefits === 'string') {
            try {
              benefits = JSON.parse(benefits);
            } catch (e) {
              console.error('Failed to parse benefits:', e);
              benefits = [];
            }
          }
          
          // Ensure arrays
          if (!Array.isArray(features)) features = [];
          if (!Array.isArray(benefits)) benefits = [];
          
          const normalizedMembership = {
            ...foundMembership,
            features,
            benefits
          };
          
          setMembership(normalizedMembership)
          
          // Set default price option
          const basePrice = foundMembership.discountPrice || foundMembership.price
          setSelectedPriceOption({
            label: getDurationLabel(foundMembership.durationType, foundMembership.duration),
            price: basePrice,
            duration: foundMembership.duration.toString(),
            durationType: foundMembership.durationType
          })
          
          // Auto-apply coupon if from URL
          if (couponCode && !isCouponApplied) {
            setTimeout(() => applyCoupon(couponCode), 500)
          }
        } else {
          setError('Paket membership tidak ditemukan')
        }
      } catch (error) {
        console.error('Error fetching membership:', error)
        setError('Gagal memuat paket membership')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug && session) {
      fetchMembership()
    }
  }, [slug, session, router])

  // Update form when session changes and fetch latest from API
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        // First set from session as fallback
        setFormData(prev => ({
          ...prev,
          name: session.user.name || prev.name,
          email: session.user.email || prev.email,
          phone: (session.user as any).phone || prev.phone,
          whatsapp: (session.user as any).whatsapp || prev.whatsapp,
        }))
        
        // Then fetch latest data from API profile
        try {
          const profileRes = await fetch('/api/user/profile')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            // API returns { user: {...} } without success field
            if (profileData.user) {
              console.log('[Checkout Course] Profile data loaded:', profileData.user.whatsapp)
              setFormData(prev => ({
                ...prev,
                name: profileData.user.name || prev.name,
                phone: profileData.user.phone || prev.phone,
                whatsapp: profileData.user.whatsapp || profileData.user.phone || prev.whatsapp,
              }))
            }
          }
        } catch (error) {
          console.error('[Checkout Course] Error fetching profile:', error)
        }
      }
    }
    
    loadUserData()
  }, [session])

  const getDurationLabel = (durationType: string, duration: number) => {
    if (durationType === 'LIFETIME') return 'Lifetime Access'
    if (durationType === 'MONTH') return `${duration} Bulan`
    if (durationType === 'YEAR') return `${duration} Tahun`
    return `${duration} Hari`
  }

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
          membershipId: membership?.id,
          type: 'MEMBERSHIP'
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
    if (!membership || !selectedPriceOption) {
      toast.error('Paket membership tidak ditemukan')
      return
    }

    if (!formData.name || !formData.email) {
      toast.error('Nama dan email harus diisi')
      return
    }

    if (!session) {
      toast.error('Silakan login terlebih dahulu')
      router.push(`/auth/signin?callbackUrl=/checkout/${slug}`)
      return
    }

    setIsProcessing(true)

    try {
      // Calculate final price
      const basePrice = selectedPriceOption.price
      const finalPrice = Math.max(basePrice - couponDiscount, 0)

      const response = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: membership.id,
          priceOption: selectedPriceOption,
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

  if (error || !membership) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Paket membership tidak ditemukan'}</p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/membership')}
            >
              Kembali ke Daftar Paket
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const basePrice = selectedPriceOption?.price || 0
  const finalPrice = Math.max(basePrice - couponDiscount, 0)
  const discount = membership.discountPrice 
    ? Math.round(((membership.price - membership.discountPrice) / membership.price) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Membership Details */}
          <div className="space-y-6">
            {/* Membership Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {membership.name}
                    </CardTitle>
                    {membership.description && (
                      <CardDescription>{membership.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {membership.isBestSeller && (
                      <Badge variant="default" className="bg-orange-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Best Seller
                      </Badge>
                    )}
                    {membership.isMostPopular && (
                      <Badge variant="default" className="bg-blue-500">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Banner */}
                {membership.formBanner && (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden">
                    <Image
                      src={membership.formBanner}
                      alt={membership.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Price Info */}
                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="flex items-baseline gap-2 mb-2">
                    {discount > 0 && (
                      <>
                        <span className="text-2xl font-bold line-through text-muted-foreground">
                          {formatPrice(membership.price)}
                        </span>
                        <Badge variant="destructive">{discount}% OFF</Badge>
                      </>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {formatPrice(membership.discountPrice || membership.price)}
                    </span>
                    <span className="text-muted-foreground">
                      / {getDurationLabel(membership.durationType, membership.duration)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                {membership.features && Array.isArray(membership.features) && membership.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Fitur yang Didapat
                    </h3>
                    <div className="space-y-2">
                      {membership.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {membership.benefits && Array.isArray(membership.benefits) && membership.benefits.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Keuntungan Tambahan
                    </h3>
                    <div className="space-y-2">
                      {membership.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trial Info */}
                {membership.trialDays && membership.trialDays > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">
                        Trial {membership.trialDays} hari gratis!
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
                      <span className="text-muted-foreground">Paket</span>
                      <span className="font-medium">{membership.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Durasi</span>
                      <span className="font-medium">
                        {getDurationLabel(membership.durationType, membership.duration)}
                      </span>
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

                    {/* Affiliate Partner Badge */}
                    <AffiliatePartnerBadge className="mt-4" />
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
                  {membership.autoRenewal && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Perpanjangan otomatis aktif</span>
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

export default function MembershipCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <MembershipCheckoutContent />
    </Suspense>
  )
}
