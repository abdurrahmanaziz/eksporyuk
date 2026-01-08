'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Package, 
  DollarSign, 
  Activity, 
  Crown, 
  Settings,
  TrendingUp,
  Bell,
  ShoppingCart,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Radio,
  Zap,
  Link2,
  Award,
  Flag,
  FileText,
  Percent,
  CreditCard,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  BarChart3,
  Eye,
  MousePointer,
  Target,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStats, useXenditBalance } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import ViewAsUserModal from '@/components/admin/ViewAsUserModal'

interface DashboardStats {
  users: {
    total: number
    active: number
    new30Days: number
    growth: string
    online: number
  }
  memberships: {
    total: number
    active: number
  }
  revenue: {
    total: number
    thisMonth: number
    growth: string
  }
  transactions: {
    total: number
    pending: number
  }
  content: {
    courses: number
    lessons: number
    products: number
    forums: number
    discussions: number
    comments: number
  }
  affiliates: {
    totalLinks: number
    activeLinks: number
    totalClicks: number
  }
  notifications: {
    sent30Days: number
    templates: number
    autoRules: number
  }
  moderation: {
    pendingReports: number
  }
}

interface TrafficSource {
  name: string
  key: string
  count: number
  percentage: number
  color: string
  icon: string
}

interface TopAffiliate {
  rank: number
  affiliateId: string
  name: string
  sales: number
  commission: number
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [trafficSources, setTrafficSources] = React.useState<TrafficSource[]>([])
  const [trafficLoading, setTrafficLoading] = React.useState(true)
  const [topAffiliates, setTopAffiliates] = React.useState<TopAffiliate[]>([])
  const [affiliatesLoading, setAffiliatesLoading] = React.useState(true)
  const [affiliatesPeriod, setAffiliatesPeriod] = React.useState('')
  const [showViewAsUserModal, setShowViewAsUserModal] = React.useState(false)
  
  // Use React Query hooks for cached, auto-refreshing data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats()
  const { data: xenditBalance, isLoading: xenditLoading, error: xenditError, refetch: refetchXendit } = useXenditBalance()

