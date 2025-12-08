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
  Award, Search, Download, Eye, Calendar, 
  User, BookOpen, CheckCircle, XCircle, Ban, Trash2,
  RefreshCw, Mail, Plus, FileDown, Filter
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type Certificate = {
  id: string
  certificateNumber: string
  studentName: string
  courseName: string
  completionDate: string
  issuedAt: string
  isValid: boolean
  verificationUrl?: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  course: {
    id: string
    title: string
    slug: string
    thumbnail?: string
  }
}

export default function AdminCertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all')
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [sendEmailOnIssue, setSendEmailOnIssue] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loadingIssue, setLoadingIssue] = useState(false)

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
      fetchCertificates()
    }
  }, [status, session, router])

  useEffect(() => {
    // Fetch users and courses for manual issue dialog
    if (session?.user?.role === 'ADMIN') {
      fetchUsersAndCourses()
    }
  }, [session])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, certificates])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/certificates')
      if (res.ok) {
        const data = await res.json()
        setCertificates(data.certificates || [])
      } else {
        toast.error('Gagal memuat data sertifikat')
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersAndCourses = async () => {
    try {
      // Fetch users
      const usersRes = await fetch('/api/admin/users?limit=1000')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      // Fetch courses
      const coursesRes = await fetch('/api/courses?limit=1000')
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch users/courses:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...certificates]

    if (searchQuery) {
      filtered = filtered.filter(cert =>
        cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter === 'valid') {
      filtered = filtered.filter(cert => cert.isValid)
    } else if (statusFilter === 'invalid') {
      filtered = filtered.filter(cert => !cert.isValid)
    }

    setFilteredCertificates(filtered)
  }

  const handleRevoke = async (certificateId: string) => {
    if (!confirm('Apakah Anda yakin ingin mencabut sertifikat ini? Aksi ini akan membuat sertifikat menjadi tidak valid.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/revoke`, {
        method: 'PATCH',
      })

      if (res.ok) {
        toast.success('Sertifikat berhasil dicabut')
        fetchCertificates()
      } else {
        toast.error('Gagal mencabut sertifikat')
      }
    } catch (error) {
      console.error('Failed to revoke certificate:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleRestore = async (certificateId: string) => {
    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/restore`, {
        method: 'PATCH',
      })

      if (res.ok) {
        toast.success('Sertifikat berhasil dipulihkan')
        fetchCertificates()
      } else {
        toast.error('Gagal memulihkan sertifikat')
      }
    } catch (error) {
      console.error('Failed to restore certificate:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDownload = (certificateId: string) => {
    window.open(`/api/certificates/${certificateId}/download`, '_blank')
  }

  const handleVerify = (certNumber: string) => {
    window.open(`/certificates/verify/${certNumber}`, '_blank')
  }

  const handleRegenerate = async (certificateId: string) => {
    if (!confirm('Regenerate PDF sertifikat ini? PDF lama akan ditimpa dengan yang baru.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/regenerate`, {
        method: 'PATCH',
      })

      if (res.ok) {
        toast.success('PDF sertifikat berhasil di-regenerate')
        fetchCertificates()
      } else {
        toast.error('Gagal regenerate PDF sertifikat')
      }
    } catch (error) {
      console.error('Failed to regenerate certificate:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleResendEmail = async (certificateId: string) => {
    try {
      const res = await fetch(`/api/certificates/${certificateId}/resend-email`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Email sertifikat berhasil dikirim ulang')
      } else {
        toast.error('Gagal mengirim email')
      }
    } catch (error) {
      console.error('Failed to resend email:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleIssueManual = async () => {
    if (!selectedUserId || !selectedCourseId) {
      toast.error('Pilih user dan course terlebih dahulu')
      return
    }

    try {
      setLoadingIssue(true)
      const res = await fetch('/api/admin/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          courseId: selectedCourseId,
          sendEmail: sendEmailOnIssue
        })
      })

      if (res.ok) {
        toast.success('Sertifikat berhasil diterbitkan secara manual')
        setShowIssueDialog(false)
        setSelectedUserId('')
        setSelectedCourseId('')
        fetchCertificates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menerbitkan sertifikat')
      }
    } catch (error) {
      console.error('Failed to issue certificate:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoadingIssue(false)
    }
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') {
      params.append('isValid', (statusFilter === 'valid').toString())
    }
    window.open(`/api/admin/certificates/export?${params.toString()}`, '_blank')
    toast.success('Exporting certificates to CSV...')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStats = () => {
    const total = certificates.length
    const valid = certificates.filter(c => c.isValid).length
    const invalid = total - valid
    const thisMonth = certificates.filter(c => {
      const date = new Date(c.issuedAt)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length

    return { total, valid, invalid, thisMonth }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data sertifikat...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelola Sertifikat</h1>
          <p className="text-muted-foreground">Pantau dan kelola semua sertifikat yang diterbitkan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowIssueDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Issue Manual
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sertifikat</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Semua sertifikat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sertifikat Valid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.valid}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif dan terverifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dicabut</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invalid}</div>
            <p className="text-xs text-muted-foreground mt-1">Tidak valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Sertifikat baru</p>
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
                placeholder="Cari nama siswa, email, kursus, atau nomor sertifikat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Dicabut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kursus</TableHead>
                  <TableHead>Nomor Sertifikat</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                  <TableHead>Diterbitkan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Tidak ada sertifikat ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {cert.user.avatar ? (
                              <img src={cert.user.avatar} alt={cert.user.name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{cert.studentName}</p>
                            <p className="text-sm text-muted-foreground">{cert.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="line-clamp-2">{cert.courseName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {cert.certificateNumber}
                        </code>
                      </TableCell>
                      <TableCell>{formatDate(cert.completionDate)}</TableCell>
                      <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                      <TableCell>
                        {cert.isValid ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Dicabut
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(cert.id)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVerify(cert.certificateNumber)}
                            title="Verifikasi"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRegenerate(cert.id)}
                            title="Regenerate PDF"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResendEmail(cert.id)}
                            title="Resend Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          {cert.isValid ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevoke(cert.id)}
                              title="Cabut Sertifikat"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRestore(cert.id)}
                              title="Pulihkan Sertifikat"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manual Issue Certificate Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Certificate Manual</DialogTitle>
            <DialogDescription>
              Terbitkan sertifikat secara manual untuk user tertentu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih User *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pilih Course *</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmailOnIssue}
                onChange={(e) => setSendEmailOnIssue(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="sendEmail" className="font-normal">
                Kirim email notifikasi ke user
              </Label>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Jika user belum enrolled di course ini, 
                sistem akan otomatis membuat enrollment dengan status completed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
              disabled={loadingIssue}
            >
              Batal
            </Button>
            <Button
              onClick={handleIssueManual}
              disabled={loadingIssue || !selectedUserId || !selectedCourseId}
            >
              {loadingIssue ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Issue Certificate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
