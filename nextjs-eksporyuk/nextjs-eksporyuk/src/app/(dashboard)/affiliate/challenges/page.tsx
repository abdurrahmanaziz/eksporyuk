'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Trophy,
  Target,
  Gift,
  Clock,
  Users,
  TrendingUp,
  Crown,
  Medal,
  Award,
  ChevronRight,
  Zap,
  Star,
  Link,
  Copy,
  ExternalLink,
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
  isActive: boolean
  status: 'active' | 'upcoming' | 'ended'
  daysRemaining: number
  participantsCount: number
  userProgress?: {
    currentValue: number
    progress: number
    completed: boolean
    rewardClaimed: boolean
  }
  userRank?: number
  hasJoined: boolean
  leaderboardPreview: {
    rank: number
    name: string
    avatar: string | null
    currentValue: number
    isCurrentUser: boolean
  }[]
  // Product relation
  affiliateLink?: string
  linkTarget?: {
    type: 'membership' | 'product' | 'course'
    id: string
    name: string
    slug: string
  }
}

interface LeaderboardEntry {
  rank: number
  affiliateId: string
  userId: string
  name: string
  avatar: string | null
  tier: number
  totalEarnings: number
  totalConversions: number
  totalClicks: number
  conversionRate?: string
  isCurrentUser: boolean
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  currentUser: LeaderboardEntry | null
  currentUserRank: number | null
  totalAffiliates: number
}

