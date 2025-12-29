'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getRoleTheme } from '@/lib/role-themes'
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Trophy,
  ChevronRight,
  Lock,
  Award,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// Helper function for duration display
const formatDuration = (totalSeconds: number | null | undefined): string => {
  if (!totalSeconds || totalSeconds <= 0) return ''
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (hours > 0) parts.push(`${hours} jam`)
  if (minutes > 0) parts.push(`${minutes} menit`)
  if (seconds > 0) parts.push(`${seconds} detik`)
  return parts.join(' ')
}

interface TrainingCourse {
  id: string
  title: string
  slug: string
  description: string
  thumbnail: string | null
  duration: number | null
  level: string | null
  modulesCount: number
  lessonsCount: number
  isEnrolled: boolean
  progress: number
  isCompleted: boolean
  hasCertificate: boolean
  isMainTraining: boolean
  isLearningMaterial: boolean
}

// Course Card Component
function CourseCard({ 
  course, 
  theme, 
  onEnroll, 
  isRequired 
}: { 
  course: TrainingCourse
  theme: { primary: string; secondary?: string }
  onEnroll: (courseId: string) => void
  isRequired: boolean
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Required Badge */}
        {isRequired && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-medium">
            Wajib
          </div>
        )}
        
        {/* Status Badge */}
        {course.isCompleted && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Selesai
          </div>
        )}
        {course.isEnrolled && !course.isCompleted && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-yellow-500 text-white text-xs font-medium">
            {course.progress}% Progress
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Level & Duration */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          {course.level && (
            <span className="px-2 py-1 bg-gray-100 rounded-lg capitalize">{course.level}</span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(course.duration)}
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span>{course.modulesCount} Modul</span>
          <span>{course.lessonsCount} Pelajaran</span>
        </div>

        {/* Progress Bar (if enrolled) */}
        {course.isEnrolled && !course.isCompleted && (
          <div className="mb-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${course.progress}%`,
                  backgroundColor: theme.primary
                }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {course.isEnrolled ? (
          <Link
            href={`/learn/${course.slug}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: theme.primary }}
          >
            <Play className="w-4 h-4" />
            {course.isCompleted ? 'Lihat Kembali' : 'Lanjutkan Belajar'}
          </Link>
        ) : (
          <button
            onClick={() => onEnroll(course.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <BookOpen className="w-4 h-4" />
            Mulai Belajar
          </button>
        )}

        {/* Certificate */}
        {course.hasCertificate && (
          <Link
            href="/dashboard/certificates"
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-700"
          >
            <Award className="w-4 h-4" />
            Lihat Sertifikat
          </Link>
        )}
      </div>
    </div>
  )
}

export default function AffiliateTrainingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([])
  const [learningMaterials, setLearningMaterials] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'training' | 'materials'>('training')

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTrainingCourses()
    }
  }, [status])

  const fetchTrainingCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/affiliate/training')
      const data = await response.json()
      
      if (response.ok) {
        setCourses(data.courses || [])
        setTrainingCourses(data.trainingCourses || [])
        setLearningMaterials(data.learningMaterials || [])
      } else {
        setError(data.error || 'Gagal memuat data')
      }
    } catch (err) {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const response = await fetch('/api/affiliate/training/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })

      if (response.ok) {
        fetchTrainingCourses()
      }
    } catch (err) {
      console.error('Error enrolling:', err)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: theme.primary }} />
          <p className="text-gray-600">Memuat panduan affiliate...</p>
        </div>
      </div>
    )
  }

  // Check if user is affiliate
  const isAffiliate = session?.user?.role === 'AFFILIATE' || 
                      session?.user?.role === 'ADMIN' ||
                      session?.user?.role === 'CO_FOUNDER' ||
                      session?.user?.role === 'FOUNDER'

  if (!isAffiliate) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h1>
            <p className="text-gray-600 mb-6">
              Panduan training ini hanya tersedia untuk affiliate. 
              Daftar sebagai affiliate untuk mengakses materi training eksklusif.
            </p>
            <Link
              href="/daftar-affiliate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-colors"
              style={{ backgroundColor: theme.primary }}
            >
              Daftar Jadi Affiliate
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <BookOpen className="w-7 h-7" style={{ color: theme.primary }} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Panduan Affiliate</h1>
          <p className="text-gray-600">Pelajari strategi dan tips sukses menjadi affiliate</p>
        </div>
        <Link
          href="/learn/training-affiliate"
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: theme.primary }}
        >
          <Play className="w-4 h-4" />
          Lihat di Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kursus</p>
              <p className="text-xl font-bold">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Selesai</p>
              <p className="text-xl font-bold">{courses.filter(c => c.isCompleted).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sedang Belajar</p>
              <p className="text-xl font-bold">{courses.filter(c => c.isEnrolled && !c.isCompleted).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sertifikat</p>
              <p className="text-xl font-bold">{courses.filter(c => c.hasCertificate).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Training Progress Banner */}
      {courses.length > 0 && courses.some(c => c.isEnrolled && !c.isCompleted) && (
        <div 
          className="rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary || theme.primary}dd)` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Lanjutkan Training Anda</h3>
              <p className="text-white/80 text-sm">
                Selesaikan semua materi untuk mendapatkan sertifikat Certified EksporYuk Affiliate
              </p>
            </div>
            <Trophy className="w-12 h-12 text-white/30" />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress Keseluruhan</span>
              <span>
                {Math.round(courses.filter(c => c.isEnrolled).reduce((acc, c) => acc + c.progress, 0) / Math.max(courses.filter(c => c.isEnrolled).length, 1))}%
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ 
                  width: `${courses.filter(c => c.isEnrolled).reduce((acc, c) => acc + c.progress, 0) / Math.max(courses.filter(c => c.isEnrolled).length, 1)}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setActiveTab('training')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'training' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Training Wajib ({trainingCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'materials' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Materi Belajar ({learningMaterials.length})
        </button>
      </div>

      {/* Course List - Training Wajib */}
      {activeTab === 'training' && (
        <>
          {trainingCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  theme={theme} 
                  onEnroll={handleEnroll}
                  isRequired={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">Belum Ada Training Wajib</p>
                <p className="text-gray-400 text-sm">
                  Materi training wajib akan segera tersedia
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Course List - Materi Belajar */}
      {activeTab === 'materials' && (
        <>
          {learningMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningMaterials.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  theme={theme} 
                  onEnroll={handleEnroll}
                  isRequired={false}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">Belum Ada Materi Belajar</p>
                <p className="text-gray-400 text-sm">
                  Materi pembelajaran tambahan akan segera tersedia
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Tentang Panduan Affiliate</h4>
            <p className="text-sm text-blue-700">
              Materi training ini dirancang khusus untuk membantu Anda sukses sebagai affiliate EksporYuk. 
              Selesaikan semua materi untuk mendapatkan sertifikat "Certified EksporYuk Affiliate" 
              dan tingkatkan kredibilitas Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
