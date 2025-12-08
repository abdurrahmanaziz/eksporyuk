import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Award,
  Download,
  Share2,
  CheckCircle,
  Calendar,
  BookOpen,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const certificates = await prisma.certificate.findMany({
    where: {
      userId: session.user.id,
      isValid: true
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          slug: true,
          duration: true,
          mentor: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      issuedAt: 'desc'
    }
  })

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-600" />
              My Certificates
            </h1>
            <p className="text-muted-foreground mt-2">
              View and download your course completion certificates
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
          </Badge>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete courses to earn certificates!
              </p>
              <Link href="/courses">
                <Button>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600">
                    {cert.course.thumbnail ? (
                      <Image
                        src={cert.course.thumbnail}
                        alt={cert.courseName}
                        fill
                        className="object-cover opacity-20"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Award className="h-20 w-20 text-white opacity-90" />
                    </div>
                    <Badge className="absolute top-4 right-4 bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Course Title */}
                    <div>
                      <h3 className="font-bold text-lg line-clamp-2 mb-1">
                        {cert.courseName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cert.course.mentor?.user.name || 'EksporYuk'}
                      </p>
                    </div>

                    {/* Certificate Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        Issued: {new Date(cert.issuedAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Award className="w-4 h-4 mr-2" />
                        No: {cert.certificateNumber}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {cert.pdfUrl && (
                        <Button asChild className="flex-1">
                          <a href={cert.pdfUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" asChild>
                        <Link href={`/verify/${cert.certificateNumber}`} target="_blank">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Verify
                        </Link>
                      </Button>
                    </div>

                    {/* Share Button */}
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => {
                        const url = `${window.location.origin}/verify/${cert.certificateNumber}`
                        navigator.clipboard.writeText(url)
                        // TODO: Add toast notification
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">
                  About Your Certificates
                </p>
                <p className="text-sm text-blue-800">
                  All certificates are digitally signed and can be verified using the certificate number. 
                  Share your achievements on LinkedIn or other professional networks!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
