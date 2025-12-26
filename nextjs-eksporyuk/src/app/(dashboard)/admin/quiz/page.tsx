'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileQuestion, Search, Filter, Eye, Edit, Trash2,
  Clock, Target, CheckCircle, AlertCircle, BookOpen,
  TrendingUp, Users, BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

type Quiz = {
  id: string
  title: string
  description?: string
  passingScore: number
  timeLimit?: number
  maxAttempts?: number
  isActive: boolean
  createdAt: string
  course?: {
    id: string
    title: string
    slug: string
  }
  _count?: {
    questions: number
    attempts: number
  }
}

type StatsData = {
  totalQuizzes: number
  activeQuizzes: number
  totalQuestions: number
  totalAttempts: number
  averagePassingScore: number
}

export default function AdminQuizPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalQuizzes: 0,
    activeQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averagePassingScore: 0
  })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostAttempts' | 'mostQuestions'>('newest')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        toast.error('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.')
        return
      }
      fetchQuizzes()
    }
  }, [status, session, router])

  useEffect(() => {
    // Apply filters
    let filtered = [...quizzes]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        quiz =>
          quiz.title.toLowerCase().includes(query) ||
          quiz.description?.toLowerCase().includes(query) ||
          quiz.course?.title.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(quiz => quiz.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(quiz => !quiz.isActive)
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'mostAttempts':
        filtered.sort((a, b) => (b._count?.attempts || 0) - (a._count?.attempts || 0))
        break
      case 'mostQuestions':
        filtered.sort((a, b) => (b._count?.questions || 0) - (a._count?.questions || 0))
        break
    }

    setFilteredQuizzes(filtered)
  }, [quizzes, searchQuery, statusFilter, sortBy])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/quizzes')
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal memuat data quiz')
      }

      const data = await res.json()
      setQuizzes(data.quizzes || [])
      
      // Calculate stats
      const totalQuizzes = data.quizzes?.length || 0
      const activeQuizzes = data.quizzes?.filter((q: Quiz) => q.isActive).length || 0
      const totalQuestions = data.quizzes?.reduce((sum: number, q: Quiz) => sum + (q._count?.questions || 0), 0) || 0
      const totalAttempts = data.quizzes?.reduce((sum: number, q: Quiz) => sum + (q._count?.attempts || 0), 0) || 0
      const averagePassingScore = totalQuizzes > 0
        ? Math.round(data.quizzes.reduce((sum: number, q: Quiz) => sum + q.passingScore, 0) / totalQuizzes)
        : 0

      setStats({
        totalQuizzes,
        activeQuizzes,
        totalQuestions,
        totalAttempts,
        averagePassingScore
      })
    } catch (error: any) {
      console.error('Failed to fetch quizzes:', error)
      toast.error(error.message || 'Terjadi kesalahan saat memuat data quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string, courseId: string) => {
    if (!confirm('Yakin ingin menghapus quiz ini? Semua pertanyaan dan hasil attempt akan terhapus permanen.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal menghapus quiz')
      }

      toast.success('Quiz berhasil dihapus')
      fetchQuizzes()
    } catch (error: any) {
      console.error('Delete quiz error:', error)
      toast.error(error.message || 'Terjadi kesalahan saat menghapus quiz')
    }
  }

  const toggleQuizStatus = async (quizId: string, courseId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal mengubah status quiz')
      }

      toast.success(`Quiz berhasil di${!currentStatus ? 'aktifkan' : 'nonaktifkan'}`)
      fetchQuizzes()
    } catch (error: any) {
      console.error('Toggle status error:', error)
      toast.error(error.message || 'Terjadi kesalahan saat mengubah status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manajemen Quiz</h1>
          <p className="text-muted-foreground">Kelola semua quiz dari semua kursus secara terpusat</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Quiz</p>
                  <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                </div>
                <FileQuestion className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quiz Aktif</p>
                  <p className="text-2xl font-bold">{stats.activeQuizzes}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pertanyaan</p>
                  <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                  <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Passing Score</p>
                  <p className="text-2xl font-bold">{stats.averagePassingScore}%</p>
                </div>
                <Target className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari judul quiz, deskripsi, atau nama kursus..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                    <SelectItem value="mostAttempts">Paling Banyak Attempts</SelectItem>
                    <SelectItem value="mostQuestions">Paling Banyak Soal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz List */}
        {filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tidak ada quiz yang sesuai dengan filter.'
                  : 'Belum ada quiz yang dibuat.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        {quiz.isActive ? (
                          <Badge variant="default">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Nonaktif</Badge>
                        )}
                      </div>
                      
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{quiz.course?.title || 'Kursus tidak ditemukan'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/admin/quiz/${quiz.id}/attempts`}>
                        <Button size="sm" variant="outline" title="Lihat Attempts">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      {quiz.course && (
                        <Link href={`/admin/courses/${quiz.course.id}/quiz`}>
                          <Button size="sm" variant="outline" title="Edit Quiz">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      <Button
                        size="sm"
                        variant={quiz.isActive ? "outline" : "default"}
                        onClick={() => quiz.course && toggleQuizStatus(quiz.id, quiz.course.id, quiz.isActive)}
                        title={quiz.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {quiz.isActive ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => quiz.course && handleDeleteQuiz(quiz.id, quiz.course.id)}
                        title="Hapus Quiz"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Pertanyaan</p>
                      <p className="font-semibold">{quiz._count?.questions || 0} soal</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Passing Score</p>
                      <p className="font-semibold">{quiz.passingScore}%</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Batas Waktu</p>
                      <p className="font-semibold">
                        {quiz.timeLimit ? `${quiz.timeLimit} menit` : 'Tidak terbatas'}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Max Attempts</p>
                      <p className="font-semibold">
                        {quiz.maxAttempts || 'Tidak terbatas'}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground mb-1">Total Attempts</p>
                      <p className="font-semibold">{quiz._count?.attempts || 0} kali</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredQuizzes.length > 0 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Menampilkan {filteredQuizzes.length} dari {quizzes.length} quiz
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
