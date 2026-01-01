'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Search,
  Play,
  Image as ImageIcon,
  Paperclip,
  Smile,
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Star,
  Users,
  ShoppingBag,
  GraduationCap,
  Truck,
  DollarSign,
  Loader2,
  Send,
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  progress: number
  totalLessons: number
  completedLessons: number
  currentModule: number
  totalModules: number
}

interface Group {
  id: string
  slug: string
  name: string
  thumbnail: string | null
  memberCount: number
}

interface Product {
  id: string
  name: string
  slug: string
  thumbnail: string | null
  price: number
  rating: number
  reviewCount: number
}

interface Post {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string | null
    role: string
  }
  createdAt: string
  likesCount: number
  commentsCount: number
  tags: string[]
  images?: string[]
}

interface Banner {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  linkUrl: string
  linkText: string | null
  backgroundColor: string | null
  textColor: string | null
  buttonColor: string | null
  buttonTextColor: string | null
}

interface DashboardData {
  courses: Course[]
  groups: Group[]
  products: Product[]
  recentPosts: Post[]
  banners: Banner[]
  stats: {
    totalCourses: number
    completedCourses: number
    totalLessons: number
    completedLessons: number
  }
}

export default function PremiumDashboardNew() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [newPostContent, setNewPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [feedFilter, setFeedFilter] = useState('Terbaru')
  
  const userName = session?.user?.name?.split(' ')[0] || 'Member'
  const userInitial = userName.charAt(0).toUpperCase()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    if (data?.banners && data.banners.length > 1) {
      const timer = setInterval(() => {
        setBannerIndex((prev) => (prev + 1) % data.banners.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [data?.banners])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/premium-new')
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

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Tulis sesuatu untuk diposting')
      return
    }

    try {
      setPosting(true)
      const res = await fetch('/api/community/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          type: 'PUBLIC'
        })
      })

      if (res.ok) {
        toast.success('Post berhasil dibuat!')
        setNewPostContent('')
        fetchDashboardData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal membuat post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Gagal membuat post')
    } finally {
      setPosting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Baru saja'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
  }

  const weeklyProgress = data?.stats.totalLessons 
    ? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100) 
    : 0

  const currentCourse = data?.courses?.[0]

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        {/* Welcome Header - Full Width */}
        <div className="max-w-7xl mx-auto mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            Lanjutkan progress belajarmu hari ini.
          </p>
        </div>

        {/* Main Grid: 2 Column Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:gap-6">
            
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6">

            {/* Hero Banner Card - Blue Gradient */}
            {data?.banners && data.banners.length > 0 ? (
              <div 
                className="relative w-full rounded-2xl shadow-lg overflow-hidden group min-h-[280px] md:min-h-[320px]"
                style={{ 
                  background: data.banners[bannerIndex]?.backgroundColor 
                    ? `linear-gradient(135deg, ${data.banners[bannerIndex].backgroundColor}, #4F46E5)`
                    : 'linear-gradient(135deg, #2563EB, #4F46E5)'
                }}
              >
                <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 rounded-l-full blur-3xl transform translate-x-1/4"></div>
                <div className="absolute right-10 bottom-10 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 p-6 md:p-12 text-white h-full flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-4 w-fit">
                    <span>🚀</span> <span>Fantastic Progress!</span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight max-w-lg">
                    {data.banners[bannerIndex]?.title || 'Mastering Export Logistics in 4 Weeks'}
                  </h2>
                  
                  <p className="text-blue-100 mb-6 text-sm md:text-base max-w-md">
                    {data.banners[bannerIndex]?.description || `Kamu sudah menyelesaikan ${weeklyProgress}% dari target mingguan. Yuk gas lagi belajarnya!`}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link href={data.banners[bannerIndex]?.linkUrl || '/learn'}>
                      <Button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                        <Play className="w-4 h-4 fill-current" />
                        {data.banners[bannerIndex]?.linkText || 'Lanjut Belajar'}
                      </Button>
                    </Link>
                    
                    <div className="flex-1 w-full sm:max-w-[150px]">
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span>Progress</span>
                        <span>{weeklyProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-900/30 rounded-full h-1.5">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(weeklyProgress, 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {data.banners.length > 1 && (
                  <>
                    <button 
                      onClick={() => setBannerIndex((prev) => (prev - 1 + data.banners.length) % data.banners.length)}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 rounded-full hidden md:flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button 
                      onClick={() => setBannerIndex((prev) => (prev + 1) % data.banners.length)}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 rounded-full hidden md:flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {data.banners.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setBannerIndex(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            bannerIndex === index 
                              ? 'w-6 bg-white' 
                              : 'w-1.5 bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="relative w-full rounded-2xl shadow-lg overflow-hidden group min-h-[280px] md:min-h-[320px] bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 rounded-l-full blur-3xl transform translate-x-1/4"></div>
                <div className="absolute right-10 bottom-10 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 p-6 md:p-12 text-white h-full flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-4 w-fit">
                    <span>🚀</span> <span>Fantastic Progress!</span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight max-w-lg">
                    {currentCourse?.title || 'Mastering Export Logistics in 4 Weeks'}
                  </h2>
                  
                  <p className="text-blue-100 mb-6 text-sm md:text-base max-w-md">
                    Kamu sudah menyelesaikan {weeklyProgress}% dari target mingguan. Yuk gas lagi belajarnya!
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link href={currentCourse ? `/learn/${currentCourse.slug}` : '/courses'}>
                      <Button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                        <Play className="w-4 h-4 fill-current" />
                        Lanjut Belajar
                      </Button>
                    </Link>
                    
                    <div className="flex-1 w-full sm:max-w-[150px]">
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span>Progress</span>
                        <span>{weeklyProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-900/30 rounded-full h-1.5">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(weeklyProgress, 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Community Feed Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Community Feed
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                      className="w-full sm:w-auto bg-white border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search discussions..."
                    />
                  </div>
                  <select 
                    value={feedFilter}
                    onChange={(e) => setFeedFilter(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-lg py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Terbaru</option>
                    <option>Populer</option>
                    <option>Diskusi Saya</option>
                  </select>
                </div>
              </div>

              {/* Create Post Card */}
              <Card className="rounded-xl shadow-sm border-gray-100">
                <CardContent className="p-4">
                  <div className="flex gap-3 md:gap-4">
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback className="bg-green-500 text-white font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleCreatePost()
                          }
                        }}
                        placeholder={`Apa yang ingin kamu diskusikan hari ini, ${userName}?`}
                        className="w-full bg-gray-50 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
                        disabled={posting}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-1 md:gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Smile className="w-5 h-5" />
                          </button>
                        </div>
                        <Button 
                          onClick={handleCreatePost}
                          disabled={posting || !newPostContent.trim()}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                          {posting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            'Post'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Posts */}
              {data?.recentPosts && data.recentPosts.length > 0 ? (
                <>
                  {data.recentPosts.map((post, index) => (
                    <Card key={post.id} className="rounded-xl shadow-sm border-gray-100">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Link href={`/profile/${post.author.id}`}>
                              <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                                <AvatarImage src={post.author.avatar || ''} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                                  {post.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div>
                              <Link href={`/profile/${post.author.id}`}>
                                <h4 className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors cursor-pointer">
                                  {post.author.name}
                                </h4>
                              </Link>
                              <p className="text-xs text-gray-500">
                                {post.author.role === 'MEMBER_PREMIUM' ? 'Member Premium' : 
                                 post.author.role === 'ADMIN' ? 'Admin' :
                                 post.author.role === 'MENTOR' ? 'Mentor' :
                                 post.author.role} • {formatTimeAgo(post.createdAt)}
                              </p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>

                        <Link href={`/community/feed?post=${post.id}`}>
                          <div className="mb-4 cursor-pointer hover:text-blue-600 transition-colors">
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>
                          </div>
                        </Link>

                        {post.images && post.images.length > 0 && (
                          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                            {post.images.slice(0, 4).map((img, imgIndex) => (
                              <div key={imgIndex} className="relative aspect-video bg-gray-100">
                                <Image src={img} alt={`Post image ${imgIndex + 1}`} fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex gap-4 md:gap-6">
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likesCount}<span className="hidden sm:inline"> Likes</span></span>
                            </button>
                            <Link href={`/community/feed?post=${post.id}`}>
                              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                                <MessageSquare className="w-4 h-4" />
                                <span>{post.commentsCount}<span className="hidden sm:inline"> Comments</span></span>
                              </button>
                            </Link>
                          </div>
                          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Share</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="text-center pt-2">
                    <Link href="/community/feed">
                      <Button variant="outline" className="w-full sm:w-auto px-8 py-3 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold">
                        Lihat Semua Diskusi
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <Card className="rounded-xl shadow-sm border-gray-100">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-700 mb-1">Belum ada diskusi</h4>
                    <p className="text-sm text-gray-500 mb-4">Jadilah yang pertama memulai diskusi!</p>
                    <Link href="/community/feed">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">Mulai Diskusi</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar - Fixed Width */}
          <aside className="w-full lg:w-80 xl:w-96 lg:flex-shrink-0 space-y-6 lg:mt-0 mt-6">
            
            {/* Progress Kelas */}
            <Card className="rounded-xl shadow-sm border border-gray-100 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <span className="text-lg">🎯</span>
                    Progress Kelas
                  </h3>
                  <Link href="/learn" className="text-xs font-semibold text-blue-600 hover:underline">Lihat Semua</Link>
                </div>
                
                <div className="space-y-4">
                  {data?.courses && data.courses.length > 0 ? (
                    data.courses.slice(0, 2).map((course, index) => (
                      <Link key={course.id} href={`/learn/${course.slug}`} className="block group">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-blue-100' : 'bg-purple-100'}`}>
                            {course.thumbnail ? (
                              <Image src={course.thumbnail} alt={course.title} width={44} height={44} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-xl">{index === 0 ? '📦' : '💰'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{course.title}</h4>
                            <p className="text-xs text-gray-500">Modul {course.currentModule} dari {course.totalModules}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${index === 0 ? 'bg-blue-600' : 'bg-purple-500'}`} style={{ width: `${Math.max(course.progress, 5)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{course.progress}% Selesai</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Belum ada kursus</p>
                      <Link href="/courses"><Button variant="link" className="text-blue-600 text-sm mt-2">Jelajahi Kursus →</Button></Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grup Rekomendasi */}
            <Card className="rounded-xl shadow-sm border border-gray-100 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <span className="text-lg">👥</span>
                    Grup Rekomendasi
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {data?.groups && data.groups.length > 0 ? (
                    data.groups.slice(0, 3).map((group, index) => {
                      const gradients = [
                        'from-green-400 to-emerald-500',
                        'from-orange-400 to-red-500', 
                        'from-blue-400 to-indigo-500'
                      ]
                      return (
                        <div key={group.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradients[index % 3]} overflow-hidden`}>
                              {group.thumbnail ? (
                                <Image src={group.thumbnail} alt={group.name} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{group.name.charAt(0)}</div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{group.name}</h4>
                              <p className="text-xs text-gray-500">{group.memberCount.toLocaleString()} Anggota</p>
                            </div>
                          </div>
                          <Link href={`/community/groups/${group.slug}`}>
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full h-auto">Gabung</Button>
                          </Link>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-4">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tidak ada grup tersedia</p>
                    </div>
                  )}
                </div>
                
                <Link href="/community/groups">
                  <button className="w-full mt-3 text-xs text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
                    Lihat grup lainnya <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Produk Rekomendasi */}
            <Card className="rounded-xl shadow-sm border border-gray-100 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <span className="text-lg">🛍️</span>
                    Produk Rekomendasi
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {data?.products && data.products.length > 0 ? (
                    data.products.slice(0, 2).map((product) => (
                      <Link key={product.id} href={`/products/${product.slug}`} className="block group">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {product.thumbnail ? (
                              <Image src={product.thumbnail} alt={product.name} width={56} height={56} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{product.name}</h4>
                            <div className="flex items-center gap-1 my-0.5">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">{product.rating.toFixed(1)} ({product.reviewCount})</span>
                            </div>
                            <p className="text-sm font-bold text-blue-600">{formatPrice(product.price)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tidak ada produk tersedia</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Skeleton className="h-[280px] w-full rounded-2xl" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
