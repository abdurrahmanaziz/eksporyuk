'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  RefreshCw,
  Search,
  Download,
  Eye,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface CourseAnalytics {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  instructor: {
    name: string
    avatar: string | null
  }
  totalEnrollments: number
  activeStudents: number
  completionRate: number
  averageRating: number
  totalReviews: number
  totalRevenue: number
  totalLessons: number
  averageProgress: number
  status: string
  createdAt: string
}

interface OverviewStats {
  totalCourses: number
  totalEnrollments: number
  averageCompletion: number
  totalRevenue: number
  activeLearners: number
  certificatesIssued: number
}

export default function CourseAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('enrollments')
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [courses, setCourses] = useState<CourseAnalytics[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/admin/analytics/courses?sort=${sortBy}&search=${searchQuery}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOverview(data.overview || null)
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data')
      setCourses([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [sortBy, searchQuery])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData()
    }
  }, [session, fetchData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  const courseList = courses || []

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Analytics</h1>
              <p className="text-gray-500 mt-1">Analisis performa kursus</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={fetchData} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="text-sm font-medium text-gray-500">Total Kursus</span>
            <div className="text-2xl font-bold text-gray-900 mt-2">{overview?.totalCourses || 0}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="text-sm font-medium text-gray-500">Total Enrollments</span>
            <div className="text-2xl font-bold text-gray-900 mt-2">{overview?.totalEnrollments?.toLocaleString() || 0}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="text-sm font-medium text-gray-500">Active Learners</span>
            <div className="text-2xl font-bold text-gray-900 mt-2">{overview?.activeLearners?.toLocaleString() || 0}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="text-sm font-medium text-gray-500">Avg Completion</span>
            <div className="text-2xl font-bold text-gray-900 mt-2">{overview?.averageCompletion || 0}%</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="text-sm font-medium text-gray-500">Certificates</span>
            <div className="text-2xl font-bold text-gray-900 mt-2">{overview?.certificatesIssued?.toLocaleString() || 0}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="text-sm font-medium text-gray-500">Total Revenue</span>
            <div className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(overview?.totalRevenue || 0)}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollments">Enrollment Tertinggi</SelectItem>
                <SelectItem value="completion">Completion Rate</SelectItem>
                <SelectItem value="rating">Rating Tertinggi</SelectItem>
                <SelectItem value="revenue">Revenue Tertinggi</SelectItem>
                <SelectItem value="newest">Terbaru</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Course Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Daftar Kursus</h3>
            <p className="text-sm text-gray-500 mt-1">Performa detail setiap kursus</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kursus</TableHead>
                <TableHead>Instruktur</TableHead>
                <TableHead className="text-center">Enrollments</TableHead>
                <TableHead className="text-center">Completion</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Belum ada data kursus</p>
                  </TableCell>
                </TableRow>
              ) : (
                courseList.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                          <p className="text-xs text-gray-500">{course.totalLessons} lessons</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{course.instructor?.name || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{course.totalEnrollments}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={course.completionRate} className="w-16 h-2" />
                        <span className="text-sm">{course.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.averageRating?.toFixed(1) || '-'}</span>
                        <span className="text-xs text-gray-500">({course.totalReviews})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {formatCurrency(course.totalRevenue)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
