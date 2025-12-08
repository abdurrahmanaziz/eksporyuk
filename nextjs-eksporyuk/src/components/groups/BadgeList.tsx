'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Award, 
  Target,
  Star,
  Flame,
  Lock
} from 'lucide-react'

interface BadgeItem {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  category: string
  points: number
  earned: boolean
  earnedAt?: string
}

interface BadgeListProps {
  groupId: string
  groupSlug: string
  isAdmin?: boolean
}

export default function BadgeList({ groupId, groupSlug, isAdmin }: BadgeListProps) {
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [earnedCount, setEarnedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchBadges()
  }, [groupId])

  const fetchBadges = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/badges`)
      if (res.ok) {
        const data = await res.json()
        setBadges(data.badges || [])
        setEarnedCount(data.earnedCount || 0)
        setTotalCount(data.totalCount || 0)
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PARTICIPATION':
        return <Star className="w-4 h-4" />
      case 'ACHIEVEMENT':
        return <Trophy className="w-4 h-4" />
      case 'SPECIAL':
        return <Award className="w-4 h-4" />
      case 'QUIZ':
        return <Target className="w-4 h-4" />
      case 'LEADERBOARD':
        return <Flame className="w-4 h-4" />
      default:
        return <Award className="w-4 h-4" />
    }
  }

  const categories = ['all', 'PARTICIPATION', 'ACHIEVEMENT', 'SPECIAL', 'QUIZ', 'LEADERBOARD']
  const categoryNames: Record<string, string> = {
    'all': 'Semua',
    'PARTICIPATION': 'Partisipasi',
    'ACHIEVEMENT': 'Pencapaian',
    'SPECIAL': 'Spesial',
    'QUIZ': 'Quiz',
    'LEADERBOARD': 'Leaderboard'
  }

  const filteredBadges = activeCategory === 'all' 
    ? badges 
    : badges.filter(b => b.category === activeCategory)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <CardTitle>Koleksi Badge</CardTitle>
          </div>
          <Badge variant="secondary" className="text-sm">
            {earnedCount} / {totalCount} diperoleh
          </Badge>
        </div>
        <Progress value={(earnedCount / totalCount) * 100} className="h-2 mt-2" />
      </CardHeader>

      <CardContent>
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1"
            >
              {cat !== 'all' && getCategoryIcon(cat)}
              {categoryNames[cat]}
            </Button>
          ))}
        </div>

        {/* Badge Grid */}
        {filteredBadges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada badge dalam kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredBadges.map(badge => (
              <div 
                key={badge.id}
                className={`relative p-4 rounded-xl text-center transition-all cursor-pointer hover:shadow-md ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'
                    : 'bg-gray-50 border-2 border-gray-100 opacity-75'
                }`}
              >
                {/* Badge Icon */}
                <div 
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${
                    badge.earned 
                      ? ''
                      : 'grayscale'
                  }`}
                  style={{ 
                    backgroundColor: badge.earned ? badge.color + '20' : '#f3f4f6',
                  }}
                >
                  {badge.earned ? (
                    badge.icon
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Badge Name */}
                <h4 className={`font-semibold text-sm mb-1 ${
                  badge.earned ? '' : 'text-gray-400'
                }`}>
                  {badge.name}
                </h4>

                {/* Badge Description */}
                <p className={`text-xs line-clamp-2 ${
                  badge.earned ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {badge.description}
                </p>

                {/* Points */}
                {badge.points > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`mt-2 text-xs ${
                      badge.earned ? 'bg-yellow-100 text-yellow-700' : ''
                    }`}
                  >
                    +{badge.points} poin
                  </Badge>
                )}

                {/* Earned Checkmark */}
                {badge.earned && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