export default function AffiliateChallengesPage() {
  const { data: session } = useSession()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('challenges')
  const [challengeFilter, setChallengeFilter] = useState('active')
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all')
  const [leaderboardSort, setLeaderboardSort] = useState('earnings')
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null)
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [showChallengeDetail, setShowChallengeDetail] = useState(false)

  useEffect(() => {
    fetchData()
  }, [challengeFilter, leaderboardPeriod, leaderboardSort])

  const fetchData = async () => {
    try {
      const [challengesRes, leaderboardRes] = await Promise.all([
        fetch(`/api/affiliate/challenges?status=${challengeFilter}`),
        fetch(`/api/affiliate/leaderboard?period=${leaderboardPeriod}&sortBy=${leaderboardSort}`),
      ])

      if (challengesRes.ok) {
        const data = await challengesRes.json()
        setChallenges(data.challenges || [])
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningChallenge(challengeId)
    try {
      const response = await fetch('/api/affiliate/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Berhasil bergabung dengan challenge!')
        fetchData()
      } else {
        toast.error(data.error || 'Gagal bergabung')
      }
    } catch (error) {
      console.error('Error joining challenge:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setJoiningChallenge(null)
    }
  }

  const handleClaimReward = async (challengeId: string) => {
    setClaimingReward(challengeId)
    try {
      const response = await fetch(`/api/affiliate/challenges/${challengeId}/claim`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Reward berhasil diklaim!')
        fetchData()
        setShowChallengeDetail(false)
      } else {
        toast.error(data.error || 'Gagal klaim reward')
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setClaimingReward(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALES_COUNT: 'Total Penjualan',
      REVENUE: 'Total Revenue',
      CLICKS: 'Total Klik',
      CONVERSIONS: 'Total Konversi',
      NEW_CUSTOMERS: 'Customer Baru',
    }
    return labels[type] || type
  }

  const getRewardTypeLabel = (type: string, value: number) => {
    switch (type) {
      case 'BONUS_COMMISSION':
        return `Bonus ${formatCurrency(value)}`
      case 'CASH_BONUS':
        return `Cash ${formatCurrency(value)}`
      default:
        return `Bonus ${formatCurrency(value)}`
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Akan Datang</Badge>
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">Selesai</Badge>
      default:
        return null
    }
  }

  const getTierBadge = (tier: number) => {
    const colors = [
      'bg-gray-100 text-gray-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
    ]
    return (
      <Badge className={colors[Math.min(tier - 1, 4)]}>
        Tier {tier}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data tantangan...</p>
        </div>
      </div>
    )
  }

  const activeChallenges = challenges.filter(c => c.status === 'active')
  const joinedChallenges = challenges.filter(c => c.hasJoined)
  const completedChallenges = joinedChallenges.filter(c => c.userProgress?.completed)

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tantangan & Leaderboard</h1>
          <p className="text-gray-600 mt-1">Ikuti tantangan dan bersaing dengan affiliate lainnya</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Challenge Aktif
              </CardDescription>
              <CardTitle className="text-3xl text-orange-600">{activeChallenges.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Diikuti
              </CardDescription>
              <CardTitle className="text-3xl text-blue-600">{joinedChallenges.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center">
                <Trophy className="w-4 h-4 mr-1" />
                Selesai
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{completedChallenges.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Peringkat Anda
              </CardDescription>
              <CardTitle className="text-3xl text-purple-600">
                #{leaderboard?.currentUserRank || '-'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Tantangan
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            {/* Challenge Filter */}
            <div className="flex flex-wrap gap-2">
              {['active', 'upcoming', 'ended', 'all'].map((filter) => (
                <Button
                  key={filter}
                  variant={challengeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChallengeFilter(filter)}
                  className={challengeFilter === filter ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {filter === 'active' && 'Aktif'}
                  {filter === 'upcoming' && 'Akan Datang'}
                  {filter === 'ended' && 'Selesai'}
                  {filter === 'all' && 'Semua'}
                </Button>
              ))}
            </div>

            {/* Challenges List */}
            {challenges.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900">Tidak ada tantangan</h3>
                  <p className="text-gray-500 mt-1">
                    Belum ada tantangan dengan filter yang dipilih
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges.map((challenge) => (
                  <Card 
                    key={challenge.id} 
                    className={`hover:shadow-lg transition-shadow cursor-pointer ${
                      challenge.hasJoined ? 'border-orange-300' : ''
                    }`}
                    onClick={() => {
                      setSelectedChallenge(challenge)
                      setShowChallengeDetail(true)
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(challenge.status)}
                            {challenge.hasJoined && (
                              <Badge variant="outline" className="border-orange-500 text-orange-600">
                                <Zap className="w-3 h-3 mr-1" />
                                Diikuti
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {challenge.description}
                          </CardDescription>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Product Info - if challenge has linked product */}
                        {challenge.linkTarget && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Link className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-xs text-blue-600">Produk untuk dipromosikan:</p>
                                  <p className="font-medium text-blue-800">{challenge.linkTarget.name}</p>
                                </div>
                              </div>
                              {challenge.affiliateLink && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-300"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(challenge.affiliateLink!)
                                    toast.success('Link berhasil disalin!')
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Salin Link
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Target & Reward */}
                        <div className="flex justify-between text-sm">
                          <div>
                            <p className="text-gray-500">Target</p>
                            <p className="font-semibold">
                              {challenge.targetType === 'REVENUE' 
                                ? formatCurrency(challenge.targetValue)
                                : challenge.targetValue} {getTargetTypeLabel(challenge.targetType)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Hadiah</p>
                            <p className="font-semibold text-green-600">
                              {getRewardTypeLabel(challenge.rewardType, challenge.rewardValue)}
                            </p>
                          </div>
                        </div>

                        {/* Progress (if joined) */}
                        {challenge.hasJoined && challenge.userProgress && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress Anda</span>
                              <span className="font-semibold">
                                {challenge.userProgress.progress.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={challenge.userProgress.progress} 
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {challenge.targetType === 'REVENUE'
                                ? formatCurrency(challenge.userProgress.currentValue)
                                : challenge.userProgress.currentValue} / {
                                  challenge.targetType === 'REVENUE'
                                    ? formatCurrency(challenge.targetValue)
                                    : challenge.targetValue
                                }
                            </p>
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {challenge.participantsCount} peserta
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {challenge.status === 'upcoming'
                              ? `Mulai ${formatDate(challenge.startDate)}`
                              : challenge.status === 'ended'
                              ? 'Selesai'
                              : `${challenge.daysRemaining} hari lagi`}
                          </div>
                        </div>

                        {/* Action Button */}
                        {challenge.status === 'active' && !challenge.hasJoined && (
                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleJoinChallenge(challenge.id)
                            }}
                            disabled={joiningChallenge === challenge.id}
                          >
                            {joiningChallenge === challenge.id ? 'Bergabung...' : 'Ikuti Challenge'}
                          </Button>
                        )}

                        {challenge.hasJoined && challenge.userProgress?.completed && !challenge.userProgress?.rewardClaimed && (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClaimReward(challenge.id)
                            }}
                            disabled={claimingReward === challenge.id}
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            {claimingReward === challenge.id ? 'Mengklaim...' : 'Klaim Hadiah'}
                          </Button>
                        )}

                        {challenge.hasJoined && challenge.userProgress?.rewardClaimed && (
                          <div className="flex items-center justify-center py-2 text-green-600">
                            <Star className="w-5 h-5 mr-2 fill-current" />
                            Hadiah sudah diklaim!
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            {/* Leaderboard Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex gap-2">
                <span className="text-sm text-gray-500 self-center">Periode:</span>
                {['all', 'monthly', 'weekly'].map((period) => (
                  <Button
                    key={period}
                    variant={leaderboardPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLeaderboardPeriod(period)}
                    className={leaderboardPeriod === period ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    {period === 'all' && 'Semua Waktu'}
                    {period === 'monthly' && 'Bulan Ini'}
                    {period === 'weekly' && 'Minggu Ini'}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-gray-500 self-center">Urutkan:</span>
                {['earnings', 'conversions', 'clicks'].map((sort) => (
                  <Button
                    key={sort}
                    variant={leaderboardSort === sort ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLeaderboardSort(sort)}
                    className={leaderboardSort === sort ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    {sort === 'earnings' && 'Pendapatan'}
                    {sort === 'conversions' && 'Konversi'}
                    {sort === 'clicks' && 'Klik'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Your Position Card */}
            {leaderboard?.currentUser && (
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
                        {getRankIcon(leaderboard.currentUser.rank)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Peringkat Anda</p>
                        <p className="text-2xl font-bold text-orange-600">
                          #{leaderboard.currentUser.rank}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        dari {leaderboard.totalAffiliates} affiliate
                      </p>
                      {leaderboardSort === 'earnings' && (
                        <p className="text-lg font-semibold">
                          {formatCurrency(leaderboard.currentUser.totalEarnings)}
                        </p>
                      )}
                      {leaderboardSort === 'conversions' && (
                        <p className="text-lg font-semibold">
                          {leaderboard.currentUser.totalConversions} konversi
                        </p>
                      )}
                      {leaderboardSort === 'clicks' && (
                        <p className="text-lg font-semibold">
                          {leaderboard.currentUser.totalClicks} klik
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard List */}
            <Card>
              <CardHeader>
                <CardTitle>Top Affiliate</CardTitle>
                <CardDescription>
                  {leaderboardPeriod === 'all' && 'Peringkat keseluruhan berdasarkan '}
                  {leaderboardPeriod === 'monthly' && 'Peringkat bulan ini berdasarkan '}
                  {leaderboardPeriod === 'weekly' && 'Peringkat minggu ini berdasarkan '}
                  {leaderboardSort === 'earnings' && 'total pendapatan'}
                  {leaderboardSort === 'conversions' && 'jumlah konversi'}
                  {leaderboardSort === 'clicks' && 'jumlah klik'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!leaderboard?.leaderboard || leaderboard.leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Belum ada data leaderboard</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.leaderboard.map((entry) => (
                      <div
                        key={entry.affiliateId}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          entry.isCurrentUser
                            ? 'bg-orange-50 border border-orange-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 text-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={entry.avatar || undefined} />
                            <AvatarFallback>
                              {entry.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium ${entry.isCurrentUser ? 'text-orange-600' : ''}`}>
                              {entry.name}
                              {entry.isCurrentUser && ' (Anda)'}
                            </p>
                            <div className="flex items-center gap-2">
                              {entry.conversionRate && (
                                <span className="text-xs text-gray-500">
                                  {entry.conversionRate}% CVR
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {leaderboardSort === 'earnings' && (
                            <p className="font-semibold text-green-600">
                              {formatCurrency(entry.totalEarnings)}
                            </p>
                          )}
                          {leaderboardSort === 'conversions' && (
                            <p className="font-semibold text-blue-600">
                              {entry.totalConversions} konversi
                            </p>
                          )}
                          {leaderboardSort === 'clicks' && (
                            <p className="font-semibold text-purple-600">
                              {entry.totalClicks} klik
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Challenge Detail Modal */}
        {showChallengeDetail && selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(selectedChallenge.status)}
                      {selectedChallenge.hasJoined && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          Diikuti
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{selectedChallenge.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {selectedChallenge.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Link Info */}
                {selectedChallenge.linkTarget && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Link className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 mb-1">Produk yang harus dipromosikan</p>
                          <p className="font-semibold text-blue-800">{selectedChallenge.linkTarget.name}</p>
                          <p className="text-xs text-blue-600 capitalize">{selectedChallenge.linkTarget.type}</p>
                        </div>
                      </div>
                    </div>
                    {selectedChallenge.affiliateLink ? (
                      <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                        <p className="text-xs text-gray-500 mb-1">Link Affiliate Anda:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                            {selectedChallenge.affiliateLink}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedChallenge.affiliateLink!)
                              toast.success('Link berhasil disalin!')
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => window.open(selectedChallenge.affiliateLink, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-700">
                          ⚠️ Anda belum memiliki link affiliate untuk produk ini. 
                          <Button 
                            variant="link" 
                            className="text-xs p-0 h-auto text-yellow-700 underline ml-1"
                            onClick={() => window.location.href = '/affiliate/links'}
                          >
                            Buat link di sini
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Challenge Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="font-semibold text-lg">
                      {selectedChallenge.targetType === 'REVENUE'
                        ? formatCurrency(selectedChallenge.targetValue)
                        : selectedChallenge.targetValue}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getTargetTypeLabel(selectedChallenge.targetType)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Hadiah</p>
                    <p className="font-semibold text-lg text-green-600">
                      {getRewardTypeLabel(selectedChallenge.rewardType, selectedChallenge.rewardValue)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedChallenge.rewardType === 'BONUS_COMMISSION' && 'Masuk ke wallet'}
                      {selectedChallenge.rewardType === 'CASH_BONUS' && 'Cash bonus'}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Mulai: </span>
                    <span className="font-medium">{formatDate(selectedChallenge.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Berakhir: </span>
                    <span className="font-medium">{formatDate(selectedChallenge.endDate)}</span>
                  </div>
                </div>

                {/* Progress (if joined) */}
                {selectedChallenge.hasJoined && selectedChallenge.userProgress && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Progress Anda</span>
                      <span className="text-lg font-bold text-orange-600">
                        {selectedChallenge.userProgress.progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={selectedChallenge.userProgress.progress}
                      className="h-3"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedChallenge.targetType === 'REVENUE'
                        ? formatCurrency(selectedChallenge.userProgress.currentValue)
                        : selectedChallenge.userProgress.currentValue} dari{' '}
                      {selectedChallenge.targetType === 'REVENUE'
                        ? formatCurrency(selectedChallenge.targetValue)
                        : selectedChallenge.targetValue}
                    </p>
                    {selectedChallenge.userRank && (
                      <p className="text-sm text-orange-600 mt-1">
                        Peringkat Anda: #{selectedChallenge.userRank}
                      </p>
                    )}
                  </div>
                )}

                {/* Leaderboard Preview */}
                {selectedChallenge.leaderboardPreview && selectedChallenge.leaderboardPreview.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Top Performers</h4>
                    <div className="space-y-2">
                      {selectedChallenge.leaderboardPreview.slice(0, 5).map((entry) => (
                        <div
                          key={entry.rank}
                          className={`flex items-center justify-between p-2 rounded ${
                            entry.isCurrentUser ? 'bg-orange-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.avatar || undefined} />
                              <AvatarFallback>
                                {entry.name?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className={entry.isCurrentUser ? 'text-orange-600 font-medium' : ''}>
                              {entry.name}
                              {entry.isCurrentUser && ' (Anda)'}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {selectedChallenge.targetType === 'REVENUE'
                              ? formatCurrency(entry.currentValue)
                              : entry.currentValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChallengeDetail(false)
                      setSelectedChallenge(null)
                    }}
                  >
                    Tutup
                  </Button>
                  
                  {selectedChallenge.status === 'active' && !selectedChallenge.hasJoined && (
                    <Button
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleJoinChallenge(selectedChallenge.id)}
                      disabled={joiningChallenge === selectedChallenge.id}
                    >
                      {joiningChallenge === selectedChallenge.id ? 'Bergabung...' : 'Ikuti Challenge'}
                    </Button>
                  )}

                  {selectedChallenge.hasJoined && 
                   selectedChallenge.userProgress?.completed && 
                   !selectedChallenge.userProgress?.rewardClaimed && (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleClaimReward(selectedChallenge.id)}
                      disabled={claimingReward === selectedChallenge.id}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {claimingReward === selectedChallenge.id ? 'Mengklaim...' : 'Klaim Hadiah'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
