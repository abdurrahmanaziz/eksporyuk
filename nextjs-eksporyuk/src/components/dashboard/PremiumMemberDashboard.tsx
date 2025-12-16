'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import DashboardBanner from '@/components/banners/DashboardBanner'
import {
  BookOpen,
  PlayCircle,
  Clock,
  Calendar,
  Users,
  ChevronRight,
  Award,
  Star,
  TrendingUp,
  ShoppingBag,
  Bell,
  ArrowRight,
  CheckCircle2,
  Target,
  Zap,
  Crown,
  GraduationCap,
  FileText,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'
import { getRoleTheme } from '@/lib/role-themes'

interface Course {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  progress: number
  totalLessons: number
  completedLessons: number
  lastAccessedAt: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
}

interface Group {
  id: string
  slug: string
  name: string
  description: string | null
  thumbnail: string | null
  memberCount: number
  postCount: number
}

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  thumbnail: string | null
  isOnline: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  thumbnail: string | null
  price: number
  originalPrice: number | null
  category: string | null
}

interface DashboardData {
  courses: Course[]
  groups: Group[]
  events: Event[]
  products: Product[]
  stats: {
    totalCourses: number
    completedCourses: number
    totalLessons: number
    completedLessons: number
    certificates: number
    daysRemaining: number
  }
  membership: {
    name: string
    expiresAt: string | null
    isExpired: boolean
  } | null
  announcements: Array<{
    id: string
    title: string
    content: string
    createdAt: string
    priority: string
  }>
}

