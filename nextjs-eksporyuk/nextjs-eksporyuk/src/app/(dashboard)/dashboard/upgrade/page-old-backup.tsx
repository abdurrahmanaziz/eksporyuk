'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getRoleTheme } from '@/lib/role-themes'
import {
  Crown,
  Check,
  Clock,
  Shield,
  Zap,
  Star,
  BookOpen,
  Users,
  Rocket,
  Sparkles,
  Calculator,
  ArrowRight,
  X,
  Percent,
  TrendingUp
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
  const pathname = usePathname()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [currentMembership, setCurrentMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [calculation, setCalculation] = useState<UpgradeCalculation | null>(null)
  const [calculatingFor, setCalculatingFor] = useState<string | null>(null)

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
        if (data.hasMembership) {
          setCurrentMembership({
            id: data.membership.id,
            endDate: data.membership.endDate,
            daysRemaining: data.membership.daysRemaining,
            isLifetime: data.membership.isLifetime,
            plan: {
              id: data.membership.plan.id,
              name: data.membership.plan.name,
              duration: data.membership.plan.duration,
              price: parseFloat(data.membership.plan.price)
            }
          })
        }
      }
    } catch (error) {
      console.error('Error fetching current membership:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: MembershipPlan) => {
    if (!session?.user?.id) {
      router.push('/login?callbackUrl=/dashboard/upgrade')
      return
    }

    // If no current membership, direct to checkout
    if (!currentMembership) {
      router.push(`/checkout/${plan.slug}`)
      return
    }

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

  if (status === 'loading' || loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading membership plans...</p>
        </div>
      </div>
    )
  }

  const themeColors = getRoleTheme(session?.user?.role || 'MEMBER_FREE')

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2" style={{ backgroundColor: `${themeColors.primary}15` }}>
              <Crown className="w-9 h-9" style={{ color: themeColors.primary }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: themeColors.primary }}>
              Upgrade Membership
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
              Tingkatkan pengalaman belajar Anda dengan <span className="font-semibold" style={{ color: themeColors.primary }}>fitur eksklusif</span> dan <span className="font-semibold" style={{ color: themeColors.primary }}>akses unlimited</span>.
            </p>
            
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="font-medium">Aman</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}20` }}>
                  <Zap className="w-3 h-3" style={{ color: themeColors.primary }} />
                </div>
                <span className="font-medium">Instan</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                  <Star className="w-3 h-3 text-orange-500" />
                </div>
                <span className="font-medium">Premium</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <h2 className="text-lg font-bold text-gray-900">Pilih Plan Yang Sesuai</h2>
          </div>

          {currentMembership && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColors.primary}15` }}>
                  {currentMembership.isLifetime ? (
                    <Crown className="w-5 h-5" style={{ color: themeColors.primary }} />
                  ) : (
                    <Clock className="w-5 h-5" style={{ color: themeColors.primary }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">
                    {currentMembership.isLifetime ? 'Membership Lifetime Aktif' : `Durasi ${formatDuration(currentMembership.plan.duration)}`}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {currentMembership.isLifetime ? (
                      <span>Anda sudah memiliki <strong className="text-green-600">akses selamanya</strong></span>
                    ) : (
                      <span>Sisa <strong className="text-gray-900">{currentMembership.daysRemaining} hari</strong> aktif</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id)
              const isLifetime = plan.duration === 'LIFETIME'
              const isUpgradeable = currentMembership?.isLifetime ? false : !isCurrent

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border-2 transition-all relative overflow-hidden"
                  style={{
                    borderColor: plan.isMostPopular ? themeColors.primary : isCurrent ? '#10b981' : '#e5e7eb'
                  }}
                >
                  {plan.isMostPopular && (
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: themeColors.primary }}></div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    {plan.isMostPopular && (
                      <Badge className="text-xs font-semibold" style={{ backgroundColor: themeColors.primary }}>
                        TERPOPULER
                      </Badge>
                    )}
                    {plan.isBestSeller && !plan.isMostPopular && (
                      <Badge variant="outline" className="text-xs font-semibold border-orange-500 text-orange-600">
                        BEST SELLER
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="text-xs font-semibold bg-green-600">
                        AKTIF
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold text-sm text-gray-900">
                          Durasi {formatDuration(plan.duration)}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                        Rp {Math.floor(plan.price / 1000)}K
                      </div>
                      {!isLifetime && (
                        <div className="text-xs text-gray-500">
                          /{formatDuration(plan.duration).toLowerCase().replace(' ', '')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.slice(0, 4).map((feature: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-700 leading-relaxed">
                            {typeof feature === 'string' ? feature : (feature.name || feature.label || 'Fitur tersedia')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-700">Akses semua materi ekspor</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-700">Webinar eksklusif bulanan</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-700">Konsultasi bisnis 1-on-1</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-gray-700">Grup WhatsApp eksklusif</span>
                        </div>
                      </>
                    )}
                  </div>

                  {currentMembership?.isLifetime ? (
                    <button 
                      className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm cursor-not-allowed"
                      disabled
                      title="Anda sudah memiliki akses Lifetime"
                    >
                      Sudah Lifetime
                    </button>
                  ) : isCurrent ? (
                    <button 
                      className="w-full py-3 rounded-xl bg-green-100 text-green-700 font-semibold text-sm cursor-default border-2 border-green-300"
                      disabled
                    >
                      Paket Aktif Anda
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      disabled={calculatingFor === plan.id}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                      style={{ backgroundColor: themeColors.primary }}
                    >
                      {calculatingFor === plan.id ? (
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

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4 mt-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}15` }}>
                <Sparkles className="w-4 h-4" style={{ color: themeColors.primary }} />
              </div>
              <h2 className="text-base font-bold text-gray-900">Kenapa Harus Upgrade?</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nikmati berbagai keuntungan eksklusif
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColors.primary}15` }}>
                  <BookOpen className="w-5 h-5" style={{ color: themeColors.primary }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">Akses Unlimited</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Akses ke <strong>semua kursus</strong>, materi premium, dan resource eksklusif tanpa batas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColors.primary}15` }}>
                  <Users className="w-5 h-5" style={{ color: themeColors.primary }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">Komunitas Eksklusif</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Bergabung dengan <strong>komunitas premium</strong> dan networking berkualitas tinggi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColors.primary}15` }}>
                  <Rocket className="w-5 h-5" style={{ color: themeColors.primary }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">Update Terbaru</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Dapatkan <strong>akses pertama</strong> ke konten dan fitur terbaru sebelum yang lain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="font-bold text-base text-gray-900">Punya Pertanyaan?</h3>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              Tim support kami siap membantu Anda memilih plan yang tepat dan menjawab semua pertanyaan.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/dashboard">
                <button className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Dashboard
                </button>
              </Link>
              <Link href="/messages">
                <button 
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Hubungi Support
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Upgrade Calculation Modal */}
      {calculation && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColors.primary}15` }}>
                  <Calculator className="w-5 h-5" style={{ color: themeColors.primary }} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">Perhitungan Upgrade</h2>
                  <p className="text-xs text-gray-500">Detail biaya dan diskon prorata</p>
                </div>
              </div>
              <button
                onClick={closeCalculation}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Current vs Target Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Package */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Paket Sekarang</div>
                  <div className="font-bold text-base text-gray-900 mb-1">
                    {calculation.currentMembership.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {formatDuration(calculation.currentMembership.duration)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-500">Rp</span>
                    <span className="text-lg font-bold text-gray-900">
                      {calculation.currentMembership.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Sisa {calculation.currentMembership.daysRemaining} hari</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-md" style={{ borderColor: themeColors.primary }}>
                  <ArrowRight className="w-5 h-5" style={{ color: themeColors.primary }} />
                </div>

                {/* Target Package */}
                <div className="p-4 rounded-xl border-2" style={{ 
                  backgroundColor: `${themeColors.primary}05`,
                  borderColor: themeColors.primary
                }}>
                  <div className="text-xs mb-2" style={{ color: themeColors.primary }}>Paket Tujuan</div>
                  <div className="font-bold text-base text-gray-900 mb-1">
                    {calculation.targetMembership.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {formatDuration(calculation.targetMembership.duration)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-500">Rp</span>
                    <span className="text-lg font-bold text-gray-900">
                      {calculation.targetMembership.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: `${themeColors.primary}30` }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.primary }}>
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">Upgrade Premium</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-gray-900">Rincian Perhitungan Prorata</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Harga paket tujuan</span>
                    <span className="font-semibold text-sm text-gray-900">
                      Rp {calculation.targetMembership.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {!calculation.isLifetimeUpgrade && calculation.discount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Nilai sisa paket sekarang
                        </span>
                        <span className="font-semibold text-sm">
                          - Rp {calculation.discount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-base text-gray-900">Total Pembayaran</span>
                    <div className="text-right">
                      <div className="font-bold text-xl" style={{ color: themeColors.primary }}>
                        Rp {calculation.upgradePrice.toLocaleString('id-ID')}
                      </div>
                      {calculation.discount > 0 && !calculation.isLifetimeUpgrade && (
                        <div className="text-xs text-green-600 font-semibold">
                          Hemat Rp {calculation.discount.toLocaleString('id-ID')}!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifetime Warning */}
              {calculation.isLifetimeUpgrade && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Rocket className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-amber-900 mb-1">Upgrade ke Lifetime</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Paket Lifetime memerlukan pembayaran penuh tanpa potongan prorata. Anda akan mendapatkan akses selamanya tanpa perpanjangan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              {calculation.message && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900 leading-relaxed">{calculation.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeCalculation}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-sm text-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  disabled={processingPlanId === selectedPlan.id}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  {processingPlanId === selectedPlan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjutkan ke Pembayaran</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ResponsivePageWrapper>
  )
}
