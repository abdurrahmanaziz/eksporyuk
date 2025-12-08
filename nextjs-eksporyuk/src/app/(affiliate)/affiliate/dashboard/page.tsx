'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import Link from 'next/link'
import OnboardingChecklist from '@/components/affiliate/OnboardingChecklist'
import Leaderboard from '@/components/affiliate/Leaderboard'
import {
  Users,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Target,
  ArrowUpRight,
  Clock,
  Trophy,
  Gift,
  ChevronRight,
  Wallet,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Percent,
  ShoppingCart,
  Zap,
  Award,
  BarChart3,
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
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    if (status === 'authenticated') {
      checkWelcomeStatus()
      fetchStats()
      fetchChallenges()
    }
  }, [status])

  useEffect(() => {
    // Refresh data when window gains focus (user returns from training/other pages)
    const handleFocus = () => {
      if (status === 'authenticated') {
        checkWelcomeStatus()
        fetchStats()
        fetchChallenges()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [status])

  const checkWelcomeStatus = async () => {
    try {
      const response = await fetch('/api/affiliate/onboarding')
      const data = await response.json()
      
      if (data.success && data.data?.needsWelcome) {
        // Redirect to welcome page if first time after approval
        router.push('/affiliate/welcome')
        return
      }
    } catch (error) {
      console.error('Error checking welcome status:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch from both endpoints for complete data
      const [statsRes, dashboardRes] = await Promise.all([
        fetch('/api/affiliate/stats'),
        fetch('/api/dashboard/stats')
      ])
      
      const statsData = await statsRes.json()
      const dashboardData = await dashboardRes.json()
      
      // Merge data
      setStats({
        ...statsData,
        recentClicks: dashboardData.affiliate?.recentClicks || 0,
        recentConversions: dashboardData.affiliate?.recentConversions || 0,
        recentEarnings: dashboardData.affiliate?.recentEarnings || 0,
        tier: dashboardData.affiliate?.tier || 1,
        commissionRate: Number(dashboardData.affiliate?.commissionRate) || 10,
        affiliateCode: dashboardData.affiliate?.affiliateCode || '',
        shortLink: dashboardData.affiliate?.shortLink || '',
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/affiliate/challenges?status=active&limit=3')
      const data = await response.json()
      if (data.challenges) {
        setChallenges(data.challenges)
      }
    } catch (error) {
      console.error('Error fetching challenges:', error)
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

  const getRewardLabel = (type: string, value: number) => {
    if (type === 'BONUS_COMMISSION' || type === 'CASH_BONUS') {
      return formatCurrency(value)
    }
    return formatCurrency(value)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-100">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.secondary}15 100%)`
          }}
        />
        <div className="relative bg-white/80 backdrop-blur-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                style={{ 
                  backgroundColor: theme.primary,
                  boxShadow: `0 4px 14px 0 ${theme.primary}40`
                }}
              >
                <span className="text-white">💰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Halo, {session?.user?.name}! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                  Selamat datang di Dashboard Affiliate Eksporyuk
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Komisi Bulan Ini */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-green-100 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              Bulan Ini
            </div>
          </div>
          <p className="text-green-100 text-sm mb-1">Komisi Bulan Ini</p>
          <p className="text-3xl font-bold">{formatCurrency(stats?.recentEarnings || 0)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-green-100 text-xs">
              Total: {formatCurrency(stats?.totalEarnings || 0)}
            </p>
          </div>
        </div>

        {/* Total Klik */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 text-blue-500 text-sm bg-blue-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              +{stats?.recentClicks || 0}
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Total Klik</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.totalClicks || 0)}</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-400 text-xs">
              Klik bulan ini: {formatNumber(stats?.recentClicks || 0)}
            </p>
          </div>
        </div>

        {/* Total Konversi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 text-purple-500 text-sm bg-purple-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              +{stats?.recentConversions || 0}
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Total Konversi</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.totalConversions || 0)}</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-400 text-xs">
              Conversion rate: {(stats?.conversionRate || 0).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Saldo Tersedia */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <Link 
              href="/affiliate/wallet"
              className="flex items-center gap-1 text-orange-100 text-sm hover:text-white transition-colors"
            >
              Detail
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-orange-100 text-sm mb-1">Saldo Tersedia</p>
          <p className="text-3xl font-bold">{formatCurrency(stats?.availableBalance || 0)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-orange-100 text-xs">
              Pending: {formatCurrency(stats?.pendingEarnings || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Affiliate Link */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Link Affiliate Kamu</h2>
                <p className="text-sm text-gray-500">Bagikan link ini untuk mendapatkan komisi</p>
              </div>
            </div>
            
            {stats?.shortLink ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-700 truncate">{stats.shortLink}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(stats.shortLink || '')}
                  className="px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Tersalin!' : 'Copy'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 text-sm">
                  Link affiliate belum tersedia. Hubungi admin untuk aktivasi.
                </span>
              </div>
            )}

            {stats?.affiliateCode && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-sm">Kode Affiliate:</span>
                  <span className="font-mono font-semibold text-gray-900">{stats.affiliateCode}</span>
                </div>
                <Link 
                  href="/affiliate/links"
                  className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  Kelola Link
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Performa Affiliate</h2>
                  <p className="text-sm text-gray-500">Ringkasan aktivitas bulan ini</p>
                </div>
              </div>
              <Link 
                href="/affiliate/reports"
                className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                Lihat Laporan
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Simple Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(stats?.recentClicks || 0)}</p>
                <p className="text-sm text-blue-600 mt-1">Klik</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-purple-600">{formatNumber(stats?.recentConversions || 0)}</p>
                <p className="text-sm text-purple-600 mt-1">Konversi</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{(stats?.conversionRate || 0).toFixed(1)}%</p>
                <p className="text-sm text-green-600 mt-1">Rate</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Target Bulanan</span>
                <span className="font-semibold text-gray-900">
                  {stats?.recentConversions || 0} / 10 konversi
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(((stats?.recentConversions || 0) / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {(stats?.recentConversions || 0) >= 10 
                  ? '🎉 Target tercapai! Terus tingkatkan performamu!'
                  : `Butuh ${10 - (stats?.recentConversions || 0)} konversi lagi untuk mencapai target`}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/affiliate/links" className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-center group">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Link2 className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Buat Link</span>
              </Link>
              <Link href="/affiliate/short-links" className="p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-center group">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Short Link</span>
              </Link>
              <Link href="/affiliate/wallet" className="p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-center group">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Wallet</span>
              </Link>
              <Link href="/affiliate/challenges" className="p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all text-center group">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Tantangan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Affiliate Status */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Status Affiliate</h3>
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                Aktif
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Total Penjualan</span>
                <span className="font-bold text-gray-900">{formatNumber(stats?.totalConversions || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Total Komisi</span>
                <span className="font-bold text-green-600">{formatCurrency(stats?.totalEarnings || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Saldo Tersedia</span>
                <span className="font-bold text-emerald-600">{formatCurrency(stats?.walletBalance || 0)}</span>
              </div>
            </div>
          </div>

          {/* Tantangan Affiliate Widget */}
          {challenges.length > 0 ? (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-gray-900">🔥 Tantangan Aktif</h3>
                </div>
                <Link 
                  href="/affiliate/challenges" 
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  Semua
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {challenges.slice(0, 3).map((challenge) => (
                  <Link 
                    key={challenge.id}
                    href="/affiliate/challenges"
                    className="block p-3 bg-white rounded-xl border border-orange-100 hover:border-orange-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {challenge.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Target: {challenge.targetType === 'REVENUE' 
                            ? formatCurrency(challenge.targetValue) 
                            : challenge.targetValue} {getTargetLabel(challenge.targetType)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        {challenge.daysRemaining}h
                      </div>
                    </div>
                    
                    {challenge.hasJoined && challenge.userProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-semibold text-orange-600">
                            {challenge.userProgress.progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                            style={{ width: `${Math.min(challenge.userProgress.progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Gift className="w-3 h-3" />
                        {getRewardLabel(challenge.rewardType, challenge.rewardValue)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {challenge.participantsCount}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/affiliate/challenges"
                className="mt-4 w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Target className="w-4 h-4" />
                Lihat Semua Tantangan
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">Tantangan</h3>
              </div>
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Belum ada tantangan aktif</p>
                <Link 
                  href="/affiliate/challenges"
                  className="text-sm text-indigo-500 hover:text-indigo-600 mt-2 inline-block"
                >
                  Lihat Semua Tantangan →
                </Link>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">💡 Tips Affiliate</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <strong>Bagikan di media sosial</strong> - Posting link affiliate kamu di Instagram, Facebook, atau TikTok
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-sm text-green-700">
                  <strong>Gunakan short link</strong> - Link pendek lebih mudah dibagikan dan terlihat profesional
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-700">
                  <strong>Ikuti tantangan</strong> - Dapatkan bonus tambahan dengan menyelesaikan tantangan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section - Full Width */}
        <div className="col-span-1 lg:col-span-2">
          <Leaderboard period="weekly" limit={10} showCurrentUser={true} />
        </div>
      </div>
    </div>
  )
}
