'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Play,
  Users,
  Calendar,
  MapPin,
  Video,
  ThumbsUp,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Download,
  Filter,
  MoreHorizontal,
  Sparkles,
  HelpCircle
} from 'lucide-react'

interface MemberDashboardProps {
  data: any
  user: any
}

export default function MemberDashboard({ data, user }: MemberDashboardProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  const activeMembership = data.activeMembership
  const isPremium = activeMembership && activeMembership.membership

  // Banner carousel
  const handlePrevBanner = () => {
    setCurrentBannerIndex((prev) => (prev === 0 ? data.banners.length - 1 : prev - 1))
  }

  const handleNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev === data.banners.length - 1 ? 0 : prev + 1))
  }

  return (
    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
            Selamat Datang Kembali, {user.name || 'Member'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Berikut yang terjadi di komunitas Anda hari ini.
          </p>
        </div>
        {data.courses.length > 0 && (
          <Link
            href={`/course/${data.courses[0].id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/30"
          >
            <Play className="w-5 h-5" />
            Lanjutkan Belajar
          </Link>
        )}
      </div>

      {/* Banner Carousel - Only show if banners exist */}
      {data.banners.length > 0 && (
        <div className="mb-8 relative group">
          <div className="flex overflow-hidden rounded-2xl shadow-md">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {data.banners.map((banner: any, index: number) => (
                <div
                  key={banner.id}
                  className="w-full flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 sm:p-10 min-h-[220px] flex flex-col justify-center"
                >
                  {banner.backgroundImage && (
                    <div className="absolute inset-0 opacity-20">
                      <Image
                        src={banner.backgroundImage}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="relative z-10 max-w-xl">
                    {banner.badge && (
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-bold mb-4 border border-white/10">
                        <Sparkles className="w-4 h-4" />
                        <span>{banner.badge}</span>
                      </div>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">{banner.title}</h2>
                    <p className="text-blue-50/90 mb-6 text-sm sm:text-base font-medium">
                      {banner.description}
                    </p>
                    {banner.ctaText && banner.ctaLink && (
                      <Link
                        href={banner.ctaLink}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-xl transition-all shadow-lg inline-flex items-center gap-2"
                      >
                        <span>{banner.ctaText}</span>
                        <Play className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Navigation */}
          {data.banners.length > 1 && (
            <>
              <button
                onClick={handlePrevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <button
                onClick={handleNextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
              <div className="flex justify-center gap-2 mt-4">
                {data.banners.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentBannerIndex ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          {/* Kelas Sedang Dipelajari */}
          {data.courses.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[22px] font-bold">Kelas Sedang Dipelajari</h2>
                <Link href="/dashboard/my-courses" className="text-blue-600 text-sm font-bold hover:underline">
                  Lihat Semua
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.courses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/course/${course.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                  >
                    <div className="flex gap-4">
                      <div
                        className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{
                          backgroundImage: course.thumbnail
                            ? `url(${course.thumbnail})`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                      <div className="flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold line-clamp-1">{course.title}</h3>
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-md">
                              {course.category}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            Pelajaran {course.currentLesson} dari {course.totalLessons}
                          </p>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progres</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                course.progress >= 80 ? 'bg-green-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Grup Komunitas Anda */}
          {data.groups.length > 0 && (
            <section>
              <h2 className="text-[22px] font-bold mb-4">Grup Komunitas Anda</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.groups.map((group: any) => (
                  <Link
                    key={group.id}
                    href={`/community/groups/${group.id}`}
                    className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{
                        backgroundImage: group.coverImage
                          ? `url(${group.coverImage})`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <p className="text-white text-lg font-bold leading-tight">{group.name}</p>
                      <p className="text-gray-300 text-xs mt-1">
                        {group.memberCount.toLocaleString('id-ID')} Anggota
                        {group.newPostsCount > 0 && ` • ${group.newPostsCount} Postingan Baru`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Feed Komunitas */}
          {data.posts.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[22px] font-bold">Feed Komunitas</h2>
                <button className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-full transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {data.posts.map((post: any, index: number) => (
                  <div
                    key={post.id}
                    className={`flex gap-4 ${
                      index !== data.posts.length - 1 ? 'border-b border-gray-200 dark:border-gray-700 pb-6' : ''
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-full bg-cover bg-center flex-shrink-0"
                      style={{
                        backgroundImage: post.authorAvatar
                          ? `url(${post.authorAvatar})`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-base">
                            {post.authorName}{' '}
                            <span className="text-gray-600 dark:text-gray-500 font-normal text-sm ml-2">
                              posting di <span className="text-blue-600 font-medium">{post.groupName}</span>
                            </span>
                          </p>
                          <p className="text-gray-600 dark:text-gray-500 text-xs">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: idLocale
                            })}
                          </p>
                        </div>
                        <button className="text-gray-600 hover:text-gray-900 dark:hover:text-white">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-gray-900 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                        {post.content}
                      </p>
                      <div className="flex gap-4 mt-3">
                        <button className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm font-medium transition-colors">
                          <ThumbsUp className="w-4 h-4" /> {post.likesCount}
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-sm font-medium transition-colors">
                          <MessageCircle className="w-4 h-4" /> {post.commentsCount}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          {/* Membership Status */}
          {isPremium && (
            <div className="px-4 pb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/20 text-center">
                <div className="w-10 h-10 bg-white/50 dark:bg-black/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-200">
                  Member {activeMembership.membership.name}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                  Aktif hingga{' '}
                  {new Date(activeMembership.endDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Event Mendatang */}
          {data.events.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Event Mendatang</h2>
                <button className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors">
                  <Calendar className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {data.events.map((event: any) => {
                  const eventDate = new Date(event.startDate)
                  const month = eventDate.toLocaleDateString('id-ID', { month: 'short' })
                  const day = eventDate.getDate()

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex gap-4 items-start group cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <span className="text-xs font-bold uppercase">{month}</span>
                        <span className="text-xl font-bold">{day}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                          {event.meetingUrl ? (
                            <><Video className="w-3.5 h-3.5" /> Virtual</>
                          ) : (
                            <><MapPin className="w-3.5 h-3.5" /> {event.location || 'Lokasi TBA'}</>
                          )}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Rekomendasi Produk */}
          {data.products.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-bold px-1">Rekomendasi untuk Anda</h2>
              {data.products.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug || product.id}`}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div
                    className="aspect-video w-full rounded-lg bg-cover bg-center mb-3"
                    style={{
                      backgroundImage: product.thumbnail
                        ? `url(${product.thumbnail})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  />
                  <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {product.category || 'Produk Digital'}
                    </span>
                    <span className="text-blue-600 font-bold text-sm">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(Number(product.price))}
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {/* Bantuan */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/40 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Butuh Bantuan?</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-3">
              Hubungi tim support kami untuk pertanyaan apapun.
            </p>
            <Link
              href="/support"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Hubungi Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
