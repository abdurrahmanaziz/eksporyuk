'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getRoleTheme } from '@/lib/role-themes'
import {
  Crown,
  Check,
  X,
  TrendingUp,
  Sparkles,
  Zap,
  Clock,
  Users,
  BookOpen,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Info,
  Star,
  Shield,
  Rocket,
  Settings
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
  _count?: {
    membershipGroups: number
    membershipCourses: number
    membershipProducts: number
  }
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
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [currentMembership, setCurrentMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [upgradeMode, setUpgradeMode] = useState<'accumulate' | 'full'>('accumulate')

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

    // Redirect to checkout page
    if (plan.checkoutSlug) {
      router.push(`/${plan.checkoutSlug}`)
    } else if (plan.slug) {
      router.push(`/membership/${plan.slug}`)
    } else {
      // Fallback to unified checkout
      router.push(`/checkout-unified?package=${plan.id}`)
    }
  }

  const calculateUpgradePrice = (newPlan: MembershipPlan) => {
    // LIFETIME always full price (no accumulate discount)
    if (newPlan.duration === 'LIFETIME') {
      return newPlan.price
    }

    if (!currentMembership || upgradeMode === 'full') {
      return newPlan.price
    }

    // Accumulate mode: kurangi harga berdasarkan sisa hari (only for non-LIFETIME plans)
    const dailyRate = currentMembership.plan.price / getDurationInDays(currentMembership.plan.duration)
    const remainingValue = dailyRate * currentMembership.daysRemaining
    const upgradePrice = Math.max(0, newPlan.price - remainingValue)
    
    return upgradePrice
  }

  const getDurationInDays = (duration: string): number => {
    const map: Record<string, number> = {
      'ONE_MONTH': 30,
      'THREE_MONTHS': 90,
      'SIX_MONTHS': 180,
      'TWELVE_MONTHS': 365,
      'LIFETIME': 36500
    }
    return map[duration] || 30
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

  const isUpgrade = (plan: MembershipPlan) => {
    if (!currentMembership) return true
    const currentDays = getDurationInDays(currentMembership.plan.duration)
    const newDays = getDurationInDays(plan.duration)
    return newDays > currentDays || plan.price > currentMembership.plan.price
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden pb-10">
      {/* Background decoration blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blur-3xl pointer-events-none -z-10" style={{ backgroundColor: `${themeColors.primary}05` }}></div>
      
      <div className="container max-w-lg mx-auto px-4 pt-8 md:max-w-2xl lg:max-w-4xl space-y-10">
        {/* Hero Header */}
        <div className="text-center mb-10 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 shadow-sm transform hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${themeColors.primary}15` }}>
            <Crown className="w-7 h-7" style={{ color: themeColors.primary }} />
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}>
            Upgrade Membership
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
            Tingkatkan pengalaman belajar Anda dengan <span className="font-semibold" style={{ color: themeColors.primary }}>fitur eksklusif</span> dan <span className="font-semibold" style={{ color: themeColors.primary }}>akses unlimited</span>.
          </p>
          <div className="flex justify-center items-center gap-4 mt-6 text-[10px] text-gray-600 font-medium">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" style={{ color: themeColors.success }} />
              <span>Aman</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" style={{ color: themeColors.primary }} />
              <span>Instan</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" style={{ color: themeColors.warning }} />
              <span>Premium</span>
            </div>
          </div>
        </div>

      {/* Current Membership Info - Enhanced */}
      {currentMembership && !currentMembership.isLifetime && (
        <Card className="border-0 shadow-lg backdrop-blur-sm" style={{ background: `linear-gradient(to right, ${themeColors.light}, ${themeColors.lighter})` }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColors.primary }}>
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-2 text-lg" style={{ color: themeColors.dark }}>Membership Aktif Anda</h3>
                <div className="space-y-1">
                  <p style={{ color: themeColors.text }}>
                    <strong className="text-xl">{currentMembership.plan.name}</strong>
                  </p>
                  <p style={{ color: themeColors.textLight }}>
                    <Clock className="w-4 h-4 inline mr-1" />
                    Sisa <strong>{currentMembership.daysRemaining} hari</strong> aktif
                  </p>
                </div>
                <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: `${themeColors.primary}10`, borderColor: `${themeColors.primary}30` }}>
                  <p className="text-sm flex items-start gap-2" style={{ color: themeColors.text }}>
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: themeColors.secondary }} />
                    <span>
                      <strong>Mode Accumulate:</strong> Nilai sisa hari akan dikurangkan dari harga plan baru - hemat lebih banyak!
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/70 p-4 rounded-xl shadow-sm">
                <p className="text-xs mb-1" style={{ color: themeColors.textLight }}>Berakhir pada:</p>
                <p className="font-bold text-lg" style={{ color: themeColors.dark }}>
                  {new Date(currentMembership.endDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifetime Info Alert - Enhanced */}
      {currentMembership && !currentMembership.isLifetime && (
        <Alert className="border-0 shadow-md" style={{ background: `linear-gradient(to right, ${themeColors.warning}15, ${themeColors.warning}10)` }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 flex-shrink-0" style={{ color: themeColors.warning }} />
            <AlertDescription className="leading-relaxed" style={{ color: themeColors.dark }}>
              <strong className="text-base">⚡ Perhatian Upgrade Lifetime:</strong>
              <p className="mt-1">
                Upgrade ke <strong>Lifetime Membership</strong> harus membayar harga penuh (tanpa potongan sisa hari) karena ini investasi jangka panjang. 
                Upgrade ke plan temporal lainnya (1-12 bulan) dapat menggunakan mode Accumulate untuk hemat biaya.
              </p>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Upgrade Mode Selection - Enhanced */}
      {currentMembership && !currentMembership.isLifetime && (
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: themeColors.primary }} />
              Pilih Mode Upgrade
            </CardTitle>
            <CardDescription className="text-base">
              Tentukan bagaimana nilai membership lama Anda diperhitungkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={upgradeMode} onValueChange={(value: any) => setUpgradeMode(value)}>
              <div className={`relative flex items-start space-x-4 p-5 border-2 rounded-xl transition-all cursor-pointer`}
                style={{
                  background: upgradeMode === 'accumulate' ? `linear-gradient(to right, ${themeColors.light}, ${themeColors.lighter})` : '#ffffff',
                  borderColor: upgradeMode === 'accumulate' ? themeColors.primary : '#e5e7eb',
                  boxShadow: upgradeMode === 'accumulate' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => { if (upgradeMode !== 'accumulate') e.currentTarget.style.borderColor = `${themeColors.primary}50` }}
                onMouseLeave={(e) => { if (upgradeMode !== 'accumulate') e.currentTarget.style.borderColor = '#e5e7eb' }}
              >
                <RadioGroupItem value="accumulate" id="accumulate" className="mt-1" />
                <Label htmlFor="accumulate" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-lg">Accumulate</div>
                    <Badge style={{ backgroundColor: themeColors.success }}>Rekomendasi</Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Nilai sisa hari membership lama dikurangkan dari harga baru. <strong style={{ color: themeColors.success }}>Hemat lebih banyak!</strong> 
                    Mode ini ideal untuk upgrade ke plan yang lebih tinggi.
                  </p>
                </Label>
                {upgradeMode === 'accumulate' && (
                  <Check className="w-6 h-6 absolute top-5 right-5" style={{ color: themeColors.primary }} />
                )}
              </div>
              
              <div className={`relative flex items-start space-x-4 p-5 border-2 rounded-xl transition-all cursor-pointer`}
                style={{
                  background: upgradeMode === 'full' ? `linear-gradient(to right, ${themeColors.light}, ${themeColors.lighter})` : '#ffffff',
                  borderColor: upgradeMode === 'full' ? themeColors.secondary : '#e5e7eb',
                  boxShadow: upgradeMode === 'full' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => { if (upgradeMode !== 'full') e.currentTarget.style.borderColor = `${themeColors.secondary}50` }}
                onMouseLeave={(e) => { if (upgradeMode !== 'full') e.currentTarget.style.borderColor = '#e5e7eb' }}
              >
                <RadioGroupItem value="full" id="full" className="mt-1" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="font-bold text-lg mb-2">Full Price</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Bayar harga penuh tanpa perhitungan sisa hari. Membership lama otomatis expire. 
                    Pilih ini jika ingin memulai periode baru dari awal.
                  </p>
                </Label>
                {upgradeMode === 'full' && (
                  <Check className="w-6 h-6 absolute top-5 right-5" style={{ color: themeColors.secondary }} />
                )}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="mb-12">
        <h2 className="text-center font-bold text-lg mb-6">Pilih Plan Yang Sesuai</h2>
        <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 snap-x snap-mandatory no-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {plans.map((plan) => {
            const isLifetime = plan.duration === 'LIFETIME'
            const isCurrent = isCurrentPlan(plan.id)
            const canUpgrade = isUpgrade(plan)
            const upgradePrice = calculateUpgradePrice(plan)
            const savings = isLifetime ? 0 : (plan.price - upgradePrice)

            return (
              <Card
                key={plan.id}
                className="snap-center shrink-0 w-[85vw] max-w-[320px] bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col relative group hover:border-blue-200 transition-colors"
                style={{
                  border: plan.isMostPopular ? `2px solid ${themeColors.primary}` : isCurrent ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
                  transform: plan.isMostPopular ? 'scale(1.02)' : 'scale(1)',
                  zIndex: plan.isMostPopular ? 10 : 1,
                  boxShadow: plan.isMostPopular ? `0 0 20px ${themeColors.primary}15` : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  opacity: isCurrent ? 0.9 : 1,
                  filter: isCurrent ? 'grayscale(30%)' : 'none'
                }}
              >
                {/* Top Badge for Popular */}
                {plan.isMostPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1" style={{ backgroundColor: themeColors.primary }}>
                    <Sparkles className="w-3 h-3" />
                    TERPOPULER
                  </div>
                )}

                {/* Top Right Badges */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-10">
                  {plan.isPopular && !plan.isMostPopular && (
                    <Badge className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200">
                      🔥 BEST SELLER
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> AKTIF
                    </Badge>
                  )}
                </div>

                {/* Card Header */}
                <div className="mb-4" style={{ marginTop: plan.isMostPopular ? '1rem' : '0' }}>
                  <h3 className="font-bold text-xl mb-1" style={{ color: plan.isMostPopular ? themeColors.primary : '#000' }}>{plan.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(plan.duration)}</span>
                  </div>
                </div>

                {/* Price Section */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold" style={{ color: plan.isMostPopular ? themeColors.primary : '#000' }}>
                      Rp {Math.floor(upgradePrice / 1000)}K
                    </span>
                    {!isLifetime && (
                      <span className="text-xs text-gray-500">/{formatDuration(plan.duration).split(' ')[0].toLowerCase()}bln</span>
                    )}
                  </div>
                  {!isLifetime && currentMembership && !currentMembership.isLifetime && upgradeMode === 'accumulate' && savings > 0 && (
                    <p className="text-[10px] font-medium mt-1 inline-block px-2 py-0.5 rounded" style={{ color: themeColors.success, backgroundColor: `${themeColors.success}15` }}>
                      Hemat {Math.floor((savings / plan.price) * 100)}%
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="flex-1 space-y-3 mb-8">
                  {plan.features && Array.isArray(plan.features) && plan.features.slice(0, 4).map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.isMostPopular ? themeColors.primary : themeColors.success }} />
                      <span className="text-gray-700" style={{ fontWeight: idx === 0 && plan.isMostPopular ? '600' : '400' }}>
                        {typeof feature === 'string' ? feature : (feature.name || feature.label || 'Fitur tersedia')}
                      </span>
                    </div>
                  ))}
                  
                  {(!plan.features || plan.features.length === 0) && (
                    <>
                      <div className="flex items-start gap-3 text-xs">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                        <span className="text-gray-700">Akses semua materi ekspor</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                        <span className="text-gray-700">Webinar eksklusif bulanan</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                        <span className="text-gray-700">Konsultasi bisnis 1-on-1</span>
                      </div>
                      <div className="flex items-start gap-3 text-xs">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                        <span className="text-gray-700">Grup WhatsApp eksklusif</span>
                      </div>
                    </>
                  )}
                </div>
                    ))}
                    
                    {(!plan.features || plan.features.length === 0) && (
                      <>
                        <div className="flex items-start gap-3 text-xs">
                          <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                          <span className="text-gray-700">Akses semua materi ekspor</span>
                        </div>
                        <div className="flex items-start gap-3 text-xs">
                          <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                          <span className="text-gray-700">Webinar eksklusif bulanan</span>
                        </div>
                        <div className="flex items-start gap-3 text-xs">
                          <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                          <span className="text-gray-700">Konsultasi bisnis 1-on-1</span>
                        </div>
                        <div className="flex items-start gap-3 text-xs">
                          <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                          <span className="text-gray-700">Grup WhatsApp eksklusif</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>

                {/* Action Button */}
                {isCurrent ? (
                  <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm cursor-default flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Plan Aktif
                  </button>
                ) : canUpgrade && plan.isMostPopular ? (
                  <button
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: themeColors.primary, boxShadow: `0 4px 14px ${themeColors.primary}20` }}
                    onClick={() => handleUpgrade(plan)}
                  >
                    Pilih Paket Ini
                  </button>
                ) : canUpgrade ? (
                  <button
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: themeColors.primary, boxShadow: `0 4px 14px ${themeColors.primary}20` }}
                    onClick={() => handleUpgrade(plan)}
                  >
                    Pilih Paket Ini
                  </button>
                ) : (
                  <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                    Bukan Upgrade
                  </button>
                )}
              </Card>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-2\" style={{ backgroundColor: `${themeColors.primary}15` }}>
            <Sparkles className="w-5 h-5" style={{ color: themeColors.primary }} />
          </div>
          <h2 className="text-lg font-bold">Kenapa Harus Upgrade?</h2>
          <p className="text-xs text-gray-600 mt-1">Nikmati berbagai keuntungan eksklusif</p>
        </div>
        <div className="grid gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${themeColors.primary}15` }}>
              <BookOpen className="w-6 h-6" style={{ color: themeColors.primary }} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Akses Unlimited</h3>
              <p className="text-[11px] text-gray-600 leading-snug">
                Akses ke <span className="font-semibold text-gray-900">semua kursus</span>, materi premium, dan resource eksklusif tanpa batas.
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${themeColors.secondary}15` }}>
              <Users className="w-6 h-6" style={{ color: themeColors.secondary }} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Komunitas Eksklusif</h3>
              <p className="text-[11px] text-gray-600 leading-snug">
                Bergabung dengan <span className="font-semibold text-gray-900">komunitas premium</span> dan networking berkualitas tinggi.
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${themeColors.warning}15` }}>
              <Rocket className="w-6 h-6" style={{ color: themeColors.warning }} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Update Terbaru</h3>
              <p className="text-[11px] text-gray-600 leading-snug">
                Dapatkan <span className="font-semibold text-gray-900">akses pertama</span> ke konten dan fitur terbaru sebelum yang lain.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ/Support Section */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
        <h3 className="font-bold text-base mb-2">Punya Pertanyaan?</h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed max-w-xs mx-auto">
          Tim support kami siap membantu Anda memilih plan yang tepat dan menjawab semua pertanyaan.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <ArrowRight className="w-4 h-4" /> Dashboard
            </button>
          </Link>
          <Link href="/messages">
            <button className="px-4 py-2 rounded-lg text-xs font-medium text-white shadow-md transition-colors flex items-center gap-2" style={{ backgroundColor: themeColors.primary, boxShadow: `0 4px 14px ${themeColors.primary}20` }}>
              💬 Hubungi Support
            </button>
          </Link>
        </div>
      </div>
    </div>
    </div>
    </ResponsivePageWrapper>
  )
}
