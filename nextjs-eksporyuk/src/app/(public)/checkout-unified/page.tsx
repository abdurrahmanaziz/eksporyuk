'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check, Lock, CreditCard, Wallet, CheckCircle, Building, Clock } from 'lucide-react'
import Link from 'next/link'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface MembershipPackage {
  id: string
  slug?: string
  name: string
  duration: string
  price: number
  marketingPrice?: number | null
  features: string[]
  isPopular?: boolean
  isMostPopular?: boolean
  formLogo?: string | null
  formBanner?: string | null
  formDescription?: string | null
}

function UnifiedCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(searchParams.get('package') || '')
  const [affiliateRef, setAffiliateRef] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'register' | null>(null)
  const [authError, setAuthError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [isCouponApplied, setIsCouponApplied] = useState(false)

  // Payment channel state
  const [paymentChannel, setPaymentChannel] = useState<string>('BCA')

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
  })

  // Helper function to convert duration to readable format
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

  // Fetch packages from database
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/memberships/packages')
        const data = await response.json()
        
        if (data.success && data.packages) {
          setPackages(data.packages)
          
          // Set selected package from URL (can be slug or ID)
          const packageFromUrl = searchParams.get('package')
          if (packageFromUrl) {
            // Try to find by slug first, then by ID
            const foundPackage = data.packages.find((p: MembershipPackage) => 
              p.slug === packageFromUrl || p.id === packageFromUrl
            )
            if (foundPackage) {
              setSelectedPackage(foundPackage.id)
            } else {
              setSelectedPackage(packageFromUrl) // Fallback to URL value
            }
          } else if (data.packages.length > 0) {
            // Select first package as default
            setSelectedPackage(data.packages[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error)
      } finally {
        setIsLoadingPackages(false)
      }
    }

    fetchPackages()
  }, [searchParams])

  useEffect(() => {
    // REDIRECT LOGIC: If ref present, check if it's for membership → redirect to /membership/[slug]
    const refFromUrl = searchParams.get('ref')
    const couponFromUrl = searchParams.get('coupon')
    
    if (refFromUrl) {
      // Track click for direct checkout links
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: refFromUrl }),
      }).catch(err => console.error('Failed to track click:', err))
      
      // Check affiliate link to see if it's for a membership
      fetch(`/api/affiliate/by-code?code=${refFromUrl}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.affiliateLink?.membershipId) {
            // This is a membership affiliate link
            // Get membership slug
            fetch(`/api/memberships/packages`)
              .then(res => res.json())
              .then(packagesData => {
                if (packagesData.success) {
                  const membership = packagesData.packages.find(
                    (p: MembershipPackage) => p.id === data.affiliateLink.membershipId
                  )
                  
                  if (membership?.slug) {
                    // Redirect to membership detail page
                    const redirectUrl = new URL(`/membership/${membership.slug}`, window.location.origin)
                    redirectUrl.searchParams.append('ref', refFromUrl)
                    if (couponFromUrl) {
                      redirectUrl.searchParams.append('coupon', couponFromUrl)
                    }
                    
                    console.log('🔄 Redirecting to membership page:', redirectUrl.toString())
                    window.location.href = redirectUrl.toString()
                    return // Stop further execution
                  }
                }
              })
              .catch(err => console.error('Failed to fetch membership:', err))
          }
        })
        .catch(err => console.error('Failed to fetch affiliate link:', err))
    }
    
    // Continue with normal checkout flow if no redirect
    const refFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('affiliate_ref='))
      ?.split('=')[1]
    
    // Also check for direct coupon code in cookie
    const couponFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('affiliate_coupon='))
      ?.split('=')[1]
    
    const effectiveRef = refFromUrl || refFromCookie || ''
    const effectiveCoupon = couponFromUrl || couponFromCookie || ''
    
    // Auto-apply coupon logic
    if (effectiveCoupon) {
      // Direct coupon code provided
      setCouponCode(effectiveCoupon)
      setTimeout(() => {
        applyCouponAutomatically(effectiveCoupon)
      }, 800)
    } else if (effectiveRef) {
      // Try to get coupon from affiliate ref
      setAffiliateRef(effectiveRef)
      fetchAndApplyCouponFromRef(effectiveRef)
    }

    // Auto-fill if logged in
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        whatsapp: (session.user as any).whatsapp || '',
        password: '',
      })
      setShowAuthForm(null) // Hide auth forms if logged in
    }
  }, [searchParams, session, packages])

  // Fetch and auto-apply coupon from affiliate ref
  const fetchAndApplyCouponFromRef = async (ref: string) => {
    if (!ref || isCouponApplied) return

    try {
      // Fetch affiliate link to get couponCode
      const response = await fetch(`/api/affiliate/by-code?code=${ref}`)
      const data = await response.json()
      
      if (data.success && data.affiliateLink?.couponCode) {
        const couponCode = data.affiliateLink.couponCode
        
        // Validate coupon exists in Coupon table
        const couponValidation = await fetch(`/api/coupons/validate?code=${couponCode}`)
        const couponData = await couponValidation.json()
        
        // Only apply if coupon exists and is valid
        if (couponData.success && couponData.coupon) {
          setCouponCode(couponCode)
          
          // Auto-apply
          setTimeout(() => {
            applyCouponAutomatically(couponCode)
          }, 500)
        }
      }
    } catch (error) {
      console.error('Failed to fetch coupon from ref:', error)
    }
  }

  // Auto-apply coupon function
  const applyCouponAutomatically = async (code: string) => {
    if (!code.trim() || isCouponApplied) return

    try {
      const response = await fetch(`/api/coupons/validate?code=${code}`)
      const data = await response.json()

      if (data.success && data.coupon) {
        const coupon = data.coupon
        const currentPkg = packages.find(p => p.id === selectedPackage)
        
        if (currentPkg) {
          const discountAmount = coupon.type === 'percentage' 
            ? (currentPkg.price * coupon.discount) / 100
            : coupon.discount

          // Update coupon code in input field
          setCouponCode(code.toUpperCase())
          setCouponDiscount(discountAmount)
          setIsCouponApplied(true)
          setCouponError('')
        }
      }
    } catch (error) {
      console.error('Failed to auto-apply coupon:', error)
    }
  }

  // Compute selected package with proper reactivity
  const selectedPkg = useMemo(() => {
    const pkg = packages.find(p => p.id === selectedPackage)
    console.log('🔍 Selected Package Debug:', {
      selectedPackage,
      packagesCount: packages.length,
      found: pkg?.name || 'NOT FOUND',
      allPackageIds: packages.map(p => ({ id: p.id, slug: p.slug, name: p.name }))
    })
    return pkg
  }, [packages, selectedPackage])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
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
        setShowAuthForm(null)
        // Data will auto-fill from session
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan sistem')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError('')

    // Validation
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.password) {
      setAuthError('Semua field wajib diisi')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setAuthError('Password minimal 8 karakter')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Auto login after register
        const loginResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (!loginResult?.error) {
          setShowAuthForm(null)
          showNotification('Registrasi berhasil! Silakan lanjutkan checkout.', 'success')
        }
      } else {
        setAuthError(data.error || 'Gagal registrasi')
      }
    } catch (error) {
      setAuthError('Terjadi kesalahan sistem')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Masukkan kode kupon')
      return
    }

    setIsLoading(true)
    setCouponError('')

    try {
      // Validate coupon from database API - NO hardcoded coupons
      const response = await fetch(`/api/coupons/validate?code=${couponCode}`)
      const data = await response.json()

      if (data.success && data.coupon) {
        const coupon = data.coupon
        const currentPkg = packages.find(p => p.id === selectedPackage)
        
        if (currentPkg) {
          const discountAmount = coupon.type === 'percentage' 
            ? (currentPkg.price * coupon.discount) / 100
            : coupon.discount

          setCouponDiscount(discountAmount)
          setIsCouponApplied(true)
          setCouponError('')
          showNotification(`✅ Kupon berhasil diterapkan! Diskon Rp ${discountAmount.toLocaleString('id-ID')}`, 'success')
        }
      } else {
        // Kupon tidak ditemukan atau tidak valid
        setCouponError(data.error || 'Kode kupon tidak valid atau belum di-generate')
        setCouponDiscount(0)
        setIsCouponApplied(false)
      }
    } catch (error) {
      setCouponError('Gagal memvalidasi kupon')
      setCouponDiscount(0)
      setIsCouponApplied(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponDiscount(0)
    setIsCouponApplied(false)
    setCouponError('')
  }

  // Show loading state while fetching packages
  if (isLoadingPackages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat paket membership...</p>
        </div>
      </div>
    )
  }

  // Check if packages are empty
  if (packages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Belum Ada Paket</h2>
          <p className="text-gray-600 mb-4">Belum ada paket membership yang tersedia</p>
          <a href="/" className="text-orange-600 hover:underline">Kembali ke beranda</a>
        </div>
      </div>
    )
  }

  // Package not found error - check after loading complete
  if (!selectedPkg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Paket tidak ditemukan</h2>
          <p className="text-gray-600 mb-2">ID/Slug yang dicari: <code className="bg-gray-100 px-2 py-1 rounded">{selectedPackage}</code></p>
          <p className="text-sm text-gray-500 mb-4">Paket yang tersedia:</p>
          <ul className="text-sm text-left bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
            {packages.map(pkg => (
              <li key={pkg.id} className="border-b border-gray-200 pb-2 last:border-0">
                <div className="font-semibold">{pkg.name}</div>
                <div className="text-xs text-gray-500">ID: {pkg.id}</div>
                <div className="text-xs text-gray-500">Slug: {pkg.slug || 'No slug'}</div>
              </li>
            ))}
          </ul>
          <a href="/" className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">Kembali ke beranda</a>
        </div>
      </div>
    )
  }
  
  const finalPrice = selectedPkg.price - couponDiscount

  const handleCheckout = async () => {
    // Auto-fill from session if user is logged in
    if (session?.user && (!formData.name || !formData.email)) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        whatsapp: (session.user as any).whatsapp || '',
        password: '',
      })
    }

    // Validation
    if (!formData.name || !formData.email) {
      showNotification('Mohon lengkapi data Anda', 'error')
      return
    }

    // WhatsApp wajib untuk semua user (untuk follow up pembayaran)
    if (!formData.whatsapp) {
      showNotification('Nomor WhatsApp wajib diisi untuk follow up pembayaran', 'error')
      return
    }

    // Update nomor WhatsApp di database jika user sudah login tapi belum punya nomor
    if (session?.user && !(session.user as any).whatsapp) {
      try {
        await fetch('/api/user/update-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whatsapp: formData.whatsapp }),
        })
      } catch (error) {
        console.error('Failed to update WhatsApp:', error)
      }
    }

    setIsLoading(true)

    try {
      // Get selected package data
      const selectedPkg = packages.find(p => p.id === selectedPackage)
      if (!selectedPkg) {
        showNotification('Paket tidak ditemukan', 'error')
        return
      }

      // Calculate final amount with coupon
      let finalAmount = Number(selectedPkg.price)
      if (isCouponApplied && couponDiscount > 0) {
        finalAmount = finalAmount - couponDiscount
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MEMBERSHIP',
          membershipId: selectedPackage,
          amount: selectedPkg.price, // Original amount sebelum diskon
          customerData: {
            name: formData.name,
            email: formData.email,
            phone: formData.whatsapp,
            whatsapp: formData.whatsapp,
          },
          couponCode: isCouponApplied ? couponCode : undefined,
          affiliateCode: affiliateRef || undefined,
          paymentMethod: paymentMethod, // bank_transfer, ewallet, qris, retail, paylater
          paymentChannel: paymentChannel, // BCA, GOPAY, QRIS, ALFAMART, KREDIVO, dll
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Show success message briefly
        showNotification(`✅ Transaksi berhasil! Order ID: ${data.transactionId}`, 'success')
        
        // Redirect to Xendit payment page after 1 second
        setTimeout(() => {
          if (data.paymentUrl) {
            window.location.href = data.paymentUrl
          } else {
            router.push(`/payment/va/${data.transactionId}`)
          }
        }, 1000)
      } else {
        showNotification('Gagal memproses transaksi: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      showNotification('Terjadi kesalahan sistem', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Toast notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }
    
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in`
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' : 
            type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' :
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'}
        </svg>
        <span>${message}</span>
      </div>
    `
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  const showXenditPaymentMethods = (transaction: any) => {
    // Create modal with Xendit payment options
    const modal = document.createElement('div')
    modal.id = 'xendit-modal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Pilih Metode Pembayaran</h2>
          <button onclick="document.getElementById('xendit-modal').remove()" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="width" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600">Total Pembayaran</div>
          <div class="text-2xl font-bold text-orange-600">Rp ${transaction.amount.toLocaleString('id-ID')}</div>
          <div class="text-xs text-gray-500 mt-1">Order ID: ${transaction.id}</div>
        </div>

        <div class="space-y-3">
          <!-- Bank Transfer -->
          <button onclick="window.handlePaymentMethod('bank_transfer', '${transaction.id}')" class="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold">Transfer Bank</div>
                <div class="text-sm text-gray-600">BCA, Mandiri, BNI, BRI, Permata</div>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <!-- E-Wallet -->
          <button onclick="window.handlePaymentMethod('ewallet', '${transaction.id}')" class="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold">E-Wallet</div>
                <div class="text-sm text-gray-600">OVO, GoPay, Dana, LinkAja, ShopeePay</div>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <!-- QRIS -->
          <button onclick="window.handlePaymentMethod('qris', '${transaction.id}')" class="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold">QRIS</div>
                <div class="text-sm text-gray-600">Scan QR untuk bayar dengan semua e-wallet</div>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <!-- Credit Card -->
          <button onclick="window.handlePaymentMethod('credit_card', '${transaction.id}')" class="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-orange-500 transition-all">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold">Kartu Kredit/Debit</div>
                <div class="text-sm text-gray-600">Visa, Mastercard, JCB, Amex</div>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <div class="mt-6 text-center text-xs text-gray-500">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Pembayaran aman dengan Xendit
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // Handle payment method selection
    ;(window as any).handlePaymentMethod = (method: string, transactionId: string) => {
      modal.remove()
      
      // Show success notification instead of alert
      const successToast = document.createElement('div')
      successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md'
      successToast.innerHTML = `
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div class="font-bold mb-1">✅ Transaksi Berhasil Dibuat!</div>
            <div class="text-sm space-y-1">
              <div>Order ID: <strong>${transactionId}</strong></div>
              <div>Total: <strong>Rp ${transaction.amount.toLocaleString('id-ID')}</strong></div>
              <div class="mt-2 pt-2 border-t border-green-400">Silakan lanjutkan pembayaran melalui metode yang dipilih.</div>
            </div>
          </div>
        </div>
      `
      document.body.appendChild(successToast)
      
      setTimeout(() => {
        successToast.style.opacity = '0'
        successToast.style.transition = 'opacity 0.3s'
        setTimeout(() => {
          successToast.remove()
          router.push('/')
        }, 300)
      }, 5000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo (if available from selected package) */}
        {selectedPkg?.formLogo && (
          <div className="text-center mb-6">
            <img 
              src={selectedPkg.formLogo} 
              alt="Logo"
              className="h-16 md:h-20 mx-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Banner (if available from selected package) */}
        {selectedPkg?.formBanner && (
          <div className="mb-6">
            <img 
              src={selectedPkg.formBanner} 
              alt="Banner"
              className="w-full max-h-48 object-cover rounded-lg shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Custom Description (if available from selected package) */}
        {selectedPkg?.formDescription && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 text-center">
              {selectedPkg.formDescription}
            </p>
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* User Data Form */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Isi Data Diri</h3>
              
              {/* Quick Login/Register dengan Google */}
              {!session && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    💡 <strong>Checkout lebih cepat:</strong> Login atau daftar dengan Google
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn('google', { callbackUrl: `/checkout-unified?package=${selectedPackage}${affiliateRef ? `&ref=${affiliateRef}` : ''}` })}
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
              )}

              {/* Login Form */}
              {showAuthForm === 'login' && (
                <form onSubmit={handleLogin} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Memproses...' : 'Login Sekarang'}
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
                <form onSubmit={handleRegister} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Mendaftar...' : 'Daftar & Lanjutkan'}
                    </Button>

                    <div className="text-center text-sm">
                      <span className="text-gray-600">Sudah punya akun? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAuthForm('login')
                          setAuthError('')
                        }}
                        className="text-orange-600 hover:underline font-semibold"
                      >
                        Login di sini
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* User logged in status - No form fields shown */}
              {session && (
                <div className="mb-4 space-y-3">
                  <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-green-800 font-semibold">
                          ✓ Anda sudah login sebagai <strong>{session.user.name}</strong>
                        </div>
                        <div className="text-xs text-green-700">{session.user.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      📱 Diperlukan untuk konfirmasi pembayaran & follow up dari tim kami
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Package Selection */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Pilih Durasi</h3>
              <div className="space-y-3">
                {packages.map((pkg) => {
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPackage === pkg.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={selectedPackage === pkg.id}
                            onChange={() => setSelectedPackage(pkg.id)}
                            className="w-5 h-5"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{pkg.name}</span>
                              {(pkg.isPopular || pkg.isMostPopular) && (
                                <Badge className="bg-orange-500 text-xs">Paling Laris</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="text-gray-500">{getDurationLabel(pkg.duration)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {pkg.marketingPrice && Number(pkg.marketingPrice) > 0 && (
                            <div className="text-sm text-gray-400 line-through mb-1">
                              Rp {Number(pkg.marketingPrice).toLocaleString('id-ID')}
                            </div>
                          )}
                          <div className="text-2xl font-bold text-orange-600">
                            Rp {Number(pkg.price).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}  
              </div>
            </div>

            {/* Payment Method Selection - REDESIGNED */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Metode Pembayaran</h3>
              
              {/* Bank Transfer (Virtual Account) */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(paymentMethod === 'bank_transfer' ? '' : 'bank_transfer')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Bank Transfer</div>
                      <div className="text-xs text-gray-500">Virtual Account - Instant</div>
                    </div>
                  </div>
                  <div className={`transform transition-transform ${paymentMethod === 'bank_transfer' ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
                
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-3 p-4 border-2 border-orange-100 rounded-lg bg-orange-50/30">
                    <p className="text-sm text-gray-600 mb-3">
                      Pilih bank untuk mendapatkan nomor Virtual Account
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { code: 'BCA', name: 'BCA', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
                        { code: 'BRI', name: 'BRI', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg' },
                        { code: 'PERMATA', name: 'Permata Bank', logo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhyLSVZ5FZPqLvxOLjBjJQxDLjkTLHhQxVTy0Sg5xJ5K5cqrpqRqJ6TQxDvqvRqZxKxN5kFH5g5n5j5B5V5n5_5e5W5T5f5M5Q5B5R5/s1600/permatabank-logo.png' },
                        { code: 'BNI', name: 'BNI', logo: 'https://www.freepnglogos.com/uploads/bni-png-logo/bank-negara-indonesia-bni-logo-png-8.png' },
                        { code: 'MANDIRI', name: 'Mandiri', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg' },
                        { code: 'SAHABAT_SAMPOERNA', name: 'Bank Sampoerna', logo: 'https://www.freepnglogos.com/uploads/bank-logo-png/bank-sahabat-sampoerna-logo-png-25.png' },
                        { code: 'CIMB', name: 'CIMB Niaga', logo: 'https://www.freepnglogos.com/uploads/cimb-logo-png/cimb-niaga-logo-png-transparent-svg-vector-freebie-supply-9.png' },
                        { code: 'BSI', name: 'BSI', logo: 'https://www.freepnglogos.com/uploads/bsi-logo-png/bank-syariah-indonesia-bsi-logo-png-0.png' },
                        { code: 'BJB', name: 'BJB', logo: 'https://www.freepnglogos.com/uploads/bank-logo-png/bank-bjb-logo-png-transparent-svg-vector-freebie-supply-6.png' },
                      ].map((bank) => (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => setPaymentChannel(bank.code)}
                          className={`relative p-3 border-2 rounded-lg transition-all ${
                            paymentChannel === bank.code
                              ? 'border-orange-500 bg-white shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {paymentChannel === bank.code && (
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <div className="h-8 flex items-center justify-center">
                            {bank.logo ? (
                              <img 
                                src={bank.logo} 
                                alt={bank.name}
                                className="max-h-7 max-w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const parent = e.currentTarget.parentElement as HTMLElement
                                  if (parent) {
                                    parent.innerHTML = `<div class="text-sm font-bold text-gray-700">${bank.name}</div>`
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-sm font-bold text-gray-700">{bank.name}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {paymentChannel && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        ✓ {paymentChannel} dipilih - Nomor VA akan diberikan setelah checkout
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Retail Outlet */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(paymentMethod === 'retail' ? '' : 'retail')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Retail Outlet</div>
                      <div className="text-xs text-gray-500">Alfamart, Indomaret - Instant</div>
                    </div>
                  </div>
                  <div className={`transform transition-transform ${paymentMethod === 'retail' ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
                
                {paymentMethod === 'retail' && (
                  <div className="mt-3 p-4 border-2 border-orange-100 rounded-lg bg-orange-50/30">
                    <p className="text-sm text-gray-600 mb-3">
                      Pilih retail outlet untuk pembayaran
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'ALFAMART', name: 'Alfamart', logo: 'https://www.freepnglogos.com/uploads/alfamart-png-logo/alfamart-logo-png-1.png' },
                        { code: 'INDOMARET', name: 'Indomaret', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png' },
                      ].map((retail) => (
                        <button
                          key={retail.code}
                          type="button"
                          onClick={() => setPaymentChannel(retail.code)}
                          className={`relative p-4 border-2 rounded-lg transition-all ${
                            paymentChannel === retail.code
                              ? 'border-orange-500 bg-white shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {paymentChannel === retail.code && (
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <div className="h-10 flex items-center justify-center">
                            <img 
                              src={retail.logo} 
                              alt={retail.name}
                              className="max-h-8 max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'block'
                              }}
                            />
                            <div className="text-center font-semibold hidden">{retail.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* E-Wallet */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(paymentMethod === 'ewallet' ? '' : 'ewallet')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">E-Wallet</div>
                      <div className="text-xs text-gray-500">OVO, GoPay, DANA - Instant</div>
                    </div>
                  </div>
                  <div className={`transform transition-transform ${paymentMethod === 'ewallet' ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
                
                {paymentMethod === 'ewallet' && (
                  <div className="mt-3 p-4 border-2 border-orange-100 rounded-lg bg-orange-50/30">
                    <p className="text-sm text-gray-600 mb-3">
                      Pilih e-wallet untuk pembayaran
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'OVO', name: 'OVO', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg' },
                        { code: 'GOPAY', name: 'GoPay', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' },
                        { code: 'DANA', name: 'DANA', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg' },
                        { code: 'LINKAJA', name: 'LinkAja', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg' },
                        { code: 'SHOPEEPAY', name: 'ShopeePay', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg' },
                      ].map((wallet) => (
                        <button
                          key={wallet.code}
                          type="button"
                          onClick={() => setPaymentChannel(wallet.code)}
                          className={`relative p-4 border-2 rounded-lg transition-all ${
                            paymentChannel === wallet.code
                              ? 'border-orange-500 bg-white shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {paymentChannel === wallet.code && (
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <div className="h-10 flex items-center justify-center">
                            <img 
                              src={wallet.logo} 
                              alt={wallet.name}
                              className="max-h-8 max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'block'
                              }}
                            />
                            <div className="text-center font-semibold hidden">{wallet.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QR Payments */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('qris')
                    setPaymentChannel('QRIS')
                  }}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all bg-white ${
                    paymentMethod === 'qris'
                      ? 'border-orange-500'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📱</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">QR Payments</div>
                      <div className="text-xs text-gray-500">QRIS - Scan & Pay</div>
                    </div>
                  </div>
                  {paymentMethod === 'qris' && (
                    <div className="bg-orange-500 text-white rounded-full p-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>

              {/* PayLater */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(paymentMethod === 'paylater' ? '' : 'paylater')}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">PayLater</div>
                      <div className="text-xs text-gray-500">Kredivo, Akulaku - Cicilan 0%</div>
                    </div>
                  </div>
                  <div className={`transform transition-transform ${paymentMethod === 'paylater' ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
                
                {paymentMethod === 'paylater' && (
                  <div className="mt-3 p-4 border-2 border-orange-100 rounded-lg bg-orange-50/30">
                    <p className="text-sm text-gray-600 mb-3">
                      Pilih paylater untuk cicilan 0%
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'KREDIVO', name: 'Kredivo', logo: '' },
                        { code: 'AKULAKU', name: 'Akulaku', logo: '' },
                      ].map((paylater) => (
                        <button
                          key={paylater.code}
                          type="button"
                          onClick={() => setPaymentChannel(paylater.code)}
                          className={`relative p-4 border-2 rounded-lg transition-all ${
                            paymentChannel === paylater.code
                              ? 'border-orange-500 bg-white shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {paymentChannel === paylater.code && (
                            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <div className="h-10 flex items-center justify-center">
                            <img 
                              src={paylater.logo} 
                              alt={paylater.name}
                              className="max-h-8 max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'block'
                              }}
                            />
                            <div className="text-center font-semibold hidden">{paylater.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coupon Code */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-4">Kode Kupon</h3>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode kupon"
                  disabled={isCouponApplied}
                  className={isCouponApplied ? 'bg-gray-100' : ''}
                />
                {!isCouponApplied ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={isLoading || !couponCode.trim()}
                    className="whitespace-nowrap"
                  >
                    {isLoading ? 'Cek...' : 'Terapkan'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveCoupon}
                    className="whitespace-nowrap text-red-600 hover:text-red-700"
                  >
                    Hapus
                  </Button>
                )}
              </div>
              {couponError && (
                <p className="text-sm text-red-600 mt-2">{couponError}</p>
              )}
              {isCouponApplied && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Kupon diterapkan: <strong className="font-bold">{couponCode}</strong>
                  </p>
                  {affiliateRef && (
                    <p className="text-xs text-green-600 mt-1">
                      🎁 Kupon otomatis terisi dari link affiliate
                    </p>
                  )}
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {affiliateRef 
                  ? '💡 Kupon sudah otomatis terisi dari link yang Anda klik'
                  : 'Contoh kode: EKSPOR10, EKSPOR20, NEWMEMBER, HEMAT25'
                }
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-3">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Paket</span>
                  <span className="font-semibold">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga</span>
                  <span className="font-semibold">Rp {selectedPkg.price.toLocaleString('id-ID')}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Kupon ({couponCode})</span>
                    <span className="font-semibold">-Rp {couponDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-orange-600">Rp {finalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="text-center text-sm text-gray-600 mb-6">
              <p>
                Dengan membeli, Anda menyetujui{' '}
                <Link href="/terms" className="text-orange-600 underline">
                  Syarat
                </Link>{' '}
                dan{' '}
                <Link href="/privacy" className="text-orange-600 underline">
                  Ketentuan
                </Link>
                .
              </p>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 font-semibold"
            >
              {isLoading ? 'Memproses...' : `Beli - Rp ${finalPrice.toLocaleString('id-ID')}`}
            </Button>

            {/* Secure Note */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                <Lock className="w-4 h-4 inline mr-1" />
                Diterbitkan oleh Channel Eksporyuk.
              </p>
            </div>

            {/* Affiliate Partner Badge */}
            <AffiliatePartnerBadge className="mt-4" />
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Halaman pembayaran ini hanya untuk aktivasi akun baru.
          </p>
          <Link href="/" className="text-orange-600 text-sm underline hover:text-orange-700">
            ← Kembali
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function UnifiedCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>}>
      <UnifiedCheckoutContent />
    </Suspense>
  )
}
