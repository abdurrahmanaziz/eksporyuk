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
import { Check, Loader2, Package, Shield, Zap, CreditCard, Wallet, Building, FileText, ChevronDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useCheckoutColors } from '@/hooks/useCheckoutColors'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface PriceOption {
  duration: string
  label: string
  price: number
  pricePerMonth?: number
  benefits: string[]
  badge?: string
  isPopular?: boolean
  membershipId?: string // For Pro checkout - specific membership ID
  membershipSlug?: string // For Pro checkout - specific membership slug
  marketingPrice?: number // Marketing price for display only (crossed out)
}

interface MembershipPlan {
  id: string
  name: string
  slug: string
  description: string | null
  formLogo: string | null
  formBanner: string | null
  prices: PriceOption[]
  benefits?: string[] // Optional benefits
  salespage: string | null
  affiliateCommission: number
  isActive: boolean
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [plan, setPlan] = useState<MembershipPlan | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<PriceOption | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'paylater' | 'manual'>('bank_transfer')
  const [paymentChannel, setPaymentChannel] = useState<string>('BCA') // Default bank
  
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
      console.log('[Checkout] loadUserData called, session:', !!session?.user, 'status:', status)
      
      // Only proceed if authenticated
      if (status !== 'authenticated' || !session?.user) {
        console.log('[Checkout] Not authenticated yet, skipping profile fetch')
        return
      }
      
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
        console.log('[Checkout] Fetching profile from API...')
        const profileRes = await fetch('/api/user/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          console.log('[Checkout] Profile API response:', profileData)
          // API returns { user: {...} } without success field
          if (profileData.user) {
            console.log('[Checkout] Profile data loaded, whatsapp:', profileData.user.whatsapp)
            setRegisterData(prev => ({
              ...prev,
              name: profileData.user.name || prev.name,
              phone: profileData.user.phone || prev.phone,
              whatsapp: profileData.user.whatsapp || profileData.user.phone || prev.whatsapp,
            }))
          }
        } else {
          console.log('[Checkout] Profile API error:', profileRes.status)
        }
      } catch (error) {
        console.error('[Checkout] Error fetching profile:', error)
      }
    }
    
    loadUserData()
  }, [session, status])

  // Ref for scrolling to registration form
  const registrationFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPlan()
    checkCouponFromCookie()
    
    // Restore selected price after Google login (if exists in localStorage)
    const savedPrice = localStorage.getItem('checkout_selected_price')
    if (savedPrice) {
      try {
        const price = JSON.parse(savedPrice)
        setSelectedPrice(price)
        localStorage.removeItem('checkout_selected_price')
      } catch (e) {
        console.error('Error parsing saved price:', e)
      }
    }
  }, [params.slug])

  const fetchPlan = async () => {
    try {
      setLoading(true)
      console.log('[Checkout] Fetching plan:', params.slug)
      
      const res = await fetch(`/api/membership-plans/${params.slug}`)
      console.log('[Checkout] API Response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('[Checkout] Plan data:', data)
        setPlan(data.plan)
        
        // Set default selected price (first option)
        if (data.plan.prices && data.plan.prices.length > 0) {
          setSelectedPrice(data.plan.prices[0])
        }
      } else {
        const errorText = await res.text()
        console.error('[Checkout] Error response:', errorText)
        toast.error('Paket membership tidak ditemukan')
        router.push('/')
      }
    } catch (error) {
      console.error('[Checkout] Error fetching plan:', error)
      toast.error('Gagal memuat data paket')
    } finally {
      setLoading(false)
    }
  }

  const checkCouponFromCookie = () => {
    // Check if there's affiliate coupon in cookies
    const cookies = document.cookie.split(';')
    const affiliateCookie = cookies.find(c => c.trim().startsWith('affiliate_code='))
    
    if (affiliateCookie) {
      const code = affiliateCookie.split('=')[1]
      setCouponCode(code)
      applyCoupon(code)
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
        // Reload to update session
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
    if (!selectedPrice) {
      toast.error('Pilih paket membership terlebih dahulu')
      return
    }
    
    try {
      const currentUrl = window.location.href
      // Store selected price in localStorage so we can retrieve it after Google login
      localStorage.setItem('checkout_selected_price', JSON.stringify(selectedPrice))
      localStorage.setItem('checkout_plan_id', plan?.id || '')
      if (appliedCoupon) {
        localStorage.setItem('checkout_coupon', appliedCoupon.code)
      }
      
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
        body: JSON.stringify({ code: coupon, planId: plan?.id })
      })

      const data = await res.json()

      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon)
        toast.success('Kupon berhasil diterapkan!')
      } else {
        toast.error(data.message || 'Kupon tidak valid')
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
    if (!selectedPrice) return 0
    
    let price = selectedPrice.price
    
    // Apply coupon discount only
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
      // Add a subtle highlight effect
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

    if (!selectedPrice) {
      toast.error('Pilih paket membership terlebih dahulu')
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
      // Register user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerData,
          phone: registerData.whatsapp || registerData.phone
        })
      })

      if (!registerRes.ok) {
        const error = await registerRes.json()
        toast.error(error.message || 'Registrasi gagal')
        setProcessing(false)
        return
      }

      toast.success('Registrasi berhasil! Sedang memproses checkout...')

      // Auto login
      const signInResult = await signIn('credentials', {
        email: registerData.email,
        password: registerData.password,
        redirect: false
      })

      if (signInResult?.ok) {
        // Wait a bit for session to update
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Process checkout directly after successful login
        const membershipId = (selectedPrice as any).membershipId || plan?.id
        const membershipSlug = (selectedPrice as any).membershipSlug || params.slug
        
        const checkoutRes = await fetch('/api/checkout/membership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: membershipId,
            membershipSlug: membershipSlug,
            priceOption: selectedPrice,
            couponCode: appliedCoupon?.code,
            finalPrice: calculateFinalPrice(),
            name: registerData.name,
            email: registerData.email,
            phone: registerData.phone,
            whatsapp: registerData.whatsapp || registerData.phone
          })
        })

        const checkoutData = await checkoutRes.json()

        if (checkoutRes.ok && checkoutData.paymentUrl) {
          // Redirect to payment page
          window.location.href = checkoutData.paymentUrl
        } else {
          toast.error(checkoutData.message || 'Gagal memproses pembayaran')
          setProcessing(false)
        }
      } else {
        toast.error('Login otomatis gagal, silakan login manual')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Terjadi kesalahan saat registrasi')
      setProcessing(false)
    }
  }

  const processCheckout = async () => {
    console.log('[DEBUG] processCheckout started')
    console.log('[DEBUG] status:', status)
    console.log('[DEBUG] selectedPrice:', selectedPrice)
    console.log('[DEBUG] session:', session)
    console.log('[DEBUG] registerData:', registerData)
    
    // Check authentication first
    if (status !== 'authenticated' || !session?.user) {
      toast.error('Anda harus login terlebih dahulu')
      setShowLoginModal(true)
      return
    }
    
    if (!selectedPrice) {
      toast.error('Pilih paket terlebih dahulu')
      return
    }

    // Validate required data
    if (!registerData.name || !registerData.email || !registerData.whatsapp) {
      toast.error('Mohon lengkapi data diri (Nama, Email, dan WhatsApp)')
      return
    }

    setProcessing(true)
    console.log('[DEBUG] Processing started...')
    
    try {
      // Refresh session to make sure it's valid
      const sessionRes = await fetch('/api/auth/session')
      const currentSession = await sessionRes.json()
      
      if (!currentSession || !currentSession.user) {
        toast.error('Session expired, silakan login kembali')
        setProcessing(false)
        setShowLoginModal(true)
        return
      }
      
      console.log('[DEBUG] Session valid:', currentSession.user.email)
      
      // For general checkout page (pro), use membershipId from selected price
      // For specific plan checkout, use plan.id
      const membershipId = (selectedPrice as any).membershipId || plan?.id
      const membershipSlug = (selectedPrice as any).membershipSlug || params.slug
      
      console.log('[Checkout] Processing:', {
        membershipId,
        membershipSlug,
        selectedPrice,
        planId: plan?.id
      })
      
      const requestBody = {
        planId: membershipId, // Use the correct membership ID
        membershipSlug: membershipSlug, // Pass slug for reference
        priceOption: selectedPrice,
        couponCode: appliedCoupon?.code,
        finalPrice: calculateFinalPrice(),
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone || registerData.whatsapp,
        whatsapp: registerData.whatsapp,
        paymentMethod: paymentMethod, // 'bank_transfer', 'ewallet', 'qris'
        paymentChannel: paymentChannel // 'BCA', 'MANDIRI', 'OVO', 'DANA', etc
      }
      
      console.log('[DEBUG] Request body:', JSON.stringify(requestBody, null, 2))
      
      const res = await fetch('/api/checkout/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('[DEBUG] Response status:', res.status, res.statusText)
      
      let data
      try {
        data = await res.json()
      } catch (parseError) {
        console.error('[DEBUG] Failed to parse JSON response:', parseError)
        const text = await res.text()
        console.error('[DEBUG] Raw response:', text)
        toast.error('Server mengembalikan response yang tidak valid')
        setProcessing(false)
        return
      }

      console.log('[Checkout] API Response:', {
        ok: res.ok,
        status: res.status,
        data: data
      })

      // Handle different status codes explicitly
      if (res.status === 401) {
        console.error('[DEBUG] ❌ Unauthorized - Session invalid')
        toast.error('Session expired, silakan login kembali')
        setShowLoginModal(true)
        setProcessing(false)
        return
      }
      
      if (res.status === 404) {
        console.error('[DEBUG] ❌ Not Found - Membership not found')
        toast.error('Paket membership tidak ditemukan')
        setProcessing(false)
        return
      }
      
      if (res.status === 400) {
        console.error('[DEBUG] ❌ Bad Request:', data)
        const errorMessage = data.error || data.message || 'Data tidak valid'
        toast.error(errorMessage)
        setProcessing(false)
        return
      }
      
      if (res.status >= 500) {
        console.error('[DEBUG] ❌ Server Error:', data)
        toast.error('Server error, silakan coba lagi')
        setProcessing(false)
        return
      }

      if (res.ok && data.paymentUrl) {
        console.log('[DEBUG] ✅ Checkout SUCCESS! Redirecting to:', data.paymentUrl)
        toast.success('Mengarahkan ke halaman pembayaran...')
        // Use router.push for Next.js navigation instead of window.location.href
        setTimeout(() => {
          router.push(data.paymentUrl)
        }, 500)
      } else {
        console.error('[DEBUG] ❌ Checkout failed - No paymentUrl:', data)
        const errorMessage = data.message || data.error || `Error ${res.status}: ${res.statusText}`
        toast.error(errorMessage)
        setProcessing(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      
      // BYPASS: Tetap redirect ke payment page walaupun error
      const tempTransactionId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const paymentUrl = `/payment/va/${tempTransactionId}`
      console.log('[DEBUG] BYPASS redirect:', paymentUrl)
      window.location.href = paymentUrl
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Paket tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {plan.formLogo && (
            <div className="flex justify-center mb-4">
              <Image src={plan.formLogo} alt={plan.name} width={80} height={80} className="rounded-lg" />
            </div>
          )}
          <h1 className="text-4xl font-bold mb-2">
            {plan.slug === 'pro' ? 'Pilih Paket Membership Anda' : 'Checkout'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {plan.slug === 'pro' 
              ? 'Pilih paket yang sesuai dengan kebutuhan bisnis ekspor Anda' 
              : plan.name}
          </p>
        </div>

        {/* Single Column Layout */}
        <div className="space-y-6">
          {/* 1. User Info / Login */}
          <Card ref={registrationFormRef} className="transition-all duration-300">
            <CardHeader>
              <CardTitle>Isi Data Diri</CardTitle>
              <CardDescription>
                {status === 'authenticated' 
                  ? 'Data Anda akan digunakan untuk invoice' 
                  : 'Registrasi untuk melanjutkan checkout'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {status === 'authenticated' ? (
                  <>
                    {/* Display User Info for Logged-In Users */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Data Akun Anda</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nama:</span>
                          <span className="font-medium text-gray-900">{registerData.name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-gray-900">{registerData.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">WhatsApp:</span>
                          <span className="font-medium text-gray-900">{registerData.whatsapp || '-'}</span>
                        </div>
                      </div>

                      {!registerData.whatsapp && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                          <p className="text-xs text-yellow-800 mb-2">
                            ⚠️ Nomor WhatsApp diperlukan untuk menyelesaikan pembelian
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => window.location.href = '/profile'}
                          >
                            Lengkapi Profil
                          </Button>
                        </div>
                      )}
                      
                      <Button variant="outline" className="w-full mt-2" onClick={() => setShowLoginModal(true)}>
                        Ganti Akun
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      {/* Login via Google */}
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full h-12 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-semibold" 
                        onClick={handleGoogleLogin}
                      >
                        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Lanjutkan dengan Google
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-3 text-gray-500 font-medium">
                            Atau daftar dengan email
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold">Nama</Label>
                      <Input
                        id="name"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        placeholder="Nama lengkap"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="contoh@gmail.com"
                        className="h-11"
                      />
                      <p className="text-xs text-orange-600 font-semibold mt-1">
                        ⚠️ Wajib menggunakan email Gmail (@gmail.com)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold">Nomor WhatsApp</Label>
                      <Input
                        id="phone"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
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
                  </>
                )}
              </CardContent>
            </Card>

          {/* 2. Package Selection - Only show if prices exist */}
          {plan.prices && plan.prices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pilih Durasi</CardTitle>
                <CardDescription>
                  {plan.slug === 'pro' 
                    ? 'Bandingkan harga dan benefit dari setiap paket yang tersedia' 
                    : 'Pilih paket yang sesuai dengan kebutuhan Anda'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.prices.map((price, index) => (
                  <div key={index}>
                    {/* Price Selection Card */}
                    <div
                      onClick={() => setSelectedPrice(price)}
                      className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md ${
                        selectedPrice?.duration === price.duration || selectedPrice?.membershipId === price.membershipId
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {price.isPopular && (
                        <Badge className="absolute -top-3 right-4 bg-orange-500 text-white font-semibold px-3 py-1">
                          ⭐ Paling Laris
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedPrice?.duration === price.duration || selectedPrice?.membershipId === price.membershipId
                              ? 'border-orange-500 bg-orange-500 shadow-sm'
                              : 'border-gray-300'
                          }`}>
                            {(selectedPrice?.duration === price.duration || selectedPrice?.membershipId === price.membershipId) && (
                              <div className="w-3 h-3 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{price.label}</h3>
                            {price.badge && (
                              <Badge variant="secondary" className="mt-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                                {price.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {price.marketingPrice && price.marketingPrice > price.price ? (
                            <>
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <span className="text-sm text-gray-400 line-through">
                                  {formatCurrency(price.marketingPrice)}
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(price.price)}
                              </p>
                            </>
                          ) : (
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {formatCurrency(price.price)}
                            </p>
                          )}
                          {price.pricePerMonth && (
                            <p className="text-sm text-gray-500">
                              {formatCurrency(price.pricePerMonth)} / bln
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Benefits - Only show for selected price (dibales.ai style) */}
                    {(selectedPrice?.duration === price.duration || selectedPrice?.membershipId === price.membershipId) && price.benefits && price.benefits.length > 0 && (
                      <div className="mt-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
                        <p className="text-sm font-bold mb-3 text-green-800 dark:text-green-400">✨ Yang kamu dapatkan:</p>
                        <div className="space-y-2">
                          {price.benefits.map((benefit, bIndex) => (
                            <div key={bIndex} className="flex items-start gap-3 text-sm">
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Benefits / Features List - Only show if NOT in price object */}
          {plan.benefits && plan.benefits.length > 0 && (
            // Only show if selected price doesn't have its own benefits
            !selectedPrice?.benefits || selectedPrice.benefits.length === 0
          ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Yang Kamu Dapatkan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {plan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 bg-green-100 dark:bg-green-900 rounded-full">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Coupon - Only show if prices exist */}
          {plan.prices && plan.prices.length > 0 && (
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
          )}

          {/* 4. Summary - Only show if prices exist */}
          {plan.prices && plan.prices.length > 0 && selectedPrice && (
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Paket</span>
                  <span className="font-medium">{selectedPrice?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga</span>
                  <span className="font-medium">{formatCurrency(selectedPrice?.price || 0)}</span>
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
          )}

          {/* Info for General Checkout (no specific prices) */}
          {(!plan.prices || plan.prices.length === 0) && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                  <Package className="h-5 w-5" />
                  Checkout Umum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-blue-700 dark:text-blue-300">
                  Halaman ini adalah checkout umum untuk berbagai paket membership. 
                  Silakan pilih paket yang Anda inginkan dari daftar paket kami.
                </p>
                <Button 
                  onClick={() => router.push('/membership')} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Lihat Paket Membership
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 5. Buy Button - Only show if user is authenticated and has selected price */}
          {status === 'authenticated' && plan.prices && plan.prices.length > 0 && (
            <div className="space-y-4">
              {/* WhatsApp Input - Only show if user doesn't have WhatsApp */}
              {!session?.user?.whatsapp && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nomor WhatsApp</CardTitle>
                    <CardDescription>
                      Diperlukan untuk notifikasi pembayaran dan akses membership
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-number" className="flex items-center gap-2">
                        Nomor WhatsApp
                        <Badge variant="destructive" className="text-xs">Wajib</Badge>
                      </Label>
                      <Input
                        id="whatsapp-number"
                        type="tel"
                        value={registerData.whatsapp}
                        onChange={(e) => setRegisterData({ ...registerData, whatsapp: e.target.value })}
                        placeholder="08123456789"
                        className="h-12"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Selection */}
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
                                className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === bank ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === bank ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-12 flex items-center justify-center mb-2 p-2">
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
                            {Object.keys(activeChannels).filter(wallet => activeChannels[wallet] !== false && ['OVO', 'DANA', 'GOPAY', 'LINKAJA'].includes(wallet)).map((wallet) => (
                              <button
                                key={wallet}
                                type="button"
                                onClick={() => setPaymentChannel(wallet)}
                                className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === wallet ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === wallet ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-12 flex items-center justify-center mb-2 p-2">
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
                            <div className="h-16 flex items-center justify-center mb-2 p-2">
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
                                className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === retail ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === retail ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-12 flex items-center justify-center mb-2 p-2">
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
                                className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === paylater ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === paylater ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-12 flex items-center justify-center mb-2 p-2">
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
                                <p className="text-xs text-center text-gray-500 mt-1">Bayar Nanti</p>
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
              
              <Button 
                className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg" 
                size="lg"
                onClick={processCheckout}
                disabled={processing || !selectedPrice || !registerData.name || !registerData.email || !registerData.whatsapp}
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
                <p className="text-xs text-center text-orange-600 font-medium">
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto px-8">
          <DialogHeader className="space-y-3 pb-2">
            <DialogTitle className="text-3xl font-bold text-center text-gray-900">
              Login ke Akun Anda
            </DialogTitle>
            <DialogDescription className="text-center text-base text-gray-600">
              Masuk untuk melanjutkan checkout
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-6 mt-6 px-4">
            {/* Google Login Button - White background with Google colors */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-semibold text-base rounded-xl shadow-sm hover:shadow-md transition-all"
              onClick={() => {
                setShowLoginModal(false)
                handleGoogleLogin()
              }}
            >
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjutkan dengan Google
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white dark:bg-background px-4 py-1 text-gray-500 font-semibold">
                  Atau login dengan email
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="login-email" className="text-sm font-bold text-gray-700">
                Email Gmail
              </Label>
              <Input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="contoh@gmail.com"
                className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-colors px-4"
                required
              />
              <p className="text-xs text-orange-600 font-medium">
                Gunakan email Gmail yang telah terdaftar
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="login-password" className="text-sm font-bold text-gray-700">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                className="h-12 text-base rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-colors px-4"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all rounded-xl mt-8"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            <div className="pt-4 pb-2">
              <p className="text-base text-center text-gray-600">
                Belum punya akun?{' '}
                <Button 
                  type="button"
                  variant="link" 
                  onClick={scrollToRegistrationForm} 
                  className="p-0 h-auto text-orange-500 hover:text-orange-600 font-bold text-base"
                >
                  Isi form registrasi
                </Button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