  // Fetch traffic sources
  React.useEffect(() => {
    const fetchTrafficSources = async () => {
      try {
        const res = await fetch('/api/admin/stats/traffic-source')
        if (res.ok) {
          const data = await res.json()
          setTrafficSources(data.sources || [])
        }
      } catch (error) {
        console.error('Error fetching traffic sources:', error)
      } finally {
        setTrafficLoading(false)
      }
    }
    
    fetchTrafficSources()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrafficSources, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch top affiliates
  React.useEffect(() => {
    const fetchTopAffiliates = async () => {
      try {
        const res = await fetch('/api/admin/stats/top-affiliates')
        if (res.ok) {
          const data = await res.json()
          setTopAffiliates(data.affiliates || [])
          setAffiliatesPeriod(data.period || '')
        }
      } catch (error) {
        console.error('Error fetching top affiliates:', error)
      } finally {
        setAffiliatesLoading(false)
      }
    }
    
    fetchTopAffiliates()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTopAffiliates, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000000000) {
      return `Rp ${(amount / 1000000000000).toFixed(1)}T`
    } else if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}K`
    }
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        {/* Modern Header with Gradient */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats?.users.online !== undefined && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{stats.users.online} Online</span>
              </div>
            )}
            {stats?.moderation.pendingReports > 0 && (
              <Badge variant="destructive" className="gap-1 px-3 py-2 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                {stats.moderation.pendingReports} Reports
              </Badge>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowViewAsUserModal(true)}
              className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-purple-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              View As User
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => { refetchStats(); refetchXendit(); }}
              className="rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modern Stats Cards with Gradient */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                {!statsLoading && stats?.users.growth && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    parseFloat(stats.users.growth) >= 0 ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
                  )}>
                    {parseFloat(stats.users.growth) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stats.users.growth}%
                  </div>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 bg-white/20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats?.users.total.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-100 mb-3">Total Users</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-blue-100">{stats?.users.active.toLocaleString()} Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-blue-100">{stats?.users.new30Days} New</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-500 to-emerald-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                {!statsLoading && stats?.revenue.growth && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    parseFloat(stats.revenue.growth) >= 0 ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
                  )}>
                    {parseFloat(stats.revenue.growth) >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stats.revenue.growth}%
                  </div>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-32 bg-white/20" />
              ) : (
                <>
                  <div className="text-[24px] font-bold text-white mb-1">
                    {formatCurrency(stats?.revenue.total || 0)}
                  </div>
                  <p className="text-sm text-green-100 mb-3">Total Revenue</p>
                  <div className="text-xs text-green-100">
                    {formatCurrency(stats?.revenue.thisMonth || 0)} this month
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Memberships Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-500 to-violet-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-white/20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats?.memberships.active.toLocaleString()}
                  </div>
                  <p className="text-sm text-purple-100 mb-3">Active Members</p>
                  <div className="text-xs text-purple-100">
                    {stats?.memberships.total.toLocaleString()} total memberships
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Transactions Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-500 to-amber-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                {!statsLoading && stats?.transactions.pending > 0 && (
                  <Badge className="rounded-lg bg-red-500/20 text-red-100 border-0">
                    {stats.transactions.pending}
                  </Badge>
                )}
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-white/20" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats?.transactions.total.toLocaleString()}
                  </div>
                  <p className="text-sm text-orange-100 mb-3">Transactions</p>
                  <div className="text-xs text-orange-100">
                    {stats?.transactions.pending > 0 ? `${stats.transactions.pending} pending approval` : 'All processed'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Revenue Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Revenue Bulanan</CardTitle>
                    <CardDescription>Pendapatan 6 bulan terakhir</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple Bar Chart Visualization */}
                <div className="flex items-end justify-between gap-2 h-40">
                  {[
                    { month: 'Jul', value: 65, amount: '2.1M' },
                    { month: 'Aug', value: 45, amount: '1.5M' },
                    { month: 'Sep', value: 78, amount: '2.5M' },
                    { month: 'Oct', value: 52, amount: '1.7M' },
                    { month: 'Nov', value: 88, amount: '2.8M' },
                    { month: 'Des', value: 100, amount: '3.2M' },
                  ].map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Rp {item.amount}</span>
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-green-500"
                        style={{ height: `${item.value}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-500">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Bulan Ini</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.revenue.total || 0)}</p>
                  </div>
                  <Link href="/admin/sales">
                    <Button variant="outline" size="sm" className="gap-2">
                      Lihat Detail
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lifetime Stats */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg dark:text-white">Lifetime Statistics</CardTitle>
                    <CardDescription className="dark:text-gray-400">Data keseluruhan platform</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Members</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.users.total.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sejak awal</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Total Revenue</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.revenue.lifetime || stats?.revenue.total || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lifetime</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Transactions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.transactions.total.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total transaksi</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs font-medium text-pink-600 dark:text-pink-400">Active Members</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.memberships.active.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Membership aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Performance Section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          {/* Affiliate Chart */}
          <Card className="border-0 shadow-lg lg:col-span-3 bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-md">
                    <Link2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg dark:text-white">Affiliate Performance</CardTitle>
                    <CardDescription className="dark:text-gray-400">Performa affiliate 7 hari terakhir</CardDescription>
                  </div>
                </div>
                <Link href="/admin/affiliates">
                  <Button variant="outline" size="sm" className="gap-2">
                    Kelola Affiliate
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simple Line Chart Visualization */}
              <div className="relative h-48 mb-4">
                <div className="absolute inset-0 flex items-end justify-between gap-1">
                  {[35, 45, 40, 60, 55, 80, 75].map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${value}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3].map((_, i) => (
                    <div key={i} className="border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => (
                  <span key={i}>{day}</span>
                ))}
              </div>
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-600 dark:text-cyan-400 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Clicks</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.affiliates.totalClicks?.toLocaleString() || '0'}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                    <MousePointer className="w-4 h-4" />
                    <span className="text-xs font-medium">Conversions</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.affiliates.conversions || '0'}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Commission</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.affiliates.totalCommission || 0)}</p>
                </div>
              </div>

              {/* Traffic Source Section */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sumber Traffic</h4>
                  <span className="text-xs text-gray-400">30 hari terakhir</span>
                </div>
                {trafficLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : trafficSources.length > 0 ? (
                  <div className="space-y-2">
                    {trafficSources.slice(0, 5).map((source) => (
                      <div key={source.key} className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: source.color }}
                        >
                          {source.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 truncate">{source.name}</span>
                        <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${source.percentage}%`,
                              backgroundColor: source.color
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-14 text-right">{source.count.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 w-8">{source.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    Belum ada data traffic
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Affiliates List - Top 10 */}
          <Card className="border-0 shadow-lg lg:col-span-2 bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg dark:text-white">Top 10 Affiliates</CardTitle>
                    <CardDescription className="dark:text-gray-400">{affiliatesPeriod || 'Bulan ini'}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{topAffiliates.length} affiliate</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-5">
              {affiliatesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : topAffiliates.length > 0 ? (
                <div className="max-h-[480px] overflow-y-auto pr-2 -mr-2 space-y-1">
                  {topAffiliates.slice(0, 10).map((affiliate) => (
                    <div key={affiliate.rank} className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        affiliate.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900 shadow-sm' :
                        affiliate.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-sm' :
                        affiliate.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-orange-800 shadow-sm' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {affiliate.rank}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
                        {affiliate.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate block">{affiliate.name}</span>
                        <span className="text-xs text-gray-400">{affiliate.sales.toLocaleString('id-ID')} sales</span>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400 text-sm flex-shrink-0">{formatCurrency(affiliate.commission)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Belum ada data affiliate bulan ini
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Link href="/admin/affiliates">
                  <Button variant="ghost" size="sm" className="w-full justify-center gap-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                    Lihat Semua Affiliate
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Audit Tools Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-900 dark:text-red-100">Security & Audit Tools</CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-300">
                    Tools keamanan dan monitoring untuk admin
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-400">
                Admin Only
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* View As User Tool */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">View As User</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Melihat platform dari perspektif user lain untuk debugging dan support
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => setShowViewAsUserModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Launch Tool
                    </Button>
                  </div>
                </div>
              </div>

              {/* Audit Log Tool */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Audit Logs</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Melihat log aktivitas admin view-as-user untuk audit trail
                    </p>
                    <Link href="/admin/audit/view-as-user">
                      <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                        <Activity className="w-4 h-4 mr-2" />
                        View Logs
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

            </div>

            {/* Warning Notice */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Perhatian Keamanan
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Semua aktivitas admin dicatat dalam audit log. Gunakan fitur ini hanya untuk keperluan 
                    debugging, dukungan customer, atau moderasi komunitas yang sah.
                  </p>
                </div>
              </div>
            </div>
            
          </CardContent>
        </Card>
        
    </div>
    
    {/* View As User Modal */}
    <ViewAsUserModal 
      isOpen={showViewAsUserModal}
      onClose={() => setShowViewAsUserModal(false)}
    />
    </ResponsivePageWrapper>
  )
}
