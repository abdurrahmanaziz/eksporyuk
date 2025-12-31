'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  MessageCircle,
  Bell,
  LogOut,
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
  ExternalLink,
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
  likes: number
  comments: number
  tags: string[]
}

interface Banner {
  id: string
  title: string
  description: string | null
  imageUrl: string
  linkUrl: string | null
  buttonText: string | null
  placement: string
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
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [newPostContent, setNewPostContent] = useState('')
  const [feedFilter, setFeedFilter] = useState('Terbaru')
  
  const userName = session?.user?.name?.split(' ')[0] || 'Member'
  const userInitial = userName.charAt(0).toUpperCase()

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="p-4 md:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Welcome Header */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-sm md:text-base text-gray-500">
                Lanjutkan progress belajarmu hari ini.
              </p>
            </div>

            {/* Banner Carousel - Only show if banners exist */}
            {data?.banners && data.banners.length > 0 && (
              <div className="relative w-full rounded-2xl shadow-lg overflow-hidden group">
                {/* Banner Slide */}
                <div className="relative">
                  {data.banners[carouselIndex % data.banners.length] && (
                    <div className="relative min-h-[200px] md:min-h-[280px]">
                      <Image
                        src={data.banners[carouselIndex % data.banners.length].imageUrl}
                        alt={data.banners[carouselIndex % data.banners.length].title}
                        fill
                        className="object-cover"
                        priority
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                      
                      {/* Content overlay */}
                      <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-12 text-white">
                        <h2 className="text-xl md:text-3xl font-bold mb-2 max-w-lg">
                          {data.banners[carouselIndex % data.banners.length].title}
                        </h2>
                        {data.banners[carouselIndex % data.banners.length].description && (
                          <p className="text-sm md:text-base text-white/90 mb-4 max-w-md">
                            {data.banners[carouselIndex % data.banners.length].description}
                          </p>
                        )}
                        {data.banners[carouselIndex % data.banners.length].linkUrl && (
                          <Link 
                            href={data.banners[carouselIndex % data.banners.length].linkUrl!}
                            className="inline-flex"
                          >
                            <Button className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 rounded-lg font-semibold text-sm shadow-md gap-2">
                              {data.banners[carouselIndex % data.banners.length].buttonText || 'Lihat Detail'}
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Carousel Navigation - only show if more than 1 banner */}
                {data.banners.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCarouselIndex((prev) => (prev - 1 + data.banners.length) % data.banners.length)}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full hidden md:flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button 
                      onClick={() => setCarouselIndex((prev) => (prev + 1) % data.banners.length)}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full hidden md:flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    
                    {/* Carousel Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {data.banners.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCarouselIndex(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            carouselIndex % data.banners.length === index 
                              ? 'w-6 bg-white' 
                              : 'w-1.5 bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Community Feed Section */}
            <div className="space-y-6">
              {/* Header */}
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
                    <Avatar className="w-8 h-8 md:w-10 md:h-10">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback className="bg-green-500 text-white font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder={`Apa yang ingin kamu diskusikan hari ini, ${userName}?`}
                        className="w-full bg-gray-50 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
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
                        <Button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Posts - Limited to 5 with spoiler effect */}
              {data?.recentPosts && data.recentPosts.length > 0 ? (
                <>
                  {data.recentPosts.slice(0, 5).map((post, index) => (
                    <Card 
                      key={post.id} 
                      className={`rounded-xl shadow-sm border-gray-100 transition-opacity ${
                        index >= 3 ? 'opacity-60 hover:opacity-100' : ''
                      }`}
                    >
                      <CardContent className="p-4 md:p-6">
                        {/* Post Header */}
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
                              <p className="text-xs text-gray-500">{post.author.role} • {formatTimeAgo(post.createdAt)}</p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Post Content - Preview only */}
                        <Link href={`/community/feed?post=${post.id}`}>
                          <div className="mb-4 cursor-pointer hover:text-blue-600 transition-colors">
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                              {post.content}
                            </p>
                          </div>
                        </Link>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex gap-4 md:gap-6">
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likes}<span className="hidden sm:inline"> Likes</span></span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                              <MessageSquare className="w-4 h-4" />
                              <span>{post.comments}<span className="hidden sm:inline"> Comments</span></span>
                            </button>
                          </div>
                          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium">
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Share</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* View All Button */}
                  <div className="text-center pt-2">
                    <Link href="/community/feed">
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto px-8 py-3 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold"
                      >
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
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Mulai Diskusi
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-6 lg:space-y-8">
            
            {/* Progress Kelas */}
            <Card className="rounded-xl shadow-sm border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-orange-500" />
                    Progress Kelas
                  </h3>
                  <Link href="/learn" className="text-xs font-semibold text-blue-600 hover:underline">
                    Lihat Semua
                  </Link>
                </div>
                
                <div className="space-y-5">
                  {data?.courses && data.courses.length > 0 ? (
                    data.courses.slice(0, 2).map((course, index) => (
                      <Link 
                        key={course.id} 
                        href={`/learn/${course.slug}`}
                        className="block group cursor-pointer"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            index === 0 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {index === 0 ? (
                              <Truck className="w-6 h-6" />
                            ) : (
                              <DollarSign className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {course.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Modul {course.currentModule} dari {course.totalModules}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                          <div 
                            className={`h-1.5 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-purple-500'}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-end text-[10px] text-gray-500 font-medium">
                          {course.progress}% Selesai
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Belum ada kursus yang diikuti</p>
                      <Link href="/courses">
                        <Button variant="link" className="text-blue-600 text-sm mt-2">
                          Jelajahi Kursus →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grup Rekomendasi */}
            <Card className="rounded-xl shadow-sm border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Grup Rekomendasi
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {data?.groups && data.groups.length > 0 ? (
                    data.groups.slice(0, 3).map((group) => (
                      <div key={group.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 overflow-hidden">
                            {group.thumbnail ? (
                              <Image 
                                src={group.thumbnail} 
                                alt={group.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                {group.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{group.name}</h4>
                            <p className="text-xs text-gray-500">{group.memberCount.toLocaleString()} Anggota</p>
                          </div>
                        </div>
                        <Link href={`/community/groups/${group.slug}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full"
                          >
                            Gabung
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tidak ada grup tersedia</p>
                    </div>
                  )}
                </div>
                
                <Link href="/community/groups">
                  <button className="w-full mt-4 text-xs text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
                    Lihat grup lainnya <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Produk Rekomendasi */}
            <Card className="rounded-xl shadow-sm border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-red-500" />
                    Produk Rekomendasi
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {data?.products && data.products.length > 0 ? (
                    data.products.slice(0, 2).map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/products/${product.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 relative">
                            {product.thumbnail ? (
                              <Image 
                                src={product.thumbnail}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-1 my-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">
                                {product.rating.toFixed(1)} ({product.reviewCount})
                              </span>
                            </div>
                            <p className="text-sm font-bold text-blue-600">{formatPrice(product.price)}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
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
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
