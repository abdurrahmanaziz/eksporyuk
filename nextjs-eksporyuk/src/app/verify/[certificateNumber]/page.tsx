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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-green-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center text-3xl">
            Certificate Verified ✓
          </CardTitle>
          <p className="text-center text-green-100 mt-2">
            This is an authentic certificate issued by EksporYuk
          </p>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Certificate Badge */}
          <div className="flex justify-center">
            <Badge className="text-lg px-6 py-2 bg-green-600">
              <Award className="w-5 h-5 mr-2" />
              Verified Certificate
            </Badge>
          </div>

          {/* Certificate Details */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4 text-lg">
                Certificate Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-semibold text-lg">{cert.studentName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Course Title</p>
                    <p className="font-semibold text-lg">{cert.courseName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Date</p>
                    <p className="font-semibold">
                      {new Date(cert.completionDate).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Number</p>
                    <p className="font-mono font-semibold">{cert.certificateNumber}</p>
                  </div>
                </div>

                {cert.duration && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Course Duration</p>
                      <p className="font-semibold">
                        {Math.floor(cert.duration / 60)} hours {cert.duration % 60} minutes
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                    <p className="font-semibold">{cert.instructor}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issued By */}
            <div className="text-center py-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Issued By</p>
              <div className="flex items-center justify-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                <p className="text-xl font-bold text-primary">EksporYuk</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Empowering Indonesian Exporters
              </p>
            </div>

            {/* Info Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <span className="font-semibold">Note:</span> This certificate can be verified at any time using the certificate number above.
                Any discrepancies should be reported immediately.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-4">
            <Link href="/courses" className="flex-1">
              <Button className="w-full" size="lg">
                Explore Our Courses
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
