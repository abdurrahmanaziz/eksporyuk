'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  BookOpen, 
  Users, 
  Star, 
  CheckCircle, 
  Play,
  Award,
  Target,
  Calendar
} from 'lucide-react'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  thumbnail?: string
  level?: string
  duration?: number
  isPublished: boolean
}

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null)

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!resolvedParams?.slug) return
      
      try {
        setLoading(true)
        
        // Try by slug first
        let response = await fetch(`/api/courses?slug=${resolvedParams.slug}`)
        let data = await response.json()
        
        // If not found by slug, try by ID (backward compatibility)
        if (!data.courses || data.courses.length === 0) {
          response = await fetch(`/api/courses/${resolvedParams.slug}`)
          if (response.ok) {
            const courseData = await response.json()
            data = { courses: [courseData] }
          }
        }
        
        if (data.courses && data.courses.length > 0) {
          setCourse(data.courses[0])
        } else {
          console.error('Course not found')
        }
      } catch (error) {
        console.error('Error fetching course:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [resolvedParams])

  const handleEnrollNow = async () => {
    if (!course) return
    
    // Jika course gratis dan user sudah login, langsung enroll
    if (course.price === 0 && session?.user) {
      setEnrolling(true)
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'COURSE',
            courseId: course.id,
            amount: 0,
            customerInfo: {
              name: session.user.name || '',
              email: session.user.email || '',
              phone: '',
              whatsapp: '',
            },
            paymentMethod: 'free',
            paymentChannel: 'FREE',
          }),
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Redirect ke dashboard atau success page
          router.push(`/dashboard?enrolled=${course.slug}`)
        } else {
          console.error('Enrollment failed:', data.error)
          // Fallback ke checkout page
          router.push(`/checkout/course/${course.slug}`)
        }
      } catch (error) {
        console.error('Enrollment error:', error)
        // Fallback ke checkout page
        router.push(`/checkout/course/${course.slug}`)
      } finally {
        setEnrolling(false)
      }
    } else {
      // Course berbayar atau user belum login - ke checkout
      router.push(`/checkout/course/${course.slug}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kursus...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kursus Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-4">Kursus yang Anda cari tidak tersedia.</p>
          <Button onClick={() => window.history.back()}>Kembali</Button>
        </div>
      </div>
    )
  }

  const discount = course.originalPrice && course.price < course.originalPrice 
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {course.level && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    {course.level === 'BEGINNER' ? 'Pemula' :
                     course.level === 'INTERMEDIATE' ? 'Menengah' :
                     course.level === 'ADVANCED' ? 'Lanjutan' : course.level}
                  </Badge>
                )}
                <Badge variant="outline" className="text-white border-white">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Kursus Online
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {course.description}
              </p>

              <div className="flex items-center gap-6 mb-8">
                {course.duration && (
                  <div className="flex items-center text-blue-100">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{course.duration} jam</span>
                  </div>
                )}
                <div className="flex items-center text-blue-100">
                  <Users className="w-5 h-5 mr-2" />
                  <span>100+ Siswa</span>
                </div>
                <div className="flex items-center text-blue-100">
                  <Award className="w-5 h-5 mr-2" />
                  <span>Sertifikat</span>
                </div>
              </div>


            </div>

            {/* Course Preview */}
            <div className="relative">
              <Card className="overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <BookOpen className="w-16 h-16 mx-auto mb-3" />
                      <h3 className="text-xl font-bold">{course.title}</h3>
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white/90 text-gray-900 hover:bg-white"
                    onClick={handleEnrollNow}
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Preview Kursus
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-600" />
                Yang Akan Anda Pelajari
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dasar-dasar ekspor yang solid</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Strategi pemasaran internasional</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dokumentasi ekspor lengkap</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Riset pasar dan kompetitor</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Negosiasi dengan buyer</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Logistik dan pengiriman</span>
                </div>
              </div>
            </Card>

            {/* Course Description */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tentang Kursus Ini</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed text-lg">
                  {course.description}
                </p>
                
                <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Siapa yang Cocok Mengikuti Kursus Ini?
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Pengusaha yang ingin mulai ekspor</li>
                  <li>• UMKM yang ingin go international</li>
                  <li>• Fresh graduate yang tertarik bidang ekspor</li>
                  <li>• Siapa saja yang ingin belajar bisnis ekspor</li>
                </ul>
              </div>
            </Card>

            {/* Course Features */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Fitur Kursus</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Materi Lengkap</h3>
                    <p className="text-gray-600 text-sm">Video HD, PDF, dan worksheet praktis</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Sertifikat</h3>
                    <p className="text-gray-600 text-sm">Sertifikat resmi setelah menyelesaikan kursus</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Komunitas</h3>
                    <p className="text-gray-600 text-sm">Akses ke komunitas eksportir Indonesia</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Akses Seumur Hidup</h3>
                    <p className="text-gray-600 text-sm">Belajar kapan saja, tanpa batas waktu</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Course Info */}
            <Card className="p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-4">Informasi Kursus</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Level</span>
                  <span className="font-medium">
                    {course.level === 'BEGINNER' ? 'Pemula' :
                     course.level === 'INTERMEDIATE' ? 'Menengah' :
                     course.level === 'ADVANCED' ? 'Lanjutan' : course.level || 'Semua Level'}
                  </span>
                </div>
                {course.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durasi</span>
                    <span className="font-medium">{course.duration} jam</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Format</span>
                  <span className="font-medium">Video Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sertifikat</span>
                  <span className="font-medium">✅ Ya</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Akses</span>
                  <span className="font-medium">Seumur Hidup</span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-baseline gap-2 mb-4">
                  {course.price === 0 ? (
                    <span className="text-2xl font-bold text-green-600">GRATIS</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-blue-600">
                        Rp {course.price.toLocaleString('id-ID')}
                      </span>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span className="text-lg text-gray-400 line-through">
                          Rp {course.originalPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                <Button 
                  onClick={handleEnrollNow}
                  disabled={enrolling || status === 'loading'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {enrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mendaftarkan...
                    </>
                  ) : course.price === 0 ? (
                    session?.user ? 'Belajar Sekarang' : 'Login & Mulai Belajar'
                  ) : (
                    'Daftar & Bayar via Xendit'
                  )}
                </Button>
                
                {course.price > 0 && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    🔒 Pembayaran aman via Xendit (Transfer Bank, E-Wallet, Kartu Kredit)
                  </p>
                )}
                
                {/* Affiliate Partner Badge */}
                <AffiliatePartnerBadge className="mt-4" />
              </div>
            </Card>

            {/* Instructor Info */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Instruktur</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  EY
                </div>
                <div>
                  <h4 className="font-semibold">Ekspor Yuk Team</h4>
                  <p className="text-sm text-gray-600">Expert Ekspor</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Tim ahli dengan pengalaman 10+ tahun di bidang ekspor dan telah membantu 
                ratusan UMKM go international.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
