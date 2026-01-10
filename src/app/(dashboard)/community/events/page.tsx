'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, MessageCircle, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  type: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  maxAttendees?: number
  group?: {
    id: string
    name: string
    slug: string
  }
  _count: {
    attendees: number
  }
}

export default function CommunityEventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'online' | 'offline'>('upcoming')

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, filter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')
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
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    const now = new Date()
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.startDate) >= now)
        break
      case 'past':
        filtered = filtered.filter(event => new Date(event.endDate) < now)
        break
      case 'online':
        filtered = filtered.filter(event => event.type === 'ONLINE')
        break
      case 'offline':
        filtered = filtered.filter(event => event.type === 'OFFLINE')
        break
    }

    setFilteredEvents(filtered)
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'ONLINE':
        return '🌐'
      case 'OFFLINE':
        return '📍'
      case 'HYBRID':
        return '🔄'
      default:
        return '📅'
    }
  }

  const getEventTypeBadge = (type: string) => {
    const colors = {
      ONLINE: 'bg-blue-100 text-blue-800',
      OFFLINE: 'bg-green-100 text-green-800',
      HYBRID: 'bg-purple-100 text-purple-800',
    }
    return colors[type as keyof typeof colors] || colors.ONLINE
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: idLocale })
    } catch {
      return dateString
    }
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <Card className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border-0 shadow-md">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-orange-600" />
                  Event Komunitas
                </h1>
                <Link href="/community/groups">
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    📁 Lihat Event Grup
                  </Button>
                </Link>
              </div>
              <p className="text-gray-600">
                Temukan dan ikuti event menarik dari komunitas ekspor. Bergabung dengan grup untuk melihat event khusus grup.
              </p>
            </CardContent>
          </Card>

          {/* Navigation Menu */}
          <div className="mb-6 sm:mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/community/feed">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <MessageCircle className="w-4 h-4 mr-2" />
                Feed
              </Button>
            </Link>
            <Link href="/community/groups">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" />
                Grup
              </Button>
            </Link>
            <Link href="/community/events">
              <Button variant="default" size="sm" className="whitespace-nowrap shadow-sm">
                <Calendar className="w-4 h-4 mr-2" />
                Event
              </Button>
            </Link>
            <Link href="/community/members">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" />
                Region
              </Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Cari event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="shadow-sm"
                >
                  Semua
                </Button>
                <Button
                  variant={filter === 'upcoming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('upcoming')}
                >
                  Mendatang
                </Button>
                <Button
                  variant={filter === 'past' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('past')}
                >
                  Selesai
                </Button>
                <Button
                  variant={filter === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('online')}
                >
                  Online
                </Button>
                <Button
                  variant={filter === 'offline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('offline')}
                >
                  Offline
                </Button>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse border-0 shadow-md">
                  <div className="h-48 bg-gradient-to-b from-gray-200 to-gray-300" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum ada event
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Tidak ada event yang sesuai dengan pencarian Anda'
                  : 'Belum ada event tersedia saat ini'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                  {/* Event Header/Image Area */}
                  <div className="h-40 bg-gradient-to-br from-orange-100 to-amber-100 relative overflow-hidden">
                    {/* Type Badge in top-right */}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className={`${getEventTypeBadge(event.type)} text-xs`}>
                        {getEventTypeIcon(event.type)} {event.type}
                      </Badge>
                    </div>

                    {/* Event Title Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                      <h3 className="text-xl font-bold text-white line-clamp-2">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Group Badge */}
                    {event.group && (
                      <Badge variant="outline" className="mb-3 text-xs">
                        📁 {event.group.name}
                      </Badge>
                    )}

                    {/* Event Description */}
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* Event Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      {/* Date & Time */}
                      <div className="flex items-start gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">{formatDate(event.startDate)}</div>
                          {event.endDate && event.startDate !== event.endDate && (
                            <div className="text-xs text-gray-600">s/d {formatDate(event.endDate)}</div>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>

                      {/* Attendees */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-xs">
                          {event._count?.attendees || 0} peserta
                          {event.maxAttendees && ` / ${event.maxAttendees}`}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-center text-sm mb-4">
                      <div>
                        <div className="font-bold text-gray-900">{event._count?.attendees || 0}</div>
                        <div className="text-xs text-gray-600">Peserta</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {event.type === 'ONLINE' ? '🌐' : event.type === 'OFFLINE' ? '📍' : '🔄'}
                        </div>
                        <div className="text-xs text-gray-600">{event.type}</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button size="sm" className="w-full h-9 hover:bg-orange-600">
                      Lihat Detail
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
