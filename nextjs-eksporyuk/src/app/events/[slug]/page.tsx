'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  ArrowLeft,
  CheckCircle,
  Star,
  Share2,
  Copy,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Event {
  id: string
  name: string
  slug: string
  checkoutSlug?: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  thumbnail?: string
  category?: string
  tags?: string | string[]
  productType: string
  productStatus?: string
  isActive: boolean
  isFeatured: boolean
  // Event specific fields
  eventDate?: string
  eventEndDate?: string
  eventDuration?: number
  eventUrl?: string
  meetingId?: string
  meetingPassword?: string
  eventLocation?: string
  maxParticipants?: number
  eventVisibility?: string
  // Creator
  creator?: {
    id: string
    name: string | null
    avatar?: string
  }
  // Stats
  _count?: {
    userProducts: number
  }
  soldCount?: number
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [resolvedParams.slug])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      // Fetch as Product with type EVENT
      const response = await fetch(`/api/products/${resolvedParams.slug}`)
      
      if (response.ok) {
        const data = await response.json()
        const product = data.product
        
        // Verify it's an EVENT type product
        if (product.productType !== 'EVENT') {
          // Not an event, redirect to product page
          router.push(`/products/${resolvedParams.slug}`)
          return
        }
        
        setEvent(product)
      } else {
        toast.error('Event tidak ditemukan')
        router.push('/events')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Gagal memuat data event')
      router.push('/events')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'EEEE, d MMMM yyyy', { locale: idLocale })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'HH:mm', { locale: idLocale })
    } catch {
      return dateString
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link berhasil disalin!')
    } catch {
      toast.error('Gagal menyalin link')
    }
  }

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.name,
          text: event?.shortDescription || event?.description?.substring(0, 100),
          url: window.location.href
        })
      } catch (err) {
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const getEventStatus = () => {
    if (!event?.eventDate) return null
    const now = new Date()
    const eventDate = new Date(event.eventDate)
    const eventEndDate = event.eventEndDate ? new Date(event.eventEndDate) : eventDate

    if (now > eventEndDate) return 'past'
    if (now >= eventDate && now <= eventEndDate) return 'ongoing'
    return 'upcoming'
  }

  const getStatusBadge = () => {
    const status = getEventStatus()
    switch (status) {
      case 'past':
        return <Badge variant="secondary">Selesai</Badge>
      case 'ongoing':
        return <Badge className="bg-green-500">Sedang Berlangsung</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>
      default:
        return null
    }
  }

  const isEventAvailable = () => {
    const status = getEventStatus()
    return status === 'upcoming' && event?.isActive
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-600 mt-4">Memuat event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Event yang Anda cari tidak tersedia</p>
          <Link href="/events">
            <Button>Lihat Event Lainnya</Button>
          </Link>
        </div>
      </div>
    )
  }

  const checkoutSlug = event.checkoutSlug || event.slug

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/events">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative">
        {event.thumbnail ? (
          <div 
            className="h-64 md:h-96 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.thumbnail})` }}
          >
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : (
          <div className="h-64 md:h-96 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Calendar className="h-24 w-24 text-white/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge()}
                  {event.isFeatured && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {event.category && (
                    <Badge variant="outline">{event.category}</Badge>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{event.name}</h1>
                  {event.shortDescription && (
                    <p className="text-gray-600 mt-2">{event.shortDescription}</p>
                  )}
                </div>

                <Separator />

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.eventDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Tanggal</div>
                        <div className="font-medium">{formatDate(event.eventDate)}</div>
                      </div>
                    </div>
                  )}

                  {event.eventDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Waktu</div>
                        <div className="font-medium">
                          {formatTime(event.eventDate)}
                          {event.eventEndDate && ` - ${formatTime(event.eventEndDate)}`} WIB
                        </div>
                      </div>
                    </div>
                  )}

                  {event.eventLocation && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Lokasi</div>
                        <div className="font-medium">{event.eventLocation}</div>
                      </div>
                    </div>
                  )}

                  {event.eventUrl && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Video className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Format</div>
                        <div className="font-medium">Online Meeting</div>
                      </div>
                    </div>
                  )}

                  {event.maxParticipants && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Kuota</div>
                        <div className="font-medium">
                          {event.soldCount || 0} / {event.maxParticipants} peserta
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h2 className="text-xl font-semibold mb-3">Tentang Event</h2>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: event.description?.replace(/\n/g, '<br/>') || '' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                {/* Price */}
                <div className="text-center">
                  {event.originalPrice && event.originalPrice > event.price && (
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(event.originalPrice)}
                    </div>
                  )}
                  <div className="text-3xl font-bold text-orange-600">
                    {event.price === 0 ? 'GRATIS' : formatPrice(event.price)}
                  </div>
                  {event.originalPrice && event.originalPrice > event.price && (
                    <Badge className="mt-1 bg-red-500">
                      Hemat {Math.round((1 - event.price / event.originalPrice) * 100)}%
                    </Badge>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>E-Ticket & akses event</span>
                  </div>
                  {event.eventUrl && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Link meeting akan diberikan</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Sertifikat kehadiran</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Materi & rekaman (jika ada)</span>
                  </div>
                </div>

                <Separator />

                {/* CTA */}
                {isEventAvailable() ? (
                  <Link href={`/checkout/product/${checkoutSlug}`}>
                    <Button className="w-full" size="lg">
                      Daftar Sekarang
                    </Button>
                  </Link>
                ) : getEventStatus() === 'past' ? (
                  <Button className="w-full" size="lg" disabled>
                    Event Sudah Selesai
                  </Button>
                ) : getEventStatus() === 'ongoing' ? (
                  <Button className="w-full" size="lg" disabled>
                    Event Sedang Berlangsung
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Tidak Tersedia
                  </Button>
                )}

                {/* Share */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={shareEvent}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organizer */}
            {event.creator && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Diselenggarakan oleh</h3>
                  <div className="flex items-center gap-3">
                    {event.creator.avatar ? (
                      <Image
                        src={event.creator.avatar}
                        alt={event.creator.name || ''}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold">
                        {(event.creator.name || 'E').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{event.creator.name || 'EksporYuk'}</div>
                      <div className="text-sm text-gray-500">Event Organizer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
