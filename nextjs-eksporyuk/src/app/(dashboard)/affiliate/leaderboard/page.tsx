'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Trophy,
  RefreshCw,
  Calendar,
  Clock,
  Target,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  oduserId?: string
  userId?: string
  name: string
  avatar?: string
  totalEarnings: number
}

interface CurrentUserRank {
  allTime: number
  monthly: number
  weekly: number
  name: string
  avatar: string
  totalEarnings: number
}

interface LeaderboardData {
  success: boolean
  allTime: LeaderboardEntry[]
  thisMonth: LeaderboardEntry[]
  thisWeek: LeaderboardEntry[]
  currentMonth: string
  currentUserRank: CurrentUserRank | null
}

export default function AffiliateLeaderboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/affiliate/leaderboard/simple')
      if (response.ok) {
        const result = await response.json()
        setData(result)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchLeaderboard()
      
      // Auto-refresh every 30 seconds for realtime feel
      const interval = setInterval(fetchLeaderboard, 30000)
      return () => clearInterval(interval)
    }
  }, [session, fetchLeaderboard])

  const formatCurrency = (amount: number) => {
    return `Rp. ${amount.toLocaleString('id-ID')}`
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  const LeaderboardCard = ({ 
    title, 
    icon: Icon, 
    entries,
    userRank,
    iconColor = 'text-blue-500'
  }: { 
    title: string
    icon: React.ElementType
    entries: LeaderboardEntry[]
    userRank?: number
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
          entries.map((entry, index) => {
            const entryUserId = entry.oduserId || entry.userId
            const isCurrentUser = entryUserId === session?.user?.id
            return (
              <div 
                key={entryUserId || index} 
                className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
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
                  <div>
                    <span className={`font-medium text-sm ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                      {entry.name}
                      {isCurrentUser && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Anda
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Earnings Badge */}
                <span className={`text-xs font-semibold px-3 py-1.5 rounded ${
                  isCurrentUser ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {formatCurrency(entry.totalEarnings)}
                </span>
              </div>
            )
          })
        )}
      </div>
      
      {/* User rank if not in top 10 */}
      {userRank && userRank > 10 && (
        <div className="border-t border-gray-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Peringkat Anda: #{userRank}</span>
            </div>
          </div>
        </div>
      )}
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
              <p className="text-gray-600 text-sm">
                Lihat posisi Anda di antara affiliate terbaik
                {lastUpdate && (
                  <span className="ml-2 text-xs text-gray-400">
                    • Update: {lastUpdate.toLocaleTimeString('id-ID')}
                  </span>
                )}
              </p>
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

        {/* Your Rank Overview */}
        {data?.currentUserRank && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {data.currentUserRank.avatar ? (
                  <img
                    src={data.currentUserRank.avatar}
                    alt={data.currentUserRank.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                    <span className="text-white font-bold text-2xl">
                      {data.currentUserRank.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">{data.currentUserRank.name}</p>
                  <p className="text-blue-100 text-sm">Total Komisi Sepanjang Masa</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.currentUserRank.totalEarnings)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-100">All Time</p>
                  <p className="text-2xl font-bold">#{data.currentUserRank.allTime || '-'}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-100">Bulan Ini</p>
                  <p className="text-2xl font-bold">#{data.currentUserRank.monthly || '-'}</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-100">Minggu Ini</p>
                  <p className="text-2xl font-bold">#{data.currentUserRank.weekly || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && !data ? (
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
              userRank={data?.currentUserRank?.allTime}
              iconColor="text-yellow-400"
            />

            {/* This Month Leaderboard */}
            <LeaderboardCard
              title={`Top 10 Affiliasi Bulan ${data?.currentMonth || 'Ini'}`}
              icon={Calendar}
              entries={data?.thisMonth || []}
              userRank={data?.currentUserRank?.monthly}
              iconColor="text-green-400"
            />

            {/* This Week Leaderboard */}
            <LeaderboardCard
              title="Top 10 Affiliasi Minggu Ini"
              icon={Clock}
              entries={data?.thisWeek || []}
              userRank={data?.currentUserRank?.weekly}
              iconColor="text-purple-400"
            />
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>🔄 Data diperbarui otomatis setiap 30 detik</p>
        </div>
      </div>
    </div>
  )
}
