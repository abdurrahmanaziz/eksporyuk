'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, Search, Download, FileText, Users, 
  Calendar, Shield, CheckCircle, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

type Consent = {
  id: string
  agreedAt: string
  ipAddress: string | null
  user: {
    id: string
    name: string
    email: string
    memberCode: string | null
    phone: string | null
    whatsapp: string | null
    avatar: string | null
  }
}

type Course = {
  id: string
  title: string
  slug: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function CourseConsentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [consents, setConsents] = useState<Consent[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MENTOR') {
        router.push('/dashboard')
        return
      }
      fetchConsents()
    }
  }, [status, session, courseId])

  const fetchConsents = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })

      const response = await fetch(`/api/admin/courses/${courseId}/consents?${params}`)
      const data = await response.json()

      if (data.success) {
        setCourse(data.course)
        setConsents(data.consents)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Gagal memuat data')
      }
    } catch (error) {
      console.error('Error fetching consents:', error)
      toast.error('Gagal memuat data persetujuan')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchConsents(1)
  }

  const generatePdf = async () => {
    try {
      setGeneratingPdf(true)
      const response = await fetch(`/api/admin/courses/${courseId}/consents/pdf`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Generate PDF using the data
      const pdfData = data.pdfData

      // Create a simple HTML-based print view
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${pdfData.title} - ${pdfData.subtitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 14px; margin-bottom: 20px; color: #666; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
            .legal { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px; }
            .total { font-weight: bold; margin-top: 15px; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${pdfData.title}</h1>
            <h2>${pdfData.subtitle}</h2>
          </div>
          
          <div class="info">
            <p><strong>Mentor:</strong> ${pdfData.mentor}</p>
            <p><strong>Tanggal Generate:</strong> ${new Date(pdfData.generatedAt).toLocaleString('id-ID')}</p>
            <p><strong>Digenerate oleh:</strong> ${pdfData.generatedBy}</p>
            <p class="total"><strong>Total Peserta yang Menyetujui:</strong> ${pdfData.totalConsents} orang</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Kode Member</th>
                <th>Nama</th>
                <th>Email</th>
                <th>No. HP</th>
                <th>Tanggal Persetujuan</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${pdfData.consents.map((c: any) => `
                <tr>
                  <td>${c.no}</td>
                  <td>${c.memberCode}</td>
                  <td>${c.name}</td>
                  <td>${c.email}</td>
                  <td>${c.phone}</td>
                  <td>${new Date(c.agreedAt).toLocaleString('id-ID')}</td>
                  <td>${c.ipAddress}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="legal">
            <strong>⚖️ Keterangan Hukum:</strong><br/>
            ${pdfData.legalNotice}
          </div>

          <div class="footer">
            <p>Dokumen ini digenerate secara otomatis oleh sistem Ekspor Yuk pada ${new Date().toLocaleString('id-ID')}</p>
            <p>Halaman ini merupakan bukti elektronik yang sah sesuai UU ITE.</p>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
              🖨️ Cetak / Save as PDF
            </button>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(html)
      printWindow.document.close()

      toast.success('Dokumen berhasil digenerate')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Gagal generate dokumen')
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${courseId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-amber-600" />
              Daftar Persetujuan Hak Cipta
            </h1>
            {course && (
              <p className="text-muted-foreground mt-1">
                {course.title}
              </p>
            )}
          </div>
        </div>
        <Button 
          onClick={generatePdf} 
          disabled={generatingPdf || consents.length === 0}
          className="gap-2"
        >
          {generatingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Persetujuan</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Tercatat Elektronik
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dasar Hukum</p>
              <p className="text-sm font-medium">UU No. 28/2014</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email peserta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Cari</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Peserta</CardTitle>
          <CardDescription>
            Peserta yang telah menyetujui ketentuan Hak Cipta untuk mengakses materi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada peserta yang menyetujui</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Kode Member</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Tanggal Persetujuan</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((consent, index) => (
                    <TableRow key={consent.id}>
                      <TableCell className="font-medium">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{consent.user.name}</p>
                          <p className="text-sm text-muted-foreground">{consent.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {consent.user.memberCode || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {consent.user.phone || consent.user.whatsapp || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(consent.agreedAt).toLocaleString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {consent.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => fetchConsents(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchConsents(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
