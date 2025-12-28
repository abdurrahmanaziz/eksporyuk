'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Clock, Users, Star, Search, Filter, TrendingUp, Award, DollarSign, Crown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

type Course = {
  id: string
  title: string
  slug: string
  description: string
  thumbnail?: string
  price: number
  originalPrice?: number
  status: string
  monetizationType: string
  level?: string
  duration?: number
  createdAt: string
  // PRD Perbaikan Fitur Kelas - field baru
  roleAccess?: string
  membershipIncluded?: boolean
  isPublicListed?: boolean
  affiliateOnly?: boolean
  isAffiliateTraining?: boolean
  accessStatus?: string // 'preview' | 'enrolled' | 'membership'
  isFreeForUser?: boolean
  _count?: {
    enrollments: number
    modules: number
  }
  enrollments?: any[]
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchQuery, filterLevel, filterType, sortBy])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses?status=PUBLISHED')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Gagal memuat kursus')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    let result = [...courses]

    // Search filter
    if (searchQuery) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Level filter
    if (filterLevel !== 'all') {
      result = result.filter(course => course.level === filterLevel)
    }

    // Type filter (FREE/PAID/MEMBERSHIP)
    if (filterType !== 'all') {
      result = result.filter(course => course.monetizationType === filterType)
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'popular':
        result.sort((a, b) => (b._count?.enrollments || 0) - (a._count?.enrollments || 0))
        break
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
    }

    setFilteredCourses(result)
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      if (res.ok) {
        toast.success('Berhasil mendaftar kursus!')
        fetchCourses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mendaftar kursus')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kursus...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelajah Kursus</h1>
        <p className="text-gray-600">Temukan kursus yang sesuai dengan kebutuhan Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Kursus</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Kursus Gratis</p>
              <p className="text-2xl font-bold text-green-600">
                {courses.filter(c => c.monetizationType === 'FREE').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Kursus Premium</p>
              <p className="text-2xl font-bold text-purple-600">
                {courses.filter(c => c.monetizationType === 'PAID').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Member Only</p>
              <p className="text-2xl font-bold text-orange-600">
                {courses.filter(c => c.monetizationType === 'MEMBERSHIP').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Level Filter */}
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="BEGINNER">Pemula</SelectItem>
              <SelectItem value="INTERMEDIATE">Menengah</SelectItem>
              <SelectItem value="ADVANCED">Lanjutan</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="FREE">Gratis</SelectItem>
              <SelectItem value="PAID">Berbayar</SelectItem>
              <SelectItem value="MEMBERSHIP">Member Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold">{filteredCourses.length}</span> kursus
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="popular">Terpopuler</SelectItem>
              <SelectItem value="price-low">Harga Terendah</SelectItem>
              <SelectItem value="price-high">Harga Tertinggi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak Ada Kursus Ditemukan
          </h3>
          <p className="text-gray-600">
            Coba ubah filter atau kata kunci pencarian
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
              isEnrolled={course.enrollments && course.enrollments.length > 0}
            />
          ))}
        </div>
      )}
      </div>
    </ResponsivePageWrapper>
  )
}

