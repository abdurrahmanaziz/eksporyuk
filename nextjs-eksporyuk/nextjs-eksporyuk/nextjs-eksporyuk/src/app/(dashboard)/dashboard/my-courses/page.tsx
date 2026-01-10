'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, Search, Award, Clock, Play, CheckCircle,
  TrendingUp, Target, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

type Enrollment = {
  id: string
  courseId: string
  progress: number
  completed: boolean
  completedAt?: string
  createdAt: string
  course: {
    id: string
    title: string
    description: string
    thumbnail?: string
    slug: string
    mentor: {
      user: {
        name: string
        avatar?: string
      }
    }
    _count: {
      modules: number
      enrollments: number
    }
  }
  detailedProgress?: {
    progress: number
    completedLessons: any
    lastAccessedAt: string
  }
}

export default function MyCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchEnrollments()
    }
  }, [status, router])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filter, enrollments])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/student/enrollments')
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments || [])
      } else {
        toast.error('Gagal memuat data kursus')
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...enrollments]

    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filter === 'completed') {
      filtered = filtered.filter(e => e.completed)
    } else if (filter === 'in-progress') {
      filtered = filtered.filter(e => !e.completed)
    }

    setFilteredEnrollments(filtered)
  }

  const getStats = () => {
    const total = enrollments.length
    const completed = enrollments.filter(e => e.completed).length
    const inProgress = total - completed
    const avgProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0

    return { total, completed, inProgress, avgProgress }
  }

  const stats = getStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat kursus Anda...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Kursus Saya</h1>
        <p className="text-muted-foreground">Lanjutkan belajar dan capai target Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kursus</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Kursus terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sedang Belajar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Dalam progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diselesaikan</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Kursus selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">Pencapaian Anda</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                Semua
              </Button>
              <Button
                variant={filter === 'in-progress' ? 'default' : 'outline'}
                onClick={() => setFilter('in-progress')}
              >
                Sedang Belajar
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilter('completed')}
              >
                Selesai
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {filteredEnrollments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {enrollments.length === 0 
                ? 'Anda belum terdaftar di kursus apapun'
                : 'Tidak ada kursus yang cocok dengan filter'
              }
            </p>
            {enrollments.length === 0 && (
              <Link href="/courses">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Jelajahi Kursus
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {enrollment.course.thumbnail && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover"
                  />
                  {enrollment.completed && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{enrollment.course.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{enrollment.course.mentor.user.name}</span>
                  <span>•</span>
                  <span>{enrollment.course._count.modules} modul</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{enrollment.progress}%</span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Enrolled {formatDate(enrollment.createdAt)}</span>
                    </div>
                  </div>

                  <Link href={`/dashboard/courses/${enrollment.courseId}`}>
                    <Button className="w-full">
                      {enrollment.completed ? (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Lihat Sertifikat
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Lanjutkan Belajar
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
