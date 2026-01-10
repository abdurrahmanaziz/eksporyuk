'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  Trophy, 
  Target, 
  Users, 
  ChevronRight,
  Award,
  Play,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Quiz {
  id: string
  title: string
  description?: string
  coverImage?: string
  passingScore: number
  timeLimit?: number
  maxAttempts?: number
  rewardPoints: number
  startDate?: string
  endDate?: string
  creator: {
    id: string
    name: string
    avatar?: string
  }
  rewardBadge?: {
    id: string
    name: string
    icon: string
    color: string
  }
  _count: {
    questions: number
    attempts: number
  }
  userAttempts: number
  bestScore: number
  hasPassed: boolean
  canAttempt: boolean
}

interface QuizListProps {
  groupId: string
  groupSlug: string
  isAdmin?: boolean
  onStartQuiz?: (quizId: string) => void
}

export default function QuizList({ groupId, groupSlug, isAdmin, onStartQuiz }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all')

  useEffect(() => {
    fetchQuizzes()
  }, [groupSlug, filter])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? `/api/groups/${groupSlug}/quizzes`
        : `/api/groups/${groupSlug}/quizzes?status=${filter}`
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date()
    if (quiz.startDate && new Date(quiz.startDate) > now) {
      return 'upcoming'
    }
    if (quiz.endDate && new Date(quiz.endDate) < now) {
      return 'ended'
    }
    return 'active'
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Aktif</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700">Akan Datang</Badge>
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-700">Selesai</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
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

      {/* Quiz Cards */}
      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada quiz tersedia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => {
            const status = getQuizStatus(quiz)
            
            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Quiz Image */}
                    <div className="w-24 h-24 flex-shrink-0">
                      {quiz.coverImage ? (
                        <img 
                          src={quiz.coverImage} 
                          alt={quiz.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Trophy className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Quiz Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">{quiz.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStatusBadge(status)}
                            {quiz.hasPassed && (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Lulus
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Award className="w-4 h-4" />
                            <span className="font-semibold">+{quiz.rewardPoints}</span>
                          </div>
                        </div>
                      </div>

                      {quiz.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {quiz.description}
                        </p>
                      )}

                      {/* Quiz Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {quiz._count.questions} soal
                        </span>
                        {quiz.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {quiz.timeLimit} menit
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {quiz._count.attempts} peserta
                        </span>
                        <span>
                          Passing Score: {quiz.passingScore}%
                        </span>
                      </div>

                      {/* User Progress */}
                      {quiz.userAttempts > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Skor Terbaik</span>
                            <span className={`font-semibold ${quiz.hasPassed ? 'text-green-600' : 'text-gray-900'}`}>
                              {quiz.bestScore.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={quiz.bestScore} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {quiz.userAttempts} percobaan 
                            {quiz.maxAttempts && ` dari ${quiz.maxAttempts} maksimal`}
                          </p>
                        </div>
                      )}

                      {/* Badge Reward */}
                      {quiz.rewardBadge && (
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <span className="text-gray-500">Hadiah Badge:</span>
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: quiz.rewardBadge.color + '20', color: quiz.rewardBadge.color }}
                          >
                            {quiz.rewardBadge.icon} {quiz.rewardBadge.name}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={quiz.creator.avatar} />
                            <AvatarFallback>{quiz.creator.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{quiz.creator.name}</span>
                        </div>

                        {status === 'active' && quiz.canAttempt && (
                          <Button
                            onClick={() => onStartQuiz?.(quiz.id)}
                            size="sm"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Mulai Quiz
                          </Button>
                        )}
                        
                        {status === 'active' && !quiz.canAttempt && (
                          <Button variant="outline" size="sm" disabled>
                            <XCircle className="w-4 h-4 mr-1" />
                            Percobaan Habis
                          </Button>
                        )}

                        {status === 'upcoming' && quiz.startDate && (
                          <span className="text-sm text-blue-600">
                            Mulai {formatDistanceToNow(new Date(quiz.startDate), { addSuffix: true, locale: idLocale })}
                          </span>
                        )}

                        {status === 'ended' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStartQuiz?.(quiz.id)}
                          >
                            Lihat Hasil
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
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