function CourseCard({ 
  course, 
  onEnroll, 
  isEnrolled 
}: { 
  course: Course
  onEnroll: (id: string) => void
  isEnrolled?: boolean
}) {
  const { data: session } = useSession()
  
  const getMonetizationBadge = () => {
    // PRD: Badge untuk affiliate-only courses
    if (course.affiliateOnly || course.isAffiliateTraining) {
      return <Badge className="bg-red-500 text-white">🎯 Khusus Affiliate</Badge>
    }
    
    // PRD: Tampilkan badge berdasarkan akses
    if (course.accessStatus === 'membership' || course.isFreeForUser) {
      return <Badge className="bg-green-500 text-white">🎫 Gratis (Member)</Badge>
    }
    
    if (course.roleAccess === 'MEMBER') {
      return <Badge className="bg-orange-500 text-white">👤 Member Only</Badge>
    }
    
    if (course.roleAccess === 'AFFILIATE') {
      return <Badge className="bg-purple-500 text-white">🎯 Affiliate Only</Badge>
    }
    
    switch (course.monetizationType) {
      case 'FREE':
        return <Badge className="bg-green-500 text-white">Gratis</Badge>
      case 'PAID':
        return <Badge className="bg-purple-500 text-white">Premium</Badge>
      case 'MEMBERSHIP':
        return <Badge className="bg-orange-500 text-white">Member Only</Badge>
      default:
        return null
    }
  }

  const canAccessCourse = () => {
    if (!session?.user) return false
    
    const userRole = session.user.role
    
    // Admin dan Mentor always can access
    if (['ADMIN', 'MENTOR'].includes(userRole)) return true
    
    // Check affiliate-only restrictions
    if (course.affiliateOnly || course.isAffiliateTraining) {
      return userRole === 'AFFILIATE'
    }
    
    // Check roleAccess
    if (course.roleAccess === 'AFFILIATE') {
      return userRole === 'AFFILIATE'
    }
    
    if (course.roleAccess === 'MEMBER') {
      // Will be checked server-side, but assume members can access
      return ['MEMBER_PREMIUM', 'MEMBER_FREE'].includes(userRole) || course.accessStatus === 'membership'
    }
    
    return true
  }

  const getAccessMessage = () => {
    if (canAccessCourse()) return null
    
    if (course.affiliateOnly || course.isAffiliateTraining || course.roleAccess === 'AFFILIATE') {
      return 'Kursus ini hanya tersedia untuk affiliate. Daftar sebagai affiliate untuk akses.'
    }
    
    if (course.roleAccess === 'MEMBER') {
      return 'Kursus ini hanya tersedia untuk member aktif. Beli membership untuk akses.'
    }
    
    return 'Anda tidak memiliki akses ke kursus ini.'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
      <Link href={isEnrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`}>
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/50" />
            </div>
          )}
          
          <div className="absolute top-4 right-4">
            {getMonetizationBadge()}
          </div>

          {course.level && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white">
                {course.level}
              </Badge>
            </div>
          )}

          {isEnrolled && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-green-500 text-white">Terdaftar</Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-6 space-y-4">
        <Link href={isEnrolled ? `/learn/${course.slug}` : `/courses/${course.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 line-clamp-3">
          {course.description}
        </p>

        {/* Course Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {course.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}j</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course._count?.modules || 0} Modul</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course._count?.enrollments || 0}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {/* PRD: Member dengan akses membership lihat harga dicoret + "Gratis" */}
            {course.isFreeForUser || course.accessStatus === 'membership' ? (
              <div>
                {Number(course.price) > 0 && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(course.price)}
                  </p>
                )}
                <p className="text-xl font-bold text-green-600">Gratis untuk Anda</p>
              </div>
            ) : course.monetizationType === 'PAID' ? (
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(course.price)}
                </p>
                {course.originalPrice && course.originalPrice > course.price && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(course.originalPrice)}
                  </p>
                )}
              </div>
            ) : course.monetizationType === 'MEMBERSHIP' || course.roleAccess === 'MEMBER' ? (
              <p className="text-sm font-semibold text-orange-600">
                Khusus Member
              </p>
            ) : (
              <p className="text-2xl font-bold text-green-600">Gratis</p>
            )}
          </div>

          {!canAccessCourse() ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              title={getAccessMessage() || ''}
            >
              <span className="text-xs">Tidak Tersedia</span>
            </Button>
          ) : isEnrolled || course.accessStatus === 'enrolled' ? (
            <Link href={`/learn/${course.slug}`}>
              <Button size="sm">Lanjutkan</Button>
            </Link>
          ) : course.isFreeForUser || course.accessStatus === 'membership' ? (
            <Button
              size="sm"
              onClick={() => onEnroll(course.id)}
            >
              Akses Sekarang
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onEnroll(course.id)}
              variant={course.monetizationType === 'FREE' ? 'default' : 'outline'}
            >
              {course.monetizationType === 'PAID' ? 'Beli' : 'Daftar'}
            </Button>
          )}
        </div>
        
        {/* Access restriction message */}
        {getAccessMessage() && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800">
              {getAccessMessage()}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
