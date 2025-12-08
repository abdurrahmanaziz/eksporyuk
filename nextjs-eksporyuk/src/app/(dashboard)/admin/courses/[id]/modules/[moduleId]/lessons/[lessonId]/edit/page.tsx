'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, Save, Loader2, Video, FileText, Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { VideoUploader } from '@/components/admin/courses/VideoUploader'
import dynamic from 'next/dynamic'

// Helper functions for duration conversion
const secondsToHMS = (totalSeconds: number | null | undefined): { hours: number, minutes: number, seconds: number } => {
  if (!totalSeconds || totalSeconds <= 0) return { hours: 0, minutes: 0, seconds: 0 }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { hours, minutes, seconds }
}

const hmsToSeconds = (hours: number, minutes: number, seconds: number): number => {
  return (hours * 3600) + (minutes * 60) + seconds
}

// Dynamic import for rich text editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor'),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
)

type Lesson = {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  isFree: boolean
}

type Module = {
  id: string
  title: string
  courseId: string
}

type Course = {
  id: string
  title: string
}

export default function EditLessonPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  
  const courseId = params?.id as string
  const moduleId = params?.moduleId as string
  const lessonId = params?.lessonId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [course, setCourse] = useState<Course | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    duration: '',
    isFree: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MENTOR') {
        router.push('/dashboard')
        return
      }
      fetchLesson()
    }
  }, [status, session, router])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      
      // Fetch lesson
      const lessonRes = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
      )
      
      if (!lessonRes.ok) {
        throw new Error('Failed to fetch lesson')
      }

      const lessonData = await lessonRes.json()
      setLesson(lessonData.lesson)
      
      setFormData({
        title: lessonData.lesson.title || '',
        content: lessonData.lesson.content || '',
        videoUrl: lessonData.lesson.videoUrl || '',
        duration: lessonData.lesson.duration?.toString() || '',
        isFree: lessonData.lesson.isFree || false
      })

      // Fetch module info
      const moduleRes = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}`
      )
      if (moduleRes.ok) {
        const moduleData = await moduleRes.json()
        setModule(moduleData.module)
      }

      // Fetch course info
      const courseRes = await fetch(`/api/admin/courses/${courseId}`)
      if (courseRes.ok) {
        const courseData = await courseRes.json()
        setCourse(courseData.course)
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      toast.error('Gagal memuat data lesson')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul lesson harus diisi')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Konten lesson harus diisi')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            duration: formData.duration ? parseInt(formData.duration) : null,
            isFree: formData.isFree
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save lesson')
      }

      toast.success('Lesson berhasil disimpan')
      
      // Refresh data
      fetchLesson()
    } catch (error) {
      console.error('Save error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan lesson'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleVideoUploadComplete = (videoUrl: string, duration?: number) => {
    setFormData(prev => ({
      ...prev,
      videoUrl,
      duration: duration?.toString() || prev.duration
    }))
    
    // Refresh lesson data
    fetchLesson()
  }

  const handleVideoDelete = () => {
    setFormData(prev => ({
      ...prev,
      videoUrl: '',
      duration: ''
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat data lesson...</p>
        </div>
      </div>
    )
  }

  if (!lesson || !module || !course) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Data tidak ditemukan</p>
            <Link href={`/admin/courses/${courseId}`}>
              <Button className="mt-4">Kembali ke Course</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/admin/courses/${courseId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Course
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Lesson</h1>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Course: <span className="font-medium">{course.title}</span></p>
              <p>Module: <span className="font-medium">{module.title}</span></p>
            </div>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Simpan Lesson
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Lesson *</Label>
              <Input
                id="title"
                placeholder="Masukkan judul lesson"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Konten Lesson *</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Tulis konten lesson di sini..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Video Upload */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Lesson
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload video untuk lesson ini
            </p>
          </div>
          
          <VideoUploader
            courseId={courseId}
            moduleId={moduleId}
            lessonId={lessonId}
            currentVideoUrl={formData.videoUrl || undefined}
            onUploadComplete={handleVideoUploadComplete}
            onDelete={handleVideoDelete}
          />
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pengaturan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFree">Lesson Gratis</Label>
                <p className="text-sm text-muted-foreground">
                  Bisa diakses tanpa membeli course
                </p>
              </div>
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isFree: checked })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Durasi Video</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    placeholder="Jam"
                    value={secondsToHMS(parseInt(formData.duration) || 0).hours}
                    onChange={(e) => {
                      const hms = secondsToHMS(parseInt(formData.duration) || 0)
                      const hours = parseInt(e.target.value) || 0
                      setFormData({ ...formData, duration: hmsToSeconds(hours, hms.minutes, hms.seconds).toString() })
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Jam (0-23)</p>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Menit"
                    value={secondsToHMS(parseInt(formData.duration) || 0).minutes}
                    onChange={(e) => {
                      const hms = secondsToHMS(parseInt(formData.duration) || 0)
                      const minutes = parseInt(e.target.value) || 0
                      setFormData({ ...formData, duration: hmsToSeconds(hms.hours, minutes, hms.seconds).toString() })
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Menit (0-59)</p>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Detik"
                    value={secondsToHMS(parseInt(formData.duration) || 0).seconds}
                    onChange={(e) => {
                      const hms = secondsToHMS(parseInt(formData.duration) || 0)
                      const seconds = parseInt(e.target.value) || 0
                      setFormData({ ...formData, duration: hmsToSeconds(hms.hours, hms.minutes, seconds).toString() })
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Detik (0-59)</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Durasi akan otomatis terisi saat upload video
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
