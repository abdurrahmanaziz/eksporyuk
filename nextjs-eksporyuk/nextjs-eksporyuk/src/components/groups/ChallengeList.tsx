'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Trophy,
  Target,
  Clock,
  Users,
  Flame,
  Medal,
  ChevronRight,
  CheckCircle2
} from 'lucide-react'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface ChallengeParticipant {
  id: string
  progress: number
  isCompleted: boolean
  user: {
    id: string
    name: string
    avatar?: string
  }
}

interface Challenge {
  id: string
  title: string
  description?: string
  type: string
  target?: number
  startDate: string
  endDate: string
  rewardPoints: number
  isActive: boolean
  participants: ChallengeParticipant[]
  _count: {
    participants: number
  }
  userProgress: number
  userCompleted: boolean
  userRank?: number
  isJoined: boolean
}

interface ChallengeListProps {
  groupId: string
}

export default function ChallengeList({ groupId }: ChallengeListProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('active')
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    fetchChallenges()
  }, [groupId, filter])

  const fetchChallenges = async () => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? `/api/groups/${groupId}/challenges`
        : `/api/groups/${groupId}/challenges?status=${filter}`
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges || [])
      }
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinChallenge = async (challengeId: string) => {
    setJoiningId(challengeId)
    try {
      const res = await fetch(`/api/groups/${groupId}/challenges/${challengeId}`, {
        method: 'POST'
      })
      
      if (res.ok) {
        toast.success('Berhasil bergabung dengan challenge!')
        fetchChallenges()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal bergabung')
      }
    } catch (error) {
      console.error('Join error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setJoiningId(null)
    }
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'MOST_POSTS':
        return '📝'
      case 'MOST_COMMENTS':
        return '💬'
      case 'QUIZ_SCORE':
        return '🧠'
      case 'MOST_REACTIONS':
        return '❤️'
      case 'STREAK':
        return '🔥'
      default:
        return '🎯'
    }
  }

  const getChallengeTypeName = (type: string) => {
    switch (type) {
      case 'MOST_POSTS':
        return 'Posting Terbanyak'
      case 'MOST_COMMENTS':
        return 'Komentar Terbanyak'
      case 'QUIZ_SCORE':
        return 'Skor Quiz Tertinggi'
      case 'MOST_REACTIONS':
        return 'Reaksi Terbanyak'
      case 'STREAK':
        return 'Aktif Berturut-turut'
      default:
        return type
    }
  }

  const getTimeLeft = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date())
    if (days < 1) {
      return formatDistanceToNow(new Date(endDate), { addSuffix: true, locale: idLocale })
    }
    return `${days} hari lagi`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'upcoming', 'ended'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f as any)}
          >
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : f === 'upcoming' ? 'Akan Datang' : 'Selesai'}
          </Button>
        ))}
      </div>

      {/* Challenge Cards */}
      {challenges.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada challenge tersedia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => {
            const isActive = new Date(challenge.startDate) <= new Date() && new Date(challenge.endDate) >= new Date()
            const isEnded = new Date(challenge.endDate) < new Date()
            const progressPercent = challenge.target 
              ? Math.min((challenge.userProgress / challenge.target) * 100, 100)
              : 0

            return (
              <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Challenge Icon */}
                    <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-3xl">
                      {getChallengeIcon(challenge.type)}
                    </div>

                    {/* Challenge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{challenge.title}</h3>
                          <Badge variant="outline" className="mt-1">
                            {getChallengeTypeName(challenge.type)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Trophy className="w-4 h-4" />
                            <span className="font-semibold">+{challenge.rewardPoints}</span>
                          </div>
                        </div>
                      </div>

                      {challenge.description && (
                        <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        {challenge.target && (
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            Target: {challenge.target}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {challenge._count.participants} peserta
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Clock className="w-4 h-4" />
                            {getTimeLeft(challenge.endDate)}
                          </span>
                        )}
                      </div>

                      {/* User Progress */}
                      {challenge.isJoined && challenge.target && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress Kamu</span>
                            <span className="font-semibold">
                              {challenge.userProgress} / {challenge.target}
                              {challenge.userCompleted && (
                                <CheckCircle2 className="w-4 h-4 text-green-500 inline ml-1" />
                              )}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}

                      {/* Leaderboard Preview */}
                      {challenge.participants.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500">Top 3:</span>
                          {challenge.participants.slice(0, 3).map((p, idx) => (
                            <div key={p.id} className="flex items-center gap-1">
                              {idx === 0 && <span className="text-yellow-500">🥇</span>}
                              {idx === 1 && <span className="text-gray-400">🥈</span>}
                              {idx === 2 && <span className="text-orange-600">🥉</span>}
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={p.user.avatar} />
                                <AvatarFallback>{p.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{p.progress}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        {challenge.isJoined && challenge.userRank && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Medal className="w-3 h-3" />
                            Peringkat #{challenge.userRank}
                          </Badge>
                        )}
                        
                        {!challenge.isJoined && isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleJoinChallenge(challenge.id)}
                            disabled={joiningId === challenge.id}
                          >
                            {joiningId === challenge.id ? 'Bergabung...' : 'Ikut Challenge'}
                          </Button>
                        )}

                        {challenge.isJoined && (
                          <Button variant="outline" size="sm">
                            Lihat Leaderboard
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}

                        {isEnded && !challenge.isJoined && (
                          <Badge variant="secondary">Selesai</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
