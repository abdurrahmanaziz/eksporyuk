'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronLeft, ChevronRight, CheckCircle, Circle, 
  Lock, PlayCircle, FileText, MessageSquare, Award,
  BookOpen, Clock, Users
} from 'lucide-react'
import { toast } from 'sonner'

// Helper function for duration display
const formatDuration = (totalSeconds: number | null | undefined): string => {
  if (!totalSeconds || totalSeconds <= 0) return ''
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (hours > 0) parts.push(`${hours}j`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}d`)
  return parts.join(' ')
}

type Lesson = {
  id: string
  title: string
  description: string
  order: number
  contentType: string
  videoUrl?: string
  content?: string
  duration: number
  isFree: boolean
  isCompleted?: boolean
  hasQuiz: boolean
  hasAssignment: boolean
}

type Module = {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  description: string
  thumbnail?: string
  price: number
  modules: Module[]
  mentor: {
    user: {
      name: string
      avatar?: string
    }
  }
  progress?: {
    progress: number
    completedLessons: string[]
    isCompleted: boolean
  }
  hasAccess: boolean
  _count: {
    enrollments: number
  }
}

export default function CoursePlayerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'discussion'>('content')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchCourse()
    }
  }, [status, courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/courses/${courseId}/player`)
      
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course)
        
        // Set first lesson or resume from last position
        if (data.course.modules.length > 0) {
          const firstModule = data.course.modules[0]
          const firstLesson = firstModule.lessons[0]
          
          if (firstLesson) {
            setCurrentModule(firstModule)
            setCurrentLesson(firstLesson)
          }
        }
      } else if (res.status === 403) {
        toast.error('Anda tidak memiliki akses ke kursus ini')
        router.push('/courses')
      } else {
        toast.error('Gagal memuat kursus')
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonSelect = (module: Module, lesson: Lesson) => {
    if (!course?.hasAccess && !lesson.isFree) {
      toast.error('Silakan daftar kursus terlebih dahulu')
      return
    }

    setCurrentModule(module)
    setCurrentLesson(lesson)
    
    // Mark lesson as completed when opened
    if (course?.hasAccess) {
      markLessonComplete(lesson.id)
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      })
      
      // Refresh course data to update progress
      fetchCourse()
    } catch (error) {
      console.error('Failed to mark lesson complete:', error)
    }
  }

  const navigateLesson = (direction: 'prev' | 'next') => {
    if (!course || !currentModule || !currentLesson) return

    const allLessons: { module: Module; lesson: Lesson }[] = []
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        allLessons.push({ module, lesson })
      })
    })

    const currentIndex = allLessons.findIndex(
      item => item.lesson.id === currentLesson.id
    )

    if (currentIndex === -1) return

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1

    if (newIndex >= 0 && newIndex < allLessons.length) {
      const { module, lesson } = allLessons[newIndex]
      handleLessonSelect(module, lesson)
    }
  }

  const isLessonCompleted = (lessonId: string) => {
    return course?.progress?.completedLessons?.includes(lessonId) || false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat kursus...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Kursus tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/my-courses')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Kembali
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="font-semibold text-lg line-clamp-1">{course.title}</h1>
                {currentLesson && (
                  <p className="text-sm text-muted-foreground">
                    {currentModule?.title} • {currentLesson.title}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {course.progress && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <Badge variant="secondary">{course.progress.progress}%</Badge>
                </div>
              )}
              {!course.hasAccess && (
                <Button onClick={() => router.push(`/courses/${courseId}`)}>
                  Daftar Sekarang
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className={sidebarOpen ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <Card>
              <CardContent className="p-0">
                {/* Video Player or Content Display */}
                {currentLesson?.contentType === 'VIDEO' && currentLesson.videoUrl ? (
                  <div className="relative bg-black aspect-video">
                    <video
                      src={currentLesson.videoUrl}
                      controls
                      className="w-full h-full"
                      poster={course.thumbnail}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : currentLesson?.contentType === 'EMBED' && currentLesson.videoUrl ? (
                  <div className="relative bg-black aspect-video">
                    <iframe
                      src={currentLesson.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 aspect-video flex items-center justify-center">
                    <div className="text-center text-white">
                      <FileText className="h-16 w-16 mx-auto mb-3 opacity-80" />
                      <p className="text-lg font-medium">Konten Teks</p>
                    </div>
                  </div>
                )}

                {/* Lesson Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{currentLesson?.title}</h2>
                      <p className="text-muted-foreground">{currentLesson?.description}</p>
                    </div>
                    {currentLesson && isLessonCompleted(currentLesson.id) && (
                      <Badge className="bg-green-600 ml-4">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selesai
                      </Badge>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="border-b mb-6">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveTab('content')}
                        className={`pb-3 px-1 border-b-2 transition-colors ${
                          activeTab === 'content'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Konten
                      </button>
                      <button
                        onClick={() => setActiveTab('discussion')}
                        className={`pb-3 px-1 border-b-2 transition-colors ${
                          activeTab === 'discussion'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Diskusi
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'content' && (
                    <div className="prose max-w-none">
                      {currentLesson?.content ? (
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      ) : (
                        <p className="text-muted-foreground">Tidak ada konten tambahan</p>
                      )}

                      {/* Quiz & Assignment Buttons */}
                      <div className="flex gap-3 mt-6 not-prose">
                        {currentLesson?.hasQuiz && course.hasAccess && (
                          <Button variant="outline">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Mulai Quiz
                          </Button>
                        )}
                        {currentLesson?.hasAssignment && course.hasAccess && (
                          <Button variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Lihat Assignment
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'discussion' && (
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Diskusi untuk pelajaran ini
                      </p>
                      {/* Discussion component will be added here */}
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Fitur diskusi akan segera hadir</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="p-6 pt-0">
                  <Separator className="mb-6" />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => navigateLesson('prev')}
                      disabled={!currentLesson}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Sebelumnya
                    </Button>
                    <Button
                      onClick={() => navigateLesson('next')}
                      disabled={!currentLesson}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Course Content */}
          {sidebarOpen && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base">Konten Kursus</CardTitle>
                  {course.progress && (
                    <Progress value={course.progress.progress} className="h-2 mt-2" />
                  )}
                </CardHeader>
                <CardContent className="p-0 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  <div className="space-y-1">
                    {course.modules.map((module, moduleIndex) => (
                      <div key={module.id}>
                        <div className="px-4 py-3 bg-gray-50 font-medium text-sm">
                          {moduleIndex + 1}. {module.title}
                        </div>
                        {module.lessons.map((lesson, lessonIndex) => {
                          const completed = isLessonCompleted(lesson.id)
                          const isCurrent = currentLesson?.id === lesson.id
                          const isLocked = !course.hasAccess && !lesson.isFree

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(module, lesson)}
                              disabled={isLocked}
                              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                                isCurrent ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {isLocked ? (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                ) : completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium line-clamp-2 ${
                                  isCurrent ? 'text-blue-600' : ''
                                }`}>
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {lesson.duration > 0 && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(lesson.duration)}
                                    </span>
                                  )}
                                  {lesson.isFree && (
                                    <Badge variant="secondary" className="text-xs">
                                      Gratis
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
