'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmailVerificationModal from '@/components/member/EmailVerificationModal'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, Users, TrendingUp, Award, Clock, 
  CheckCircle, AlertCircle, DollarSign, BarChart3, Play
} from 'lucide-react'

type DashboardStats = {
  totalCourses: number
  publishedCourses: number
  pendingCourses: number
  draftCourses: number
  totalStudents: number
  activeStudents: number
  totalRevenue: number
  monthlyRevenue: number
  averageRating: number
  totalReviews: number
  completionRate: number
  recentEnrollments: Array<{
    id: string
    courseName: string
    studentName: string
    enrolledAt: string
  }>
}

export default function MentorDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      // Check allRoles for multi-role support (user may have MENTOR as additional role)
      const allRoles = session?.user?.allRoles || [session?.user?.role]
      const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
      if (!hasMentorAccess) {
        router.push('/dashboard')
        return
      }
      fetchDashboardStats()
    }
  }, [status, session, router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Gagal memuat data dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <EmailVerificationModal onComplete={() => window.location.reload()} />
      <div className="container mx-auto py-8 px-4">
        <EmailVerificationBanner />
        {/* Header */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Mentor</h1>
        <p className="text-muted-foreground">Selamat datang kembali, {session?.user?.name}!</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kursus</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{stats.publishedCourses} published</span>
              <Clock className="h-3 w-3 text-yellow-600 ml-2" />
              <span>{stats.pendingCourses} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.activeStudents} aktif belajar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-green-600 mt-2">
              {formatPrice(stats.monthlyRevenue)} bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rating Rata-rata</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              dari {stats.totalReviews} review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Status Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status Kursus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Published</p>
                    <p className="text-sm text-green-700">Kursus yang sudah aktif</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.publishedCourses}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">Pending Review</p>
                    <p className="text-sm text-yellow-700">Menunggu persetujuan admin</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingCourses}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Draft</p>
                    <p className="text-sm text-gray-700">Belum disubmit</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-600">{stats.draftCourses}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tingkat Penyelesaian Siswa</span>
                <span className="text-sm font-semibold">{stats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada enrollment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{enrollment.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{enrollment.courseName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(enrollment.enrolledAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/mentor/courses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <BookOpen className="h-10 w-10 text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Kelola Kursus</h3>
              <p className="text-sm text-muted-foreground">
                Edit, update, dan kelola kursus Anda
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mentor/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <Users className="h-10 w-10 text-green-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Siswa Saya</h3>
              <p className="text-sm text-muted-foreground">
                Monitor progress dan aktivitas siswa
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mentor/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <BarChart3 className="h-10 w-10 text-purple-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Lihat statistik dan performa kursus
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
    </ResponsivePageWrapper>
  )
}
