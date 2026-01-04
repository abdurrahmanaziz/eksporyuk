'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  Award,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  Trophy,
  Star,
  ArrowRight,
  ExternalLink
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  progress: number
  totalLessons: number
  completedLessons: number
  totalModules: number
  currentModule: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  lastAccessedAt: string | null
  enrolledAt: string
  completedAt: string | null
  timeSpent: number // in minutes
}

interface ProgressStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  totalLessons: number
  completedLessons: number
  totalTimeSpent: number // in minutes
  averageProgress: number
  streakDays: number
  certificatesEarned: number
}

export default function ProgressPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/member/progress')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || course.status.toLowerCase() === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Kelas</h1>
        <p className="text-gray-600">Lacak kemajuan belajar dan raih pencapaian Anda</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCourses}</p>
                  <p className="text-sm text-gray-600">Total Kursus</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.completedCourses}</p>
                  <p className="text-sm text-gray-600">Selesai</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageProgress)}%</p>
                  <p className="text-sm text-gray-600">Rata-rata Progress</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{formatTime(stats.totalTimeSpent)}</p>
                  <p className="text-sm text-gray-600">Total Waktu</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari kursus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="in_progress">Sedang Belajar</TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
            <TabsTrigger value="not_started">Belum Mulai</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Progress Overview Chart */}
      {stats && stats.totalCourses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ringkasan Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Kursus Selesai</span>
                  <span className="text-sm text-gray-600">
                    {stats.completedCourses}/{stats.totalCourses}
                  </span>
                </div>
                <Progress 
                  value={(stats.completedCourses / stats.totalCourses) * 100} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Lessons Selesai</span>
                  <span className="text-sm text-gray-600">
                    {stats.completedLessons}/{stats.totalLessons}
                  </span>
                </div>
                <Progress 
                  value={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress Rata-rata</span>
                  <span className="text-sm text-gray-600">{Math.round(stats.averageProgress)}%</span>
                </div>
                <Progress value={stats.averageProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Tidak ada kursus ditemukan' : 'Belum ada kursus'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Mulai journey belajar Anda dengan mengikuti kursus pertama'
              }
            </p>
            <Link href="/member/courses">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <BookOpen className="w-4 h-4 mr-2" />
                Jelajahi Kursus
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex-shrink-0">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(course.status)}>
                        {getStatusIcon(course.status)}
                        <span className="ml-1">{course.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                      <span>Module {course.currentModule}/{course.totalModules}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {course.lastAccessedAt ? (
                      <span>
                        Terakhir diakses: {new Date(course.lastAccessedAt).toLocaleDateString('id-ID')}
                      </span>
                    ) : (
                      <span>Belum pernah diakses</span>
                    )}
                  </div>
                  
                  <Link href={`/member/learn/${course.slug}`}>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                      {course.status === 'NOT_STARTED' ? 'Mulai' : 'Lanjutkan'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}