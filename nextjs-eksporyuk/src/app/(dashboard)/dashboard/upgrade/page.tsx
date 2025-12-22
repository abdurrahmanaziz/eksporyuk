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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
      <div className="container max-w-7xl mx-auto p-6 space-y-10">
        {/* Modern Hero Header with Gradient */}
        <div className="text-center space-y-6 py-12 relative">
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Crown className="w-14 h-14 text-yellow-500 drop-shadow-lg animate-pulse" />
                <Star className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Upgrade Membership
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tingkatkan pengalaman belajar Anda dengan <span className="font-semibold text-purple-600">fitur eksklusif</span> dan 
              <span className="font-semibold text-pink-600"> akses unlimited</span>
            </p>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Pembayaran Aman</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Rocket className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Akses Instan</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium">Premium Quality</span>
              </div>
            </div>
          </div>
        </div>

      {/* Current Membership Info - Enhanced */}
      {currentMembership && !currentMembership.isLifetime && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2 text-lg">Membership Aktif Anda</h3>
                <div className="space-y-1">
                  <p className="text-blue-800">
                    <strong className="text-xl">{currentMembership.plan.name}</strong>
                  </p>
                  <p className="text-blue-700">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Sisa <strong>{currentMembership.daysRemaining} hari</strong> aktif
                  </p>
                </div>
                <div className="mt-3 p-3 bg-blue-100/70 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Mode Accumulate:</strong> Nilai sisa hari akan dikurangkan dari harga plan baru - hemat lebih banyak!
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/70 p-4 rounded-xl shadow-sm">
                <p className="text-xs text-blue-700 mb-1">Berakhir pada:</p>
                <p className="font-bold text-blue-900 text-lg">
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
        <Alert className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <AlertDescription className="text-amber-900 leading-relaxed">
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
              <Settings className="w-5 h-5 text-purple-600" />
              Pilih Mode Upgrade
            </CardTitle>
            <CardDescription className="text-base">
              Tentukan bagaimana nilai membership lama Anda diperhitungkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={upgradeMode} onValueChange={(value: any) => setUpgradeMode(value)}>
              <div className={`relative flex items-start space-x-4 p-5 border-2 rounded-xl transition-all cursor-pointer ${
                upgradeMode === 'accumulate' 
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-500 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
              }`}>
                <RadioGroupItem value="accumulate" id="accumulate" className="mt-1" />
                <Label htmlFor="accumulate" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-lg">Accumulate</div>
                    <Badge className="bg-green-600">Rekomendasi</Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Nilai sisa hari membership lama dikurangkan dari harga baru. <strong className="text-green-600">Hemat lebih banyak!</strong> 
                    Mode ini ideal untuk upgrade ke plan yang lebih tinggi.
                  </p>
                </Label>
                {upgradeMode === 'accumulate' && (
                  <Check className="w-6 h-6 text-purple-600 absolute top-5 right-5" />
                )}
              </div>
              
              <div className={`relative flex items-start space-x-4 p-5 border-2 rounded-xl transition-all cursor-pointer ${
                upgradeMode === 'full' 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}>
                <RadioGroupItem value="full" id="full" className="mt-1" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="font-bold text-lg mb-2">Full Price</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Bayar harga penuh tanpa perhitungan sisa hari. Membership lama otomatis expire. 
                    Pilih ini jika ingin memulai periode baru dari awal.
                  </p>
                </Label>
                {upgradeMode === 'full' && (
                  <Check className="w-6 h-6 text-blue-600 absolute top-5 right-5" />
                )}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards - Modern Design */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Pilih Plan Yang Sesuai
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isLifetime = plan.duration === 'LIFETIME'
            const isCurrent = isCurrentPlan(plan.id)
            const canUpgrade = isUpgrade(plan)
            const upgradePrice = calculateUpgradePrice(plan)
            const savings = isLifetime ? 0 : (plan.price - upgradePrice)

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  plan.isMostPopular 
                    ? 'border-2 border-purple-500 shadow-xl scale-105 bg-gradient-to-br from-purple-50 via-white to-pink-50' 
                    : 'border border-gray-200 bg-white hover:border-purple-300'
                } ${isCurrent ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
              >
                {/* Top Gradient Bar for Popular Plans */}
                {plan.isMostPopular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"></div>
                )}

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  {plan.isMostPopular && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Terpopuler
                    </Badge>
                  )}
                  {plan.isPopular && !plan.isMostPopular && (
                    <Badge variant="outline" className="border-orange-500 text-orange-600 bg-white shadow">
                      🔥 Paling Laris
                    </Badge>
                  )}
                  {plan.isBestSeller && (
                    <Badge variant="outline" className="border-blue-500 text-blue-600 bg-white shadow">
                      ⭐ Best Seller
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="bg-green-600 shadow-lg">
                      <Check className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <CardDescription className="text-base font-medium">
                        {formatDuration(plan.duration)}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="pt-6 space-y-2">
                    {plan.discount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          Rp {plan.originalPrice?.toLocaleString('id-ID')}
                        </span>
                        <Badge variant="destructive" className="text-xs shadow">
                          Diskon {plan.discount}%
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Rp {Math.floor(upgradePrice / 1000)}K
                      </span>
                      {!isLifetime && (
                        <span className="text-gray-500 text-sm">
                          /{formatDuration(plan.duration).split(' ')[0]}bln
                        </span>
                      )}
                    </div>
                    
                    {/* Savings Badges */}
                    {isLifetime && currentMembership && !currentMembership.isLifetime && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <Star className="w-3 h-3" />
                        Premium Lifetime Access
                      </div>
                    )}
                    {!isLifetime && currentMembership && !currentMembership.isLifetime && upgradeMode === 'accumulate' && savings > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        <Zap className="w-3 h-3" />
                        Hemat Rp {Math.floor(savings / 1000)}K
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-2.5">
                    {plan.features && Array.isArray(plan.features) && plan.features.slice(0, 5).map((feature: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 leading-relaxed">
                          {typeof feature === 'string' ? feature : (feature.name || feature.label || 'Fitur tersedia')}
                        </span>
                      </div>
                    ))}
                    
                    {(!plan.features || plan.features.length === 0) && (
                      <p className="text-sm text-gray-400 italic">Tidak ada detail fitur tersedia</p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  {plan._count && (
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <Users className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">{plan._count.membershipGroups}</p>
                        <p className="text-xs text-gray-500">Grup</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <BookOpen className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">{plan._count.membershipCourses}</p>
                        <p className="text-xs text-gray-500">Kursus</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <ShoppingBag className="w-4 h-4 mx-auto text-pink-600 mb-1" />
                        <p className="text-xs font-semibold text-gray-700">{plan._count.membershipProducts}</p>
                        <p className="text-xs text-gray-500">Produk</p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2">
                  {isCurrent ? (
                    <Button className="w-full" disabled variant="outline">
                      <Check className="w-4 h-4 mr-2" />
                      Plan Aktif
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      onClick={() => handleUpgrade(plan)}
                    >
                      {currentMembership ? (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Upgrade Sekarang
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Pilih Plan Ini
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      <X className="w-4 h-4 mr-2" />
                      Bukan Upgrade
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Benefits Section - Enhanced */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50 overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Kenapa Harus Upgrade?
            </span>
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">Nikmati berbagai keuntungan eksklusif</p>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-4 bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-purple-900">Akses Unlimited</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Akses ke <strong>semua kursus</strong>, materi premium, dan resource eksklusif tanpa batas
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4 bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-pink-900">Komunitas Eksklusif</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Bergabung dengan <strong>komunitas premium</strong> dan networking berkualitas tinggi
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4 bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-blue-900">Update Terbaru</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Dapatkan <strong>akses pertama</strong> ke konten dan fitur terbaru sebelum yang lain
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ or Support - Enhanced */}
      <div className="text-center bg-white rounded-2xl shadow-lg p-10 space-y-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-900">
            Punya Pertanyaan?
          </h3>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tim support kami siap membantu Anda memilih plan yang tepat dan menjawab semua pertanyaan tentang membership
          </p>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/my-dashboard">
            <Button variant="outline" size="lg" className="gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all">
              <ArrowRight className="w-5 h-5" />
              Lihat Dashboard
            </Button>
          </Link>
          <Link href="/messages">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all">
              💬 Hubungi Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </div>
    </ResponsivePageWrapper>
  )
}
