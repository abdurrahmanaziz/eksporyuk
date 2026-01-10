'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'

interface MembershipPackage {
  id: string
  name: string
  duration: string
  price: number
  originalPrice: number | null
  features: string[]
  checkoutSlug: string
  formLogo?: string | null
  formBanner?: string | null
  formDescription?: string | null
}

interface Coupon {
  code: string
  discount: number
  discountType: 'PERCENTAGE' | 'FIXED'
}

export default function BeliPaketPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [selectedDuration, setSelectedDuration] = useState<string>('')
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [manualCouponCode, setManualCouponCode] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'register' | null>(null)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: ''
  })
  const [currentFormSettings, setCurrentFormSettings] = useState<{
    formLogo?: string | null
    formBanner?: string | null
    formDescription?: string | null
  } | null>(null)
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false)

  // Check if Google OAuth is enabled
  useEffect(() => {
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => setGoogleAuthEnabled(data.google || false))
      .catch(() => setGoogleAuthEnabled(false))
  }, [])

  // Load packages
  useEffect(() => {
    fetchPackages()
  }, [])

  // Update form settings when package is selected
  useEffect(() => {
    if (selectedPackage) {
      setCurrentFormSettings({
        formLogo: selectedPackage.formLogo,
        formBanner: selectedPackage.formBanner,
        formDescription: selectedPackage.formDescription
      })
    } else {
      setCurrentFormSettings(null)
    }
  }, [selectedPackage])

  // Auto-apply coupon when package is selected
  useEffect(() => {
    if (selectedPackage) {
      autoApplyCoupon(selectedPackage.id)
    }
  }, [selectedPackage])

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/memberships/packages')
      const data = await res.json()
      if (data.success) {
        setPackages(data.packages)
        setLoading(false)
      }
    } catch (err) {
      setError('Gagal memuat paket')
      setLoading(false)
    }
  }

  const autoApplyCoupon = async (membershipId: string) => {
    try {
      const res = await fetch(`/api/coupons/auto-apply?membershipId=${membershipId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.coupon) {
          setAppliedCoupon(data.coupon)
        }
      }
    } catch (err) {
      console.log('No auto-apply coupon available')
    }
  }

  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration)
    const pkg = packages.find(p => p.duration === duration)
    setSelectedPackage(pkg || null)
    setAppliedCoupon(null)
    setManualCouponCode('')
    setCouponError('')
  }

  const handleApplyCoupon = async () => {
    if (!manualCouponCode.trim()) {
      setCouponError('Masukkan kode kupon')
      return
    }

    if (!selectedPackage) {
      setCouponError('Pilih paket terlebih dahulu')
      return
    }

    setApplyingCoupon(true)
    setCouponError('')

    try {
      const res = await fetch(`/api/coupons/validate?code=${manualCouponCode}&membershipId=${selectedPackage.id}`)
      const data = await res.json()

      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount: data.coupon.discount,
          discountType: data.coupon.discountType
        })
        setCouponError('')
      } else {
        setCouponError(data.error || 'Kupon tidak valid')
        setAppliedCoupon(null)
      }
    } catch (err) {
      setCouponError('Gagal memvalidasi kupon')
      setAppliedCoupon(null)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setManualCouponCode('')
    setCouponError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthLoading(true)
    setAuthError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setAuthError('Email atau password salah')
      } else {
        // Login successful, reload to show logged in state
        window.location.reload()
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan sistem')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthLoading(true)
    setAuthError('')

    if (!formData.name || !formData.email || !formData.whatsapp || !formData.password) {
      setAuthError('Semua field wajib diisi')
      setIsAuthLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setAuthError('Password minimal 8 karakter')
      setIsAuthLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Auto login after registration
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (!result?.error) {
          // Registration and login successful, reload to show logged in state
          window.location.reload()
        } else {
          setAuthError('Registrasi berhasil, silakan login manual')
        }
      } else {
        setAuthError(data.error || 'Gagal mendaftar')
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan sistem')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      'ONE_MONTH': '1 bulan',
      'THREE_MONTHS': '3 bulan',
      'SIX_MONTHS': '6 bulan',
      'TWELVE_MONTHS': '12 bulan',
      'LIFETIME': 'Lifetime'
    }
    return labels[duration] || duration
  }

  const calculateFinalPrice = () => {
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
    if (!session) {
      router.push('/login?callbackUrl=/beli-paket')
      return
    }

    if (!selectedPackage) {
      setError('Pilih paket terlebih dahulu')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'membership',
          itemId: selectedPackage.id,
          couponCode: appliedCoupon?.code,
          paymentMethod: 'XENDIT',
        }),
      })

      const data = await response.json()

      if (response.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Gagal memproses pembayaran')
        setProcessing(false)
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memproses pembayaran')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat paket...</p>
        </div>
      </div>
    )
  }

  // Get unique durations
  const durations = Array.from(new Set(packages.map(p => p.duration)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo (if available from selected package) */}
        {currentFormSettings?.formLogo && (
          <div className="text-center mb-6">
            <img 
              src={currentFormSettings.formLogo} 
              alt="Logo"
              className="h-16 md:h-20 mx-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Banner (if available from selected package) */}
        {currentFormSettings?.formBanner && (
          <div className="mb-6">
            <img 
              src={currentFormSettings.formBanner} 
              alt="Banner"
              className="w-full max-h-48 object-cover rounded-lg shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Custom Description (if available from selected package) */}
        {currentFormSettings?.formDescription && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 text-center">
              {currentFormSettings.formDescription}
            </p>
          </div>
        )}

        <Card className="p-6 md:p-8">
          {/* Step 1: Login/Register (Required First) */}
          {!session ? (
            <>
              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-center">Masuk atau Daftar</h3>
                <p className="text-gray-600 text-center mb-6">
                  Anda harus login terlebih dahulu sebelum memilih paket
                </p>
                
                {/* Quick Login/Register dengan Google */}
                {googleAuthEnabled && (
                  <>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-3 text-center">
                        💡 <strong>Checkout lebih cepat:</strong> Login atau daftar dengan Google
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => signIn('google', { callbackUrl: '/beli-paket' })}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Login dengan Google
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-blue-50 px-2 text-gray-500">Atau isi manual</span>
                        </div>
                      </div>

                      {/* Toggle Login/Register */}
                      {!showAuthForm && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="default"
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                              setShowAuthForm('register')
                              setAuthError('')
                            }}
                          >
                            Daftar Baru
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                              setShowAuthForm('login')
                              setAuthError('')
                            }}
                          >
                            Login
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Manual Login/Register buttons when Google is disabled */}
                {!googleAuthEnabled && !showAuthForm && (
                  <div className="mb-6 flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        setShowAuthForm('register')
                        setAuthError('')
                      }}
                    >
                      Daftar Baru
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        setShowAuthForm('login')
                        setAuthError('')
                      }}
                    >
                      Login
                    </Button>
                  </div>
                )}

                {/* Login Form */}
                {showAuthForm === 'login' && (
                  <form onSubmit={handleLogin} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Login</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAuthForm(null)}
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Masukkan password"
                          required
                        />
                      </div>

                      {authError && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                          {authError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                        disabled={isAuthLoading}
                      >
                        {isAuthLoading ? 'Memproses...' : 'Login Sekarang'}
                      </Button>

                      <div className="text-center text-sm">
                        <span className="text-gray-600">Belum punya akun? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAuthForm('register')
                            setAuthError('')
                            setFormData({ ...formData, password: '' })
                          }}
                          className="text-orange-600 hover:underline font-semibold"
                        >
                          Daftar di sini
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Register Form */}
                {showAuthForm === 'register' && (
                  <form onSubmit={handleRegister} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Daftar Akun Baru</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAuthForm(null)}
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="register-name">Nama Lengkap *</Label>
                        <Input
                          id="register-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Nama lengkap Anda"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-email">Email *</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-whatsapp">Nomor WhatsApp *</Label>
                        <Input
                          id="register-whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-password">Password *</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Minimal 8 karakter"
                          required
                          minLength={8}
                        />
                      </div>

                      {authError && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                          {authError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                        disabled={isAuthLoading}
                      >
                        {isAuthLoading ? 'Memproses...' : 'Daftar Sekarang'}
                      </Button>

                      <div className="text-center text-sm">
                        <span className="text-gray-600">Sudah punya akun? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAuthForm('login')
                            setAuthError('')
                            setFormData({ ...formData, password: '' })
                          }}
                          className="text-orange-600 hover:underline font-semibold"
                        >
                          Login di sini
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Preview Paket (Disabled) */}
              <div className="opacity-50 pointer-events-none">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-400">2</span>
                    </div>
                    <Label className="text-lg font-semibold text-gray-400">
                      Pilih Durasi Paket
                    </Label>
                  </div>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    disabled
                  >
                    <option>Login terlebih dahulu untuk memilih paket...</option>
                  </select>
                </div>

                {/* Show packages preview */}
                <div className="space-y-4">
                  {packages.slice(0, 3).map((pkg) => (
                    <div key={pkg.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-400">
                            {pkg.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {getDurationLabel(pkg.duration)}
                          </p>
                        </div>
                        <div className="text-right">
                          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                            <p className="text-xs text-gray-400 line-through">
                              Rp {pkg.originalPrice.toLocaleString('id-ID')}
                            </p>
                          )}
                          <p className="text-xl font-bold text-gray-400">
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {pkg.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {pkg.features.length > 3 && (
                          <p className="text-xs text-gray-400 pl-6">
                            +{pkg.features.length - 3} benefit lainnya
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {packages.length > 3 && (
                    <p className="text-center text-sm text-gray-400">
                      Dan {packages.length - 3} paket lainnya...
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              {/* Step 2: Pilih Durasi (Only show when logged in) */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <Label className="text-lg font-semibold">
                    Pilih Durasi Paket
                  </Label>
                </div>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedDuration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                >
                  <option value="">Pilih durasi paket...</option>
                  {durations.map(duration => (
                    <option key={duration} value={duration}>
                      {getDurationLabel(duration)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Tampilkan Benefit (Only when logged in and package selected) */}
              {selectedPackage && (
                <div className="mb-8 animate-fadeIn">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedPackage.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getDurationLabel(selectedPackage.duration)}
                        </p>
                      </div>
                      <div className="text-right">
                        {selectedPackage.originalPrice && selectedPackage.originalPrice > selectedPackage.price && (
                          <p className="text-sm text-gray-500 line-through">
                            Rp {selectedPackage.originalPrice.toLocaleString('id-ID')}
                          </p>
                        )}
                        <p className="text-3xl font-bold text-blue-600">
                          Rp {selectedPackage.price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500">/ {getDurationLabel(selectedPackage.duration).toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                      {selectedPackage.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <p className="text-gray-700 text-sm">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Auto-Applied Coupon OR Manual Coupon Input */}
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">
                              Kupon Diterapkan
                            </p>
                            <p className="text-sm text-green-700">
                              Kode: <span className="font-mono font-bold">{appliedCoupon.code}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-700">Diskon</p>
                          <p className="font-bold text-green-600">
                            {appliedCoupon.discountType === 'PERCENTAGE' 
                              ? `${appliedCoupon.discount}%`
                              : `Rp ${appliedCoupon.discount.toLocaleString('id-ID')}`
                            }
                          </p>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-xs text-red-600 hover:text-red-700 mt-1"
                          >
                            Hapus kupon
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <Label className="text-sm font-semibold mb-2 block">
                        Punya kode kupon? (Opsional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Masukkan kode kupon"
                          value={manualCouponCode}
                          onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyCoupon()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon || !manualCouponCode.trim()}
                        >
                          {applyingCoupon ? 'Validasi...' : 'Terapkan'}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600 mt-2">{couponError}</p>
                      )}
                    </div>
                  )}

                  {/* Step 5: Price Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Harga paket</span>
                        <span>Rp {selectedPackage.price.toLocaleString('id-ID')}</span>
                      </div>
                      
                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Diskon ({appliedCoupon.code})</span>
                          <span>
                            -{appliedCoupon.discountType === 'PERCENTAGE' 
                              ? `${appliedCoupon.discount}%`
                              : `Rp ${appliedCoupon.discount.toLocaleString('id-ID')}`
                            }
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total Bayar</span>
                          <span className="text-blue-600">
                            Rp {calculateFinalPrice().toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 6: Checkout Button */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-3"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Memproses pembayaran...
                      </>
                    ) : (
                      `Bayar Sekarang - Rp ${calculateFinalPrice().toLocaleString('id-ID')}`
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}