'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import {
  Crown,
  Check,
  Shield,
  Zap,
  Package,
  Clock,
  LockKeyhole,
  Rocket,
  Calculator,
  ArrowRight,
  X,
  Info,
  TrendingDown,
  Sparkles,
  Users,
  BookOpen,
  RefreshCw,
  MessageCircle,
  Calendar
} from 'lucide-react'

interface MembershipPlan {
  id: string
  name: string
  slug: string
  description: string
  duration: string
  price: number
  originalPrice?: number
  discount: number
  features: any[]
  isBestSeller: boolean
  isPopular: boolean
  isMostPopular: boolean
  checkoutSlug?: string
}

interface CurrentMembership {
  id: string
  endDate: string
  daysRemaining: number
  isLifetime: boolean
  plan: {
    id: string
    name: string
    duration: string
    price: number
  }
}

interface UpgradeCalculation {
  canUpgrade: boolean
  upgradePrice: number
  discount: number
  remainingValue: number
  message: string
  isLifetimeUpgrade: boolean
  currentMembership: {
    name: string
    duration: string
    price: number
    daysRemaining: number
  }
  targetMembership: {
    name: string
    duration: string
    price: number
  }
}

export default function UpgradePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [currentMembership, setCurrentMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [calculation, setCalculation] = useState<UpgradeCalculation | null>(null)
  const [calculatingFor, setCalculatingFor] = useState<string | null>(null)
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/upgrade')
      return
    }

    if (status === 'authenticated') {
      Promise.all([fetchPlans(), fetchCurrentMembership()])
    }
  }, [status, router])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/memberships/packages')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.packages || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchCurrentMembership = async () => {
    try {
      const response = await fetch('/api/memberships/user')
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Membership data:', data)
        if (data.hasMembership && data.membership) {
          const membershipData = {
            id: data.membership.id,
            endDate: data.membership.endDate,
            daysRemaining: data.membership.daysRemaining || 0,
            isLifetime: data.membership.isLifetime || false,
            plan: {
              id: data.membership.plan.id,
              name: data.membership.plan.name,
              duration: data.membership.plan.duration,
              price: parseFloat(data.membership.plan.price)
            }
          }
          console.log('✅ Setting current membership:', membershipData)
          setCurrentMembership(membershipData)
        } else {
          console.log('ℹ️ No active membership found')
        }
      } else {
        console.error('❌ API response not OK:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching current membership:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowCalculation = async (plan: MembershipPlan) => {
    console.log('🔍 handleShowCalculation called for plan:', plan.name)
    console.log('📊 Current membership state:', currentMembership)
    
    if (!session?.user?.id) {
      router.push('/login?callbackUrl=/dashboard/upgrade')
      return
    }

    // If no current membership, direct to checkout
    if (!currentMembership) {
      console.log('⚠️ No current membership, redirecting to checkout')
      router.push(`/checkout/${plan.slug}`)
      return
    }

    console.log('✅ Has membership, showing calculation modal')
    
    // Calculate upgrade price
    setCalculatingFor(plan.id)
    setSelectedPlan(plan)
    
    try {
      const response = await fetch('/api/membership/calculate-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMembershipId: plan.id })
      })

      if (response.ok) {
        const data = await response.json()
        setCalculation(data)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal menghitung upgrade')
      }
    } catch (error) {
      console.error('Error calculating upgrade:', error)
      alert('Terjadi kesalahan saat menghitung upgrade')
    } finally {
      setCalculatingFor(null)
    }
  }

  const handleProceedToCheckout = async () => {
    if (!selectedPlan) return

    setProcessingPlanId(selectedPlan.id)

    try {
      const response = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMembershipId: selectedPlan.id })
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.checkoutUrl
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal memproses upgrade')
        setProcessingPlanId(null)
      }
    } catch (error) {
      console.error('Error processing upgrade:', error)
      alert('Terjadi kesalahan saat memproses upgrade')
      setProcessingPlanId(null)
    }
  }

  const closeCalculation = () => {
    setCalculation(null)
    setSelectedPlan(null)
    setProcessingPlanId(null)
  }

  const formatDuration = (duration: string): string => {
    const map: Record<string, string> = {
      'ONE_MONTH': '1 Bulan',
      'THREE_MONTHS': '3 Bulan',
      'SIX_MONTHS': '6 Bulan',
      'TWELVE_MONTHS': '12 Bulan',
      'LIFETIME': 'Lifetime'
    }
    return map[duration] || duration
  }

  const isCurrentPlan = (planId: string) => {
    return currentMembership?.plan.id === planId
  }

  const formatRemainingTime = (days: number) => {
    if (days >= 30) {
      const months = Math.floor(days / 30)
      const remainingDays = days % 30
      return `${months} bulan ${remainingDays} hari`
    }
    const hours = Math.floor((days % 1) * 24)
    return `${Math.floor(days)} hari ${hours} jam`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat paket membership...</p>
        </div>
      </div>
    )
  }

  const themeColors = getRoleTheme(session?.user?.role || 'MEMBER_FREE')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      {/* Hero Header Section */}
      <section className="relative bg-gradient-to-b from-white to-gray-100 dark:from-slate-900 dark:to-slate-900/50 py-12 px-4 overflow-hidden border-b border-gray-200 dark:border-slate-800">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Crown Icon */}
          <div className="mb-4 inline-flex p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 shadow-sm border border-yellow-200 dark:border-yellow-800">
            <Crown className="w-10 h-10" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
            Upgrade Membership
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Tingkatkan pengalaman belajar Anda dengan fitur eksklusif dan diskon prorata sesuai sisa waktu aktif.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Keamanan</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Aman 100%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
              <Zap className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Kecepatan</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Instan Aktif</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Kualitas</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Premium</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        {/* Current Status Banner */}
        {currentMembership && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Paket Aktif Saat Ini</p>
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{currentMembership.plan.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900 shadow-sm">
                <Clock className="w-5 h-5 text-emerald-500 animate-pulse" />
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase block">Berakhir Dalam</span>
                  <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                    {formatRemainingTime(currentMembership.daysRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-16">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id)
            const isLifetime = plan.duration === 'LIFETIME'
            const isCalculating = calculatingFor === plan.id

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 bg-white dark:bg-slate-800 p-6 shadow-md transition-all hover:shadow-xl ${
                  isCurrent
                    ? 'border-emerald-500 opacity-90'
                    : plan.isBestSeller
                    ? 'border-blue-500 transform md:-translate-y-4'
                    : plan.isPopular
                    ? 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              >
                {/* Ribbon for Best Seller */}
                {plan.isBestSeller && !isCurrent && (
                  <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden z-10">
                    <div className="absolute top-7 right-[-32px] transform rotate-45 bg-red-500 text-white text-xs font-bold py-1 px-8 shadow-md">
                      TERLARIS
                    </div>
                  </div>
                )}

                {/* Active Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Paket Aktif
                  </div>
                )}

                {/* Popular Badge */}
                {plan.isPopular && !isCurrent && (
                  <div className="absolute -top-3 right-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Pilihan Populer
                  </div>
                )}

                {/* Card Header */}
                <div className="mb-5">
                  <h3 className={`text-lg font-bold ${plan.isBestSeller ? 'text-blue-500' : 'text-gray-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {plan.description || `Durasi ${formatDuration(plan.duration)}`}
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  {plan.originalPrice && plan.originalPrice > plan.price ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-400 line-through decoration-red-500">
                        Rp {plan.originalPrice.toLocaleString('id-ID')}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">
                          Rp {(plan.price / 1000).toFixed(0)}k
                        </span>
                      </div>
                      {plan.discount > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-fit">
                          <TrendingDown className="w-4 h-4" />
                          Hemat {plan.discount}% dengan Prorata
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">
                        {plan.price === 0 ? 'Rp 0' : `Rp ${(plan.price / 1000).toFixed(1)}${isLifetime ? 'jt' : 'k'}`}
                      </span>
                      <span className="text-gray-500 text-sm font-medium">
                        {isLifetime ? '/one-time' : '/month'}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {isLifetime ? 'Nilai terbaik untuk jangka panjang' : isCurrent ? 'Paket gratis aktif' : 'Upgrade sekarang'}
                  </p>
                </div>

                {/* Features List */}
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? (
                    plan.features.slice(0, 5).map((feature: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <Check className={`w-5 h-5 ${plan.isBestSeller ? 'text-blue-500' : isLifetime ? 'text-purple-500' : 'text-emerald-500'}`} />
                        <span>{typeof feature === 'string' ? feature : (feature.name || feature.label || 'Fitur tersedia')}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span>Akses semua materi</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span>Webinar bulanan</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span>Konsultasi 1-on-1</span>
                      </li>
                    </>
                  )}
                </ul>

                {/* Action Button */}
                {currentMembership?.isLifetime ? (
                  <button 
                    className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    disabled
                  >
                    <LockKeyhole className="w-4 h-4" />
                    Sudah Lifetime
                  </button>
                ) : isCurrent ? (
                  <button 
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold text-sm cursor-not-allowed border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2"
                    disabled
                  >
                    <LockKeyhole className="w-4 h-4" />
                    Paket Aktif Anda
                  </button>
                ) : (
                  <button
                    onClick={() => handleShowCalculation(plan)}
                    disabled={isCalculating}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 ${
                      isLifetime
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/30'
                        : plan.isBestSeller
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-700 shadow-blue-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-700 shadow-blue-500/30'
                    }`}
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menghitung...</span>
                      </>
                    ) : (
                      <>
                        {isLifetime ? (
                          <>
                            <Rocket className="w-4 h-4" />
                            <span>Upgrade ke Lifetime</span>
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4" />
                            <span>Lihat Perhitungan Upgrade</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Why Upgrade Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Kenapa Harus Upgrade?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Akses Unlimited</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Buka semua studi kasus premium, data buyer, dan template ekspor tanpa batasan.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Komunitas Eksklusif</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bergabung dengan jaringan VIP eksportir sukses dan mentor industri untuk wawasan harian.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 mb-4">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Update Terbaru</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dapatkan akses otomatis ke semua modul kursus dan update regulasi terbaru.</p>
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-gray-100 dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700">
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Butuh bantuan perhitungan upgrade?</h3>
            <p className="text-gray-600 dark:text-gray-400">Tim support kami siap membantu menjelaskan detail paket.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
            <button className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Hubungi Support
            </button>
          </div>
        </div>
      </div>

      {/* Calculation Modal */}
      {calculation && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeCalculation}
          ></div>

          {/* Modal Container */}
          <div className="relative flex max-h-[90vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Calculator className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">Perhitungan Upgrade</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detail biaya dan diskon prorata</p>
                </div>
              </div>
              <button 
                onClick={closeCalculation}
                className="group rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent'
            }}>
              {/* Current vs Target Section */}
              <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
                {/* Current Plan Card */}
                <div className="relative flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Saat Ini</span>
                      <span className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Aktif
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{calculation.currentMembership.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(calculation.currentMembership.duration)} - Rp {calculation.currentMembership.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    Sisa {calculation.currentMembership.daysRemaining} hari
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="flex items-center justify-center py-2 sm:py-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500 sm:rotate-0 rotate-90">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Target Plan Card */}
                <div className="relative flex flex-col justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 dark:border-blue-500/30 dark:bg-blue-500/10">
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Tujuan</span>
                      <span className="rounded-full bg-blue-500 text-white px-2 py-0.5 text-[10px] font-bold">Baru</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{calculation.targetMembership.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(calculation.targetMembership.duration)} - Rp {calculation.targetMembership.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs font-medium text-blue-500">
                    <Check className="w-4 h-4" />
                    Tingkatkan ke Premium
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown Box */}
              <div className="relative mb-6 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-purple-50/80 p-6 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
                {/* Background Decoration */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-xl"></div>
                
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Rincian Pembayaran</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Harga paket tujuan</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Rp {calculation.targetMembership.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  {!calculation.isLifetimeUpgrade && calculation.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span>Nilai sisa paket sekarang</span>
                        <div className="group relative cursor-help text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200">
                          <Info className="w-4 h-4" />
                          {/* Tooltip */}
                          <div className="invisible absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-center text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                            Dihitung berdasarkan {calculation.currentMembership.daysRemaining} hari sisa masa aktif
                            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800"></div>
                          </div>
                        </div>
                      </div>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        - Rp {calculation.discount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-slate-600"></div>

                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-gray-900 dark:text-white">Total Pembayaran</span>
                    {calculation.discount > 0 && !calculation.isLifetimeUpgrade && (
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 w-fit">
                        <TrendingDown className="w-3 h-3" />
                        Hemat Rp {calculation.discount.toLocaleString('id-ID')}!
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black tracking-tight text-blue-500">
                      Rp {calculation.upgradePrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lifetime Warning */}
              {calculation.isLifetimeUpgrade && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <Rocket className="mt-0.5 w-5 h-5 text-amber-500" />
                  <div className="flex-1 text-sm">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Upgrade ke Lifetime</h4>
                    <p className="text-amber-700 dark:text-amber-300">
                      Paket Lifetime memerlukan pembayaran penuh tanpa potongan prorata. Anda akan mendapatkan akses selamanya tanpa perpanjangan.
                    </p>
                  </div>
                </div>
              )}

              {/* Info Message */}
              {calculation.message && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <Info className="mt-0.5 w-5 h-5 text-blue-500" />
                  <p className="flex-1 text-sm text-blue-900 dark:text-blue-200">{calculation.message}</p>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-gray-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button 
                  onClick={closeCalculation}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-slate-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button 
                  onClick={handleProceedToCheckout}
                  disabled={processingPlanId === selectedPlan.id}
                  className="group relative flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg bg-blue-500 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-wait"
                >
                  {processingPlanId === selectedPlan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjutkan ke Pembayaran</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
