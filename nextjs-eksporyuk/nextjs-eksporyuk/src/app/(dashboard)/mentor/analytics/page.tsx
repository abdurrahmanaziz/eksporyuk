'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  Users,
  DollarSign,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface Analytics {
  overview: {
    totalCourses: number
    publishedCourses: number
    totalEnrollments: number
    activeStudents: number
    completedEnrollments: number
    completionRate: number
    totalCertificates: number
    totalRevenue: number
    mentorCommission: number
  }
  topCourses: Array<{
    id: string
    title: string
    thumbnail?: string
    enrollmentCount: number
  }>
  enrollmentTrends: Array<{
    date: string
    enrollments: number
  }>
  recentStudents: Array<{
    id: string
    userName: string
    userEmail: string
    userAvatar?: string
    courseTitle: string
    enrolledAt: string
    progress: number
    status: string
  }>
  courseProgress: Array<{
    courseId: string
    courseTitle: string
    totalStudents: number
    averageProgress: number
    completedStudents: number
  }>
}

export default function MentorAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mentor/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
    setLoading(false)
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
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!analytics) {
    return (
      <ResponsivePageWrapper>
        <div className="p-6">No data available</div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
          <p className="text-gray-600 mt-1">Performa kursus dan pendapatan Anda</p>
        </div>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kursus Saya</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {analytics.overview.totalCourses}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {analytics.overview.publishedCourses} published
                  </p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Siswa</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {analytics.overview.activeStudents}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.overview.totalEnrollments} enrollments
                  </p>
                </div>
                <Users className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {analytics.overview.completionRate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.overview.completedEnrollments} completed
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Komisi Saya</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {formatCurrency(analytics.overview.mentorCommission)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    from {formatCurrency(analytics.overview.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrollment Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.enrollmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Course Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Student Progress by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.courseProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseTitle" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageProgress" fill="#10b981" name="Avg Progress %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Courses & Recent Students */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-400">
                      #{index + 1}
                    </div>
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {course.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {course.enrollmentCount} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Progress Details */}
          <Card>
            <CardHeader>
              <CardTitle>Course Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.courseProgress.map((course) => (
                  <div key={course.courseId} className="space-y-2 p-3 border rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {course.courseTitle}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {course.totalStudents}
                        </p>
                        <p className="text-xs text-gray-600">Students</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {course.averageProgress}%
                        </p>
                        <p className="text-xs text-gray-600">Avg Progress</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {course.completedStudents}
                        </p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  {student.userAvatar ? (
                    <img
                      src={student.userAvatar}
                      alt={student.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{student.userName}</h4>
                    <p className="text-sm text-gray-600 truncate">
                      {student.courseTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-blue-600">
                        {student.progress}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(student.enrolledAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
