'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, TrendingUp, DollarSign, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
  rank: number
  affiliateId: string
  userId: string
  name: string
  username: string | null
  avatar: string | null
  email: string
  totalSales: number
  totalConversions: number
  totalCommission: number
}

interface LeaderboardProps {
  period?: 'weekly' | 'monthly' | 'all-time'
  limit?: number
  showCurrentUser?: boolean
}

export default function Leaderboard({ 
  period = 'weekly', 
  limit = 10,
  showCurrentUser = true 
}: LeaderboardProps) {
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all-time'>(period)

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedPeriod])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/affiliate/leaderboard?period=${selectedPeriod}`)
      const data = await response.json()
      
      if (data.success) {
        setLeaderboard(data.leaderboard.slice(0, limit))
        setCurrentUserRank(data.currentUserRank)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
      case 3:
        return <Award className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
      default:
        return <span className="w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500'
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600'
      default:
        return 'bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base">Loading Leaderboard...</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
              Leaderboard Affiliate
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Top performer {selectedPeriod === 'weekly' ? '7 hari terakhir' : '30 hari terakhir'}
            </CardDescription>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                selectedPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        {/* Current User Rank (if available and showCurrentUser) */}
        {showCurrentUser && currentUserRank && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 text-white font-bold text-sm sm:text-lg">
                #{currentUserRank.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600">Peringkat Anda</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900">
                  {formatCurrency(currentUserRank.totalSales)}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                  {currentUserRank.totalConversions} konversi • Komisi: {formatCurrency(currentUserRank.totalCommission)}
                </p>
              </div>
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-2 sm:space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
              <p className="text-xs sm:text-sm">Belum ada data leaderboard untuk periode ini</p>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.affiliateId}
                className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:shadow-md ${
                  entry.rank <= 3
                    ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Rank Icon */}
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-white shadow-sm flex-shrink-0">
                  <AvatarImage src={entry.avatar || undefined} alt={entry.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs sm:text-base">
                    {entry.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate text-xs sm:text-base">
                      {entry.name}
                    </p>
                    {entry.rank <= 3 && (
                      <Badge 
                        className={`${getRankBadgeColor(entry.rank)} text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5`}
                      >
                        Top {entry.rank}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    @{entry.username || entry.email.split('@')[0]}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-0.5 sm:gap-1 justify-end text-xs sm:text-lg font-bold text-gray-900">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <span className="hidden sm:inline">{formatCurrency(entry.totalSales)}</span>
                    <span className="sm:hidden">{(entry.totalSales / 1000000).toFixed(1)}jt</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    {entry.totalConversions} penjualan
                  </p>
                  <p className="text-[10px] sm:text-xs text-green-600 font-medium hidden sm:block">
                    Komisi: {formatCurrency(entry.totalCommission)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {leaderboard.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <p className="text-center text-[10px] sm:text-sm text-gray-500">
              Menampilkan top {leaderboard.length} affiliate dari total {leaderboard.length}+ peserta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
