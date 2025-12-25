'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Clock, CheckCircle2, Play, Award, TrendingUp, Star, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CourseProgress = {
  courseId: string
  course: {
    id: string
    title: string
    slug: string
    description: string
    thumbnail?: string
    status: string
    monetizationType: string
    level?: string
    duration?: number
    modules: {
      id: string
      title: string
      lessons: {
        id: string
        title: string
      }[]
    }[]
  }
  completedLessons: number
  totalLessons: number
  lastAccessed?: string
  progress: number
  certificateIssued: boolean
}

export default function MyCoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('in-progress')

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    try {
      const res = await fetch('/api/enrollments/my-courses')
      if (res.ok) {
        const data = await res.json()
        console.log('📚 Fetched courses:', data.enrollments?.length || 0)
        setCourses(data.enrollments || [])
      } else {
        console.error('Failed to fetch courses:', res.status)
        setCourses([])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const inProgressCourses = courses.filter(c => c.progress < 100 && c.progress > 0)
  const notStartedCourses = courses.filter(c => c.progress === 0)
  const completedCourses = courses.filter(c => c.progress === 100)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kursus...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kursus Saya</h1>
        <p className="text-gray-600">Lanjutkan perjalanan belajar Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Kursus</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sedang Berjalan</p>
              <p className="text-2xl font-bold text-orange-600">{inProgressCourses.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Selesai</p>
              <p className="text-2xl font-bold text-green-600">{completedCourses.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sertifikat</p>
              <p className="text-2xl font-bold text-purple-600">
                {courses.filter(c => c.certificateIssued).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="in-progress">
            Sedang Belajar ({inProgressCourses.length})
          </TabsTrigger>
          <TabsTrigger value="not-started">
            Belum Dimulai ({notStartedCourses.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Selesai ({completedCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress">
          {inProgressCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Kursus yang Sedang Berjalan
              </h3>
              <p className="text-gray-600 mb-6">
                Mulai belajar dari kursus yang sudah Anda daftarkan
              </p>
              <Link href="/courses">
                <Button>Jelajah Kursus</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressCourses.map((enrollment) => (
                <CourseCard key={enrollment.courseId} enrollment={enrollment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="not-started">
          {notStartedCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Semua Kursus Sudah Dimulai
              </h3>
              <p className="text-gray-600">
                Anda sudah memulai semua kursus yang terdaftar
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notStartedCourses.map((enrollment) => (
                <CourseCard key={enrollment.courseId} enrollment={enrollment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Kursus yang Selesai
              </h3>
              <p className="text-gray-600 mb-6">
                Selesaikan kursus untuk mendapatkan sertifikat
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCourses.map((enrollment) => (
                <CourseCard key={enrollment.courseId} enrollment={enrollment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </ResponsivePageWrapper>
  )
}

function CourseCard({ enrollment }: { enrollment: CourseProgress }) {
  const { course, progress, completedLessons, totalLessons, certificateIssued } = enrollment

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/learn/${course.slug}`}>
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/50" />
            </div>
          )}
          
          {/* Progress Badge */}
          <div className="absolute top-4 right-4">
            {progress === 100 ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Selesai
              </Badge>
            ) : progress > 0 ? (
              <Badge className="bg-orange-500 text-white">
                {Math.round(progress)}%
              </Badge>
            ) : (
              <Badge className="bg-gray-500 text-white">
                Belum Mulai
              </Badge>
            )}
          </div>

          {/* Level Badge */}
          {course.level && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white">
                {course.level}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6 space-y-4">
        <Link href={`/learn/${course.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 line-clamp-2">
          {course.description}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500">
            {completedLessons} dari {totalLessons} pelajaran selesai
          </p>
        </div>

        {/* Course Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {course.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}j</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.modules?.length || 0} Modul</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link href={`/learn/${course.slug}`} className="flex-1">
            <Button className="w-full" variant={progress > 0 ? "default" : "outline"}>
              {progress === 100 ? (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  Lihat Sertifikat
                </>
              ) : progress > 0 ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Lanjutkan
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Mulai Belajar
                </>
              )}
            </Button>
          </Link>
        </div>

        {certificateIssued && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <Award className="w-4 h-4" />
            <span className="font-medium">Sertifikat tersedia</span>
          </div>
        )}

        {progress === 100 && !certificateIssued && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Award className="w-4 h-4" />
            <span className="font-medium">Menghasilkan sertifikat...</span>
          </div>
        )}
      </div>
    </Card>
  )
}
