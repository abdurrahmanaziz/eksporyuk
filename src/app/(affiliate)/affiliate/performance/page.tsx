'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react'

interface PerformanceData {
  overview: {
    totalClicks: number
    totalConversions: number
    totalEarnings: number
    conversionRate: number
    avgOrderValue: number
    clickTrend: number
    conversionTrend: number
    earningsTrend: number
  }
  daily: Array<{
    date: string
    clicks: number
    conversions: number
    earnings: number
  }>
  topProducts: Array<{
    id: string
    name: string
    clicks: number
    conversions: number
    earnings: number
    conversionRate: number
  }>
  topLinks: Array<{
    id: string
    slug: string
    clicks: number
    conversions: number
    earnings: number
    conversionRate: number
  }>
}

export default function PerformancePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [refreshing, setRefreshing] = useState(false)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchPerformanceData()
  }, [period])

  const fetchPerformanceData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/affiliate/performance?period=${period}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', 
      month: 'short' 
    }).format(date)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return null
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPeriodLabel = () => {
    const labels = {
      '7d': '7 Hari Terakhir',
      '30d': '30 Hari Terakhir',
      '90d': '90 Hari Terakhir',
      'all': 'Semua Waktu'
    }
    return labels[period]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat data performa...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Gagal memuat data performa</p>
          <button 
            onClick={fetchPerformanceData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="performance">
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <BarChart3 className="w-6 h-6" style={{ color: theme.primary }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performa Affiliate</h1>
              <p className="text-gray-600">Analisis lengkap aktivitas affiliate kamu</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === '7d' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === '30d' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setPeriod('90d')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === '90d' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              90 Hari
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === 'all' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={fetchPerformanceData}
            disabled={refreshing}
            className="px-4 py-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          <button className="px-4 py-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Klik */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon(data.overview.clickTrend)}
              <span className={getTrendColor(data.overview.clickTrend)}>
                {Math.abs(data.overview.clickTrend).toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Total Klik</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(data.overview.totalClicks)}</p>
          <p className="text-xs text-gray-400 mt-2">{getPeriodLabel()}</p>
        </div>

        {/* Total Konversi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon(data.overview.conversionTrend)}
              <span className={getTrendColor(data.overview.conversionTrend)}>
                {Math.abs(data.overview.conversionTrend).toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Total Konversi</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(data.overview.totalConversions)}</p>
          <p className="text-xs text-gray-400 mt-2">
            Rate: {data.overview.conversionRate.toFixed(2)}%
          </p>
        </div>

        {/* Total Komisi */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-100">
              {getTrendIcon(data.overview.earningsTrend)}
              <span>
                {Math.abs(data.overview.earningsTrend).toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-green-100 text-sm mb-1">Total Komisi</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.overview.totalEarnings)}</p>
          <p className="text-xs text-green-100 mt-2">{getPeriodLabel()}</p>
        </div>

        {/* Rata-rata Order */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Rata-rata Order</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.overview.avgOrderValue)}</p>
          <p className="text-xs text-gray-400 mt-2">Per konversi</p>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Grafik Performa Harian</h2>
            <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Klik</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600">Konversi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Komisi</span>
            </div>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-3">
          {data.daily.slice(-14).map((day, index) => {
            const maxValue = Math.max(...data.daily.map(d => Math.max(d.clicks, d.conversions * 10)))
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">
                  {formatDate(day.date)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-6 bg-blue-100 rounded-lg flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(day.clicks / maxValue) * 100}%`, minWidth: '30px' }}
                    >
                      <span className="text-xs font-medium text-blue-700">{day.clicks}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-6 bg-purple-100 rounded-lg flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(day.conversions * 10 / maxValue) * 100}%`, minWidth: '30px' }}
                    >
                      <span className="text-xs font-medium text-purple-700">{day.conversions}</span>
                    </div>
                  </div>
                </div>
                <div className="w-28 text-right">
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(day.earnings)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {data.daily.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada data untuk periode ini</p>
          </div>
        )}
      </div>

      {/* Top Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">🏆 Top Produk</h2>
            <Link href="/affiliate/reports" className="text-sm text-blue-500 hover:text-blue-600">
              Lihat Semua →
            </Link>
          </div>
          
          <div className="space-y-3">
            {data.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ 
                    backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.primary 
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{product.clicks} klik</span>
                    <span>•</span>
                    <span>{product.conversions} konversi</span>
                    <span>•</span>
                    <span>{product.conversionRate.toFixed(1)}% rate</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(product.earnings)}</p>
                </div>
              </div>
            ))}
          </div>

          {data.topProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Belum ada data produk</p>
            </div>
          )}
        </div>

        {/* Top Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">🔗 Top Link</h2>
            <Link href="/affiliate/links" className="text-sm text-blue-500 hover:text-blue-600">
              Lihat Semua →
            </Link>
          </div>
          
          <div className="space-y-3">
            {data.topLinks.slice(0, 5).map((link, index) => (
              <div key={link.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ 
                    backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.primary 
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-gray-900 truncate">/{link.slug}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{link.clicks} klik</span>
                    <span>•</span>
                    <span>{link.conversions} konversi</span>
                    <span>•</span>
                    <span>{link.conversionRate.toFixed(1)}% rate</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(link.earnings)}</p>
                </div>
              </div>
            ))}
          </div>

          {data.topLinks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Belum ada data link</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">💡 Insights & Rekomendasi</h2>
            <p className="text-sm text-gray-600">Berdasarkan performa {getPeriodLabel().toLowerCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✅</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Conversion Rate Bagus</p>
                <p className="text-sm text-gray-600">
                  Rate {data.overview.conversionRate.toFixed(2)}% {data.overview.conversionRate >= 2 ? 'di atas' : 'mendekati'} rata-rata industri
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💪</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Tingkatkan Traffic</p>
                <p className="text-sm text-gray-600">
                  Bagikan link di lebih banyak channel untuk meningkatkan klik
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Fokus ke Top Produk</p>
                <p className="text-sm text-gray-600">
                  Promosikan produk dengan conversion rate tertinggi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </FeatureLock>
  )
}
