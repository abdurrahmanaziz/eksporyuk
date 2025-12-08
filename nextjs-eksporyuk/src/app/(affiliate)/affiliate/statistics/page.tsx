'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Globe,
  Smartphone,
  Monitor,
} from 'lucide-react'

interface StatisticsData {
  overview: {
    totalClicks: number
    totalConversions: number
    totalEarnings: number
    conversionRate: number
    avgCommission: number
  }
  timeRange: {
    today: {
      clicks: number
      conversions: number
      earnings: number
    }
    yesterday: {
      clicks: number
      conversions: number
      earnings: number
    }
    thisWeek: {
      clicks: number
      conversions: number
      earnings: number
    }
    lastWeek: {
      clicks: number
      conversions: number
      earnings: number
    }
    thisMonth: {
      clicks: number
      conversions: number
      earnings: number
    }
    lastMonth: {
      clicks: number
      conversions: number
      earnings: number
    }
  }
  devices: {
    desktop: number
    mobile: number
    tablet: number
  }
  topReferrers: Array<{
    source: string
    clicks: number
    conversions: number
  }>
}

export default function StatisticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/affiliate/statistics')
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return null
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat statistik...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Gagal memuat statistik</p>
          <button 
            onClick={fetchStatistics}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const todayChange = {
    clicks: calculateChange(data.timeRange.today.clicks, data.timeRange.yesterday.clicks),
    conversions: calculateChange(data.timeRange.today.conversions, data.timeRange.yesterday.conversions),
    earnings: calculateChange(data.timeRange.today.earnings, data.timeRange.yesterday.earnings),
  }

  const weekChange = {
    clicks: calculateChange(data.timeRange.thisWeek.clicks, data.timeRange.lastWeek.clicks),
    conversions: calculateChange(data.timeRange.thisWeek.conversions, data.timeRange.lastWeek.conversions),
    earnings: calculateChange(data.timeRange.thisWeek.earnings, data.timeRange.lastWeek.earnings),
  }

  const monthChange = {
    clicks: calculateChange(data.timeRange.thisMonth.clicks, data.timeRange.lastMonth.clicks),
    conversions: calculateChange(data.timeRange.thisMonth.conversions, data.timeRange.lastMonth.conversions),
    earnings: calculateChange(data.timeRange.thisMonth.earnings, data.timeRange.lastMonth.earnings),
  }

  return (
    <FeatureLock feature="statistics">
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistik Affiliate</h1>
            <p className="text-gray-600">Analisis detail performa affiliate kamu</p>
          </div>
        </div>
        
        <Link
          href="/affiliate/performance"
          className="px-4 py-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Lihat Performa</span>
        </Link>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">Total Klik</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalClicks)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600">Konversi</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalConversions)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">Total Komisi</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalEarnings)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600">Conv. Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.overview.conversionRate.toFixed(2)}%</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm text-gray-600">Rata Komisi</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.avgCommission)}</p>
        </div>
      </div>

      {/* Time Range Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today vs Yesterday */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Hari Ini vs Kemarin</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Klik</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(data.timeRange.today.clicks)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(todayChange.clicks)}
                  <span className={`text-sm font-semibold ${getTrendColor(todayChange.clicks)}`}>
                    {Math.abs(todayChange.clicks).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs kemarin</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Konversi</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(data.timeRange.today.conversions)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(todayChange.conversions)}
                  <span className={`text-sm font-semibold ${getTrendColor(todayChange.conversions)}`}>
                    {Math.abs(todayChange.conversions).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs kemarin</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Komisi</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.timeRange.today.earnings)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(todayChange.earnings)}
                  <span className={`text-sm font-semibold ${getTrendColor(todayChange.earnings)}`}>
                    {Math.abs(todayChange.earnings).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs kemarin</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Week vs Last Week */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Minggu Ini vs Lalu</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Klik</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(data.timeRange.thisWeek.clicks)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(weekChange.clicks)}
                  <span className={`text-sm font-semibold ${getTrendColor(weekChange.clicks)}`}>
                    {Math.abs(weekChange.clicks).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs minggu lalu</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Konversi</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(data.timeRange.thisWeek.conversions)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(weekChange.conversions)}
                  <span className={`text-sm font-semibold ${getTrendColor(weekChange.conversions)}`}>
                    {Math.abs(weekChange.conversions).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs minggu lalu</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Komisi</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.timeRange.thisWeek.earnings)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(weekChange.earnings)}
                  <span className={`text-sm font-semibold ${getTrendColor(weekChange.earnings)}`}>
                    {Math.abs(weekChange.earnings).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs minggu lalu</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Month vs Last Month */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Bulan Ini vs Lalu</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Klik</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(data.timeRange.thisMonth.clicks)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(monthChange.clicks)}
                  <span className={`text-sm font-semibold ${getTrendColor(monthChange.clicks)}`}>
                    {Math.abs(monthChange.clicks).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs bulan lalu</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Konversi</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(data.timeRange.thisMonth.conversions)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(monthChange.conversions)}
                  <span className={`text-sm font-semibold ${getTrendColor(monthChange.conversions)}`}>
                    {Math.abs(monthChange.conversions).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs bulan lalu</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Komisi</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.timeRange.thisMonth.earnings)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {getTrendIcon(monthChange.earnings)}
                  <span className={`text-sm font-semibold ${getTrendColor(monthChange.earnings)}`}>
                    {Math.abs(monthChange.earnings).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs bulan lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device & Referrer Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Perangkat</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Desktop</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.devices.desktop}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${data.devices.desktop}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Mobile</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.devices.mobile}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${data.devices.mobile}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Tablet</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.devices.tablet}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${data.devices.tablet}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sumber Traffic Teratas</h2>
          
          {data.topReferrers.length > 0 ? (
            <div className="space-y-3">
              {data.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{referrer.source || 'Direct'}</p>
                      <p className="text-xs text-gray-500">
                        {referrer.conversions} konversi dari {referrer.clicks} klik
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{referrer.clicks}</p>
                    <p className="text-xs text-gray-500">klik</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Belum ada data sumber traffic</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </FeatureLock>
  )
}
