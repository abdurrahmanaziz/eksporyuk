'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  FileText, 
  Video, 
  File, 
  Plus, 
  Edit, 
  Eye,
  Search,
  FolderOpen,
  BookOpen,
  ExternalLink,
  Layers,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  videoUrl: string | null
  content: string
  order: number
  isFree: boolean
  duration: number | null
  files: LessonFile[]
}

interface LessonFile {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileSize: number | null
  fileType: string | null
}

interface Course {
  id: string
  title: string
  slug: string
  status: string
  modules: Module[]
  _count: {
    modules: number
    enrollments: number
  }
}

interface MaterialItem {
  type: 'lesson' | 'file'
  id: string
  title: string
  courseId: string
  courseTitle: string
  moduleId: string
  moduleTitle: string
  lessonId?: string
  lessonTitle?: string
  videoUrl?: string | null
  fileUrl?: string
  fileType?: string | null
  duration?: number | null
  isFree?: boolean
}

export default function MentorMaterialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalModules: 0,
    totalLessons: 0,
    totalFiles: 0
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      // Check allRoles for multi-role support (user may have MENTOR as additional role)
      const allRoles = session?.user?.allRoles || [session?.user?.role]
      const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
      if (!hasMentorAccess) {
        router.push('/dashboard')
        return
      }
      fetchCourses()
    }
  }, [status, session, router])

  useEffect(() => {
    filterMaterials()
  }, [materials, searchQuery, courseFilter, typeFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/courses')
      if (res.ok) {
        const data = await res.json()
        const coursesData = data.courses || []
        setCourses(coursesData)
        
        // Extract all materials from courses
        const allMaterials: MaterialItem[] = []
        let totalModules = 0
        let totalLessons = 0
        let totalFiles = 0
        
        for (const course of coursesData) {
          if (course.modules) {
            totalModules += course.modules.length
            
            for (const module of course.modules) {
              if (module.lessons) {
                totalLessons += module.lessons.length
                
                for (const lesson of module.lessons) {
                  // Add lesson as material
                  allMaterials.push({
                    type: 'lesson',
                    id: lesson.id,
                    title: lesson.title,
                    courseId: course.id,
                    courseTitle: course.title,
                    moduleId: module.id,
                    moduleTitle: module.title,
                    videoUrl: lesson.videoUrl,
                    duration: lesson.duration,
                    isFree: lesson.isFree
                  })
                  
                  // Add files as materials
                  if (lesson.files) {
                    totalFiles += lesson.files.length
                    
                    for (const file of lesson.files) {
                      allMaterials.push({
                        type: 'file',
                        id: file.id,
                        title: file.title,
                        courseId: course.id,
                        courseTitle: course.title,
                        moduleId: module.id,
                        moduleTitle: module.title,
                        lessonId: lesson.id,
                        lessonTitle: lesson.title,
                        fileUrl: file.fileUrl,
                        fileType: file.fileType
                      })
                    }
                  }
                }
              }
            }
          }
        }
        
        setMaterials(allMaterials)
        setStats({
          totalCourses: coursesData.length,
          totalModules,
          totalLessons,
          totalFiles
        })
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Gagal memuat data materi')
    } finally {
      setLoading(false)
    }
  }

  const filterMaterials = () => {
    let filtered = [...materials]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.courseTitle.toLowerCase().includes(query) ||
        m.moduleTitle.toLowerCase().includes(query) ||
        (m.lessonTitle && m.lessonTitle.toLowerCase().includes(query))
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(m => m.courseId === courseFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    setFilteredMaterials(filtered)
  }

  const getTypeIcon = (material: MaterialItem) => {
    if (material.type === 'lesson') {
      return material.videoUrl ? (
        <Video className="h-4 w-4 text-blue-500" />
      ) : (
        <FileText className="h-4 w-4 text-green-500" />
      )
    }
    return <File className="h-4 w-4 text-orange-500" />
  }

  const getTypeBadge = (material: MaterialItem) => {
    if (material.type === 'lesson') {
      return material.videoUrl ? (
        <Badge variant="default" className="bg-blue-500">Video</Badge>
      ) : (
        <Badge variant="secondary">Teks</Badge>
      )
    }
    return <Badge variant="outline">File</Badge>
  }

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data materi...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Materi Pembelajaran</h1>
            <p className="text-muted-foreground">Kelola semua materi dari kursus Anda</p>
          </div>
          <Link href="/mentor/courses/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Buat Kursus Baru
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Kursus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Total Modul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="h-4 w-4" />
                Total Lesson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLessons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <File className="h-4 w-4" />
                Total File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Akses Cepat ke Kursus</CardTitle>
            <CardDescription>Klik untuk mengelola materi di setiap kursus</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada kursus</p>
                <Link href="/mentor/courses/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Kursus Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Link key={course.id} href={`/mentor/courses/${course.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium truncate">{course.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {course._count?.modules || course.modules?.length || 0} modul
                            </p>
                          </div>
                          <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                            {course.status === 'PUBLISHED' ? 'Aktif' : course.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Kursus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kursus</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="lesson">Lesson</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Materi ({filteredMaterials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tidak ada materi yang ditemukan</p>
                {courses.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Tambahkan modul dan lesson di halaman kursus
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Kursus</TableHead>
                      <TableHead>Modul</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={`${material.type}-${material.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(material)}
                            {getTypeBadge(material)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{material.title}</div>
                            {material.type === 'file' && material.lessonTitle && (
                              <div className="text-sm text-muted-foreground">
                                di: {material.lessonTitle}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{material.courseTitle}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{material.moduleTitle}</div>
                        </TableCell>
                        <TableCell>
                          {material.type === 'lesson' && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {formatDuration(material.duration)}
                            </div>
                          )}
                          {material.type === 'file' && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/mentor/courses/${material.courseId}`}>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {material.type === 'file' && material.fileUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(material.fileUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {material.type === 'lesson' && material.videoUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(material.videoUrl!, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
