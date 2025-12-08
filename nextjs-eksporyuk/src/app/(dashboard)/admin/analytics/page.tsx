'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  ShoppingBag,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface AnalyticsData {
  overview: {
    totalUsers: number
    newUsersToday: number
    userGrowth: number
    totalRevenue: number
    revenueGrowth: number
    totalTransactions: number
    transactionGrowth: number
    activeMemberships: number
    membershipGrowth: number
  }
  charts: {
    userGrowth: { date: string; count: number }[]
    revenueChart: { date: string; amount: number }[]
    transactionChart: { date: string; count: number }[]
  }
  topProducts: { id: string; name: string; sales: number; revenue: number }[]
  topCourses: { id: string; title: string; enrollments: number; completion: number }[]
  recentActivity: { type: string; description: string; timestamp: string }[]
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState('7d')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  // Redirect non-admin users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Gagal memuat data analitik')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAnalytics()
    }
  }, [session, fetchAnalytics])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(growth).toFixed(1)}%
      </span>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-500 mt-1">Overview performa sistem</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                  <SelectItem value="30d">30 Hari Terakhir</SelectItem>
                  <SelectItem value="90d">90 Hari Terakhir</SelectItem>
                  <SelectItem value="1y">1 Tahun</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Users</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.overview.totalUsers?.toLocaleString() || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">+{analytics?.overview.newUsersToday || 0} hari ini</span>
              {formatGrowth(analytics?.overview.userGrowth || 0)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics?.overview.totalRevenue || 0)}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Periode ini</span>
              {formatGrowth(analytics?.overview.revenueGrowth || 0)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Transaksi</span>
              <ShoppingBag className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.overview.totalTransactions?.toLocaleString() || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Periode ini</span>
              {formatGrowth(analytics?.overview.transactionGrowth || 0)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Active Membership</span>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.overview.activeMemberships?.toLocaleString() || 0}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Member aktif</span>
              {formatGrowth(analytics?.overview.membershipGrowth || 0)}
            </div>
          </div>
        </div>

        {/* Charts & Tables */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Top Produk</TabsTrigger>
              <TabsTrigger value="courses">Top Kursus</TabsTrigger>
              <TabsTrigger value="activity">Aktivitas Terbaru</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* User Growth Chart Placeholder */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">Pertumbuhan User</h3>
                    <p className="text-sm text-gray-500">Jumlah user baru per hari</p>
                  </div>
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Chart data akan ditampilkan di sini</p>
                      <p className="text-xs mt-1">Integrasi dengan Recharts/Chart.js</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Chart Placeholder */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">Revenue</h3>
                    <p className="text-sm text-gray-500">Total pendapatan per hari</p>
                  </div>
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue chart akan ditampilkan di sini</p>
                      <p className="text-xs mt-1">Integrasi dengan Recharts/Chart.js</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Top Selling Products</h3>
                  <p className="text-sm text-gray-500">Produk dengan penjualan tertinggi</p>
                </div>
                {analytics?.topProducts?.length ? (
                  analytics.topProducts.map((product, idx) => (
                    <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} sales</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">{formatCurrency(product.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada data produk</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="courses">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Top Courses</h3>
                  <p className="text-sm text-gray-500">Kursus dengan enrollment tertinggi</p>
                </div>
                {analytics?.topCourses?.length ? (
                  analytics.topCourses.map((course, idx) => (
                    <div key={course.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-500">{course.enrollments} enrollments</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700">{course.completion}% completion</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada data kursus</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Aktivitas Terbaru</h3>
                  <p className="text-sm text-gray-500">Log aktivitas sistem terbaru</p>
                </div>
                {analytics?.recentActivity?.length ? (
                  analytics.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <Clock className="h-4 w-4 mt-1 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(activity.timestamp), 'dd MMM yyyy HH:mm', { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada aktivitas</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
