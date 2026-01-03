'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, Loader2, Package, Shield, Download, CreditCard, Wallet, Building, FileText, Zap, ChevronDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useCheckoutColors } from '@/hooks/useCheckoutColors'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'
import { EventQuotaBar, EventQuotaBarSkeleton } from '@/components/modules/events/EventQuotaBar'
import { QuotaAlertBox } from '@/components/modules/events/QuotaAlertBox'

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

export default function ProductCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const slugOrId = params?.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [registrationCount, setRegistrationCount] = useState(0)
  const [paidCount, setPaidCount] = useState(0)
  const [loadingQuota, setLoadingQuota] = useState(false)

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'paylater' | 'manual'>('bank_transfer')
  const [paymentChannel, setPaymentChannel] = useState<string>('BCA')
  
  // Payment logos from admin settings
  const [paymentLogos, setPaymentLogos] = useState<{ [key: string]: string }>({})
  const [activeChannels, setActiveChannels] = useState<{ [key: string]: boolean }>({})
  const [manualBankAccounts, setManualBankAccounts] = useState<any[]>([])
  const [enableManualBank, setEnableManualBank] = useState(false)
  
  // Collapsible sections state
  const [expandedSection, setExpandedSection] = useState<string>('bank_transfer')
  
  // Checkout colors
  const { colors, computed } = useCheckoutColors()

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Registration form for non-logged-in users
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: ''
  })

  // Fetch payment logos and manual banks
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await fetch('/api/payment-logos')
        if (response.ok) {
          const data = await response.json()
          if (data.logos) {
            setPaymentLogos(data.logos)
          }
          if (data.activeChannels) {
            setActiveChannels(data.activeChannels)
          }
        }

        // Fetch manual bank accounts
        const methodsResponse = await fetch('/api/payment-methods')
        if (methodsResponse.ok) {
          const methodsData = await methodsResponse.json()
          if (methodsData.success) {
            setManualBankAccounts(methodsData.data.manual.bankAccounts || [])
            setEnableManualBank(methodsData.data.manual.enabled || false)
          }
        }
      } catch (error) {
        console.error('Error fetching payment data:', error)
      }
    }
    fetchPaymentData()
  }, [])

  // Helper function to check if payment method has active channels
  const hasActiveChannels = (method: 'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'paylater') => {
    if (method === 'bank_transfer') {
      return ['BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'CIMB'].some(bank => activeChannels[bank] !== false)
    } else if (method === 'ewallet') {
      return ['OVO', 'DANA', 'GOPAY', 'LINKAJA'].some(wallet => activeChannels[wallet] !== false)
    } else if (method === 'qris') {
      return activeChannels['QRIS'] !== false
    } else if (method === 'retail') {
      return ['ALFAMART', 'INDOMARET'].some(retail => activeChannels[retail] !== false)
    } else if (method === 'paylater') {
      return ['KREDIVO', 'AKULAKU'].some(paylater => activeChannels[paylater] !== false)
    }
    return true
  }

  // Load user data from session and fetch latest from API
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        // First set from session as fallback
        setRegisterData({
          name: session.user.name || '',
          email: session.user.email || '',
          phone: (session.user as any).phone || '',
          whatsapp: (session.user as any).whatsapp || (session.user as any).phone || '',
          password: ''
        })
        
        // Then fetch latest data from API profile to get updated whatsapp
        try {
          const profileRes = await fetch('/api/user/profile')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            // API returns { user: {...} } without success field
            if (profileData.user) {
              console.log('[Checkout Product] Profile data loaded:', profileData.user.whatsapp)
              setRegisterData(prev => ({
                ...prev,
                name: profileData.user.name || prev.name,
                phone: profileData.user.phone || prev.phone,
                whatsapp: profileData.user.whatsapp || profileData.user.phone || prev.whatsapp,
              }))
            }
          }
        } catch (error) {
          console.error('[Checkout Product] Error fetching profile:', error)
        }
      }
    }
    
    loadUserData()
  }, [session])

  const registrationFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProduct()
  }, [slugOrId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${slugOrId}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Normalize tags
        let tags = data.product.tags || []
        if (typeof tags === 'string') {
          try {
            tags = JSON.parse(tags)
          } catch (e) {
            tags = []
          }
        }
        if (!Array.isArray(tags)) tags = []

        setProduct({ ...data.product, tags })

        // Fetch registration count if this is an event
        if (data.product.productType === 'EVENT' && data.product.maxParticipants) {
          fetchQuotaCount(data.product.id)
        }
      } else {
        toast.error('Produk tidak ditemukan')
        router.push('/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuotaCount = async (productId: string) => {
    try {
      setLoadingQuota(true)
      const response = await fetch(`/api/products/${productId}/registration-count`)
      
      if (response.ok) {
        const data = await response.json()
        setPaidCount(data.paidCount || 0)
        setRegistrationCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching quota count:', error)
    } finally {
      setLoadingQuota(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginData.email || !loginData.password) {
      toast.error('Email dan password harus diisi')
      return
    }

    setIsLoggingIn(true)
    try {
      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Email atau password salah')
      } else if (result?.ok) {
        toast.success('Login berhasil!')
        setShowLoginModal(false)
        setLoginData({ email: '', password: '' })
        window.location.reload()
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Terjadi kesalahan saat login')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const currentUrl = window.location.href
      await signIn('google', { 
        callbackUrl: currentUrl,
        redirect: true 
      })
    } catch (error) {
      console.error('Google login error:', error)
      toast.error('Gagal login dengan Google')
    }
  }

  const applyCoupon = async (code?: string) => {
    const coupon = code || couponCode
    if (!coupon.trim()) {
      toast.error('Masukkan kode kupon')
      return
    }

    setCheckingCoupon(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: coupon, 
          productId: product?.id,
          type: 'PRODUCT'
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setAppliedCoupon(data.coupon)
        toast.success('Kupon berhasil diterapkan!')
      } else {
        toast.error(data.error || 'Kupon tidak valid')
      }
    } catch (error) {
      toast.error('Gagal memvalidasi kupon')
    } finally {
      setCheckingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    toast.info('Kupon dihapus')
  }

  const calculateFinalPrice = () => {
    if (!product) return 0
    
    let price = product.price
    
    // Apply coupon discount
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        price = price - (price * appliedCoupon.discountValue / 100)
      } else {
        price = price - appliedCoupon.discountValue
      }
    }
    
    return Math.max(price, 0)
  }

  const scrollToRegistrationForm = () => {
    setShowLoginModal(false)
    setTimeout(() => {
      registrationFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
      registrationFormRef.current?.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2')
      setTimeout(() => {
        registrationFormRef.current?.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2')
      }, 2000)
    }, 100)
  }

  const handleRegisterAndCheckout = async () => {
    if (!registerData.name || !registerData.email || !registerData.phone || !registerData.password) {
      toast.error('Lengkapi semua data registrasi')
      return
    }

    if (!product) {
      toast.error('Produk tidak ditemukan')
      return
    }

    // Validate Gmail email
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
    if (!gmailRegex.test(registerData.email)) {
      toast.error('Email harus menggunakan Gmail (@gmail.com)')
      return
    }

    setProcessing(true)

    try {
      // Register first
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password
        })
      })

      const registerResult = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerResult.message || 'Gagal mendaftar')
      }

      // Auto login after registration
      const loginResult = await signIn('credentials', {
        email: registerData.email,
        password: registerData.password,
        redirect: false
      })

      if (loginResult?.error) {
        throw new Error('Berhasil mendaftar tapi gagal login otomatis')
      }

      // Proceed to checkout
      await processCheckout()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
      setProcessing(false)
    }
  }

  const processCheckout = async () => {
    if (!product) {
      toast.error('Produk tidak ditemukan')
      return
    }

    if (!session) {
      toast.error('Silakan login terlebih dahulu')
      return
    }

    if (!registerData.name || !registerData.email || !registerData.whatsapp) {
      toast.error('Nama, email, dan WhatsApp harus diisi')
      return
    }

    setProcessing(true)

    try {
      const finalPrice = calculateFinalPrice()

      const requestBody = {
        productId: product.id,
        productSlug: product.slug,
        couponCode: appliedCoupon?.code || undefined,
        finalPrice,
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone || registerData.whatsapp,
        whatsapp: registerData.whatsapp,
        paymentMethod: paymentMethod, // 'bank_transfer', 'ewallet', 'qris'
        paymentChannel: paymentChannel // 'BCA', 'MANDIRI', 'OVO', 'DANA', etc
      }

      console.log('[Product Checkout] Request:', requestBody)

      const response = await fetch('/api/checkout/product-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('[Product Checkout] Response status:', response.status)
      
      const data = await response.json()
      console.log('[Product Checkout] Response data:', data)

      if (data.success && data.paymentUrl) {
        toast.success('Redirect ke halaman pembayaran...')
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.message || data.error || 'Checkout gagal')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Terjadi kesalahan saat checkout')
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const discount = product?.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  // Parse tags and downloadable files
  const tags = Array.isArray(product?.tags) ? product.tags : []
  let downloadableFiles: string[] = []
  if (product?.downloadableFiles) {
    try {
      downloadableFiles = typeof product.downloadableFiles === 'string' 
        ? JSON.parse(product.downloadableFiles) 
        : product.downloadableFiles
    } catch (e) {
      console.error('Failed to parse downloadableFiles:', e)
    }
  }
  if (!Array.isArray(downloadableFiles)) downloadableFiles = []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Memuat data produk...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Produk Tidak Ditemukan</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/products')} className="w-full">
              Kembali ke Daftar Produk
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{product.name}</p>
        </div>

        {/* POSITION 1: Quota Alert - TOP (Eye-catching) */}
        {product.productType === 'EVENT' && product.maxParticipants && (
          <div className="mb-6">
            {loadingQuota ? (
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
            ) : (
              <QuotaAlertBox
                maxParticipants={product.maxParticipants}
                paidCount={paidCount}
                eventName={product.name}
                variant="top"
              />
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* 1. User Data / Registration */}
          <Card ref={registrationFormRef}>
            <CardHeader>
              <CardTitle>
                {status === 'authenticated' ? 'Data Akun Anda' : 'Isi Data Diri'}
              </CardTitle>
              <CardDescription>
                {status === 'authenticated' 
                  ? 'Data Anda akan digunakan untuk proses checkout' 
                  : 'Coba GRATIS dulu dengan daftar sekarang!'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'authenticated' ? (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                    <Check className="h-5 w-5" />
                    Data Akun Anda
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Nama:</span>{' '}
                      <span className="font-medium">{registerData.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                      <span className="font-medium">{registerData.email}</span>
                    </div>
                    {registerData.whatsapp && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">WhatsApp:</span>{' '}
                        <span className="font-medium">{registerData.whatsapp}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="link" 
                    onClick={() => router.push('/profile')} 
                    className="p-0 h-auto text-orange-500 hover:text-orange-600"
                  >
                    Ganti Akun
                  </Button>
                </div>
              ) : (
                <>
                  {/* Registration Form for Non-Authenticated Users */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        placeholder="Nama lengkap Anda"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email (Gmail) *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="email@gmail.com"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Nomor Telepon *</Label>
                      <Input
                        id="phone"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp *</Label>
                      <Input
                        id="whatsapp"
                        value={registerData.whatsapp}
                        onChange={(e) => setRegisterData({ ...registerData, whatsapp: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="h-11"
                      />
                    </div>

                    {/* Register Button */}
                    <Button 
                      onClick={handleRegisterAndCheckout}
                      disabled={processing || !registerData.name || !registerData.email || !registerData.phone || !registerData.password}
                      className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base mt-4"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Mendaftar...
                        </>
                      ) : (
                        'Daftar & Lanjutkan'
                      )}
                    </Button>

                    <p className="text-sm text-gray-600 text-center">
                      Sudah punya akun?{' '}
                      <Button 
                        variant="link" 
                        onClick={() => setShowLoginModal(true)} 
                        className="p-0 h-auto text-orange-500 hover:text-orange-600 font-semibold"
                      >
                        Login di sini
                      </Button>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Product Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detail Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.thumbnail && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden">
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div>
                <h3 className="font-bold text-xl">{product.name}</h3>
                {product.shortDescription && (
                  <p className="text-sm text-gray-600 mt-1">{product.shortDescription}</p>
                )}
              </div>

              {/* Price */}
              <div className="bg-primary/5 p-4 rounded-lg">
                {discount > 0 && product.originalPrice && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl line-through text-muted-foreground">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <Badge variant="destructive">{discount}% OFF</Badge>
                  </div>
                )}
                <div className="text-3xl font-bold">
                  {formatCurrency(product.price)}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Deskripsi
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Downloadable Files */}
              {downloadableFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    File yang Didapat
                  </h4>
                  <div className="space-y-1">
                    {downloadableFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {product.courses && product.courses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Kelas yang Termasuk
                  </h4>
                  <div className="space-y-1">
                    {product.courses.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{item.course.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coupon */}
          <Card>
            <CardHeader>
              <CardTitle>Punya Kupon?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Diskon {appliedCoupon.discountType === 'PERCENTAGE' 
                        ? `${appliedCoupon.discountValue}%` 
                        : formatCurrency(appliedCoupon.discountValue)}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={removeCoupon}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                  >
                    Hapus
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Kode kupon"
                    className="h-11"
                  />
                  <Button 
                    onClick={() => applyCoupon()} 
                    disabled={checkingCoupon}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6"
                  >
                    {checkingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terapkan'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Produk</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Harga</span>
                <span className="font-medium">{formatCurrency(product.price)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Potongan Kupon</span>
                  <span>
                    -{appliedCoupon.discountType === 'PERCENTAGE' 
                      ? `${appliedCoupon.discountValue}%` 
                      : formatCurrency(appliedCoupon.discountValue)}
                  </span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(calculateFinalPrice())}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method - Only show if authenticated */}
          {status === 'authenticated' && (
            <Card 
              className="border-2 shadow-lg"
              style={{ borderColor: computed.primary }}
            >
              <CardHeader 
                className="bg-gradient-to-r"
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${computed.primaryLight}, ${computed.accent})` 
                }}
              >
                <CardTitle 
                  className="text-lg flex items-center gap-2"
                  style={{ color: computed.primary }}
                >
                  <CreditCard className="h-5 w-5" />
                  Pilih Metode Pembayaran
                </CardTitle>
                <CardDescription style={{ color: computed.primary, opacity: 0.8 }}>
                  Pilih metode pembayaran yang Anda inginkan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Transfer Bank Manual Section */}
                {enableManualBank && manualBankAccounts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'manual') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('manual')
                          setPaymentMethod('manual')
                          setPaymentChannel(manualBankAccounts[0]?.bankCode || 'MANUAL')
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">Transfer Bank</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'manual' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'manual' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-start gap-2 mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <span className="font-semibold">Aktivasi Manual</span>, Gratis Fee Merchant
                          </p>
                        </div>
                        <div className="space-y-2">
                          {manualBankAccounts.filter(acc => acc.isActive).map((account) => (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => setPaymentChannel(account.bankCode)}
                              className="relative w-full p-4 rounded-lg border-2 transition-all hover:shadow-md text-left"
                              style={{
                                borderColor: paymentChannel === account.bankCode ? computed.primary : '#e5e7eb',
                                backgroundColor: paymentChannel === account.bankCode ? computed.primaryBg : 'transparent',
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-16 w-16 flex items-center justify-center bg-white rounded-lg flex-shrink-0 border">
                                  {account.logo ? (
                                    <img 
                                      src={account.logo}
                                      alt={account.bankName}
                                      className="max-h-full max-w-full object-contain p-1"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <Building className="h-8 w-8 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">{account.bankName}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{account.accountNumber}</p>
                                  <p className="text-sm text-gray-500">a.n. {account.accountName}</p>
                                </div>
                              </div>
                              {paymentChannel === account.bankCode && (
                                <div 
                                  className="absolute top-3 right-3 rounded-full p-1"
                                  style={{ backgroundColor: computed.primary }}
                                >
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Virtual Account Section */}
                {hasActiveChannels('bank_transfer') && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'bank_transfer') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('bank_transfer')
                          setPaymentMethod('bank_transfer')
                          setPaymentChannel('BCA')
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">Virtual Account</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'bank_transfer' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'bank_transfer' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <span className="font-semibold">Instant Aktivasi</span>, Ada Biaya Fee Merchant
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.keys(activeChannels).filter(bank => activeChannels[bank] !== false && ['BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'CIMB', 'PERMATA', 'SAHABAT_SAMPOERNA'].includes(bank)).map((bank) => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setPaymentChannel(bank)}
                              className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                              style={{
                                borderColor: paymentChannel === bank ? computed.primary : '#e5e7eb',
                                backgroundColor: paymentChannel === bank ? computed.primaryBg : undefined,
                              }}
                            >
                              <div className="h-8 flex items-center justify-center mb-1">
                                <img 
                                  src={paymentLogos[bank] || `/images/payment-logos/${bank.toLowerCase()}.svg`}
                                  alt={bank}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.parentElement!.innerHTML += `<span class="text-xs font-bold text-gray-600">${bank}</span>`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-1">Virtual Account</p>
                              {paymentChannel === bank && (
                                <div 
                                  className="absolute top-2 right-2 rounded-full p-1"
                                  style={{ backgroundColor: computed.primary }}
                                >
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* E-Wallet Section */}
                {hasActiveChannels('ewallet') && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'ewallet') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('ewallet')
                          setPaymentMethod('ewallet')
                          setPaymentChannel('OVO')
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">e-Wallets</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'ewallet' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'ewallet' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.keys(activeChannels).filter(wallet => activeChannels[wallet] !== false && ['OVO', 'DANA', 'GOPAY', 'LINKAJA', 'SHOPEEPAY', 'ASTRAPAY'].includes(wallet)).map((wallet) => (
                            <button
                              key={wallet}
                              type="button"
                              onClick={() => setPaymentChannel(wallet)}
                              className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                              style={{
                                borderColor: paymentChannel === wallet ? computed.primary : '#e5e7eb',
                                backgroundColor: paymentChannel === wallet ? computed.primaryBg : undefined,
                              }}
                            >
                              <div className="h-8 flex items-center justify-center mb-1">
                                <img 
                                  src={paymentLogos[wallet] || `/images/payment-logos/${wallet.toLowerCase()}.svg`}
                                  alt={wallet}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.parentElement!.innerHTML += `<span class="text-xs font-bold text-gray-600">${wallet}</span>`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-1">E-Wallet</p>
                              {paymentChannel === wallet && (
                                <div 
                                  className="absolute top-2 right-2 rounded-full p-1"
                                  style={{ backgroundColor: computed.primary }}
                                >
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QRIS Section */}
                {hasActiveChannels('qris') && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'qris') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('qris')
                          setPaymentMethod('qris')
                          setPaymentChannel('QRIS')
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">QRIS</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'qris' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'qris' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div 
                          className="relative p-6 rounded-lg border-2"
                          style={{
                            borderColor: computed.primary,
                            backgroundColor: computed.primaryBg,
                          }}
                        >
                          <div className="h-20 flex items-center justify-center mb-3">
                            <img 
                              src={paymentLogos['QRIS'] || "/images/payment-logos/qris.svg"}
                              alt="QRIS"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Scan QR Code dengan aplikasi pembayaran apapun
                            </p>
                            <p className="text-xs text-gray-500">
                              GoPay • OVO • DANA • LinkAja • ShopeePay • Bank Apps
                            </p>
                          </div>
                          <div 
                            className="absolute top-3 right-3 rounded-full p-1"
                            style={{ backgroundColor: computed.primary }}
                          >
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Retail/Minimarket Section */}
                {hasActiveChannels('retail') && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'retail') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('retail')
                          setPaymentMethod('retail')
                          setPaymentChannel('ALFAMART')
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">Minimarket</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'retail' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'retail' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.keys(activeChannels).filter(retail => activeChannels[retail] !== false && ['ALFAMART', 'INDOMARET'].includes(retail)).map((retail) => (
                            <button
                              key={retail}
                              type="button"
                              onClick={() => setPaymentChannel(retail)}
                              className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                              style={{
                                borderColor: paymentChannel === retail ? computed.primary : '#e5e7eb',
                                backgroundColor: paymentChannel === retail ? computed.primaryBg : undefined,
                              }}
                            >
                              <div className="h-8 flex items-center justify-center mb-1">
                                <img 
                                  src={paymentLogos[retail] || `/images/payment-logos/${retail.toLowerCase()}.svg`}
                                  alt={retail}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.parentElement!.innerHTML += `<span class="text-xs font-bold text-gray-600">${retail}</span>`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-1">Bayar di Kasir</p>
                              {paymentChannel === retail && (
                                <div 
                                  className="absolute top-2 right-2 rounded-full p-1"
                                  style={{ backgroundColor: computed.primary }}
                                >
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PayLater Section */}
                {hasActiveChannels('paylater') && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'paylater') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('paylater')
                          setPaymentMethod('paylater')
                          setPaymentChannel('KREDIVO')
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">PayLater</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'paylater' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'paylater' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-3">
                          {Object.keys(activeChannels).filter(paylater => activeChannels[paylater] !== false && ['KREDIVO', 'AKULAKU'].includes(paylater)).map((paylater) => (
                            <button
                              key={paylater}
                              type="button"
                              onClick={() => setPaymentChannel(paylater)}
                              className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                              style={{
                                borderColor: paymentChannel === paylater ? computed.primary : '#e5e7eb',
                                backgroundColor: paymentChannel === paylater ? computed.primaryBg : undefined,
                              }}
                            >
                              <div className="h-8 flex items-center justify-center mb-1">
                                <img 
                                  src={paymentLogos[paylater] || `/images/payment-logos/${paylater.toLowerCase()}.svg`}
                                  alt={paylater}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.parentElement!.innerHTML += `<span class="text-xs font-bold text-gray-600">${paylater}</span>`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-1">Cicilan 0%</p>
                              {paymentChannel === paylater && (
                                <div 
                                  className="absolute top-2 right-2 rounded-full p-1"
                                  style={{ backgroundColor: computed.primary }}
                                >
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Buy Button */}
          {status === 'authenticated' && (
            <div className="space-y-4">
              <Button 
                className="w-full h-16 text-white font-bold text-lg shadow-lg" 
                size="lg"
                style={{
                  backgroundColor: computed.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = computed.primaryHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = computed.primary
                }}
                onClick={processCheckout}
                disabled={processing || !registerData.name || !registerData.email || !registerData.whatsapp}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Beli Sekarang - {formatCurrency(calculateFinalPrice())}
                  </>
                )}
              </Button>

              {(!registerData.name || !registerData.email || !registerData.whatsapp) && (
                <p 
                  className="text-xs text-center font-medium"
                  style={{ color: computed.primary }}
                >
                  ⚠️ Mohon lengkapi data diri (Nama, Email, dan WhatsApp) untuk melanjutkan
                </p>
              )}

              <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                <Shield className="inline h-3 w-3" /> Dilindungi oleh Channel Eksporyuk
              </p>

              {/* Affiliate Partner Badge */}
              <AffiliatePartnerBadge className="mt-2" />
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Login ke Akun Anda</DialogTitle>
            <DialogDescription>Masuk untuk melanjutkan checkout</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2"
              onClick={() => {
                setShowLoginModal(false)
                handleGoogleLogin()
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjutkan dengan Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau login dengan email
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Password"
                  required
                />
              </div>

              <Button 
                type="submit"
                className="w-full h-11 bg-orange-500 hover:bg-orange-600"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Belum punya akun?{' '}
              <Button
                type="button"
                variant="link"
                onClick={scrollToRegistrationForm}
                className="p-0 h-auto text-orange-500 hover:text-orange-600 font-semibold"
              >
                Daftar di sini
              </Button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
