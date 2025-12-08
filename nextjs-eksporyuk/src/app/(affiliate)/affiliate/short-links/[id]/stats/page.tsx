'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

interface Click {
  id: string
  ipAddress: string
  userAgent: string
  referrer: string | null
  createdAt: string
}

interface LinkStats {
  id: string
  username: string
  fullShortUrl: string
  clicks: number
  conversions: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  clickHistory: Click[]
  domain: {
    domain: string
    displayName: string
  }
}

export default function ShortLinkStatsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d')

  useEffect(() => {
    fetchStats()
  }, [resolvedParams.id, period])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/affiliate/short-links/${resolvedParams.id}/stats?period=${period}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceType = (userAgent: string): string => {
    if (/mobile/i.test(userAgent)) return '📱 Mobile'
    if (/tablet/i.test(userAgent)) return '📱 Tablet'
    return '💻 Desktop'
  }

  const getBrowser = (userAgent: string): string => {
    if (/chrome/i.test(userAgent)) return 'Chrome'
    if (/firefox/i.test(userAgent)) return 'Firefox'
    if (/safari/i.test(userAgent)) return 'Safari'
    if (/edge/i.test(userAgent)) return 'Edge'
    return 'Other'
  }

  const getReferrerDomain = (url: string | null): string => {
    if (!url) return 'Direct'
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  }

  if (loading) {
    return <div className="p-8">Loading statistics...</div>
  }

  if (!stats) {
    return <div className="p-8">Statistics not found</div>
  }

  // Group clicks by date
  const clicksByDate = stats.clickHistory.reduce((acc, click) => {
    const date = new Date(click.createdAt).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by device
  const deviceStats = stats.clickHistory.reduce((acc, click) => {
    const device = getDeviceType(click.userAgent)
    acc[device] = (acc[device] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by browser
  const browserStats = stats.clickHistory.reduce((acc, click) => {
    const browser = getBrowser(click.userAgent)
    acc[browser] = (acc[browser] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by referrer
  const referrerStats = stats.clickHistory.reduce((acc, click) => {
    const referrer = getReferrerDomain(click.referrer)
    acc[referrer] = (acc[referrer] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Short Links
        </button>
        
        <h1 className="text-3xl font-bold mb-2">Link Statistics</h1>
        <p className="text-gray-600 font-mono">{stats.fullShortUrl}</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg ${
              period === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg ${
              period === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-lg ${
              period === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Clicks</p>
          <p className="text-4xl font-bold text-blue-600">{stats.clicks}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Conversions</p>
          <p className="text-4xl font-bold text-green-600">{stats.conversions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Conversion Rate</p>
          <p className="text-4xl font-bold text-purple-600">
            {stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Device Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(deviceStats).map(([device, count]) => (
              <div key={device}>
                <div className="flex justify-between mb-1">
                  <span>{device}</span>
                  <span className="font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / stats.clicks) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Browser Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(browserStats).map(([browser, count]) => (
              <div key={browser}>
                <div className="flex justify-between mb-1">
                  <span>{browser}</span>
                  <span className="font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(count / stats.clicks) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {Object.entries(referrerStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([referrer, count]) => (
                <div key={referrer}>
                  <div className="flex justify-between mb-1">
                    <span className="truncate flex-1">{referrer}</span>
                    <span className="font-bold ml-2">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.clicks) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Clicks Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Clicks Timeline</h3>
          <div className="space-y-2">
            {Object.entries(clicksByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .slice(0, 10)
              .map(([date, count]) => (
                <div key={date} className="flex justify-between">
                  <span className="text-sm">{date}</span>
                  <span className="font-bold text-blue-600">{count} clicks</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Recent Clicks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-2">Time</th>
                <th className="pb-2">Device</th>
                <th className="pb-2">Browser</th>
                <th className="pb-2">Referrer</th>
                <th className="pb-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {stats.clickHistory.slice(0, 20).map((click) => (
                <tr key={click.id} className="border-b">
                  <td className="py-2">
                    {new Date(click.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2">{getDeviceType(click.userAgent)}</td>
                  <td className="py-2">{getBrowser(click.userAgent)}</td>
                  <td className="py-2 truncate max-w-xs">
                    {getReferrerDomain(click.referrer)}
                  </td>
                  <td className="py-2 font-mono text-xs">{click.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
