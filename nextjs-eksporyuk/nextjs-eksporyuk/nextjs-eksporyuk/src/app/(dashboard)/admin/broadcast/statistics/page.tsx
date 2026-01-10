'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  Send, 
  Eye,
  MousePointerClick,
  XCircle,
  Users,
  Calendar,
  Mail,
  MessageSquare,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

export default function BroadcastStatisticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7') // 7, 30, 90 days
  const [statistics, setStatistics] = useState<any>({
    total: {
      campaigns: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    },
    rates: {
      delivery: 0,
      open: 0,
      click: 0,
      failure: 0,
    },
    byChannel: {
      EMAIL: { sent: 0, opened: 0, clicked: 0 },
      WHATSAPP: { sent: 0, delivered: 0, read: 0 },
      BOTH: { sent: 0, opened: 0, clicked: 0 },
    },
    recent: [],
    trends: {
      campaigns: 0,
      sent: 0,
      opened: 0,
      clicked: 0,
    }
  })

  // Check auth
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Load statistics
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadStatistics()
    }
  }, [session, timeRange])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/broadcast/statistics?days=${timeRange}`)
      if (res.ok) {
        const data = await res.json()
        setStatistics(data.statistics || statistics)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue' }: any) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600',
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {value.toLocaleString()}
        </h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistik Broadcast</h1>
            <p className="text-gray-600">
              Analisis performa campaign email & WhatsApp secara menyeluruh
            </p>
          </div>
          
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
            <option value="365">1 Tahun Terakhir</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Campaign"
          value={statistics.total.campaigns}
          icon={BarChart3}
          change={statistics.trends.campaigns}
          color="blue"
        />
        <StatCard
          title="Pesan Terkirim"
          value={statistics.total.sent}
          icon={Send}
          change={statistics.trends.sent}
          color="green"
        />
        <StatCard
          title="Dibuka"
          value={statistics.total.opened}
          icon={Eye}
          change={statistics.trends.opened}
          color="purple"
        />
        <StatCard
          title="Diklik"
          value={statistics.total.clicked}
          icon={MousePointerClick}
          change={statistics.trends.clicked}
          color="orange"
        />
      </div>

      {/* Performance Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Delivery Rate</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {statistics.rates.delivery}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${statistics.rates.delivery}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Open Rate</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {statistics.rates.open}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${statistics.rates.open}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Click Rate</span>
            <MousePointerClick className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {statistics.rates.click}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${statistics.rates.click}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Failure Rate</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {statistics.rates.failure}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${statistics.rates.failure}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* By Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Email Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Campaign</h3>
              <p className="text-sm text-gray-600">Performance metrics</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Terkirim</span>
              <span className="font-semibold text-gray-900">
                {statistics.byChannel.EMAIL.sent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dibuka</span>
              <span className="font-semibold text-purple-600">
                {statistics.byChannel.EMAIL.opened.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Diklik</span>
              <span className="font-semibold text-orange-600">
                {statistics.byChannel.EMAIL.clicked.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">WhatsApp Campaign</h3>
              <p className="text-sm text-gray-600">Performance metrics</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Terkirim</span>
              <span className="font-semibold text-gray-900">
                {statistics.byChannel.WHATSAPP.sent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivered</span>
              <span className="font-semibold text-green-600">
                {statistics.byChannel.WHATSAPP.delivered.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dibaca</span>
              <span className="font-semibold text-blue-600">
                {statistics.byChannel.WHATSAPP.read.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Both Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Send className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email + WhatsApp</h3>
              <p className="text-sm text-gray-600">Combined campaigns</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Terkirim</span>
              <span className="font-semibold text-gray-900">
                {statistics.byChannel.BOTH.sent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dibuka</span>
              <span className="font-semibold text-purple-600">
                {statistics.byChannel.BOTH.opened.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Diklik</span>
              <span className="font-semibold text-orange-600">
                {statistics.byChannel.BOTH.clicked.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Terbaru</h2>
        
        {statistics.recent.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada campaign dalam periode ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Sent</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Opened</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Clicked</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Open Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {statistics.recent.map((campaign: any) => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.emailSubject}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        {campaign.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {campaign.sentCount}
                    </td>
                    <td className="py-3 px-4 text-center text-purple-600 font-semibold">
                      {campaign.openedCount}
                    </td>
                    <td className="py-3 px-4 text-center text-orange-600 font-semibold">
                      {campaign.clickedCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-gray-900">
                        {campaign.sentCount > 0 
                          ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(campaign.sentAt || campaign.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
