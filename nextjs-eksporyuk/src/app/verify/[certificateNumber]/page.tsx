'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  User,
  BookOpen,
  Clock,
  Loader2,
  Download,
  Share2,
  Home
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface CertificateVerification {
  valid: boolean
  message?: string
  certificate?: {
    id: string
    certificateNumber: string
    studentName: string
    courseName: string
    completedAt: string
    completionDate: string
    issuedAt: string
    isValid: boolean
    pdfUrl?: string | null
    user: {
      name: string
      image: string | null
    }
    course: {
      title: string
      thumbnail?: string | null
      duration?: number | null
      mentor: {
        user: {
          name: string
        }
      }
    }
  }
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const certificateNumber = params?.certificateNumber as string

  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<CertificateVerification | null>(null)

  useEffect(() => {
    if (certificateNumber) {
      verifyCertificate()
    }
  }, [certificateNumber])

  const verifyCertificate = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/certificates/verify/${certificateNumber}`)
      const data = await res.json()
      setVerification(data)
    } catch (error) {
      console.error('Verification error:', error)
      setVerification({
        valid: false,
        message: 'Failed to verify certificate'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 sm:py-16 text-center">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Memverifikasi sertifikat...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verification || !verification.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              Sertifikat Tidak Valid
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm sm:text-base text-muted-foreground">
              {verification?.message || 'Sertifikat tidak dapat diverifikasi.'}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-900">
                Nomor Sertifikat: <span className="font-mono font-semibold break-all">{certificateNumber}</span>
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="h-9 sm:h-10 text-sm sm:text-base">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cert = verification.certificate!
  const instructor = cert.course?.mentor?.user?.name || 'EksporYuk Team'

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Sertifikat ${cert.courseName}`,
          text: `${cert.studentName} telah menyelesaikan kursus ${cert.courseName}`,
          url: url
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link berhasil disalin!')
      }
    } catch (err) {
      await navigator.clipboard.writeText(url)
      toast.success('Link berhasil disalin!')
    }
  }

  const handleDownload = () => {
    if (cert.pdfUrl) {
      window.open(cert.pdfUrl, '_blank')
    } else {
      window.open(`/api/certificates/${cert.id}/download`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-3xl border-green-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sm:p-6">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="bg-white rounded-full p-3 sm:p-4">
              <CheckCircle className="h-10 w-10 sm:h-16 sm:w-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center text-xl sm:text-3xl">
            Sertifikat Terverifikasi ✓
          </CardTitle>
          <p className="text-center text-green-100 mt-2 text-xs sm:text-sm">
            Sertifikat ini asli dan diterbitkan oleh EksporYuk
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Certificate Badge */}
          <div className="flex justify-center">
            <Badge className="text-sm sm:text-lg px-4 sm:px-6 py-1.5 sm:py-2 bg-green-600">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              Sertifikat Valid
            </Badge>
          </div>

          {/* Certificate Details */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <h3 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-base sm:text-lg">
                Detail Sertifikat
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Nama Peserta</p>
                    <p className="font-semibold text-sm sm:text-lg truncate">{cert.studentName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Judul Kursus</p>
                    <p className="font-semibold text-sm sm:text-lg">{cert.courseName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Tanggal Penyelesaian</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {new Date(cert.completionDate || cert.completedAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Nomor Sertifikat</p>
                    <p className="font-mono font-semibold text-xs sm:text-sm break-all">{cert.certificateNumber}</p>
                  </div>
                </div>

                {cert.course?.duration && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Durasi Kursus</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {Math.floor(cert.course.duration / 60)} jam {cert.course.duration % 60} menit
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 sm:gap-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Instruktur</p>
                    <p className="font-semibold text-sm sm:text-base">{instructor}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issued By */}
            <div className="text-center py-3 sm:py-4 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Diterbitkan Oleh</p>
              <div className="flex items-center justify-center gap-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <p className="text-lg sm:text-xl font-bold text-primary">EksporYuk</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Empowering Indonesian Exporters
              </p>
            </div>

            {/* Info Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-yellow-900">
                <span className="font-semibold">Catatan:</span> Sertifikat ini dapat diverifikasi kapan saja menggunakan nomor sertifikat di atas.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button 
              onClick={handleDownload}
              className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="h-10 sm:h-11 text-sm sm:text-base"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
            <Link href="/courses" className="sm:flex-1">
              <Button variant="secondary" className="w-full h-10 sm:h-11 text-sm sm:text-base">
                <BookOpen className="w-4 h-4 mr-2" />
                Jelajahi Kursus
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
