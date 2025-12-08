'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    email: string
    image: string | null
    role: string
  }
  role: string
  stats: {
    posts: number
    comments: number
    likesGiven: number
    likesReceived: number
    score: number
  }
}

interface LeaderboardProps {
  groupId: string
}

export default function Leaderboard({ groupId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'all-time'>('week')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [groupId, period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/leaderboard?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
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
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />
      default:
        return <span className="text-sm font-semibold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600'
    return 'bg-gray-100'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <CardTitle>Leaderboard</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              Month
            </Button>
            <Button
              variant={period === 'all-time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('all-time')}
            >
              All Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada aktivitas dalam periode ini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.user.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${getRankBadge(entry.rank)}`}
              >
                <div className="flex items-center justify-center w-10">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar className="border-2 border-white">
                  <AvatarImage src={entry.user.image || ''} />
                  <AvatarFallback>
                    {entry.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold truncate ${
                      entry.rank <= 3 ? 'text-white' : 'text-gray-900'
                    }`}>
                      {entry.user.name}
                    </p>
                    {entry.rank === 1 && (
                      <Badge variant="secondary" className="bg-white text-yellow-600">
                        Top Member
                      </Badge>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 text-xs ${
                    entry.rank <= 3 ? 'text-white/90' : 'text-gray-600'
                  }`}>
                    <span>{entry.stats.posts} posts</span>
                    <span>•</span>
                    <span>{entry.stats.comments} comments</span>
                    <span>•</span>
                    <span>{entry.stats.likesReceived} likes</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    entry.rank <= 3 ? 'text-white' : 'text-blue-600'
                  }`}>
                    {entry.stats.score}
                  </p>
                  <p className={`text-xs ${
                    entry.rank <= 3 ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
