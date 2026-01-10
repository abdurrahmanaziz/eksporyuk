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
  eventDate?: string
  eventEndDate?: string
  eventLocation?: string
  maxParticipants?: number
  isActive: boolean
  _count?: {
    UserProduct: number
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, statusFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/events?limit=100', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    const now = new Date()
    if (statusFilter === 'upcoming') {
      filtered = filtered.filter(event => {
        const eventDate = event.eventDate ? new Date(event.eventDate) : null
        return eventDate && eventDate >= now
      })
    } else if (statusFilter === 'past') {
      filtered = filtered.filter(event => {
        const eventDate = event.eventDate ? new Date(event.eventDate) : null
        return eventDate && eventDate < now
      })
    }

    setFilteredEvents(filtered)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Event & Webinar</h1>
          <p className="text-blue-100">Temukan event terbaik untuk pengembangan bisnis ekspor Anda</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Search */}
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Event</SelectItem>
              <SelectItem value="upcoming">Akan Datang</SelectItem>
              <SelectItem value="past">Event Lalu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Event tidak ditemukan</p>
          </div>
        )}

        {/* Event Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventDate = event.eventDate ? new Date(event.eventDate) : null
              const attendeeCount = event._count?.UserProduct || 0
              const isUpcoming = eventDate && eventDate >= new Date()

              return (
                <Link key={event.id} href={`/events/${event.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    {/* Thumbnail */}
                    {event.thumbnail && (
                      <div className="relative w-full h-48 bg-gray-200">
                        <Image
                          src={event.thumbnail}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      {/* Status Badge */}
                      <div className="flex gap-2">
                        {isUpcoming && (
                          <Badge className="bg-green-500">Akan Datang</Badge>
                        )}
                        {event.isActive && (
                          <Badge variant="outline">Aktif</Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-lg line-clamp-2">{event.name}</h3>

                      {/* Description */}
                      {event.shortDescription && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.shortDescription}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="space-y-2 pt-2 border-t">
                        {eventDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4" />
                            <span>{format(eventDate, 'd MMM yyyy', { locale: idLocale })}</span>
                          </div>
                        )}

                        {attendeeCount > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Users className="w-4 h-4" />
                            <span>{attendeeCount} peserta</span>
                          </div>
                        )}
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Harga</p>
                          <p className="font-bold text-blue-600">
                            Rp {event.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Lihat Detail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
