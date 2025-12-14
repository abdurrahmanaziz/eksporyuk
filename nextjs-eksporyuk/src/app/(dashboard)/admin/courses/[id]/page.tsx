'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Save, ArrowLeft, Plus, Edit, Trash2, GripVertical,
  BookOpen, PlayCircle, FileText, Settings, FileQuestion, ClipboardList,
  Upload, Download, X, File, Shield
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type LessonFile = {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileSize?: number
  fileType?: string
  order: number
}

type Lesson = {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  isFree: boolean
  files?: LessonFile[]
}

type Module = {
  id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  slug: string
  description: string
  thumbnail?: string
  price: number
  originalPrice?: number | null
  status: string
  monetizationType: string
  level?: string | null
  duration?: number | null
  groupId?: string | null
  mailketingListId?: string | null
  mailketingListName?: string | null
  affiliateOnly?: boolean
  isAffiliateTraining?: boolean
  isAffiliateMaterial?: boolean
  // PRD Perbaikan Fitur Kelas - field baru
  roleAccess?: string
  membershipIncluded?: boolean
  isPublicListed?: boolean
  modules: Module[]
}

// Sortable Lesson Item Component
interface SortableLessonProps {
  lesson: Lesson
  lessonIndex: number
  module: Module
  onEdit: (module: Module, lesson: Lesson) => void
  onDelete: (moduleId: string, lessonId: string) => void
}

