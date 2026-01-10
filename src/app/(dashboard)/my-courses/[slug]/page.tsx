'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Users,
  Award,
  MessageSquare,
  FileText,
  Video,
  ArrowLeft,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function for duration display
const formatDuration = (totalSeconds: number | null | undefined): string => {
  if (!totalSeconds || totalSeconds <= 0) return 'Durasi belum diset'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (hours > 0) parts.push(`${hours} jam`)
  if (minutes > 0) parts.push(`${minutes} menit`)
  if (seconds > 0) parts.push(`${seconds} detik`)
  return parts.length > 0 ? parts.join(' ') : 'Durasi belum diset'
}

type Lesson = {
  id: string
  title: string
  content: string
  videoUrl: string | null
  duration: number | null
  order: number
  isFree: boolean
  isCompleted: boolean
}

type Module = {
  id: string
  title: string
  description: string | null
  order: number
  lessons: Lesson[]
  isExpanded: boolean
}

type Course = {
  id: string
  title: string
  slug: string
  description: string
  thumbnail: string | null
  mentor: {
    user: {
      name: string
      avatar: string | null
    }
  }
  modules: Module[]
  progress: number
  isCompleted: boolean
  hasCertificate: boolean
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])

  useEffect(() => {
    if (params.slug) {
      fetchCourse()
    }
  }, [params.slug])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/student/courses/${params.slug}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course)
        setModules(data.course.modules.map((m: Module) => ({ ...m, isExpanded: false })))
        
        // Set first incomplete lesson as current
        const firstIncomplete = data.course.modules
          .flatMap((m: Module) => m.lessons)
          .find((l: Lesson) => !l.isCompleted)
        
        if (firstIncomplete) {
          setCurrentLesson(firstIncomplete)
        } else if (data.course.modules[0]?.lessons[0]) {
          setCurrentLesson(data.course.modules[0].lessons[0])
        }
      } else {
        toast.error('Kursus tidak ditemukan')
        router.push('/my-courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      toast.error('Gagal memuat kursus')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m
    ))
  }

  const selectLesson = async (lesson: Lesson) => {
    setCurrentLesson(lesson)
    
    // Mark as accessed
    try {
      await fetch(`/api/student/courses/${params.slug}/lessons/${lesson.id}/access`, {
        method: 'POST'
      })
      
      // Refresh course data to update progress
      fetchCourse()
    } catch (error) {
      console.error('Error marking lesson as accessed:', error)
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/student/courses/${params.slug}/lessons/${lessonId}/complete`, {
        method: 'POST'
      })

      if (res.ok) {
        toast.success('Pelajaran diselesaikan!')
        
        // Update local state
        setModules(modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l => 
            l.id === lessonId ? { ...l, isCompleted: true } : l
          )
        })))

        // Refresh course data
        fetchCourse()

        // Move to next lesson
        const allLessons = modules.flatMap(m => m.lessons)
        const currentIndex = allLessons.findIndex(l => l.id === lessonId)
        if (currentIndex < allLessons.length - 1) {
          setCurrentLesson(allLessons[currentIndex + 1])
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
      toast.error('Gagal menyelesaikan pelajaran')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return null
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedLessons = modules.reduce((sum, m) => 
    sum + m.lessons.filter(l => l.isCompleted).length, 0
  )

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/my-courses"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-semibold text-lg text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">
                  {completedLessons} dari {totalLessons} pelajaran selesai
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Progress */}
              <div className="hidden md:flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {course.progress}%
                </span>
              </div>

              {/* Certificate Button */}
              {course.isCompleted && course.hasCertificate && (
                <Link
                  href={`/certificates/${course.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Award className="w-5 h-5" />
                  Sertifikat
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Video & Lesson */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            {currentLesson && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {currentLesson.videoUrl ? (
                  <div className="relative aspect-video bg-black">
                    <video
                      key={currentLesson.id}
                      controls
                      className="w-full h-full"
                      poster={course.thumbnail || undefined}
                    >
                      <source src={currentLesson.videoUrl} type="video/mp4" />
                      Browser Anda tidak mendukung video player.
                    </video>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-white/30" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {currentLesson.title}
                      </h2>
                      {currentLesson.duration && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(currentLesson.duration)}</span>
                        </div>
                      )}
                    </div>

                    {!currentLesson.isCompleted && (
                      <button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Selesai
                      </button>
                    )}
                  </div>

                  {/* Lesson Content */}
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                </div>
              </div>
            )}

            {/* Tabs - Discussion, Quiz, Assignment */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="border-b border-gray-200">
                <div className="flex gap-4 px-6">
                  <button className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
                    Diskusi
                  </button>
                  <button className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                    Quiz
                  </button>
                  <button className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
                    Tugas
                  </button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 text-center py-8">
                  Diskusi untuk pelajaran ini akan segera hadir
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm sticky top-24">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  Konten Kursus
                </h3>
                <p className="text-sm text-gray-600">
                  {totalLessons} pelajaran • {completedLessons} selesai
                </p>
              </div>

              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {modules.map((module) => (
                  <div key={module.id} className="border-b border-gray-200 last:border-0">
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div>
                          {module.isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{module.title}</h4>
                          <p className="text-sm text-gray-600">
                            {module.lessons.filter(l => l.isCompleted).length}/{module.lessons.length} pelajaran
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Lessons */}
                    {module.isExpanded && (
                      <div className="bg-gray-50">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={`w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left ${
                              currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                          >
                            <div>
                              {lesson.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : lesson.isFree ? (
                                <Play className="w-5 h-5 text-gray-400" />
                              ) : (
                                <Video className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                currentLesson?.id === lesson.id ? 'text-blue-600' : 'text-gray-900'
                              }`}>
                                {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-600">{formatDuration(lesson.duration)}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
