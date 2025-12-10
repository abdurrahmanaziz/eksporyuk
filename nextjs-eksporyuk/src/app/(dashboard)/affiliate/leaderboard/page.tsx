'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import Link from 'next/link'
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Crown,
  Star,
  Zap,
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  affiliateId: string
  userId: string
  name: string
  email: string
  avatar: string | null
  username: string | null
  totalSales: number
  totalConversions: number
  totalCommission: number
}

interface LeaderboardData {
  success: boolean
  leaderboard: LeaderboardEntry[]
  currentUserRank?: LeaderboardEntry
  period: string
  limit: number
}

export default function AffiliateLeaderboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('weekly')
  const theme = getRoleTheme('AFFILIATE')

  useEffect(() => {
    if (session?.user) {
      fetchLeaderboard()
    }
  }, [session, period])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/affiliate/leaderboard?period=${period}&limit=50`)
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    } else if (rank <= 10) {
      return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
    } else {
      return 'bg-gray-100 text-gray-700'
    }
  }

  if (!session?.user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className={`w-8 h-8 ${theme.primaryColor}`} />
            <h1 className="text-3xl font-bold text-gray-900">Affiliate Leaderboard</h1>
          </div>
          <p className="text-gray-600">
            Lihat posisi Anda di antara affiliate terbaik platform ini
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { value: 'weekly', label: '7 Hari' },
              { value: 'monthly', label: '30 Hari' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total di Leaderboard</p>
                  <p className="text-2xl font-bold text-gray-900">{data.leaderboard.length}</p>
                </div>
              </div>
            </div>

            {data.currentUserRank && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Peringkat Anda</p>
                    <p className="text-2xl font-bold text-gray-900">#{data.currentUserRank.rank}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Top Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {data.leaderboard[0]?.totalSales.toLocaleString('id-ID') || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat leaderboard...</p>
            </div>
          ) : data?.leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada data leaderboard</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peringkat
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.leaderboard.map((entry) => {
                    const isCurrentUser = entry.userId === session?.user?.id
                    return (
                      <tr
                        key={entry.affiliateId}
                        className={`hover:bg-gray-50 ${
                          isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                              {getRankIcon(entry.rank)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {entry.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={entry.avatar}
                                  alt={entry.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {entry.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.name}
                                {isCurrentUser && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{entry.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            Rp {entry.totalSales.toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.totalConversions}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Rp {entry.totalCommission.toLocaleString('id-ID')}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User's Rank (if not in top 10) */}
        {data?.currentUserRank && data.currentUserRank.rank > 10 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(data.currentUserRank.rank)}`}>
                  {getRankIcon(data.currentUserRank.rank)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Peringkat Anda</p>
                  <p className="text-sm text-gray-600">
                    Rp {data.currentUserRank.totalSales.toLocaleString('id-ID')} sales
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">#{data.currentUserRank.rank}</p>
                <p className="text-sm text-gray-600">dari {data.limit} affiliate</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}