function SortableLessonItem({ lesson, lessonIndex, module, onEdit, onDelete }: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 bg-background ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <PlayCircle className="h-5 w-5 text-primary" />
        <div>
          <div className="font-medium">
            Lesson {lessonIndex + 1}: {lesson.title}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDuration(lesson.duration)}
            {lesson.isFree && <Badge variant="outline" className="ml-2">Gratis</Badge>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(module, lesson)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(module.id, lesson.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Helper functions for duration conversion
function secondsToHMS(seconds: number | null | undefined): { hours: number; minutes: number; seconds: number } {
  if (!seconds) return { hours: 0, minutes: 0, seconds: 0 }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return { hours, minutes, seconds: secs }
}

function hmsToSeconds(hours: number, minutes: number, seconds: number): number {
  return (hours * 3600) + (minutes * 60) + seconds
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return 'Durasi belum diset'
  const { hours, minutes, seconds: secs } = secondsToHMS(seconds)
  const parts = []
  if (hours > 0) parts.push(`${hours} jam`)
  if (minutes > 0) parts.push(`${minutes} menit`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs} detik`)
  return parts.join(' ')
}

export default function AdminCourseDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState('info')

  // Module & Lesson states
  const [modules, setModules] = useState<Module[]>([])
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  
  // File management states
  const [newFile, setNewFile] = useState({ title: '', fileName: '', fileUrl: '' })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<'device' | 'url'>('device')
  
  // Dropdown options
  const [groups, setGroups] = useState<Array<{id: string, name: string}>>([]) 
  const [mailketingLists, setMailketingLists] = useState<Array<{id: string, name: string}>>([])  
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchCourse()
    }
  }, [status, session, router, courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      
      // Fetch groups
      try {
        const groupsRes = await fetch('/api/admin/groups')
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          setGroups(groupsData.groups || [])
        }
      } catch (err) {
        console.log('Groups API not available')
      }
      
      // Fetch mailketing lists
      try {
        const listsRes = await fetch('/api/admin/mailketing/lists')
        if (listsRes.ok) {
          const listsData = await listsRes.json()
          setMailketingLists(listsData.lists || [])
        }
      } catch (err) {
        console.log('Mailketing API not available')
      }
      const res = await fetch(`/api/admin/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course)
        setModules(data.course.modules || [])
      } else {
        toast.error('Gagal memuat data kursus')
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCourseInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!course) return

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          originalPrice: course.originalPrice,
          monetizationType: course.monetizationType,
          level: course.level,
          duration: course.duration,
          groupId: course.groupId,
          mailketingListId: course.mailketingListId,
          mailketingListName: course.mailketingListName,
          affiliateOnly: course.affiliateOnly,
          isAffiliateTraining: course.isAffiliateTraining,
          isAffiliateMaterial: course.isAffiliateMaterial,
          // PRD Perbaikan Fitur Kelas - field baru
          roleAccess: course.roleAccess,
          membershipIncluded: course.membershipIncluded,
          isPublicListed: course.isPublicListed,
          // PRD: Status & Publikasi (DRAFT/PUBLISHED/PRIVATE)
          status: course.status
        })
      })

      if (res.ok) {
        toast.success('Informasi kursus berhasil disimpan')
        fetchCourse()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleThumbnailUpload = async (file: File) => {
    if (!file) return
    
    try {
      setUploadingThumbnail(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      
      const res = await fetch('/api/admin/courses/upload-thumbnail', {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        setCourse({ ...course!, thumbnail: data.url })
        toast.success('Thumbnail berhasil diupload')
      } else {
        toast.error('Gagal upload thumbnail')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleCreateModule = async () => {
    if (!course) return

    const title = prompt('Nama Modul:')
    if (!title) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          order: modules.length + 1
        })
      })

      if (res.ok) {
        toast.success('Modul berhasil dibuat')
        fetchCourse()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat modul')
      }
    } catch (error) {
      console.error('Create module error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleUpdateModule = async (moduleId: string, title: string, description?: string) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })

      if (res.ok) {
        toast.success('Modul berhasil diupdate')
        fetchCourse()
        setEditingModule(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengupdate modul')
      }
    } catch (error) {
      console.error('Update module error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Yakin ingin menghapus modul ini? Semua lesson di dalamnya akan ikut terhapus.')) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Modul berhasil dihapus')
        fetchCourse()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus modul')
      }
    } catch (error) {
      console.error('Delete module error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleCreateLesson = async (moduleId: string) => {
    const title = prompt('Judul Lesson:')
    if (!title) return

    try {
      const module = modules.find(m => m.id === moduleId)
      const res = await fetch(`/api/admin/courses/${params.id}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: '',
          order: (module?.lessons.length || 0) + 1
        })
      })

      if (res.ok) {
        toast.success('Lesson berhasil dibuat')
        fetchCourse()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat lesson')
      }
    } catch (error) {
      console.error('Create lesson error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleUpdateLesson = async (
    moduleId: string, 
    lessonId: string, 
    data: Partial<Lesson>
  ) => {
    try {
      const res = await fetch(
        `/api/admin/courses/${params.id}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )

      if (res.ok) {
        toast.success('Lesson berhasil diupdate')
        
        // Refresh course data
        await fetchCourse()
        
        // Close edit dialog - data sudah tersimpan di database
        setEditingLesson(null)
        setSelectedModule(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengupdate lesson')
      }
    } catch (error) {
      console.error('Update lesson error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Yakin ingin menghapus lesson ini?')) return

    try {
      const res = await fetch(
        `/api/admin/courses/${params.id}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'DELETE'
        }
      )

      if (res.ok) {
        toast.success('Lesson berhasil dihapus')
        fetchCourse()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus lesson')
      }
    } catch (error) {
      console.error('Delete lesson error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle lesson reorder via drag and drop
  const handleLessonDragEnd = async (event: DragEndEvent, moduleId: string) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const oldIndex = module.lessons.findIndex(l => l.id === active.id)
    const newIndex = module.lessons.findIndex(l => l.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistically update UI
    const newLessons = arrayMove(module.lessons, oldIndex, newIndex)
    const updatedModules = modules.map(m => 
      m.id === moduleId 
        ? { ...m, lessons: newLessons.map((l, idx) => ({ ...l, order: idx + 1 })) }
        : m
    )
    setModules(updatedModules)

    // Save to server
    try {
      const lessonOrders = newLessons.map((lesson, index) => ({
        id: lesson.id,
        order: index + 1
      }))

      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessons: lessonOrders })
        }
      )

      if (res.ok) {
        toast.success('Urutan lesson berhasil diupdate')
      } else {
        // Revert on error
        await fetchCourse()
        toast.error('Gagal mengupdate urutan lesson')
      }
    } catch (error) {
      console.error('Reorder lessons error:', error)
      await fetchCourse()
      toast.error('Terjadi kesalahan')
    }
  }

  // File Management Functions
  const handleAddFile = async () => {
    if (!editingLesson || !selectedModule) return
    
    if (uploadMethod === 'device') {
      // Upload from device
      if (!selectedFile || !newFile.title) {
        toast.error('Pilih file dan isi judul')
        return
      }

      try {
        setUploadingFile(true)
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', newFile.title)

        const res = await fetch(
          `/api/admin/courses/${courseId}/modules/${selectedModule.id}/lessons/${editingLesson.id}/files/upload`,
          {
            method: 'POST',
            body: formData
          }
        )

        if (res.ok) {
          const updated = await res.json()
          toast.success('File berhasil diupload')
          
          // Update editingLesson dengan file baru
          if (updated.file) {
            setEditingLesson({
              ...editingLesson,
              files: [...(editingLesson.files || []), updated.file]
            })
          }
          
          // Reset form
          setNewFile({ title: '', fileName: '', fileUrl: '' })
          setSelectedFile(null)
          
          // Refresh data dari server
          await fetchCourse()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Gagal upload file')
        }
      } catch (error) {
        console.error('Upload file error:', error)
        toast.error('Terjadi kesalahan')
      } finally {
        setUploadingFile(false)
      }
    } else {
      // Add from URL
      if (!newFile.title || !newFile.fileName || !newFile.fileUrl) {
        toast.error('Semua field harus diisi')
        return
      }

      try {
        setUploadingFile(true)
        const res = await fetch(
          `/api/admin/courses/${courseId}/modules/${selectedModule.id}/lessons/${editingLesson.id}/files`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFile)
          }
        )

        if (res.ok) {
          const updated = await res.json()
          toast.success('File berhasil ditambahkan')
          
          // Update editingLesson dengan file baru
          if (updated.file) {
            setEditingLesson({
              ...editingLesson,
              files: [...(editingLesson.files || []), updated.file]
            })
          }
          
          // Reset form
          setNewFile({ title: '', fileName: '', fileUrl: '' })
          
          // Refresh data dari server
          await fetchCourse()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Gagal menambahkan file')
        }
      } catch (error) {
        console.error('Add file error:', error)
        toast.error('Terjadi kesalahan')
      } finally {
        setUploadingFile(false)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title if empty
      if (!newFile.title) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
        setNewFile({ ...newFile, title: nameWithoutExt })
      }
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!editingLesson || !selectedModule) return
    if (!confirm('Yakin ingin menghapus file ini?')) return

    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${selectedModule.id}/lessons/${editingLesson.id}/files/${fileId}`,
        {
          method: 'DELETE'
        }
      )

      if (res.ok) {
        toast.success('File berhasil dihapus')
        // Update editingLesson files
        setEditingLesson({
          ...editingLesson,
          files: editingLesson.files?.filter(f => f.id !== fileId)
        })
        await fetchCourse()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus file')
      }
    } catch (error) {
      console.error('Delete file error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data kursus...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Kursus tidak ditemukan</p>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge>{course.status}</Badge>
              <Badge variant="outline">{course.monetizationType}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/courses/${courseId}/consents`}>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Persetujuan Hak Cipta
            </Button>
          </Link>
          <Link href={`/admin/courses/${courseId}/quiz`}>
            <Button variant="outline">
              <FileQuestion className="h-4 w-4 mr-2" />
              Kelola Quiz
            </Button>
          </Link>
          <Link href={`/admin/courses/${courseId}/assignment`}>
            <Button variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              Kelola Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">
            <Settings className="h-4 w-4 mr-2" />
            Informasi Kursus
          </TabsTrigger>
          <TabsTrigger value="content">
            <BookOpen className="h-4 w-4 mr-2" />
            Konten & Modul
          </TabsTrigger>
        </TabsList>

        {/* Tab: Course Info */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kursus</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCourseInfo} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informasi Dasar</h3>
                  
                  <div>
                    <Label htmlFor="title">Judul Kursus</Label>
                    <Input
                      id="title"
                      value={course.title}
                      onChange={(e) => setCourse({ ...course, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={course.slug}
                      onChange={(e) => setCourse({ ...course, slug: e.target.value })}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      URL: /courses/{course.slug}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={course.description}
                      onChange={(e) => setCourse({ ...course, description: e.target.value })}
                      rows={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleThumbnailUpload(file)
                        }}
                        disabled={uploadingThumbnail}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingThumbnail}
                        size="sm"
                      >
                        {uploadingThumbnail ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    {course.thumbnail && (
                      <div className="mt-2">
                        <img src={course.thumbnail} alt="Thumbnail" className="h-32 w-auto rounded border" />
                        <Input
                          value={course.thumbnail}
                          onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                          placeholder="Atau masukkan URL manual"
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">Harga & Monetisasi</h3>
                  
                  <div>
                    <Label htmlFor="monetizationType">Tipe Monetisasi</Label>
                    <Select
                      value={course.monetizationType}
                      onValueChange={(value) => setCourse({ ...course, monetizationType: value })}
                    >
                      <SelectTrigger id="monetizationType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Gratis</SelectItem>
                        <SelectItem value="PAID">Berbayar</SelectItem>
                        <SelectItem value="SUBSCRIPTION">Subscription/Membership</SelectItem>
                        <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Harga (Rp)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={course.price}
                        onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Harga Asli (Rp)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={course.originalPrice || ''}
                        onChange={(e) => setCourse({ ...course, originalPrice: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="Untuk diskon"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">Detail Kursus</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Select
                        value={course.level || 'BEGINNER'}
                        onValueChange={(value) => setCourse({ ...course, level: value })}
                      >
                        <SelectTrigger id="level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Pemula</SelectItem>
                          <SelectItem value="INTERMEDIATE">Menengah</SelectItem>
                          <SelectItem value="ADVANCED">Lanjutan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration">Durasi (jam)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        step="0.5"
                        value={course.duration || ''}
                        onChange={(e) => setCourse({ ...course, duration: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="Total durasi"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">Pengaturan Lanjutan</h3>
                  
                  <div>
                    <Label htmlFor="groupId">Group/Komunitas</Label>
                    <Select
                      value={course.groupId || 'NONE'}
                      onValueChange={(value) => setCourse({ ...course, groupId: value === 'NONE' ? null : value })}
                    >
                      <SelectTrigger id="groupId">
                        <SelectValue placeholder="Pilih group (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Tidak ada group</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mailketingListId">Mailketing List</Label>
                    <Select
                      value={course.mailketingListId || 'NONE'}
                      onValueChange={(value) => {
                        if (value === 'NONE') {
                          setCourse({ ...course, mailketingListId: null, mailketingListName: null })
                        } else {
                          const selectedList = mailketingLists.find(list => list.id === value)
                          setCourse({ 
                            ...course, 
                            mailketingListId: value,
                            mailketingListName: selectedList?.name || null
                          })
                        }
                      }}
                    >
                      <SelectTrigger id="mailketingListId">
                        <SelectValue placeholder="Pilih mailketing list (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Tidak ada list</SelectItem>
                        {mailketingLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {course.mailketingListId && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Auto-add pembeli ke list: {course.mailketingListName || course.mailketingListId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Affiliate Training Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">🎯 Pengaturan Khusus Affiliate</h3>
                  <p className="text-sm text-muted-foreground">
                    Jadikan kursus ini eksklusif untuk affiliate saja. Role lain tidak bisa mengakses.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="affiliateOnly"
                        checked={course.affiliateOnly || false}
                        onChange={(e) => setCourse({ ...course, affiliateOnly: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="affiliateOnly" className="cursor-pointer">
                        <span className="font-medium">Khusus Affiliate Only</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          Hanya bisa diakses oleh user dengan role Affiliate
                        </p>
                      </Label>
                    </div>
                    
                    {course.affiliateOnly && (
                      <>
                        <div className="flex items-center gap-3 ml-7">
                          <input
                            type="checkbox"
                            id="isAffiliateTraining"
                            checked={course.isAffiliateTraining || false}
                            onChange={(e) => setCourse({ ...course, isAffiliateTraining: e.target.checked, isAffiliateMaterial: e.target.checked ? false : course.isAffiliateMaterial })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="isAffiliateTraining" className="cursor-pointer">
                            <span className="font-medium">📚 Kursus Training Wajib</span>
                            <p className="text-sm text-muted-foreground font-normal">
                              Kursus ini WAJIB diselesaikan oleh affiliate baru sebelum bisa mengakses fitur lainnya
                            </p>
                          </Label>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-7">
                          <input
                            type="checkbox"
                            id="isAffiliateMaterial"
                            checked={course.isAffiliateMaterial || false}
                            onChange={(e) => setCourse({ ...course, isAffiliateMaterial: e.target.checked, isAffiliateTraining: e.target.checked ? false : course.isAffiliateTraining })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="isAffiliateMaterial" className="cursor-pointer">
                            <span className="font-medium">📖 Materi Belajar Tambahan</span>
                            <p className="text-sm text-muted-foreground font-normal">
                              Materi pembelajaran tambahan untuk affiliate (tidak wajib, tapi bermanfaat)
                            </p>
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* PRD Perbaikan Fitur Kelas - Pengaturan Akses */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">🔐 Pengaturan Akses & Visibilitas</h3>
                  <p className="text-sm text-muted-foreground">
                    Atur siapa yang bisa mengakses dan melihat kursus ini
                  </p>
                  
                  <div>
                    <Label htmlFor="roleAccess">Akses Berdasarkan Role</Label>
                    <Select
                      value={course.roleAccess || 'PUBLIC'}
                      onValueChange={(value) => setCourse({ ...course, roleAccess: value })}
                    >
                      <SelectTrigger id="roleAccess">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">
                          <span className="flex items-center gap-2">
                            🌐 Publik - Semua user bisa lihat
                          </span>
                        </SelectItem>
                        <SelectItem value="MEMBER">
                          <span className="flex items-center gap-2">
                            👤 Member Only - Hanya member aktif
                          </span>
                        </SelectItem>
                        <SelectItem value="AFFILIATE">
                          <span className="flex items-center gap-2">
                            💼 Affiliate Only - Hanya affiliate
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.roleAccess === 'PUBLIC' && 'Semua user dapat melihat kursus ini'}
                      {course.roleAccess === 'MEMBER' && 'Hanya member aktif yang dapat melihat dan mengakses'}
                      {course.roleAccess === 'AFFILIATE' && 'Hanya affiliate yang dapat mengakses kursus ini'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPublicListed"
                        checked={course.isPublicListed ?? true}
                        onChange={(e) => setCourse({ ...course, isPublicListed: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isPublicListed" className="cursor-pointer">
                        <span className="font-medium">📋 Tampilkan di Daftar Publik</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          Kursus akan muncul di halaman daftar kursus umum
                        </p>
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="membershipIncluded"
                        checked={course.membershipIncluded || false}
                        onChange={(e) => setCourse({ ...course, membershipIncluded: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="membershipIncluded" className="cursor-pointer">
                        <span className="font-medium">🎫 Gratis untuk Member Aktif</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          Member dengan membership aktif tidak perlu bayar untuk kursus ini
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* PRD Perbaikan Fitur Kelas - Status & Publikasi */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">📊 Status & Publikasi</h3>
                  <p className="text-sm text-muted-foreground">
                    Kontrol status publikasi kursus - apakah sudah siap tampil atau masih draft
                  </p>
                  
                  <div>
                    <Label htmlFor="status">Status Kursus</Label>
                    <Select
                      value={course.status || 'DRAFT'}
                      onValueChange={(value) => setCourse({ ...course, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">
                          <span className="flex items-center gap-2">
                            📝 Draft - Belum dipublikasikan
                          </span>
                        </SelectItem>
                        <SelectItem value="PUBLISHED">
                          <span className="flex items-center gap-2">
                            ✅ Published - Sudah dipublikasikan
                          </span>
                        </SelectItem>
                        <SelectItem value="PRIVATE">
                          <span className="flex items-center gap-2">
                            🔒 Private - Hanya bisa diakses via link langsung
                          </span>
                        </SelectItem>
                        <SelectItem value="PENDING_REVIEW">
                          <span className="flex items-center gap-2">
                            ⏳ Pending Review - Menunggu review
                          </span>
                        </SelectItem>
                        <SelectItem value="ARCHIVED">
                          <span className="flex items-center gap-2">
                            📦 Archived - Diarsipkan
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2 p-3 rounded-lg bg-muted/50">
                      {course.status === 'DRAFT' && (
                        <p className="text-sm text-muted-foreground">
                          <strong>📝 Draft:</strong> Kursus tidak tampil ke publik dan tidak bisa diakses user. Hanya admin yang bisa melihat.
                        </p>
                      )}
                      {course.status === 'PUBLISHED' && (
                        <p className="text-sm text-green-600">
                          <strong>✅ Published:</strong> Kursus aktif dan bisa diakses sesuai pengaturan role dan visibilitas.
                        </p>
                      )}
                      {course.status === 'PRIVATE' && (
                        <p className="text-sm text-orange-600">
                          <strong>🔒 Private:</strong> Kursus tidak muncul di listing, tapi masih bisa diakses jika user punya link langsung dan memenuhi syarat akses.
                        </p>
                      )}
                      {course.status === 'PENDING_REVIEW' && (
                        <p className="text-sm text-yellow-600">
                          <strong>⏳ Pending Review:</strong> Kursus sedang direview sebelum dipublikasikan.
                        </p>
                      )}
                      {course.status === 'ARCHIVED' && (
                        <p className="text-sm text-gray-600">
                          <strong>📦 Archived:</strong> Kursus diarsipkan dan tidak aktif. Tidak bisa diakses oleh user.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={saving} size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Course Content */}
        <TabsContent value="content">
          <div className="space-y-6">
            {/* Add Module Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Modul & Lesson</h2>
              <Button onClick={handleCreateModule}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Modul
              </Button>
            </div>

            {/* Modules List */}
            {modules.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada modul. Klik "Tambah Modul" untuk membuat modul pertama.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <Card key={module.id}>
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <div>
                            <CardTitle className="text-lg">
                              Modul {moduleIndex + 1}: {module.title}
                            </CardTitle>
                            {module.description && (
                              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingModule(module)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateLesson(module.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Lesson
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteModule(module.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {module.lessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Belum ada lesson. Klik "+ Lesson" untuk menambahkan.
                        </p>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleLessonDragEnd(event, module.id)}
                        >
                          <SortableContext
                            items={module.lessons.map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <SortableLessonItem
                                  key={lesson.id}
                                  lesson={lesson}
                                  lessonIndex={lessonIndex}
                                  module={module}
                                  onEdit={(mod, les) => {
                                    setSelectedModule(mod)
                                    setEditingLesson(les)
                                  }}
                                  onDelete={handleDeleteLesson}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Module Dialog */}
      {editingModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Edit Modul</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Judul Modul</Label>
                  <Input
                    value={editingModule.title}
                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Deskripsi (Opsional)</Label>
                  <Textarea
                    value={editingModule.description || ''}
                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUpdateModule(
                      editingModule.id,
                      editingModule.title,
                      editingModule.description
                    )}
                  >
                    Simpan
                  </Button>
                  <Button variant="outline" onClick={() => setEditingModule(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Lesson Dialog */}
      {editingLesson && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-4xl mx-4 my-8">
            <CardHeader>
              <CardTitle>Edit Lesson: {editingLesson.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Judul Lesson</Label>
                  <Input
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Konten Lesson</Label>
                  <Textarea
                    value={editingLesson.content}
                    onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                    rows={10}
                    placeholder="Tulis konten lesson di sini..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Video URL (YouTube/Vimeo)</Label>
                    <Input
                      value={editingLesson.videoUrl || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <Label>Durasi Video</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          placeholder="Jam"
                          value={secondsToHMS(editingLesson.duration).hours}
                          onChange={(e) => {
                            const hms = secondsToHMS(editingLesson.duration)
                            const hours = parseInt(e.target.value) || 0
                            setEditingLesson({ ...editingLesson, duration: hmsToSeconds(hours, hms.minutes, hms.seconds) })
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Jam</p>
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Menit"
                          value={secondsToHMS(editingLesson.duration).minutes}
                          onChange={(e) => {
                            const hms = secondsToHMS(editingLesson.duration)
                            const minutes = parseInt(e.target.value) || 0
                            setEditingLesson({ ...editingLesson, duration: hmsToSeconds(hms.hours, minutes, hms.seconds) })
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Menit</p>
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Detik"
                          value={secondsToHMS(editingLesson.duration).seconds}
                          onChange={(e) => {
                            const hms = secondsToHMS(editingLesson.duration)
                            const seconds = parseInt(e.target.value) || 0
                            setEditingLesson({ ...editingLesson, duration: hmsToSeconds(hms.hours, hms.minutes, seconds) })
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Detik</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={editingLesson.isFree}
                    onChange={(e) => setEditingLesson({ ...editingLesson, isFree: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isFree">Lesson ini gratis (bisa diakses tanpa membership)</Label>
                </div>

                {/* Files Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <File className="h-4 w-4" />
                    File Materi (untuk didownload siswa)
                  </h3>
                  
                  {/* File List */}
                  {editingLesson.files && editingLesson.files.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {editingLesson.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium text-sm">{file.title}</div>
                              <div className="text-xs text-muted-foreground">{file.fileName}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New File Form */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                    <div className="text-sm font-medium">Tambah File Baru</div>
                    
                    {/* Upload Method Selector */}
                    <div className="flex gap-2 border-b pb-3">
                      <Button
                        type="button"
                        size="sm"
                        variant={uploadMethod === 'device' ? 'default' : 'outline'}
                        onClick={() => setUploadMethod('device')}
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Upload dari Device
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={uploadMethod === 'url' ? 'default' : 'outline'}
                        onClick={() => setUploadMethod('url')}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Link URL
                      </Button>
                    </div>

                    {uploadMethod === 'device' ? (
                      /* Upload from Device */
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Judul File</Label>
                          <Input
                            placeholder="Contoh: PDF Materi Bab 1"
                            value={newFile.title}
                            onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Pilih File</Label>
                          <Input
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                          />
                          {selectedFile && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Format: PDF, Word, Excel, PowerPoint, ZIP, RAR, TXT (Max 50MB)
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAddFile}
                          disabled={uploadingFile || !selectedFile || !newFile.title}
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          {uploadingFile ? 'Uploading...' : 'Upload File'}
                        </Button>
                      </div>
                    ) : (
                      /* Add from URL */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Judul File</Label>
                            <Input
                              placeholder="Contoh: PDF Materi Bab 1"
                              value={newFile.title}
                              onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Nama File</Label>
                            <Input
                              placeholder="materi-bab-1.pdf"
                              value={newFile.fileName}
                              onChange={(e) => setNewFile({ ...newFile, fileName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">URL File (Google Drive, Dropbox, dll)</Label>
                          <Input
                            placeholder="https://drive.google.com/file/d/..."
                            value={newFile.fileUrl}
                            onChange={(e) => setNewFile({ ...newFile, fileUrl: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload file ke Google Drive/Dropbox, set sharing ke "Anyone with the link", lalu paste URL-nya
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAddFile}
                          disabled={uploadingFile || !newFile.title || !newFile.fileName || !newFile.fileUrl}
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          {uploadingFile ? 'Menambahkan...' : 'Tambah File'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUpdateLesson(
                      selectedModule.id,
                      editingLesson.id,
                      {
                        title: editingLesson.title,
                        content: editingLesson.content,
                        videoUrl: editingLesson.videoUrl,
                        duration: editingLesson.duration,
                        isFree: editingLesson.isFree
                      }
                    )}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Lesson
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditingLesson(null)
                    setSelectedModule(null)
                    setNewFile({ title: '', fileName: '', fileUrl: '' })
                    setSelectedFile(null)
                    setUploadMethod('device')
                  }}>
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
