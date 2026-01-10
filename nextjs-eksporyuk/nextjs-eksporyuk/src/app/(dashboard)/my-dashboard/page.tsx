'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Crown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  BookOpen,
  ShoppingBag,
  Sparkles,
  ArrowRight
} from 'lucide-react'

interface MembershipData {
  hasMembership: boolean
  message?: string
  membership?: {
    id: string
    startDate: string
    endDate: string
    status: string
    isActive: boolean
    daysRemaining: number | null
    isExpiringSoon: boolean
    isLifetime: boolean
    plan: {
      name: string
      slug: string
      description: string
      duration: string
      features: any[]
      groups: Array<{ id: string; name: string; slug: string; description?: string }>
      courses: Array<{ id: string; title: string; slug: string; thumbnail?: string; description?: string }>
      products: Array<{ id: string; name: string; slug: string; thumbnail?: string; description?: string }>
    }
    canRenew: boolean
    canUpgrade: boolean
    upgradeRecommended: boolean
  }
}

export default function MyDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-dashboard')
      return
    }

    if (status === 'authenticated') {
      fetchMembership()
    }
  }, [status, router])

  const fetchMembership = async () => {
    try {
      const response = await fetch('/api/memberships/user')
      const data = await response.json()
      setMembershipData(data)
    } catch (error) {
      console.error('Error fetching membership:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <LoadingSkeleton />
  }

  if (!membershipData?.hasMembership) {
    return <NoMembershipView />
  }

  const { membership } = membershipData
  const daysRemaining = membership!.daysRemaining
  const isLifetime = membership!.isLifetime

  return (
    <ResponsivePageWrapper>
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            My Membership
          </h1>
          <p className="text-gray-600 mt-1">Kelola dan pantau membership Anda</p>
        </div>
        {membership!.canUpgrade && (
          <Link href="/dashboard/upgrade">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </Link>
        )}
      </div>

      {/* Status Alert */}
      {membership!.isExpiringSoon && !isLifetime && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">
                  Membership Anda akan berakhir dalam {daysRemaining} hari
                </p>
                <p className="text-sm text-orange-700">
                  Perpanjang sekarang agar tidak kehilangan akses ke semua benefit
                </p>
              </div>
              <Link href="/dashboard/upgrade">
                <Button size="sm" variant="outline" className="border-orange-600 text-orange-600">
                  Perpanjang
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Membership Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 hover:bg-purple-700 text-lg px-3 py-1">
                  {membership!.plan.name}
                </Badge>
                {membership!.status === 'ACTIVE' && (
                  <Badge variant="outline" className="border-green-600 text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{membership!.plan.description}</p>
            </div>
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Mulai</p>
                <p className="font-semibold">
                  {new Date(membership!.startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">
                  {isLifetime ? 'Durasi' : 'Berakhir'}
                </p>
                <p className="font-semibold">
                  {isLifetime ? 'Lifetime' : new Date(membership!.endDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Sisa Waktu</p>
                <p className="font-semibold">
                  {isLifetime ? 'Selamanya' : `${daysRemaining} hari`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Fitur yang Anda Dapatkan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {membership!.plan.features.map((feature: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Groups */}
        {membership!.plan.groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Grup Komunitas
              </CardTitle>
              <CardDescription>
                {membership!.plan.groups.length} grup tersedia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {membership!.plan.groups.slice(0, 3).map((group) => (
                <Link
                  key={group.id}
                  href={`/community/groups/${group.slug}`}
                  className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <p className="font-medium text-sm">{group.name}</p>
                </Link>
              ))}
              {membership!.plan.groups.length > 3 && (
                <Link href="/community/groups" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Lihat semua <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Courses */}
        {membership!.plan.courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Kursus
              </CardTitle>
              <CardDescription>
                {membership!.plan.courses.length} kursus tersedia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {membership!.plan.courses.slice(0, 3).map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <p className="font-medium text-sm">{course.title}</p>
                </Link>
              ))}
              {membership!.plan.courses.length > 3 && (
                <Link href="/my-courses" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                  Lihat semua <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products */}
        {membership!.plan.products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                Produk
              </CardTitle>
              <CardDescription>
                {membership!.plan.products.length} produk tersedia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {membership!.plan.products.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <p className="font-medium text-sm">{product.name}</p>
                </Link>
              ))}
              {membership!.plan.products.length > 3 && (
                <Link href="/products" className="text-sm text-green-600 hover:underline flex items-center gap-1">
                  Lihat semua <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {membership!.upgradeRecommended && (
            <Link href="/dashboard/upgrade">
              <Button variant="outline" className="border-purple-600 text-purple-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          )}
          {membership!.canRenew && !isLifetime && (
            <Link href="/dashboard/upgrade">
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Perpanjang Membership
              </Button>
            </Link>
          )}
          <Link href="/my-courses">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Lihat Kursus
            </Button>
          </Link>
          <Link href="/community/groups">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Join Grup
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

function NoMembershipView() {
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card className="border-2 border-dashed">
        <CardContent className="p-12 text-center">
          <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Belum Punya Membership</h2>
          <p className="text-gray-600 mb-6">
            Dapatkan akses penuh ke semua kursus, grup komunitas, dan benefit eksklusif lainnya
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/upgrade">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Sparkles className="w-5 h-5 mr-2" />
                Pilih Membership
              </Button>
            </Link>
            <Link href="/membership">
              <Button size="lg" variant="outline">
                Lihat Benefit
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
