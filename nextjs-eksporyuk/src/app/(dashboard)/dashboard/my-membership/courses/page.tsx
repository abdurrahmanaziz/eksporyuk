'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { getRoleTheme } from '@/lib/role-themes'
import MemberOnboardingChecklist from '@/components/member/MemberOnboardingChecklist'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  Clock,
  Users,
  PlayCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Crown,
  GraduationCap,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type MembershipCourse = {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  description: string | null
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  totalModules: number
  totalLessons: number
  totalDuration: number
  enrollmentCount: number
  instructor: {
    id: string
    name: string
    avatar: string | null
  } | null
  userProgress?: {
    progress: number
    completedLessons: number
    lastAccessedAt: string | null
  }
  isEnrolled: boolean
}

type MembershipInfo = {
  id: string
  name: string
  isActive: boolean
  endDate: string | null
}

export default function MembershipCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<MembershipCourse[]>([])
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('MEMBER_FREE')

  useEffect(() => {
    if (status === 'authenticated') {
      checkProfileAndFetchCourses()
    }
  }, [status])

  const checkProfileAndFetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)

      // First check profile completion
      const profileRes = await fetch('/api/member/onboarding')
      const profileData = await profileRes.json()
      
      if (profileData.success) {
        setProfileComplete(profileData.data.profileCompleted)
        
        // If profile not complete, don't fetch courses
        if (!profileData.data.profileCompleted) {
          setLoading(false)
          return
        }
      }

      // Fetch courses if profile is complete
      const res = await fetch('/api/user/membership/courses')
      const data = await res.json()

      if (res.ok) {
        setCourses(data.courses || [])
        setMembership(data.membership || null)
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch (err) {
      console.error('Error fetching membership courses:', err)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const getLevelBadge = (level: string) => {
    const levels = {
      BEGINNER: { label: 'Pemula', color: 'bg-green-100 text-green-700' },
      INTERMEDIATE: { label: 'Menengah', color: 'bg-yellow-100 text-yellow-700' },
      ADVANCED: { label: 'Lanjutan', color: 'bg-red-100 text-red-700' },
    }
    return levels[level as keyof typeof levels] || levels.BEGINNER
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} menit`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.primary }}></div>
            <p className="text-gray-600">Memuat kursus membership...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  // Profile not complete - show checklist
  if (profileComplete === false) {
    return (
      <ResponsivePageWrapper>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-7 h-7" style={{ color: theme.primary }} />
              Kursus Membership
            </h1>
            <p className="text-gray-600 mt-1">
              Akses kursus eksklusif dari paket membership Anda
            </p>
          </div>
          
          <MemberOnboardingChecklist variant="alert" />
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-8">
              <div className="text-center">
                <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Profil Belum Lengkap
                </h3>
                <p className="text-gray-600 mb-4">
                  Lengkapi profil Anda terlebih dahulu untuk mengakses kursus membership
                </p>
                <Link href="/dashboard/complete-profile">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Lengkapi Profil Sekarang
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/dashboard/my-membership" className="text-gray-500 hover:text-gray-700 text-sm">
                My Membership
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 text-sm font-medium">Kursus</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-7 h-7" style={{ color: theme.primary }} />
              Kursus Membership
            </h1>
            <p className="text-gray-600 mt-1">
              Akses kursus eksklusif dari paket membership Anda
            </p>
          </div>

          {membership && (
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200">
              <Crown className="w-5 h-5" style={{ color: theme.primary }} />
              <div>
                <p className="text-sm font-medium text-gray-900">{membership.name}</p>
                <p className="text-xs text-gray-500">
                  {membership.isActive ? (
                    membership.endDate ? (
                      `Aktif hingga ${new Date(membership.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    ) : (
                      'Lifetime Access'
                    )
                  ) : (
                    <span className="text-red-500">Tidak Aktif</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{typeof error === 'string' ? error : String(error)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Membership */}
        {!membership && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Membership Aktif
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Anda belum memiliki membership aktif. Upgrade sekarang untuk mendapatkan akses ke kursus eksklusif.
              </p>
              <Link href="/dashboard/upgrade">
                <Button style={{ backgroundColor: theme.primary }}>
                  <Crown className="w-4 h-4 mr-2" />
                  Lihat Paket Membership
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Membership Expired */}
        {membership && !membership.isActive && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Membership Anda Sudah Berakhir</p>
                    <p className="text-sm text-yellow-700">Perpanjang membership untuk mengakses kursus</p>
                  </div>
                </div>
                <Link href="/dashboard/upgrade">
                  <Button variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                    Perpanjang Sekarang
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Stats */}
        {membership && courses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
                    <BookOpen className="w-5 h-5" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                    <p className="text-xs text-gray-500">Total Kursus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter(c => c.userProgress && c.userProgress.progress === 100).length}
                    </p>
                    <p className="text-xs text-gray-500">Selesai</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter(c => c.isEnrolled && c.userProgress && c.userProgress.progress > 0 && c.userProgress.progress < 100).length}
                    </p>
                    <p className="text-xs text-gray-500">Sedang Dipelajari</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {courses.filter(c => !c.isEnrolled || !c.userProgress || c.userProgress.progress === 0).length}
                    </p>
                    <p className="text-xs text-gray-500">Belum Mulai</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Courses */}
        {membership && courses.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Kursus
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Paket membership Anda belum memiliki kursus terkait. Jelajahi kursus lainnya di katalog.
              </p>
              <Link href="/courses">
                <Button variant="outline">
                  Jelajahi Kursus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const level = getLevelBadge(course.level)
              const progress = course.userProgress?.progress || 0
              const isLocked = !membership?.isActive

              return (
                <Card key={course.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${isLocked ? 'opacity-75' : ''}`}>
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: theme.primary + '20' }}>
                        <BookOpen className="w-12 h-12" style={{ color: theme.primary }} />
                      </div>
                    )}
                    
                    {/* Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Membership Expired</p>
                        </div>
                      </div>
                    )}

                    {/* Progress Badge */}
                    {!isLocked && progress > 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge className={progress === 100 ? 'bg-green-500' : 'bg-blue-500'}>
                          {progress === 100 ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Selesai
                            </>
                          ) : (
                            `${progress}%`
                          )}
                        </Badge>
                      </div>
                    )}

                    {/* Level Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={level.color}>{level.label}</Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Title & Description */}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Instructor */}
                    {course.instructor && (
                      <div className="flex items-center gap-2 mb-3">
                        {course.instructor.avatar ? (
                          <Image
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            {course.instructor.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-gray-600">{course.instructor.name}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.totalModules} Modul</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{course.totalLessons} Pelajaran</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(course.totalDuration)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!isLocked && course.isEnrolled && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Action Button */}
                    {isLocked ? (
                      <Link href="/dashboard/upgrade">
                        <Button variant="outline" className="w-full" size="sm">
                          Perpanjang Membership
                        </Button>
                      </Link>
                    ) : course.isEnrolled ? (
                      <Link href={`/learn/${course.slug}`}>
                        <Button className="w-full" size="sm" style={{ backgroundColor: theme.primary }}>
                          {progress === 0 ? 'Mulai Belajar' : progress === 100 ? 'Review Kursus' : 'Lanjutkan'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/courses/${course.slug}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          Lihat Detail
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {membership && membership.isActive && courses.length > 0 && (
          <Card className="border-0 shadow-lg" style={{ backgroundColor: theme.primary + '10' }}>
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Ingin lebih banyak kursus?</h3>
                    <p className="text-sm text-gray-600">Jelajahi katalog kursus lengkap kami</p>
                  </div>
                </div>
                <Link href="/courses">
                  <Button variant="outline">
                    Jelajahi Katalog
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
