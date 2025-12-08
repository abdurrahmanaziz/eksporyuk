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
  Info
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

  return (
    <ResponsivePageWrapper>
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upgrade Membership
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tingkatkan pengalaman belajar Anda dengan fitur-fitur eksklusif
        </p>
      </div>

      {/* Current Membership Info */}
      {currentMembership && !currentMembership.isLifetime && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Membership Aktif Anda</h3>
                <p className="text-blue-800">
                  <strong>{currentMembership.plan.name}</strong> - Sisa {currentMembership.daysRemaining} hari
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  💡 Mode Accumulate: Nilai sisa hari akan dikurangkan dari harga plan baru
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Berakhir:</p>
                <p className="font-semibold text-blue-900">
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

      {/* Lifetime Info Alert */}
      {currentMembership && !currentMembership.isLifetime && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Perhatian:</strong> Upgrade ke <strong>Lifetime Membership</strong> harus membayar harga penuh (tanpa potongan sisa hari). 
            Upgrade ke plan temporal lainnya (1-12 bulan) dapat menggunakan mode Accumulate.
          </AlertDescription>
        </Alert>
      )}

      {/* Upgrade Mode Selection */}
      {currentMembership && !currentMembership.isLifetime && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pilih Mode Upgrade</CardTitle>
            <CardDescription>
              Tentukan bagaimana nilai membership lama Anda diperhitungkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={upgradeMode} onValueChange={(value: any) => setUpgradeMode(value)}>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="accumulate" id="accumulate" />
                <Label htmlFor="accumulate" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Accumulate (Rekomendasi)</div>
                  <p className="text-sm text-gray-600">
                    Nilai sisa hari membership lama dikurangkan dari harga baru. Hemat lebih banyak!
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Full Price</div>
                  <p className="text-sm text-gray-600">
                    Bayar harga penuh tanpa perhitungan sisa hari. Membership lama otomatis expire.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isLifetime = plan.duration === 'LIFETIME'
          const isCurrent = isCurrentPlan(plan.id)
          const canUpgrade = isUpgrade(plan)
          const upgradePrice = calculateUpgradePrice(plan)
          const savings = isLifetime ? 0 : (plan.price - upgradePrice) // No savings for LIFETIME

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-xl ${
                plan.isMostPopular ? 'border-2 border-purple-500 shadow-lg scale-105' : ''
              } ${isCurrent ? 'border-green-500 bg-green-50' : ''}`}
            >
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {plan.isMostPopular && (
                  <Badge className="bg-purple-600">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Terpopuler
                  </Badge>
                )}
                {plan.isPopular && !plan.isMostPopular && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    Paling Laris
                  </Badge>
                )}
                {plan.isBestSeller && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    Best Seller
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="bg-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Aktif
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {formatDuration(plan.duration)}
                  </CardDescription>
                </div>

                {/* Price */}
                <div className="pt-4">
                  {plan.discount > 0 && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500 line-through">
                        Rp {plan.originalPrice?.toLocaleString('id-ID')}
                      </span>
                      <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                        -{plan.discount}%
                      </Badge>
                    </div>
                  )}
                  <div className="text-3xl font-bold">
                    Rp {upgradePrice.toLocaleString('id-ID')}
                  </div>
                  {isLifetime && currentMembership && !currentMembership.isLifetime && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      ⭐ Harga penuh (Premium Lifetime Access)
                    </p>
                  )}
                  {!isLifetime && currentMembership && !currentMembership.isLifetime && upgradeMode === 'accumulate' && savings > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      💰 Hemat Rp {savings.toLocaleString('id-ID')} dari sisa membership
                    </p>
                  )}
                  {!isLifetime && (
                    <p className="text-sm text-gray-500">
                      /{formatDuration(plan.duration).toLowerCase()}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  {plan.features && Array.isArray(plan.features) && plan.features.slice(0, 5).map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">
                        {typeof feature === 'string' ? feature : (feature.name || feature.label || 'Fitur tersedia')}
                      </span>
                    </div>
                  ))}
                  
                  {(!plan.features || plan.features.length === 0) && (
                    <p className="text-sm text-gray-500 italic">Tidak ada detail fitur tersedia</p>
                  )}
                </div>

                {/* Stats */}
                {plan._count && (
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <Users className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600">{plan._count.membershipGroups} Grup</p>
                    </div>
                    <div className="text-center">
                      <BookOpen className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600">{plan._count.membershipCourses} Kursus</p>
                    </div>
                    <div className="text-center">
                      <ShoppingBag className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-600">{plan._count.membershipProducts} Produk</p>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" disabled variant="outline">
                    <Check className="w-4 h-4 mr-2" />
                    Plan Aktif
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                        Pilih Plan
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

      {/* Benefits Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Kenapa Harus Upgrade?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Akses Unlimited</h3>
                <p className="text-sm text-gray-600">
                  Akses ke semua kursus, materi, dan resource tanpa batas
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Komunitas Eksklusif</h3>
                <p className="text-sm text-gray-600">
                  Bergabung dengan komunitas premium dan networking berkualitas
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Update Terbaru</h3>
                <p className="text-sm text-gray-600">
                  Dapatkan akses first ke konten dan fitur terbaru
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ or Support */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Punya pertanyaan tentang membership?
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/my-dashboard">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 mr-2" />
              Lihat Dashboard
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="outline">
              💬 Hubungi Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
