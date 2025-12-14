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
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
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
        <CardHeader>
          <CardTitle>Loading Leaderboard...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard Affiliate
            </CardTitle>
            <CardDescription>
              Top performer {selectedPeriod === 'weekly' ? '7 hari terakhir' : '30 hari terakhir'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      <CardContent>
        {/* Current User Rank (if available and showCurrentUser) */}
        {showCurrentUser && currentUserRank && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg">
                #{currentUserRank.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Peringkat Anda</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(currentUserRank.totalSales)}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUserRank.totalConversions} konversi • Komisi: {formatCurrency(currentUserRank.totalCommission)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada data leaderboard untuk periode ini</p>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.affiliateId}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
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
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                  <AvatarImage src={entry.avatar || undefined} alt={entry.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {entry.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">
                      {entry.name}
                    </p>
                    {entry.rank <= 3 && (
                      <Badge 
                        className={`${getRankBadgeColor(entry.rank)} text-white text-xs px-2 py-0.5`}
                      >
                        Top {entry.rank}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    @{entry.username || entry.email.split('@')[0]}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-lg font-bold text-gray-900">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    {formatCurrency(entry.totalSales)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {entry.totalConversions} penjualan
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    Komisi: {formatCurrency(entry.totalCommission)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {leaderboard.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Menampilkan top {leaderboard.length} affiliate dari total {leaderboard.length}+ peserta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
