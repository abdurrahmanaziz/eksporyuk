'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, CreditCard, ChevronDown, AlertCircle, Building, Wallet } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useCheckoutColors } from '@/hooks/useCheckoutColors'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface MembershipPackage {
  id: string
  name: string
  duration: string
  price: number
  originalPrice: number | null
  features: string[]
  isBestSeller?: boolean
}

interface PaymentMethod {
  id: string
  name: string
  logo: string
  type: 'VA' | 'EWALLET' | 'QRIS'
}

interface PaymentChannel {
  code: string
  name: string
  type: string
  icon: string
  isActive: boolean
  customLogoUrl?: string
}

interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  isActive: boolean
  customLogoUrl?: string
}

export default function CheckoutProPage() {
  const { data: session } = useSession()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  
  // Get URL parameters on client side
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search))
  }, [])
  
  // Helper function to get logo URL
  const getLogoUrl = (code: string, customLogoUrl?: string) => {
    // Prioritize custom logo if available
    if (customLogoUrl) {
      return customLogoUrl
    }
    
    const baseUrl = '/images/payment-logos'
    const logos: { [key: string]: string } = {
      'BCA': `${baseUrl}/bca.svg`,
      'MANDIRI': `${baseUrl}/mandiri.svg`,
      'BNI': `${baseUrl}/bni.svg`,
      'BRI': `${baseUrl}/bri.svg`,
      'BSI': `${baseUrl}/bsi.svg`,
      'CIMB': `${baseUrl}/cimb.svg`,
      'PERMATA': `${baseUrl}/permata.svg`,
      'SAHABAT_SAMPOERNA': `${baseUrl}/sahabat-sampoerna.svg`,
      'OVO': `${baseUrl}/ovo.svg`,
      'DANA': `${baseUrl}/dana.svg`,
      'GOPAY': `${baseUrl}/gopay.svg`,
      'LINKAJA': `${baseUrl}/linkaja.svg`,
      'SHOPEEPAY': `${baseUrl}/shopeepay.svg`,
      'ASTRAPAY': `${baseUrl}/astrapay.svg`,
      'JENIUSPAY': `${baseUrl}/jeniuspay.svg`,
      'QRIS': `${baseUrl}/qris.svg`,
      'ALFAMART': `${baseUrl}/alfamart.svg`,
      'INDOMARET': `${baseUrl}/indomaret.svg`,
      'KREDIVO': `${baseUrl}/kredivo.svg`,
      'AKULAKU': `${baseUrl}/akulaku.svg`,
    }
    return logos[code] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%230066CC'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='white' font-family='Arial'%3E${code.substring(0, 3)}%3C/text%3E%3C/svg%3E`
  }
  
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponChecking, setCouponChecking] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [userData, setUserData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    whatsapp: ''
  })

  // Registration form for non-logged-in users
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: ''
  })

  const [isRegistering, setIsRegistering] = useState(false)
  
  // Payment settings
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<{
    xenditChannels: PaymentChannel[]
    manualBankAccounts: BankAccount[]
    enableManual: boolean
    enableXendit: boolean
  }>({
    xenditChannels: [],
    manualBankAccounts: [],
    enableManual: false,
    enableXendit: true
  })
  
  // Payment method selection - include 'retail' for minimarket payments and 'cardless_credit' for buy now pay later
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'cardless_credit' | 'manual'>('bank_transfer')
  const [paymentChannel, setPaymentChannel] = useState<string>('BCA')
  
  // Collapsible sections state
  const [expandedSection, setExpandedSection] = useState<string>('bank_transfer')
  
  // Checkout colors
  const { colors, computed } = useCheckoutColors()

  useEffect(() => {
    fetchPackages()
    fetchPaymentMethods()
  }, [searchParams]) // Add searchParams dependency

  // Auto-fill coupon from URL parameter
  useEffect(() => {
    if (searchParams) {
      const couponFromUrl = searchParams.get('coupon')
      if (couponFromUrl && !couponCode) {
        console.log('[Checkout Pro] Auto-filling coupon from URL:', couponFromUrl)
        setCouponCode(couponFromUrl)
      }
    }
  }, [searchParams])

  // Auto-detect coupon as user types (with debounce)
  useEffect(() => {
    if (!couponCode.trim() || couponCode.length < 3 || !selectedPackage) {
      setCouponError(null)
      return
    }
    
    // Don't auto-check if already applied
    if (appliedCoupon && appliedCoupon.code === couponCode) {
      return
    }

    const debounceTimer = setTimeout(async () => {
      setCouponChecking(true)
      setCouponError(null)
      try {
        const res = await fetch(`/api/coupons/validate?code=${couponCode}&membershipId=${selectedPackage.id}`)
        const data = await res.json()
        if (res.ok && data.valid) {
          setAppliedCoupon(data.coupon)
          setCouponError(null)
        } else {
          setAppliedCoupon(null)
          setCouponError(data.message || 'Kupon tidak valid')
        }
      } catch (err) {
        console.error('[Checkout Pro] Error checking coupon:', err)
        setCouponError('Gagal memeriksa kupon')
      } finally {
        setCouponChecking(false)
      }
    }, 800) // 800ms debounce

    return () => clearTimeout(debounceTimer)
  }, [couponCode, selectedPackage])

  // Auto-validate coupon when couponCode is set from URL and package is selected
  useEffect(() => {
    const autoValidateCoupon = async () => {
      if (searchParams && selectedPackage && couponCode) {
        const couponFromUrl = searchParams.get('coupon')
        // Only auto-validate if coupon came from URL
        if (couponFromUrl && couponFromUrl === couponCode && !appliedCoupon) {
          console.log('[Checkout Pro] Auto-validating coupon:', couponCode)
          setCouponChecking(true)
          try {
            const res = await fetch(`/api/coupons/validate?code=${couponCode}&membershipId=${selectedPackage.id}`)
            const data = await res.json()
            if (res.ok && data.valid) {
              console.log('[Checkout Pro] Coupon validated successfully:', data.coupon)
              setAppliedCoupon(data.coupon)
            } else {
              setCouponError(data.message || 'Kupon tidak valid')
            }
          } catch (err) {
            console.error('[Checkout Pro] Error auto-validating coupon:', err)
          } finally {
            setCouponChecking(false)
          }
        }
      }
    }
    autoValidateCoupon()
  }, [searchParams, selectedPackage, couponCode])

  // Load user data from session and fetch latest from API
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        // First set from session as fallback
        setUserData({
          name: session.user.name || '',
          email: session.user.email || '',
          whatsapp: (session.user as any).whatsapp || (session.user as any).phone || ''
        })
        
        // Then fetch latest data from API profile to get updated whatsapp
        try {
          const profileRes = await fetch('/api/user/profile')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            // API returns { user: {...} } without success field
            if (profileData.user) {
              console.log('[Checkout Pro] Profile data loaded:', profileData.user.whatsapp)
              setUserData(prev => ({
                ...prev,
                name: profileData.user.name || prev.name,
                whatsapp: profileData.user.whatsapp || profileData.user.phone || prev.whatsapp,
              }))
            }
          }
        } catch (error) {
          console.error('[Checkout Pro] Error fetching profile:', error)
        }
      }
    }
    
    loadUserData()
  }, [session])

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/memberships/packages')
      const data = await res.json()
      if (data.success) {
        setPackages(data.packages)
        
        // Auto-select package from URL parameter or first package
        if (data.packages.length > 0) {
          const planId = searchParams?.get('plan')
          
          if (planId) {
            // Find and select the package matching the plan ID
            const targetPackage = data.packages.find((pkg: MembershipPackage) => pkg.id === planId)
            if (targetPackage) {
              console.log('[Checkout Pro] Auto-selecting package from URL:', targetPackage.name)
              setSelectedPackage(targetPackage)
            } else {
              // Fallback to first package if plan ID not found
              setSelectedPackage(data.packages[0])
            }
          } else {
            // No plan parameter, select first package
            setSelectedPackage(data.packages[0])
          }
        }
      }
    } catch (err) {
      console.error('Error fetching packages:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods')
      const data = await res.json()
      
      console.log('[Checkout Pro] Payment methods response:', data)
      
      if (data.success) {
        const xenditChannels = data.data.xendit.channels || []
        const manualBankAccounts = data.data.manual.bankAccounts || []
        const enableManual = data.data.manual.enabled
        const enableXendit = data.data.xendit.enabled

        console.log('[Checkout Pro] Xendit enabled:', enableXendit)
        console.log('[Checkout Pro] Xendit channels:', xenditChannels)
        console.log('[Checkout Pro] Bank transfer channels:', xenditChannels.filter((ch: PaymentChannel) => ch.type === 'bank_transfer' && ch.isActive))

        // If no channels but Xendit is enabled, use default channels
        const finalXenditChannels = (enableXendit && xenditChannels.length === 0) 
          ? getDefaultChannels() 
          : xenditChannels

        setAvailablePaymentMethods({
          xenditChannels: finalXenditChannels,
          manualBankAccounts,
          enableManual,
          enableXendit
        })

        // Auto-select first available payment method and expand section
        if (enableXendit && finalXenditChannels.length > 0) {
          const firstBankTransfer = finalXenditChannels.find((ch: PaymentChannel) => ch.type === 'bank_transfer' && ch.isActive)
          if (firstBankTransfer) {
            console.log('[Checkout Pro] Auto-selecting bank transfer:', firstBankTransfer.code)
            setPaymentMethod('bank_transfer')
            setPaymentChannel(firstBankTransfer.code)
            setExpandedSection('bank_transfer') // Auto-expand bank transfer section
          }
        } else if (enableManual && manualBankAccounts.length > 0) {
          console.log('[Checkout Pro] Auto-selecting manual transfer')
          setPaymentMethod('manual')
          setPaymentChannel(manualBankAccounts[0].bankCode)
          setExpandedSection('manual') // Auto-expand manual section
        }
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err)
      // Set default channels on error
      const defaultChannels = getDefaultChannels()
      setAvailablePaymentMethods({
        xenditChannels: defaultChannels,
        manualBankAccounts: [],
        enableManual: false,
        enableXendit: true
      })
      const firstBank = defaultChannels.find(ch => ch.type === 'bank_transfer' && ch.isActive)
      if (firstBank) {
        setPaymentMethod('bank_transfer')
        setPaymentChannel(firstBank.code)
        setExpandedSection('bank_transfer')
      }
    }
  }

  // Default payment channels as fallback
  const getDefaultChannels = (): PaymentChannel[] => {
    return [
      { code: 'BCA', name: 'Bank Central Asia (BCA)', type: 'bank_transfer', icon: '🏦', isActive: true },
      { code: 'MANDIRI', name: 'Bank Mandiri', type: 'bank_transfer', icon: '🏦', isActive: true },
      { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', type: 'bank_transfer', icon: '🏦', isActive: true },
      { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', type: 'bank_transfer', icon: '🏦', isActive: true },
      { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', type: 'bank_transfer', icon: '🏦', isActive: true },
      { code: 'OVO', name: 'OVO', type: 'ewallet', icon: '💳', isActive: true },
      { code: 'DANA', name: 'DANA', type: 'ewallet', icon: '💳', isActive: true },
      { code: 'GOPAY', name: 'GoPay', type: 'ewallet', icon: '💳', isActive: true },
      { code: 'QRIS', name: 'QRIS (Scan QR)', type: 'qris', icon: '📱', isActive: true },
      { code: 'ALFAMART', name: 'Alfamart', type: 'retail', icon: '🏪', isActive: true },
      { code: 'INDOMARET', name: 'Indomaret', type: 'retail', icon: '🏪', isActive: true },
      { code: 'KREDIVO', name: 'Kredivo', type: 'cardless_credit', icon: '💳', isActive: true },
      { code: 'AKULAKU', name: 'Akulaku', type: 'cardless_credit', icon: '💳', isActive: true },
    ]
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !selectedPackage) return

    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode}&membershipId=${selectedPackage.id}`)
      const data = await res.json()

      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon)
      }
    } catch (err) {
      console.error('Error validating coupon:', err)
    }
  }

  // Register and checkout function
  const handleRegisterAndCheckout = async () => {
    if (!selectedPackage) return
    
    setIsRegistering(true)
    
    try {
      // 1. Register user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          phone: registerData.phone || registerData.whatsapp,
          whatsapp: registerData.whatsapp
        })
      })

      const registerResult = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerResult.error || 'Gagal mendaftar')
      }

      // 2. Auto login
      const loginResult = await signIn('credentials', {
        email: registerData.email,
        password: registerData.password,
        redirect: false
      })

      if (loginResult?.error) {
        throw new Error('Registrasi berhasil tapi gagal login. Silakan login manual.')
      }

      // 3. Wait for session to update
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 4. Proceed to checkout (will be handled by the form since session is now active)
      window.location.reload() // Reload to update session state
      
    } catch (error: any) {
      console.error('Error during registration:', error)
      alert(error.message || 'Terjadi kesalahan saat mendaftar')
    } finally {
      setIsRegistering(false)
    }
  }

  const calculateTotal = () => {
    if (!selectedPackage) return 0
    
    let price = selectedPackage.price
    
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        price = price - (price * appliedCoupon.discount / 100)
      } else {
        price = price - appliedCoupon.discount
      }
    }
    
    return Math.max(0, price)
  }

  const handleCheckout = async () => {
    if (!selectedPackage) return

    setProcessing(true)

    try {
      // Determine payment channel based on method
      let channel = paymentChannel
      if (paymentMethod === 'ewallet') {
        channel = paymentChannel // OVO, DANA, etc
      } else if (paymentMethod === 'qris') {
        channel = 'QRIS'
      } else if (paymentMethod === 'retail') {
        channel = paymentChannel // ALFAMART, INDOMARET
      } else if (paymentMethod === 'cardless_credit') {
        channel = paymentChannel // KREDIVO, AKULAKU
      } else if (paymentMethod === 'bank_transfer') {
        channel = paymentChannel // BCA, MANDIRI, BNI, BRI, etc
      }

      console.log('[Checkout Frontend] Sending checkout request:', {
        paymentMethod,
        paymentChannel: channel
      })

      const response = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'membership',
          itemId: selectedPackage.id,
          couponCode: appliedCoupon?.code,
          paymentMethod: paymentMethod,
          paymentChannel: channel,
          customerName: userData.name,
          customerEmail: userData.email,
          customerWhatsapp: userData.whatsapp
        }),
      })

      const data = await response.json()
      
      console.log('[Checkout Frontend] Response:', {
        ok: response.ok,
        status: response.status,
        data: data
      })

      if (response.ok && data.paymentUrl) {
        console.log('[Checkout Frontend] Redirecting to:', data.paymentUrl)
        window.location.href = data.paymentUrl
      } else {
        console.error('[Checkout Frontend] No payment URL or error:', data)
        alert(data.error || 'Gagal memproses pembayaran. Tidak ada URL pembayaran.')
        setProcessing(false)
      }
    } catch (err) {
      console.error('[Checkout Frontend] Exception:', err)
      alert('Terjadi kesalahan saat memproses pembayaran')
      setProcessing(false)
    }
  }

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      'ONE_MONTH': '1 Bulan',
      'THREE_MONTHS': '3 Bulan',
      'SIX_MONTHS': '6 Bulan',
      'TWELVE_MONTHS': '12 Bulan',
      'LIFETIME': 'Lifetime'
    }
    return labels[duration] || duration
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Pilih Paket Membership Anda
            </h1>
            <p className="text-gray-600">
              Pilih paket yang sesuai dengan kebutuhan bisnis ekspor Anda
            </p>
          </div>

          {/* User Info Form */}
          {!session && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">Isi Data Diri</h3>
              <p className="text-sm text-blue-700 mb-4">
                Data ini akan digunakan untuk invoice
              </p>
              
              <div className="space-y-3">
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 hover:bg-gray-50 font-semibold"
                  onClick={() => signIn('google', { callbackUrl: window.location.href })}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Daftar dengan Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-blue-50 px-3 text-gray-500 font-medium">
                      Atau daftar dengan email
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="contoh@gmail.com"
                    required
                  />
                  <p className="text-xs text-orange-600 font-semibold mt-1">
                    ⚠️ Wajib menggunakan email Gmail (@gmail.com)
                  </p>
                </div>
                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={registerData.whatsapp}
                    onChange={(e) => setRegisterData({...registerData, whatsapp: e.target.value, phone: e.target.value})}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                {/* Register Button */}
                <Button 
                  onClick={handleRegisterAndCheckout}
                  disabled={isRegistering || !registerData.name || !registerData.email || !registerData.whatsapp || !registerData.password}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base mt-4"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Mendaftar...
                    </>
                  ) : (
                    'Daftar & Lanjutkan'
                  )}
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-700 text-center">
                  Sudah punya akun?{' '}
                  <button
                    onClick={() => signIn()}
                    className="font-semibold underline hover:text-blue-800"
                  >
                    Login di sini
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* User Info Display for Logged In Users */}
          {session && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Data Pembeli
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{userData.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{userData.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp:</span>
                  <span className="font-medium">{userData.whatsapp || '-'}</span>
                </div>
              </div>

              {!userData.whatsapp && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 font-medium">⚠️ Data tidak lengkap</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Nomor WhatsApp Anda belum terdaftar. Silakan lengkapi profil Anda terlebih dahulu.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard/profile'}
                    className="mt-2 text-xs"
                  >
                    Lengkapi Profil
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Package Selection */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Pilih Durasi</h3>
            <p className="text-sm text-gray-600 mb-4">
              Berlangganan dalam rentang yang kami tawarkan
            </p>

            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPackage?.id === pkg.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPackage?.id === pkg.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedPackage?.id === pkg.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                          {pkg.isBestSeller && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                              Paling Laris
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          🎁 {getDurationLabel(pkg.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <p className="text-xs text-gray-400 line-through">
                          Rp {pkg.originalPrice.toLocaleString('id-ID')}
                        </p>
                      )}
                      <p className="font-bold text-lg text-orange-600">
                        Rp {pkg.price.toLocaleString('id-ID')}
                      </p>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <p className="text-xs text-green-600 font-semibold">
                          Hemat {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features - Show only when selected */}
                  {selectedPackage?.id === pkg.id && pkg.features && pkg.features.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        ✨ Yang kamu dapatkan:
                      </p>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Section */}
          <div className="mb-8">
            <Label className="text-sm font-semibold mb-2 block">Punya Kupon?</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Masukkan kode kupon"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon.code) {
                      setAppliedCoupon(null)
                    }
                  }}
                  className={`pr-10 ${appliedCoupon ? 'border-green-500 bg-green-50' : couponError ? 'border-red-500 bg-red-50' : ''}`}
                />
                {couponChecking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {appliedCoupon && !couponChecking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleValidateCoupon}
                disabled={couponChecking || !couponCode.trim()}
                className="bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {couponChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Terapkan'}
              </Button>
            </div>
            {appliedCoupon && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Kupon "{appliedCoupon.code}" berhasil diterapkan - Hemat {appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discount}%` : `Rp ${appliedCoupon.discount?.toLocaleString('id-ID')}`}
              </p>
            )}
            {couponError && !appliedCoupon && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {couponError}
              </p>
            )}
          </div>

          {/* Summary */}
          {selectedPackage && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Paket</span>
                  <span className="font-medium">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga</span>
                  <span>Rp {selectedPackage.price.toLocaleString('id-ID')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon ({appliedCoupon.code})</span>
                    <span>
                      -{appliedCoupon.discountType === 'PERCENTAGE'
                        ? `${appliedCoupon.discount}%`
                        : `Rp ${appliedCoupon.discount.toLocaleString('id-ID')}`
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Diskon Paket</span>
                  <span>
                    {selectedPackage.originalPrice && selectedPackage.originalPrice > selectedPackage.price
                      ? `${Math.round(((selectedPackage.originalPrice - selectedPackage.price) / selectedPackage.originalPrice) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Selection */}
          <Card 
            className="mb-8 border-2 shadow-lg"
            style={{ borderColor: computed.primary }}
          >
            <div 
              className="p-4 bg-gradient-to-r"
              style={{ 
                backgroundImage: `linear-gradient(to right, ${computed.primaryLight}, ${computed.accent})` 
              }}
            >
              <h3 
                className="font-semibold flex items-center gap-2"
                style={{ color: computed.primary }}
              >
                <CreditCard className="h-5 w-5" />
                Pilih Metode Pembayaran
              </h3>
              <p className="text-sm mt-1" style={{ color: computed.primary, opacity: 0.8 }}>
                Pilih metode pembayaran yang Anda inginkan
              </p>
            </div>
            
            {/* Check if any payment methods are available */}
            {!availablePaymentMethods.enableXendit && 
             !availablePaymentMethods.enableManual && (
              <div className="p-4 m-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ Tidak ada metode pembayaran yang tersedia saat ini. Silakan hubungi admin.
              </div>
            )}
            
            {(availablePaymentMethods.enableXendit || availablePaymentMethods.enableManual) && (
              <div className="p-4 space-y-3">
                {/* Transfer Bank Manual Section */}
                {availablePaymentMethods.enableManual && 
                 availablePaymentMethods.manualBankAccounts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'manual') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('manual')
                          setPaymentMethod('manual')
                          setPaymentChannel(availablePaymentMethods.manualBankAccounts[0]?.bankCode || 'MANUAL')
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
                          {availablePaymentMethods.manualBankAccounts
                            .filter((acc: BankAccount) => acc.isActive)
                            .map((account: BankAccount) => (
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
                                    <img 
                                      src={getLogoUrl(account.bankCode, account.customLogoUrl)} 
                                      alt={account.bankName}
                                      className="max-h-full max-w-full object-contain p-1"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
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
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Virtual Account Section */}
                {availablePaymentMethods.enableXendit && 
                 availablePaymentMethods.xenditChannels.some((ch: PaymentChannel) => ch.type === 'bank_transfer' && ch.isActive) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'bank_transfer') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('bank_transfer')
                          setPaymentMethod('bank_transfer')
                          const firstBank = availablePaymentMethods.xenditChannels.find((ch: PaymentChannel) => ch.type === 'bank_transfer' && ch.isActive)
                          if (firstBank) setPaymentChannel(firstBank.code)
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
                          {availablePaymentMethods.xenditChannels
                            .filter((ch: PaymentChannel) => ch.type === 'bank_transfer' && ch.isActive)
                            .map((channel: PaymentChannel) => (
                              <button
                                key={channel.code}
                                type="button"
                                onClick={() => setPaymentChannel(channel.code)}
                                className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === channel.code ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === channel.code ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-8 flex items-center justify-center mb-1">
                                  <img 
                                    src={getLogoUrl(channel.code, channel.customLogoUrl)}
                                    alt={channel.name}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-1">Virtual Account</p>
                                {paymentChannel === channel.code && (
                                  <div 
                                    className="absolute top-2 right-2 rounded-full p-1"
                                    style={{ backgroundColor: computed.primary }}
                                  >
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* E-Wallet Section */}
                {availablePaymentMethods.enableXendit && 
                 availablePaymentMethods.xenditChannels.some((ch: PaymentChannel) => ch.type === 'ewallet' && ch.isActive) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'ewallet') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('ewallet')
                          setPaymentMethod('ewallet')
                          const firstEwallet = availablePaymentMethods.xenditChannels.find((ch: PaymentChannel) => ch.type === 'ewallet' && ch.isActive)
                          if (firstEwallet) setPaymentChannel(firstEwallet.code)
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">E-Wallet</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'ewallet' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'ewallet' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-3">
                          {availablePaymentMethods.xenditChannels
                            .filter((ch: PaymentChannel) => ch.type === 'ewallet' && ch.isActive)
                            .map((channel: PaymentChannel) => (
                              <button
                                key={channel.code}
                                type="button"
                                onClick={() => setPaymentChannel(channel.code)}
                                className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === channel.code ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === channel.code ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-8 flex items-center justify-center mb-1">
                                  <img 
                                    src={getLogoUrl(channel.code, channel.customLogoUrl)}
                                    alt={channel.name}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                </div>
                                {paymentChannel === channel.code && (
                                  <div 
                                    className="absolute top-2 right-2 rounded-full p-1"
                                    style={{ backgroundColor: computed.primary }}
                                  >
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QRIS Section */}
                {availablePaymentMethods.enableXendit && 
                 availablePaymentMethods.xenditChannels.some((ch: PaymentChannel) => ch.type === 'qris' && ch.isActive) && (
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
                              src={getLogoUrl('QRIS')}
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
                {availablePaymentMethods.enableXendit && 
                 availablePaymentMethods.xenditChannels.some((ch: PaymentChannel) => ch.type === 'retail' && ch.isActive) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'retail') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('retail')
                          setPaymentMethod('retail')
                          const firstRetail = availablePaymentMethods.xenditChannels.find((ch: PaymentChannel) => ch.type === 'retail' && ch.isActive)
                          if (firstRetail) setPaymentChannel(firstRetail.code)
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
                          {availablePaymentMethods.xenditChannels
                            .filter((ch: PaymentChannel) => ch.type === 'retail' && ch.isActive)
                            .map((channel: PaymentChannel) => (
                              <button
                                key={channel.code}
                                type="button"
                                onClick={() => setPaymentChannel(channel.code)}
                                className="relative p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === channel.code ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === channel.code ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-8 flex items-center justify-center mb-1">
                                  <img 
                                    src={getLogoUrl(channel.code, channel.customLogoUrl)}
                                    alt={channel.name}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-1">Bayar di Kasir</p>
                                {paymentChannel === channel.code && (
                                  <div 
                                    className="absolute top-2 right-2 rounded-full p-1"
                                    style={{ backgroundColor: computed.primary }}
                                  >
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PayLater Section */}
                {availablePaymentMethods.enableXendit && 
                 availablePaymentMethods.xenditChannels.some((ch: PaymentChannel) => ch.type === 'cardless_credit' && ch.isActive) && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (expandedSection === 'cardless_credit') {
                          setExpandedSection('')
                        } else {
                          setExpandedSection('cardless_credit')
                          setPaymentMethod('cardless_credit')
                          const firstPaylater = availablePaymentMethods.xenditChannels.find((ch: PaymentChannel) => ch.type === 'cardless_credit' && ch.isActive)
                          if (firstPaylater) setPaymentChannel(firstPaylater.code)
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">PayLater</span>
                      <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expandedSection === 'cardless_credit' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSection === 'cardless_credit' && (
                      <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-3">
                          {availablePaymentMethods.xenditChannels
                            .filter((ch: PaymentChannel) => ch.type === 'cardless_credit' && ch.isActive)
                            .map((channel: PaymentChannel) => (
                              <button
                                key={channel.code}
                                type="button"
                                onClick={() => setPaymentChannel(channel.code)}
                                className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md bg-white dark:bg-gray-800"
                                style={{
                                  borderColor: paymentChannel === channel.code ? computed.primary : '#e5e7eb',
                                  backgroundColor: paymentChannel === channel.code ? computed.primaryBg : undefined,
                                }}
                              >
                                <div className="h-12 flex items-center justify-center mb-2 p-2">
                                  <img 
                                    src={getLogoUrl(channel.code, channel.customLogoUrl)}
                                    alt={channel.name}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-1">Bayar Nanti</p>
                                {paymentChannel === channel.code && (
                                  <div 
                                    className="absolute top-2 right-2 rounded-full p-1"
                                    style={{ backgroundColor: computed.primary }}
                                  >
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={processing || !selectedPackage || !userData.name || !userData.email || !userData.whatsapp}
            className="w-full font-bold py-4 text-lg"
            style={{
              backgroundColor: computed.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = computed.primaryHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = computed.primary
            }}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              `Beli Sekarang - Rp ${calculateTotal().toLocaleString('id-ID')}`
            )}
          </Button>

          {/* Show warning if data incomplete */}
          {(!userData.name || !userData.email || !userData.whatsapp) && (
            <p className="text-center text-sm text-red-600 mt-2">
              ⚠️ Data tidak lengkap. {!userData.whatsapp && 'Nomor WhatsApp diperlukan untuk checkout.'}
            </p>
          )}

          <p className="text-center text-xs text-gray-500 mt-4">
            🔒 Pembayaran aman dengan Xendit
          </p>

          {/* Affiliate Partner Badge */}
          <AffiliatePartnerBadge className="mt-4" />
        </Card>
      </div>
    </div>
  )
}
