'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Target, 
  Plus, 
  Search,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Users,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate: string
  maxScore: number
  course: {
    id: string
    title: string
  }
  submissions: {
    total: number
    pending: number
    graded: number
    late: number
  }
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT'
  createdAt: string
}

export default function MentorAssignmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
      fetchAssignments()
    }
  }, [status, session, router])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/assignments')
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    
    if (assignment.status === 'DRAFT') {
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
    }
    if (assignment.status === 'CLOSED') {
      return <Badge className="bg-red-100 text-red-800">Ditutup</Badge>
    }
    if (dueDate < now) {
      return <Badge className="bg-orange-100 text-orange-800">Deadline Lewat</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
  }

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return `${Math.abs(diff)} hari yang lalu`
    if (diff === 0) return 'Hari ini'
    if (diff === 1) return 'Besok'
    return `${diff} hari lagi`
  }

  const filteredAssignments = assignments.filter(asn => {
    const matchesSearch = asn.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || asn.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPending = assignments.reduce((sum, a) => sum + a.submissions.pending, 0)

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tugas</h1>
            <p className="text-gray-600 mt-1">Kelola tugas dan penilaian siswa</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Buat Tugas Baru
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                  <p className="text-sm text-gray-600">Total Tugas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {assignments.filter(a => a.status === 'ACTIVE').length}
                  </p>
                  <p className="text-sm text-gray-600">Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPending}</p>
                  <p className="text-sm text-gray-600">Menunggu Dinilai</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {assignments.reduce((sum, a) => sum + a.submissions.total, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Submisi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Alert */}
        {totalPending > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">
                    Ada {totalPending} tugas yang menunggu penilaian
                  </p>
                  <p className="text-sm text-orange-600">
                    Segera nilai untuk memberikan feedback kepada siswa
                  </p>
                </div>
                <Link href="/mentor/grading">
                  <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                    Nilai Sekarang
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'ACTIVE', 'CLOSED', 'DRAFT'].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? 'default' : 'outline'}
                onClick={() => setStatusFilter(st)}
                size="sm"
              >
                {st === 'all' ? 'Semua' : st === 'ACTIVE' ? 'Aktif' : st === 'CLOSED' ? 'Ditutup' : 'Draft'}
              </Button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Tugas
              </h3>
              <p className="text-gray-600 mb-4">
                Buat tugas untuk mengevaluasi kemampuan siswa
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Buat Tugas Baru
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>
                      
                      {assignment.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {assignment.course.title}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(assignment.dueDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getDaysRemaining(assignment.dueDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Max: {assignment.maxScore} poin
                        </div>
                      </div>

                      {/* Submission Stats */}
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="bg-blue-50">
                          <FileText className="w-3 h-3 mr-1" />
                          {assignment.submissions.total} submisi
                        </Badge>
                        {assignment.submissions.pending > 0 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {assignment.submissions.pending} menunggu
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {assignment.submissions.graded} dinilai
                        </Badge>
                        {assignment.submissions.late > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            {assignment.submissions.late} terlambat
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {assignment.submissions.pending > 0 && (
                        <Link href={`/mentor/grading?assignment=${assignment.id}`}>
                          <Button className="w-full">
                            Nilai ({assignment.submissions.pending})
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline">
                        Detail
                      </Button>
                    </div>
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
