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
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [userData, setUserData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    whatsapp: ''
  })
  
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
  
  // Payment method selection - include 'retail' for minimarket payments
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'ewallet' | 'qris' | 'retail' | 'manual'>('bank_transfer')
  const [paymentChannel, setPaymentChannel] = useState<string>('BCA')
  
  // Collapsible sections state
  const [expandedSection, setExpandedSection] = useState<string>('bank_transfer')
  
  // Checkout colors
  const { colors, computed } = useCheckoutColors()

  useEffect(() => {
    fetchPackages()
    fetchPaymentMethods()
  }, [searchParams]) // Add searchParams dependency

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
      
      if (data.success) {
        const xenditChannels = data.data.xendit.channels || []
        const manualBankAccounts = data.data.manual.bankAccounts || []
        const enableManual = data.data.manual.enabled
        const enableXendit = data.data.xendit.enabled

        setAvailablePaymentMethods({
          xenditChannels,
          manualBankAccounts,
          enableManual,
          enableXendit
        })

        // Auto-select first available payment method
        if (enableXendit && xenditChannels.length > 0) {
          const firstBankTransfer = xenditChannels.find((ch: PaymentChannel) => ch.type === 'bank_transfer' && ch.isActive)
          if (firstBankTransfer) {
            setPaymentMethod('bank_transfer')
            setPaymentChannel(firstBankTransfer.code)
          }
        } else if (enableManual && manualBankAccounts.length > 0) {
          setPaymentMethod('manual')
          setPaymentChannel(manualBankAccounts[0].bankCode)
        }
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err)
    }
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
                <div>
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                    placeholder="Nama Administrator"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    placeholder="admin@eksporyuk.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={userData.whatsapp}
                    onChange={(e) => setUserData({...userData, whatsapp: e.target.value})}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-700">
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
            <Label className="text-sm font-semibold mb-2 block">Punya Kupon</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Kode kupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleValidateCoupon}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Validasi
              </Button>
            </div>
            {appliedCoupon && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Kupon "{appliedCoupon.code}" berhasil diterapkan
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
