'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Trophy,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Calendar,
  Clock,
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatar?: string
  totalEarnings: number
}

interface LeaderboardData {
  allTime: LeaderboardEntry[]
  thisMonth: LeaderboardEntry[]
  thisWeek: LeaderboardEntry[]
  currentMonth: string
  currentWeek: string
}

export default function AdminLeaderboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchLeaderboard()
    }
  }, [session])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/affiliates/leaderboard/simple')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `Rp. ${amount.toLocaleString('id-ID')}`
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const LeaderboardCard = ({ 
    title, 
    icon: Icon, 
    entries, 
    iconColor = 'text-blue-500'
  }: { 
    title: string
    icon: React.ElementType
    entries: LeaderboardEntry[]
    iconColor?: string
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-gray-700 rounded">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-700 rounded">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="divide-y divide-gray-100">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Belum ada data
          </div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={entry.userId} 
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {entry.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Rank badge for top 3 */}
                  {index < 3 && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                      {index + 1}
                    </div>
                  )}
                </div>
                
                {/* Name */}
                <Link 
                  href={`/admin/affiliates/${entry.userId}`}
                  className="font-medium text-gray-900 hover:text-blue-600 text-sm"
                >
                  {entry.name}
                </Link>
              </div>
              
              {/* Earnings Badge */}
              <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded">
                {formatCurrency(entry.totalEarnings)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard Affiliate</h1>
              <p className="text-gray-600 text-sm">Top performer affiliate platform</p>
            </div>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm h-96 animate-pulse">
                <div className="bg-gray-300 h-12 rounded-t-xl"></div>
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      <div className="w-24 h-6 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* All Time Leaderboard */}
            <LeaderboardCard
              title="Top 10 Affiliasi Sepanjang Waktu"
              icon={Trophy}
              entries={data?.allTime || []}
              iconColor="text-yellow-400"
            />

            {/* This Month Leaderboard */}
            <LeaderboardCard
              title={`Top 10 Affiliasi Bulan ${data?.currentMonth || 'Ini'}`}
              icon={Calendar}
              entries={data?.thisMonth || []}
              iconColor="text-green-400"
            />

            {/* This Week Leaderboard */}
            <LeaderboardCard
              title={`Top 10 Affiliasi Minggu Ini`}
              icon={Clock}
              entries={data?.thisWeek || []}
              iconColor="text-purple-400"
            />
          </div>
        )}

        {/* Quick Link */}
        <div className="mt-6 text-center">
          <Link 
            href="/admin/affiliates"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Lihat Semua Affiliate & Detail Omset →
          </Link>
        </div>
      </div>
    </div>
  )
}
