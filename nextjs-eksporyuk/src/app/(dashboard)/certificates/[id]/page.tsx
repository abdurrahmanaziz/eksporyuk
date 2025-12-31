'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Award, Calendar, CheckCircle, ExternalLink, Download, Share2, Printer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Certificate = {
  id: string
  certificateNumber: string
  studentName: string
  courseName: string
  completedAt: string
  issuedAt: string
  verificationUrl: string
  course: {
    title: string
    slug: string
    thumbnail?: string
  }
  certificateTemplate?: {
    backgroundColor: string
    primaryColor: string
    secondaryColor: string | null
    textColor: string
    layout: string
    showLogo: boolean
    showSignature: boolean
    showQrCode: boolean
    showBorder: boolean
    fontFamily: string
  }
}

export default function CertificateDetailPage() {
  const params = useParams()
  const certificateId = params?.id as string
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCertificate()
  }, [certificateId])

  const fetchCertificate = async () => {
    try {
      const res = await fetch(`/api/certificates/${certificateId}`)
      if (res.ok) {
        const data = await res.json()
        setCertificate(data.certificate)
      } else {
        toast.error('Sertifikat tidak ditemukan')
      }
    } catch (error) {
      console.error('Error fetching certificate:', error)
      toast.error('Gagal memuat sertifikat')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (!certificate) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sertifikat ${certificate.courseName}`,
          text: `Saya telah menyelesaikan kursus ${certificate.courseName}!`,
          url: certificate.verificationUrl
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(certificate.verificationUrl)
      toast.success('Link sertifikat disalin!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sertifikat...</p>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sertifikat Tidak Ditemukan
          </h3>
          <p className="text-gray-600 mb-6">
            Sertifikat yang Anda cari tidak tersedia
          </p>
          <Link href="/dashboard/certificates">
            <Button>Kembali ke Sertifikat</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Actions - Print Hidden */}
      <div className="mb-6 print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/certificates">
          <Button variant="outline">
            ← Kembali
          </Button>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Bagikan</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Cetak</span>
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Certificate Card */}
      <Card className="overflow-hidden shadow-2xl">
        <div 
          className="relative p-6 sm:p-10 md:p-16"
          style={{
            backgroundColor: certificate.certificateTemplate?.backgroundColor || '#FFFFFF',
            color: certificate.certificateTemplate?.textColor || '#1F2937',
            borderBottom: certificate.certificateTemplate?.showBorder 
              ? `4px solid ${certificate.certificateTemplate.primaryColor}` 
              : 'none'
          }}
        >
          {/* Decorative Background */}
          {!certificate.certificateTemplate && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
                }} />
              </div>
            </div>
          )}

          <div className="relative z-10 text-center space-y-6">
            {/* Logo/Icon */}
            {(certificate.certificateTemplate?.showLogo ?? true) && (
              <div className="flex justify-center">
                <div 
                  className="w-20 h-20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: certificate.certificateTemplate 
                      ? `${certificate.certificateTemplate.primaryColor}20`
                      : 'rgba(255,255,255,0.2)'
                  }}
                >
                  <Award 
                    className="w-12 h-12"
                    style={{
                      color: certificate.certificateTemplate?.primaryColor || '#FFFFFF'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <h1 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
                style={{
                  fontFamily: certificate.certificateTemplate?.fontFamily || 'inherit',
                  color: certificate.certificateTemplate?.primaryColor || (certificate.certificateTemplate ? 'inherit' : '#FFFFFF')
                }}
              >
                CERTIFICATE OF COMPLETION
              </h1>
              <p 
                className="text-sm sm:text-base md:text-lg"
                style={{
                  opacity: certificate.certificateTemplate ? 0.75 : 0.9,
                  color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                }}
              >
                This is to certify that
              </p>
            </div>

            {/* Student Name */}
            <div className="py-2 sm:py-4">
              <p 
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4"
                style={{
                  fontFamily: certificate.certificateTemplate?.fontFamily || 'inherit',
                  color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                }}
              >
                {certificate.studentName}
              </p>
              <div 
                className="w-48 h-1 mx-auto"
                style={{
                  backgroundColor: certificate.certificateTemplate 
                    ? `${certificate.certificateTemplate.primaryColor}50`
                    : 'rgba(255,255,255,0.5)'
                }}
              ></div>
            </div>

            {/* Achievement */}
            <div className="max-w-2xl mx-auto">
              <p 
                className="text-base sm:text-lg md:text-xl mb-2"
                style={{
                  opacity: certificate.certificateTemplate ? 0.75 : 0.9,
                  color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                }}
              >
                has successfully completed
              </p>
              <p 
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6"
                style={{
                  fontFamily: certificate.certificateTemplate?.fontFamily || 'inherit',
                  color: certificate.certificateTemplate?.primaryColor || (certificate.certificateTemplate ? 'inherit' : '#FFFFFF')
                }}
              >
                {certificate.courseName}
              </p>
              <p 
                className="text-sm sm:text-base md:text-lg"
                style={{
                  opacity: certificate.certificateTemplate ? 0.75 : 0.9,
                  color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                }}
              >
                with dedication and commitment to learning
              </p>
            </div>

            {/* Date & Certificate Number */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 gap-4 sm:gap-0">
              <div className="text-center sm:text-left">
                <p 
                  className="text-xs sm:text-sm mb-1"
                  style={{ 
                    opacity: certificate.certificateTemplate ? 0.6 : 0.75,
                    color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                  }}
                >
                  Completion Date
                </p>
                <p 
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF' }}
                >
                  {new Date(certificate.completedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p 
                  className="text-xs sm:text-sm mb-1"
                  style={{ 
                    opacity: certificate.certificateTemplate ? 0.6 : 0.75,
                    color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                  }}
                >
                  Certificate Number
                </p>
                <p 
                  className="text-base sm:text-lg font-mono font-semibold"
                  style={{ color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF' }}
                >
                  {certificate.certificateNumber}
                </p>
              </div>
            </div>

            {/* Signatures */}
            {(certificate.certificateTemplate?.showSignature ?? true) && (
              <div className="flex flex-col sm:flex-row justify-around mt-8 sm:mt-12 pt-6 sm:pt-8 gap-6 sm:gap-0">
                <div className="text-center">
                  <div 
                    className="border-t-2 pt-2 px-8 mb-2"
                    style={{
                      borderColor: certificate.certificateTemplate?.primaryColor || (certificate.certificateTemplate ? 'currentColor' : 'rgba(255,255,255,0.5)')
                    }}
                  ></div>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF' }}
                  >
                    Instructor
                  </p>
                </div>
                <div className="text-center">
                  <div 
                    className="border-t-2 pt-2 px-8 mb-2"
                    style={{
                      borderColor: certificate.certificateTemplate?.primaryColor || (certificate.certificateTemplate ? 'currentColor' : 'rgba(255,255,255,0.5)')
                    }}
                  ></div>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF' }}
                  >
                    Director
                  </p>
                </div>
              </div>
            )}

            {/* QR Code Placeholder */}
            {(certificate.certificateTemplate?.showQrCode ?? true) && (
              <div className="absolute bottom-4 right-4">
                <div 
                  className="text-xs"
                  style={{
                    opacity: certificate.certificateTemplate ? 0.5 : 0.7,
                    color: certificate.certificateTemplate ? 'inherit' : '#FFFFFF'
                  }}
                >
                  [QR Code]
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Section - Print Hidden */}
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 print:hidden">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Sertifikat Terverifikasi
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Sertifikat ini telah diverifikasi dan dapat dicek keasliannya
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 mr-1" />
                  Diterbitkan {new Date(certificate.issuedAt).toLocaleDateString('id-ID')}
                </Badge>
                <Link href={certificate.verificationUrl || `/verify/${certificate.certificateNumber}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Verifikasi Online
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Info - Print Hidden */}
      <Card className="mt-4 sm:mt-6 p-4 sm:p-6 print:hidden">
        <h3 className="font-semibold text-base sm:text-lg mb-4">Tentang Kursus</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {certificate.course.thumbnail && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={certificate.course.thumbnail} 
                alt={certificate.course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {certificate.course.title}
            </h4>
            {certificate.course.slug && (
              <Link href={`/learn/${certificate.course.slug}`}>
                <Button variant="link" className="p-0 h-auto">
                  Lihat Kursus →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}
