'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar, 
  Clock, 
  Users, 
  Search,
  Star,
  MapPin,
  Video,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Event {
  id: string
  name: string
  slug: string
  checkoutSlug?: string
  shortDescription?: string
  price: number
  originalPrice?: number
  thumbnail?: string
  category?: string
  eventDate?: string
  eventEndDate?: string
  eventLocation?: string
  eventUrl?: string
  maxParticipants?: number
  isActive: boolean
  isFeatured: boolean
  productStatus?: string
  _count?: {
    userProducts: number
  }
  soldCount?: number
}

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('upcoming')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchEvents()
  }, [statusFilter])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, categoryFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/events?status=${statusFilter}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(query) ||
        event.shortDescription?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    setFilteredEvents(filtered)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: idLocale })
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

  const getEventStatus = (event: Event) => {
    if (!event.eventDate) return null
    const now = new Date()
    const eventDate = new Date(event.eventDate)
    const eventEndDate = event.eventEndDate ? new Date(event.eventEndDate) : eventDate

    if (now > eventEndDate) return 'past'
    if (now >= eventDate && now <= eventEndDate) return 'ongoing'
    return 'upcoming'
  }

  const categories = [...new Set(events.map(e => e.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Event & Workshop</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Tingkatkan skill ekspor Anda dengan mengikuti event, workshop, dan training dari para expert
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Akan Datang</SelectItem>
                <SelectItem value="ongoing">Sedang Berlangsung</SelectItem>
                <SelectItem value="past">Selesai</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
            <p className="text-gray-600 mt-4">Memuat event...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada event</h3>
            <p className="text-gray-600">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Coba ubah filter pencarian Anda'
                : 'Belum ada event yang tersedia saat ini'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {/* Thumbnail */}
                  <div className="relative h-48">
                    {event.thumbnail ? (
                      <Image
                        src={event.thumbnail}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {event.isFeatured && (
                        <Badge className="bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {getEventStatus(event) === 'ongoing' && (
                        <Badge className="bg-green-500">Live</Badge>
                      )}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-3 right-3">
                      <Badge className={event.price === 0 ? "bg-green-500" : "bg-orange-500"}>
                        {event.price === 0 ? 'GRATIS' : formatPrice(event.price)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Category */}
                    {event.category && (
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {event.name}
                    </h3>

                    {/* Short Description */}
                    {event.shortDescription && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.shortDescription}
                      </p>
                    )}

                    {/* Event Info */}
                    <div className="space-y-2 text-sm text-gray-500">
                      {event.eventDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.eventDate)}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{formatTime(event.eventDate)} WIB</span>
                        </div>
                      )}

                      {event.eventLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.eventLocation}</span>
                        </div>
                      )}

                      {event.eventUrl && !event.eventLocation && (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <span>Online Event</span>
                        </div>
                      )}

                      {event.maxParticipants && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.soldCount || event._count?.userProducts || 0} / {event.maxParticipants} peserta
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Button 
                      className="w-full mt-2" 
                      variant={getEventStatus(event) === 'upcoming' ? 'default' : 'secondary'}
                      disabled={getEventStatus(event) === 'past'}
                    >
                      {getEventStatus(event) === 'upcoming' 
                        ? 'Lihat Detail' 
                        : getEventStatus(event) === 'ongoing'
                        ? 'Sedang Berlangsung'
                        : 'Event Selesai'}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
