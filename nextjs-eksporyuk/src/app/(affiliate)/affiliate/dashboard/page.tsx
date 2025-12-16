'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OnboardingChecklist from '@/components/affiliate/OnboardingChecklist'
import Leaderboard from '@/components/affiliate/Leaderboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Users,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Trophy,
  Gift,
  ChevronRight,
  Wallet,
  Link2,
  Copy,
  Check,
  ExternalLink,
  ShoppingCart,
  Zap,
  BarChart3,
  Calendar,
  RefreshCw,
  Target,
} from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  targetType: string
  targetValue: number
  rewardType: string
  rewardValue: number
  startDate: string
  endDate: string
  daysRemaining: number
  participantsCount: number
  status: string
  hasJoined: boolean
  userProgress?: {
    currentValue: number
    progress: number
    completed: boolean
    rewardClaimed: boolean
  }
}

interface AffiliateStats {
  totalEarnings: number
  totalClicks: number
  totalConversions: number
  conversionRate: number
  pendingEarnings: number
  availableBalance: number
  recentClicks?: number
  recentConversions?: number
  recentEarnings?: number
  tier?: number
  commissionRate?: number
  affiliateCode?: string
  shortLink?: string
  walletBalance?: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  // Use React Query for cached data fetching with realtime updates
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['affiliate', 'dashboard-stats'],
    queryFn: async () => {
      const [statsRes, dashboardRes] = await Promise.all([
        fetch('/api/affiliate/stats'),
        fetch('/api/dashboard/stats')
      ])
      
      const stats = await statsRes.json()
      const dashboard = await dashboardRes.json()
      
      return {
        ...stats,
        recentClicks: dashboard.affiliate?.recentClicks || 0,
        recentConversions: dashboard.affiliate?.recentConversions || 0,
        recentEarnings: dashboard.affiliate?.recentEarnings || 0,
        tier: dashboard.affiliate?.tier || 1,
        commissionRate: Number(dashboard.affiliate?.commissionRate) || 10,
        affiliateCode: dashboard.affiliate?.affiliateCode || '',
        shortLink: dashboard.affiliate?.shortLink || '',
        walletBalance: dashboard.affiliate?.walletBalance || stats.availableBalance || 0,
      }
    },
    enabled: status === 'authenticated',
    staleTime: 15 * 1000,
    refetchInterval: 30000, // Realtime: refresh every 30 seconds
    refetchOnWindowFocus: true,
  })

  const { data: challengesData } = useQuery({
    queryKey: ['affiliate', 'challenges', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/affiliate/challenges?status=active&limit=3')
      const data = await response.json()
      return data.challenges || []
    },
    enabled: status === 'authenticated',
    staleTime: 60 * 1000,
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (status === 'authenticated') {
      checkWelcomeStatus()
    }
  }, [status])

  const stats = statsData as AffiliateStats | null
  const challenges = (challengesData || []) as Challenge[]
  const loading = statsLoading

  const checkWelcomeStatus = async () => {
    try {
      const response = await fetch('/api/affiliate/onboarding')
      const data = await response.json()
      if (data.success && data.data?.needsWelcome) {
        router.push('/affiliate/welcome')
      }
    } catch (error) {
      console.error('Error checking welcome status:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value)
  }

  const getTargetLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALES_COUNT: 'penjualan',
      REVENUE: 'revenue',
      CLICKS: 'klik',
      CONVERSIONS: 'konversi',
      NEW_CUSTOMERS: 'customer baru',
    }
    return labels[type] || type
  }

  const getRewardLabel = (type: string, value: number) => formatCurrency(value)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Modern Header - Same as Admin */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard Affiliate
            </h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Live Data</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetchStats()} className="rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <OnboardingChecklist />

      {/* Modern Stats Cards with Gradient */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Komisi Bulan Ini */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-500 to-emerald-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-400/20 text-green-100">
                <ArrowUpRight className="h-3 w-3" />
                Realtime
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 bg-white/20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.recentEarnings || 0)}</div>
                <p className="text-sm text-green-100 mb-3">Komisi Bulan Ini</p>
                <div className="text-xs text-green-100">Total: {formatCurrency(stats?.totalEarnings || 0)}</div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Klik */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <MousePointerClick className="h-6 w-6 text-white" />
              </div>
              {!loading && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-400/20 text-green-100">
                  <ArrowUpRight className="h-3 w-3" />
                  +{stats?.recentClicks || 0}
                </div>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-white/20" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white mb-1">{formatNumber(stats?.totalClicks || 0)}</div>
                <p className="text-sm text-blue-100 mb-3">Total Klik</p>
                <div className="text-xs text-blue-100">Bulan ini: {formatNumber(stats?.recentClicks || 0)} klik</div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Konversi */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-500 to-violet-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              {!loading && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-400/20 text-green-100">
                  <ArrowUpRight className="h-3 w-3" />
                  +{stats?.recentConversions || 0}
                </div>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-white/20" />
            ) : (
              <>
                <div className="text-3xl font-bold text-white mb-1">{formatNumber(stats?.totalConversions || 0)}</div>
                <p className="text-sm text-purple-100 mb-3">Total Konversi</p>
                <div className="text-xs text-purple-100">Rate: {(stats?.conversionRate || 0).toFixed(2)}%</div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Saldo Tersedia */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-500 to-amber-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <Link href="/affiliate/wallet" className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white/20 text-orange-100 hover:bg-white/30">
                Detail <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-28 bg-white/20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.availableBalance || 0)}</div>
                <p className="text-sm text-orange-100 mb-3">Saldo Tersedia</p>
                <div className="text-xs text-orange-100">Pending: {formatCurrency(stats?.pendingEarnings || 0)}</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Affiliate Link Card */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Link Affiliate Kamu</h2>
                  <p className="text-sm text-gray-500">Bagikan link ini untuk mendapatkan komisi</p>
                </div>
              </div>
              
              {stats?.shortLink ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{stats.shortLink}</span>
                  </div>
                  <Button onClick={() => copyToClipboard(stats.shortLink || '')} className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                    {copied ? 'Tersalin!' : 'Copy'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-700 dark:text-yellow-300 text-sm">Link affiliate belum tersedia. Hubungi admin untuk aktivasi.</span>
                </div>
              )}

              {stats?.affiliateCode && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Kode Affiliate:</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{stats.affiliateCode}</span>
                  </div>
                  <Link href="/affiliate/links" className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                    Kelola Link <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Performa Affiliate</h2>
                    <p className="text-sm text-gray-500">Ringkasan aktivitas bulan ini</p>
                  </div>
                </div>
                <Link href="/affiliate/reports" className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1">
                  Lihat Laporan <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(stats?.recentClicks || 0)}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Klik</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(stats?.recentConversions || 0)}</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Konversi</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(stats?.conversionRate || 0).toFixed(1)}%</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Rate</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Target Bulanan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats?.recentConversions || 0} / 10 konversi</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${Math.min(((stats?.recentConversions || 0) / 10) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {(stats?.recentConversions || 0) >= 10 ? '🎉 Target tercapai!' : `Butuh ${10 - (stats?.recentConversions || 0)} konversi lagi`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Aksi Cepat</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/affiliate/links" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-center group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Link2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Buat Link</span>
                </Link>
                <Link href="/affiliate/short-links" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-center group">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Link</span>
                </Link>
                <Link href="/affiliate/wallet" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-center group">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet</span>
                </Link>
                <Link href="/affiliate/challenges" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-center group">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tantangan</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Affiliate Status */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Status Affiliate</h3>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">✓ Aktif</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-100 text-sm">Total Penjualan</span>
                  <span className="font-bold text-white">{formatNumber(stats?.totalConversions || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-100 text-sm">Total Komisi</span>
                  <span className="font-bold text-white">{formatCurrency(stats?.totalEarnings || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-100 text-sm">Saldo Tersedia</span>
                  <span className="font-bold text-white">{formatCurrency(stats?.availableBalance || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-100 text-sm">Rate Komisi</span>
                  <span className="font-bold text-white">{stats?.commissionRate || 10}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tantangan */}
          {challenges.length > 0 ? (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">🔥 Tantangan Aktif</h3>
                  </div>
                  <Link href="/affiliate/challenges" className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
                    Semua <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {challenges.slice(0, 3).map((challenge: Challenge) => (
                    <Link key={challenge.id} href="/affiliate/challenges" className="block p-3 bg-white dark:bg-gray-800 rounded-xl border border-orange-100 dark:border-orange-800 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{challenge.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Target: {challenge.targetType === 'REVENUE' ? formatCurrency(challenge.targetValue) : challenge.targetValue} {getTargetLabel(challenge.targetType)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" />{challenge.daysRemaining}h
                        </div>
                      </div>
                      {challenge.hasJoined && challenge.userProgress && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-semibold text-orange-600">{challenge.userProgress.progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: `${Math.min(challenge.userProgress.progress, 100)}%` }} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                          <Gift className="w-3 h-3" />{getRewardLabel(challenge.rewardType, challenge.rewardValue)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />{challenge.participantsCount}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/affiliate/challenges" className="mt-4 w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex items-center justify-center gap-2 shadow-sm">
                  <Target className="w-4 h-4" />Lihat Semua Tantangan
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Tantangan</h3>
                </div>
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Belum ada tantangan aktif</p>
                  <Link href="/affiliate/challenges" className="text-sm text-indigo-500 hover:text-indigo-600 mt-2 inline-block">Lihat Semua →</Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">💡 Tips Affiliate</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Bagikan di media sosial</strong> - Posting link di Instagram, Facebook, atau TikTok</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-sm text-green-700 dark:text-green-300"><strong>Gunakan short link</strong> - Link pendek lebih mudah dibagikan</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-sm text-purple-700 dark:text-purple-300"><strong>Ikuti tantangan</strong> - Dapatkan bonus tambahan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Leaderboard period="weekly" limit={10} showCurrentUser={true} />
      </div>
    </div>
  )
}