export default function PremiumMemberDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [activeTab, setActiveTab] = useState('in-progress')
  
  const theme = getRoleTheme(session?.user?.role || 'MEMBER_PREMIUM')
  const userName = session?.user?.name?.split(' ')[0] || 'Member'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/premium')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredCourses = data?.courses.filter(course => {
    if (activeTab === 'in-progress') return course.status === 'IN_PROGRESS'
    if (activeTab === 'completed') return course.status === 'COMPLETED'
    if (activeTab === 'not-started') return course.status === 'NOT_STARTED'
    return true
  }) || []

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Promotional Banner Carousel */}
        <DashboardBanner placement="DASHBOARD" />
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute left-1/2 bottom-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✌️</span>
                  <p className="text-white/90 text-sm font-medium">{getGreeting()}</p>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                  Welcome back, {userName}!
                </h1>
                <p className="text-white/90 max-w-md">
                  Fantastic Progress! 🎉 Kamu sudah menyelesaikan <span className="text-yellow-300 font-bold">{data?.stats.totalLessons ? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100) : 0}%</span> dari target belajar mingguan!
                </p>
                
                {/* Progress indicator */}
                <div className="mt-4 max-w-xs">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">Progress Belajar</span>
                    <span className="font-bold text-yellow-300">
                      {data?.stats.totalLessons ? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={data?.stats.totalLessons ? (data.stats.completedLessons / data.stats.totalLessons) * 100 : 0} 
                    className="h-2 bg-white/20"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:block">
                  <Image 
                    src="/images/learning-illustration.svg" 
                    alt="Learning" 
                    width={180} 
                    height={140}
                    className="opacity-90"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                <Link href="/learn">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Lanjut Belajar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ✨ SPOTLIGHT SECTION - Quick Access to Class & Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Spotlight: Kelas Utama */}
          {data?.courses && data.courses.length > 0 ? (
            <Link href={`/learn/${data.courses[0].slug}`} className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 h-[200px] shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute right-4 top-4 w-20 h-20 bg-white/10 rounded-full" />
                
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <Badge className="bg-white/20 text-white border-0">
                        {data.courses[0].status === 'IN_PROGRESS' ? '🔥 Lanjutkan' : '📚 Mulai Belajar'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-1 line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
                      {data.courses[0].title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {data.courses[0].completedLessons}/{data.courses[0].totalLessons} materi selesai
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={data.courses[0].progress} 
                        className="w-24 h-2 bg-white/20"
                      />
                      <span className="text-sm font-semibold">{data.courses[0].progress}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-white font-semibold group-hover:gap-2 transition-all">
                      Masuk Kelas <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/courses" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 h-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative h-full flex flex-col items-center justify-center text-center">
                  <GraduationCap className="w-12 h-12 mb-3 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">Mulai Belajar</h3>
                  <p className="text-white/80 text-sm mb-3">Jelajahi kursus ekspor yang tersedia</p>
                  <div className="flex items-center gap-1 font-semibold">
                    Lihat Kursus <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Spotlight: Grup Utama */}
          {data?.groups && data.groups.length > 0 ? (
            <Link href={`/community/groups/${data.groups[0].slug}`} className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white p-6 h-[200px] shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute right-4 top-4 w-20 h-20 bg-white/10 rounded-full" />
                
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <Badge className="bg-white/20 text-white border-0">
                        💬 Komunitas Aktif
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-1 line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
                      {data.groups[0].name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {data.groups[0].memberCount.toLocaleString()} member aktif
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white/30 border-2 border-violet-500 flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-white/80">+{Math.max(0, data.groups[0].memberCount - 4)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white font-semibold group-hover:gap-2 transition-all">
                      Masuk Grup <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/community/groups" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white p-6 h-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative h-full flex flex-col items-center justify-center text-center">
                  <Users className="w-12 h-12 mb-3 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">Gabung Komunitas</h3>
                  <p className="text-white/80 text-sm mb-3">Temukan grup diskusi eksportir</p>
                  <div className="flex items-center gap-1 font-semibold">
                    Lihat Grup <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Announcements Banner */}
        {data?.announcements && data.announcements.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-amber-900">{data.announcements[0].title}</h3>
                  {data.announcements[0].priority === 'HIGH' && (
                    <Badge variant="destructive" className="text-xs">Penting</Badge>
                  )}
                </div>
                <p className="text-sm text-amber-800 line-clamp-2">{data.announcements[0].content}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100">
                Lihat Semua
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats - Hidden on dashboard, shown in welcome */}
        

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Courses */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* My Courses with Tabs */}
            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    Kursus Saya
                  </CardTitle>
                  <Link href="/learn">
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="in-progress" onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger value="in-progress" className="text-sm">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Sedang Berjalan
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Selesai
                    </TabsTrigger>
                    <TabsTrigger value="not-started" className="text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      Belum Mulai
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="mt-0">
                    {filteredCourses.length > 0 ? (
                      <div className="space-y-3">
                        {filteredCourses.slice(0, 4).map((course) => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Belum ada kursus di kategori ini</p>
                        <Link href="/courses">
                          <Button variant="link" className="mt-2">
                            Jelajahi Kursus →
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Groups & Community */}
            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    Grup Komunitas
                  </CardTitle>
                  <Link href="/community/groups">
                    <Button variant="ghost" size="sm" className="text-purple-600">
                      Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {data?.groups && data.groups.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.groups.slice(0, 4).map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">Belum bergabung ke grup komunitas</p>
                    <Link href="/community/groups">
                      <Button variant="link" className="mt-2">
                        Jelajahi Grup →
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Membership Status */}
            {data?.membership && (
              <Card className="border-0 shadow-lg shadow-blue-500/30 bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:shadow-xl hover:shadow-blue-500/40 transition-shadow duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-300" />
                      <span className="font-semibold">Member Premium</span>
                    </div>
                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                      Aktif
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-100 mb-3">
                    {data.membership.name}
                  </p>
                  {data.membership.expiresAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Berlaku hingga {formatDate(data.membership.expiresAt)}</span>
                    </div>
                  )}
                  <Link href="/dashboard/my-membership">
                    <Button 
                      className="w-full mt-4 bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
                    >
                      Kelola Membership
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    Event Mendatang
                  </CardTitle>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="text-green-600 h-8 px-2">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {data?.events && data.events.length > 0 ? (
                  <div className="space-y-3">
                    {data.events.slice(0, 3).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Tidak ada event mendatang</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Products */}
            <Card className="border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                    Produk Rekomendasi
                  </CardTitle>
                  <Link href="/products">
                    <Button variant="ghost" size="sm" className="text-orange-600 h-8 px-2">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {data?.products && data.products.length > 0 ? (
                  <div className="space-y-3">
                    {data.products.slice(0, 3).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Belum ada produk rekomendasi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-components

function QuickStatCard({ icon: Icon, label, value, color, suffix }: {
  icon: any
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'orange'
  suffix?: string
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  }

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <Icon className="w-6 h-6 mb-2" />
      <p className="text-2xl font-bold">{value}{suffix && <span className="text-sm font-normal ml-1">{suffix}</span>}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const statusColors = {
    'NOT_STARTED': 'bg-gray-100 text-gray-700',
    'IN_PROGRESS': 'bg-blue-100 text-blue-700',
    'COMPLETED': 'bg-green-100 text-green-700',
  }

  const statusLabels = {
    'NOT_STARTED': 'Belum Mulai',
    'IN_PROGRESS': 'On Going',
    'COMPLETED': 'Complete',
  }

  return (
    <Link href={`/learn/${course.slug}`}>
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md shadow-sm transition-all duration-200 group">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden flex-shrink-0 shadow-sm">
          {course.thumbnail ? (
            <Image 
              src={course.thumbnail} 
              alt={course.title}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-blue-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-[15px]">
            {course.title}
          </h4>
          <div className="flex items-center gap-3 mt-2">
            <Badge 
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                course.status === 'COMPLETED' 
                  ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                  : course.status === 'IN_PROGRESS'
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {statusLabels[course.status]}
            </Badge>
            <span className="text-sm text-gray-500 font-medium">
              {course.completedLessons}/{course.totalLessons}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          {course.status === 'COMPLETED' ? (
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 gap-1.5">
              Certificate <Award className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
              {course.status === 'IN_PROGRESS' ? 'Resume Course' : 'Start'} <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Link>
  )
}

function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/community/groups/${group.slug || group.id}`}>
      <div className="p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-md shadow-sm transition-all duration-200 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden flex-shrink-0 shadow-sm">
            {group.thumbnail ? (
              <Image 
                src={group.thumbnail} 
                alt={group.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
              {group.name}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {group.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {group.postCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all duration-200 group">
        <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl flex-shrink-0">
          <span className="text-xl font-bold text-green-700">
            {new Date(event.startDate).getDate()}
          </span>
          <span className="text-[10px] font-medium text-green-600 uppercase">
            {new Date(event.startDate).toLocaleDateString('id-ID', { month: 'short' })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors">
            {event.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(event.startDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            {event.isOnline ? ' • Online' : event.location ? ` • ${event.location}` : ''}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
      </div>
    </Link>
  )
}

function ProductCard({ product }: { product: Product }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all duration-200 group">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden flex-shrink-0 shadow-sm">
          {product.thumbnail ? (
            <Image 
              src={product.thumbnail} 
              alt={product.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-orange-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-orange-700 transition-colors">
            {product.name}
          </h4>
          {product.category && (
            <p className="text-xs text-gray-500 capitalize">{product.category}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-bold text-orange-600">
              {formatPrice(product.price)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
      </div>
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 space-y-6">
      <Skeleton className="h-48 w-full rounded-2xl shadow-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-80 rounded-xl shadow-lg" />
          <Skeleton className="h-48 rounded-xl shadow-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl shadow-lg" />
          <Skeleton className="h-48 rounded-xl shadow-lg" />
          <Skeleton className="h-48 rounded-xl shadow-lg" />
        </div>
      </div>
    </div>
  )
}
