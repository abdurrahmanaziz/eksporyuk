'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BookOpen, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, 
  Search, Filter, Users, TrendingUp, AlertCircle, Settings, Copy, ExternalLink, Link as LinkIcon
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

type Course = {
  id: string
  title: string
  slug: string
  checkoutSlug: string | null
  description: string
  thumbnail?: string
  price: number
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED'
  monetizationType: 'FREE' | 'PAID' | 'SUBSCRIPTION' | 'AFFILIATE'
  isPublished: boolean
  enrollmentCount: number
  rating: number
  createdAt: string
  mentor: {
    id: string
    user: {
      name: string
      email: string
    }
  }
  modules: Array<{ id: string }>
}

type Stats = {
  total: number
  draft: number
  pendingReview: number
  approved: number
  published: number
  rejected: number
  totalStudents: number
  totalRevenue: number
}

export default function MentorCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    pendingReview: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    totalStudents: 0,
    totalRevenue: 0
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [monetizationFilter, setMonetizationFilter] = useState<string>('all')

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (!['ADMIN', 'MENTOR'].includes(session?.user?.role || '')) {
        router.push('/dashboard')
        return
      }
      fetchCourses()
    }
  }, [status, session, router])

  useEffect(() => {
    filterCourses()
  }, [courses, searchQuery, statusFilter, monetizationFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
        
        // Calculate stats
        const allCourses = data.courses || []
        setStats({
          total: allCourses.length,
          draft: allCourses.filter((c: Course) => c.status === 'DRAFT').length,
          pendingReview: allCourses.filter((c: Course) => c.status === 'PENDING_REVIEW').length,
          approved: allCourses.filter((c: Course) => c.status === 'APPROVED').length,
          published: allCourses.filter((c: Course) => c.status === 'PUBLISHED').length,
          rejected: allCourses.filter((c: Course) => c.status === 'REJECTED').length,
          totalStudents: allCourses.reduce((sum: number, c: Course) => sum + c.enrollmentCount, 0),
          totalRevenue: allCourses.reduce((sum: number, c: Course) => sum + (Number(c.price) * c.enrollmentCount), 0)
        })
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Gagal memuat data kursus')
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = [...courses]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.mentor.user.name.toLowerCase().includes(query) ||
        c.mentor.user.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    // Monetization filter
    if (monetizationFilter !== 'all') {
      filtered = filtered.filter(c => c.monetizationType === monetizationFilter)
    }

    setFilteredCourses(filtered)
  }

  const handlePublish = async (courseId: string) => {
    try {
      const res = await fetch(`/api/mentor/courses/${courseId}/publish`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Kursus berhasil dipublikasikan')
        fetchCourses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mempublikasikan kursus')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleUnpublish = async (courseId: string) => {
    try {
      const res = await fetch(`/api/mentor/courses/${courseId}/unpublish`, {
        method: 'POST'
      })
      if (res.ok) {
        toast.success('Kursus berhasil dibatalkan publikasinya')
        fetchCourses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membatalkan publikasi kursus')
      }
    } catch (error) {
      console.error('Unpublish error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const confirmDelete = (course: Course) => {
    setCourseToDelete(course)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/mentor/courses/${courseToDelete.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Kursus berhasil dihapus')
        fetchCourses()
        setDeleteDialogOpen(false)
        setCourseToDelete(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus kursus')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  // Function to get checkout URL
  const getCheckoutUrl = (course: Course) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    if (course.checkoutSlug) {
      return `${baseUrl}/checkout/course/${course.checkoutSlug}`
    }
    return `${baseUrl}/checkout/course/${course.slug}`
  }

  // Function to copy checkout link
  const copyCheckoutLink = async (course: Course) => {
    const url = getCheckoutUrl(course)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link pembelian berhasil disalin!')
    } catch (err) {
      toast.error('Gagal menyalin link')
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PENDING_REVIEW: { variant: 'outline', label: 'Menunggu Review' },
      APPROVED: { variant: 'default', label: 'Disetujui' },
      REJECTED: { variant: 'destructive', label: 'Ditolak' },
      PUBLISHED: { variant: 'default', label: 'Dipublikasi' },
      ARCHIVED: { variant: 'secondary', label: 'Diarsipkan' }
    }
    const { variant, label } = config[status] || config.DRAFT
    return <Badge variant={variant}>{label}</Badge>
  }

  const getMonetizationBadge = (type: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      FREE: { variant: 'secondary', label: 'Gratis' },
      PAID: { variant: 'default', label: 'Berbayar' },
      SUBSCRIPTION: { variant: 'outline', label: 'Langganan' },
      AFFILIATE: { variant: 'default', label: 'Affiliate' }
    }
    const { variant, label } = config[type] || config.FREE
    return <Badge variant={variant}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data kursus...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kursus Saya</h1>
          <p className="text-muted-foreground">Kelola kursus dan materi pembelajaran Anda</p>
        </div>
        <Link href="/mentor/courses/new">
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Buat Kursus Baru
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Kursus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dipublikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Menunggu Review</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="PUBLISHED">Dipublikasi</SelectItem>
                <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monetizationFilter} onValueChange={setMonetizationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Monetisasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="FREE">Gratis</SelectItem>
                <SelectItem value="PAID">Berbayar</SelectItem>
                <SelectItem value="SUBSCRIPTION">Langganan</SelectItem>
                <SelectItem value="AFFILIATE">Affiliate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kursus ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tidak ada kursus yang ditemukan</p>
              <Link href="/mentor/courses/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Kursus Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul Kursus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Link Pembelian</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-muted-foreground">{course.slug}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell>Rp {Number(course.price).toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollmentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyCheckoutLink(course)}
                                className="h-8 px-2"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Salin
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-[300px] break-all">{getCheckoutUrl(course)}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(getCheckoutUrl(course), '_blank')}
                                className="h-8 px-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Buka halaman pembelian</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {course.status === 'APPROVED' && !course.isPublished && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handlePublish(course.id)}
                            >
                              Publikasi
                            </Button>
                          )}
                          {course.isPublished && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnpublish(course.id)}
                            >
                              Batal Publikasi
                            </Button>
                          )}
                          <Link href={`/mentor/courses/${course.id}`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/learn/${course.slug}`} target="_blank">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmDelete(course)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kursus?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus kursus <strong>{courseToDelete?.title}</strong>?
              <br />
              <span className="text-red-600 font-semibold">
                Tindakan ini tidak dapat dibatalkan. Semua data modul, lesson, quiz, dan enrollment akan terhapus.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </ResponsivePageWrapper>
  )
}
