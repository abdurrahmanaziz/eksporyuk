import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { redirect } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Award,
  BookOpen,
  Info,
  Shield,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { CertificateCard } from '@/components/certificates/CertificateCard'

export const dynamic = 'force-dynamic'

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Fetch certificates with manual joins (no relations in schema)
  const certificates = await prisma.certificate.findMany({
    where: {
      userId: session.user.id,
      isValid: true
    },
    orderBy: {
      issuedAt: 'desc'
    }
  })

  // Fetch related course data
  const courseIds = [...new Set(certificates.map(c => c.courseId))]
  const courses = courseIds.length > 0 ? await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      mentorId: true
    }
  }) : []

  // Fetch mentor names
  const mentorIds = courses.map(c => c.mentorId).filter(Boolean) as string[]
  const mentors = mentorIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: mentorIds } },
    select: { id: true, name: true }
  }) : []

  // Map data
  const courseMap = new Map(courses.map(c => [c.id, c]))
  const mentorMap = new Map(mentors.map(m => [m.id, m]))

  const certificatesWithData = certificates.map(cert => {
    const course = courseMap.get(cert.courseId)
    const mentor = course?.mentorId ? mentorMap.get(course.mentorId) : null
    return {
      ...cert,
      course: course ? {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        mentor: mentor ? { name: mentor.name } : null
      } : null
    }
  })

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                Sertifikat Saya
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Lihat dan unduh sertifikat penyelesaian kursus Anda
              </p>
            </div>
            <Badge variant="outline" className="text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 self-start sm:self-auto">
              {certificates.length} Sertifikat
            </Badge>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="certificates" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="certificates" className="text-xs sm:text-sm">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Sertifikat
              </TabsTrigger>
              <TabsTrigger value="verify" className="text-xs sm:text-sm">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Verifikasi
              </TabsTrigger>
            </TabsList>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="mt-4 sm:mt-6">
              {certificates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 sm:py-16 text-center">
                    <Award className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Belum Ada Sertifikat</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                      Selesaikan kursus untuk mendapatkan sertifikat penyelesaian!
                    </p>
                    <Link href="/courses">
                      <Button className="h-9 sm:h-10 text-sm sm:text-base">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Jelajahi Kursus
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {certificatesWithData.map((cert) => (
                    <CertificateCard 
                      key={cert.id} 
                      certificate={cert}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Verify Tab */}
            <TabsContent value="verify" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="py-8 sm:py-12">
                  <div className="text-center max-w-lg mx-auto">
                    <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Verifikasi Sertifikat</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                      Masukkan nomor sertifikat untuk memverifikasi keasliannya.
                      Sertifikat EksporYuk dilengkapi dengan sistem verifikasi digital.
                    </p>
                    
                    <form 
                      action="/verify" 
                      method="GET" 
                      className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto"
                    >
                      <input
                        type="text"
                        name="number"
                        placeholder="Contoh: CERT-2025-000001"
                        className="flex-1 h-10 sm:h-11 px-4 rounded-lg border border-input bg-background text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Button type="submit" className="h-10 sm:h-11">
                        <Search className="w-4 h-4 mr-2" />
                        Verifikasi
                      </Button>
                    </form>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                      Atau kunjungi langsung:{' '}
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">
                        eksporyuk.com/verify/[nomor-sertifikat]
                      </code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Box */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-4 sm:py-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">
                    Tentang Sertifikat Anda
                  </p>
                  <p className="text-xs sm:text-sm text-blue-800">
                    Semua sertifikat ditandatangani secara digital dan dapat diverifikasi menggunakan nomor sertifikat. 
                    Bagikan pencapaian Anda di LinkedIn atau jaringan profesional lainnya!
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
