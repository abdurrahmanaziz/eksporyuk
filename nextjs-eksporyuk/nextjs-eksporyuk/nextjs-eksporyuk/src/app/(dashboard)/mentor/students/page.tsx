'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { 
  Users, Search, BookOpen, TrendingUp, 
  CheckCircle, Clock, User, Award
} from 'lucide-react'
import { toast } from 'sonner'

type StudentProgress = {
  id: string
  userId: string
  courseId: string
  progress: number
  completedLessons: any
  lastAccessedAt: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  course: {
    title: string
  }
  quizAttempts: number
  assignmentSubmissions: number
  isCompleted: boolean
}

export default function MentorStudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [progressFilter, setProgressFilter] = useState<string>('all')
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      // Check allRoles for multi-role support (user may have MENTOR as additional role)
      const allRoles = session?.user?.allRoles || [session?.user?.role]
      const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
      if (!hasMentorAccess) {
        router.push('/dashboard')
        return
      }
      fetchData()
    }
  }, [status, session, router])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, courseFilter, progressFilter, students])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch students progress
      const studentsRes = await fetch('/api/mentor/students')
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }

      // Fetch mentor's courses for filter
      const coursesRes = await fetch('/api/courses?mentorOnly=true')
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses.map((c: any) => ({ id: c.id, title: c.title })))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...students]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.course.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.courseId === courseFilter)
    }

    // Progress filter
    if (progressFilter === 'completed') {
      filtered = filtered.filter(student => student.isCompleted)
    } else if (progressFilter === 'in-progress') {
      filtered = filtered.filter(student => !student.isCompleted && student.progress > 0)
    } else if (progressFilter === 'not-started') {
      filtered = filtered.filter(student => student.progress === 0)
    }

    setFilteredStudents(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStats = () => {
    const total = students.length
    const completed = students.filter(s => s.isCompleted).length
    const inProgress = students.filter(s => !s.isCompleted && s.progress > 0).length
    const avgProgress = students.length > 0
      ? students.reduce((sum, s) => sum + s.progress, 0) / students.length
      : 0

    return { total, completed, inProgress, avgProgress }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data siswa...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Siswa Saya</h1>
        <p className="text-muted-foreground">Monitor progress dan aktivitas siswa di kursus Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Semua enrollment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sedang Belajar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Kursus completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Rata-rata kemajuan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Kursus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kursus</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={progressFilter} onValueChange={setProgressFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="in-progress">Sedang Belajar</SelectItem>
                <SelectItem value="not-started">Belum Mulai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kursus</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Terakhir Akses</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Tidak ada siswa ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {student.user.avatar ? (
                              <img 
                                src={student.user.avatar} 
                                alt={student.user.name} 
                                className="w-10 h-10 rounded-full" 
                              />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{student.user.name}</p>
                            <p className="text-sm text-muted-foreground">{student.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="line-clamp-1">{student.course.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{student.progress}%</span>
                          </div>
                          <Progress value={student.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.quizAttempts} attempts
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.assignmentSubmissions} submitted
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.lastAccessedAt 
                          ? formatDate(student.lastAccessedAt)
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {student.isCompleted ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesai
                          </Badge>
                        ) : student.progress > 0 ? (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Belajar
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Belum Mulai
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}
