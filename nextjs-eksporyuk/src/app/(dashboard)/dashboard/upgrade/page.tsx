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
  Sparkles
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

export default function UpgradePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [currentMembership, setCurrentMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)

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

    // Detect current path to use correct confirm route
    const basePath = pathname || '/dashboard/upgrade'
    const confirmPath = `${basePath}/confirm`

    // If user has active membership, go to upgrade confirmation with prorata calculation
    if (currentMembership) {
      router.push(`${confirmPath}?package=${plan.id}`)
    } else {
      // New purchase - direct to checkout
      router.push(`/checkout/${plan.slug}`)
    }
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
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 hover:opacity-90"
                      style={{ backgroundColor: themeColors.primary }}
                    >
                      {isLifetime ? 'Upgrade ke Lifetime' : 'Upgrade Sekarang'}
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
    </ResponsivePageWrapper>
  )
}
