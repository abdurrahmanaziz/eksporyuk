'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Users, Search, TrendingUp, Award, BookOpen, 
  CheckCircle, Clock, Target, BarChart, Plus,
  Trash2, Eye, Download, RefreshCw, UserPlus,
  GraduationCap, FileText, ExternalLink
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import Link from 'next/link'

type Course = {
  id: string
  title: string
  thumbnail?: string
}

type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type Enrollment = {
  id: string
  userId: string
  courseId: string
  progress: number
  completed: boolean
  completedAt?: string
  createdAt: string
  user: User
  course: Course
  detailedProgress?: {
    progress: number
    completedLessons: any
    lastAccessedAt: string
  }
  quizAttempts: number
  assignmentSubmissions: number
}

type Stats = {
  total: number
  completed: number
  inProgress: number
  avgProgress: number
}

export default function AdminEnrollmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0, avgProgress: 0 })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 50
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  
  // Add enrollment form
  const [newEnrollmentUserId, setNewEnrollmentUserId] = useState('')
  const [newEnrollmentCourseId, setNewEnrollmentCourseId] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [addingEnrollment, setAddingEnrollment] = useState(false)
  const [deletingEnrollment, setDeletingEnrollment] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchEnrollments()
    }
  }, [status, session, router])

  const fetchEnrollments = async (page = currentPage) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (courseFilter !== 'all') params.set('courseId', courseFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', page.toString())
      params.set('limit', pageSize.toString())
      
      const res = await fetch(`/api/admin/enrollments?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments || [])
        setCourses(data.courses || [])
        setStats(data.stats || { total: 0, completed: 0, inProgress: 0, avgProgress: 0 })
        setTotalRecords(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setCurrentPage(data.page || 1)
      } else {
        toast.error('Gagal memuat data enrollment')
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      setCurrentPage(1)
      fetchEnrollments(1)
    }
  }, [courseFilter, statusFilter])

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([])
      return
    }
    
    try {
      setSearchingUsers(true)
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setSearchingUsers(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(userSearchQuery)
    }, 300)
    return () => clearTimeout(debounce)
  }, [userSearchQuery])

  const handleAddEnrollment = async () => {
    if (!newEnrollmentUserId || !newEnrollmentCourseId) {
      toast.error('Pilih user dan kursus')
      return
    }

    try {
      setAddingEnrollment(true)
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newEnrollmentUserId,
          courseId: newEnrollmentCourseId
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('User berhasil didaftarkan ke kursus')
        setShowAddModal(false)
        setNewEnrollmentUserId('')
        setNewEnrollmentCourseId('')
        setUserSearchQuery('')
        fetchEnrollments()
      } else {
        toast.error(data.error || 'Gagal mendaftarkan user')
      }
    } catch (error) {
      console.error('Failed to add enrollment:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setAddingEnrollment(false)
    }
  }

  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return

    try {
      setDeletingEnrollment(true)
      const res = await fetch(`/api/admin/enrollments?id=${selectedEnrollment.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Enrollment berhasil dihapus')
        setShowDeleteModal(false)
        setSelectedEnrollment(null)
        fetchEnrollments()
      } else {
        toast.error(data.error || 'Gagal menghapus enrollment')
      }
    } catch (error) {
      console.error('Failed to delete enrollment:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingEnrollment(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    fetchEnrollments(page)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5
    
    if (totalPages <= showPages + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  const exportToCSV = () => {
    const headers = ['User', 'Email', 'Course', 'Progress', 'Status', 'Quiz Attempts', 'Assignments', 'Enrolled Date']
    const rows = filteredEnrollments.map(e => [
      e.user.name,
      e.user.email,
      e.course.title,
      `${e.progress}%`,
      e.completed ? 'Completed' : 'In Progress',
      e.quizAttempts,
      e.assignmentSubmissions,
      formatDate(e.createdAt)
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enrollments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data berhasil diekspor')
  }

  // Apply client-side search filter
  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      enrollment.user.name?.toLowerCase().includes(query) ||
      enrollment.user.email?.toLowerCase().includes(query) ||
      enrollment.course.title?.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data enrollment...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Course Enrollments</h1>
            <p className="text-sm text-muted-foreground">Kelola dan pantau progress siswa di semua kursus</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchEnrollments()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" />
              Tambah Enrollment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.avgProgress}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa atau kursus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={courseFilter} onValueChange={(value) => { setCourseFilter(value); setTimeout(fetchEnrollments, 100); }}>
                <SelectTrigger className="w-full md:w-[200px] h-9">
                  <SelectValue placeholder="Filter Kursus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kursus</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setTimeout(fetchEnrollments, 100); }}>
                <SelectTrigger className="w-full md:w-[160px] h-9">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Enrollment ({filteredEnrollments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tidak ada data enrollment</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Enrollment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Siswa</TableHead>
                      <TableHead>Kursus</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-center">Quiz</TableHead>
                      <TableHead className="text-center">Tugas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead className="pr-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            {enrollment.user.avatar ? (
                              <img
                                src={enrollment.user.avatar}
                                alt={enrollment.user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-emerald-600">
                                  {enrollment.user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{enrollment.user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{enrollment.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <BookOpen className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm truncate">{enrollment.course.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  enrollment.progress >= 100 ? 'bg-green-500' : 
                                  enrollment.progress >= 50 ? 'bg-emerald-500' : 'bg-orange-400'
                                }`}
                                style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-8">{enrollment.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {enrollment.quizAttempts}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {enrollment.assignmentSubmissions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {enrollment.completed ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Selesai
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Belajar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(enrollment.createdAt)}
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link href={`/admin/users/${enrollment.userId}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedEnrollment(enrollment)
                                setShowDeleteModal(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
              
            {/* Pagination */}
            {totalPages > 1 && filteredEnrollments.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRecords)} dari {totalRecords.toLocaleString()} data
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    ««
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    «
                  </Button>
                  
                  {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`h-8 w-8 ${currentPage === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={index} className="px-2 text-muted-foreground">...</span>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    »
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    »»
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Enrollment Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Tambah Enrollment
            </DialogTitle>
            <DialogDescription>
              Daftarkan user ke kursus secara manual
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cari User</Label>
              <Input
                placeholder="Ketik nama atau email user..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
              {searchingUsers && (
                <p className="text-xs text-muted-foreground">Mencari...</p>
              )}
              {users.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <button
                      key={user.id}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                        newEnrollmentUserId === user.id ? 'bg-emerald-50' : ''
                      }`}
                      onClick={() => {
                        setNewEnrollmentUserId(user.id)
                        setUserSearchQuery(user.name || user.email)
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-600">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Pilih Kursus</Label>
              <Select value={newEnrollmentCourseId} onValueChange={setNewEnrollmentCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kursus..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleAddEnrollment} 
              disabled={addingEnrollment || !newEnrollmentUserId || !newEnrollmentCourseId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addingEnrollment ? 'Mendaftarkan...' : 'Daftarkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Enrollment</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus enrollment ini? User akan kehilangan akses ke kursus dan semua progress akan dihapus.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEnrollment && (
            <div className="py-4 space-y-2 bg-gray-50 rounded-lg px-4">
              <p className="text-sm"><strong>User:</strong> {selectedEnrollment.user.name}</p>
              <p className="text-sm"><strong>Email:</strong> {selectedEnrollment.user.email}</p>
              <p className="text-sm"><strong>Kursus:</strong> {selectedEnrollment.course.title}</p>
              <p className="text-sm"><strong>Progress:</strong> {selectedEnrollment.progress}%</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteEnrollment}
              disabled={deletingEnrollment}
            >
              {deletingEnrollment ? 'Menghapus...' : 'Hapus Enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsivePageWrapper>
  )
}
