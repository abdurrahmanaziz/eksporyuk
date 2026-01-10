'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  ArrowLeft,
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
  description?: string
  shortDescription?: string
  price: number
  originalPrice?: number
  thumbnail?: string
  eventDate?: string
  eventEndDate?: string
  eventDuration?: number
  eventUrl?: string
  eventLocation?: string
  maxParticipants?: number
  isActive: boolean
  salesPageUrl?: string
  _count?: {
    UserProduct: number
  }
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent()
  }, [slug])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch event by slug from admin API
      const response = await fetch(`/api/admin/events?search=${slug}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Event tidak ditemukan')
      }
      
      const data = await response.json()
      const foundEvent = data.events?.find((e: any) => e.slug === slug)
      
      if (!foundEvent) {
        setError('Event tidak ditemukan')
        return
      }
      
      setEvent(foundEvent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      toast.error('Gagal memuat event')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 text-center mb-4">{error || 'Event tidak ditemukan'}</p>
            <Link href="/community/events" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventDate = event.eventDate ? new Date(event.eventDate) : null
  const attendeeCount = event._count?.UserProduct || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/community/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="flex-1 text-xl font-bold truncate">{event.name}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Thumbnail */}
        {event.thumbnail && (
          <div className="relative w-full h-80 rounded-lg overflow-hidden mb-8 bg-gray-200">
            <Image
              src={event.thumbnail}
              alt={event.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Title & Badge */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-3xl font-bold">{event.name}</h1>
                {event.isActive && <Badge className="bg-green-500">Aktif</Badge>}
              </div>
              {event.shortDescription && (
                <p className="text-gray-600">{event.shortDescription}</p>
              )}
            </div>

            {/* Event Meta */}
            <div className="grid grid-cols-2 gap-4">
              {eventDate && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tanggal</p>
                    <p className="font-semibold">
                      {format(eventDate, 'd MMMM yyyy', { locale: idLocale })}
                    </p>
                  </div>
                </div>
              )}

              {event.eventDuration && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Durasi</p>
                    <p className="font-semibold">{event.eventDuration} menit</p>
                  </div>
                </div>
              )}

              {event.eventLocation && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg col-span-2 md:col-span-1">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Lokasi</p>
                    <p className="font-semibold truncate">{event.eventLocation}</p>
                  </div>
                </div>
              )}

              {event.maxParticipants && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg col-span-2 md:col-span-1">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Kapasitas</p>
                    <p className="font-semibold">{event.maxParticipants} peserta</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendees */}
            {attendeeCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-900">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">{attendeeCount} peserta sudah mendaftar</span>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-bold mb-3">Deskripsi Event</h3>
                <p className="whitespace-pre-wrap text-gray-700">{event.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar - CTA */}
          <div>
            <Card className="sticky top-24 border-2">
              <CardContent className="pt-6 space-y-4">
                {/* Price */}
                <div>
                  {event.originalPrice && event.originalPrice > event.price && (
                    <p className="text-sm text-gray-500 line-through">
                      Rp {event.originalPrice.toLocaleString('id-ID')}
                    </p>
                  )}
                  <p className="text-3xl font-bold text-blue-600">
                    Rp {event.price.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => {
                    // Redirect ke sales page jika ada, atau checkout
                    const url = event.salesPageUrl || 
                               `/checkout/product/${event.checkoutSlug || event.slug}`
                    window.open(url, '_blank')
                  }}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  {event.salesPageUrl ? 'Lihat Sales Page' : 'Daftar Sekarang'}
                </Button>

                {/* Checkout Link */}
                {!event.salesPageUrl && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/checkout/product/${event.checkoutSlug || event.slug}`)}
                    className="w-full"
                  >
                    Beli Tiket
                  </Button>
                )}

                {/* Event URL */}
                {event.eventUrl && (
                  <Button
                    variant="ghost"
                    onClick={() => window.open(event.eventUrl, '_blank')}
                    className="w-full"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Akses Event
                  </Button>
                )}

                {/* Info */}
                <p className="text-xs text-gray-500 text-center pt-2">
                  Pendaftaran event akan ditutup sesaat sebelum event dimulai
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
