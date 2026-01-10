'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Award,
  Download,
  Share2,
  CheckCircle,
  Calendar,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

interface CertificateCardProps {
  certificate: {
    id: string
    certificateNumber: string
    courseName: string
    studentName: string
    issuedAt: Date | string
    completionDate: Date | string
    pdfUrl: string | null
    isValid: boolean
    course?: {
      id: string
      title: string
      thumbnail: string | null
      mentor?: {
        name: string
      } | null
    } | null
  }
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/verify/${certificate.certificateNumber}`
    
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link sertifikat berhasil disalin!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success('Link sertifikat berhasil disalin!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank')
    } else {
      // Generate PDF on-the-fly
      window.open(`/api/certificates/${certificate.id}/download`, '_blank')
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="p-0">
        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
          {certificate.course?.thumbnail && (
            <Image
              src={certificate.course.thumbnail}
              alt={certificate.courseName}
              fill
              className="object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Award className="h-16 w-16 sm:h-20 sm:w-20 text-white/90 mx-auto mb-2" />
              <p className="text-white/80 text-xs sm:text-sm font-medium">Certificate of Completion</p>
            </div>
          </div>
          <Badge className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Course Title */}
          <div>
            <h3 className="font-bold text-base sm:text-lg line-clamp-2 mb-1">
              {certificate.courseName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {certificate.course?.mentor?.name || 'EksporYuk Team'}
            </p>
          </div>

          {/* Certificate Info */}
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                Diterbitkan: {new Date(certificate.issuedAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate font-mono text-xs">{certificate.certificateNumber}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              onClick={handleDownload}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Link href={`/verify/${certificate.certificateNumber}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Verifikasi
              </Link>
            </Button>
          </div>

          {/* Share Button */}
          <Button 
            variant="ghost" 
            className="w-full h-9 sm:h-10 text-xs sm:text-sm"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-600" />
                Link Disalin!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Bagikan Sertifikat
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
