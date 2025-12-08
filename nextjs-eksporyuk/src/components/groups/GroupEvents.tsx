'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface GroupEventsProps {
  groupId: string
}

export default function GroupEvents({ groupId }: GroupEventsProps) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [groupId])

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/events?filter=upcoming`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Fetch events error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (eventId: string, status: string) => {
    setRsvpLoading(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success('RSVP berhasil diperbarui')
        fetchEvents()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal memperbarui RSVP')
      }
    } catch (error) {
      console.error('RSVP error:', error)
      toast.error('Gagal memperbarui RSVP')
    } finally {
      setRsvpLoading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada event mendatang</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const userRsvp = event.rsvps[0]?.status
        const isEventFull = event.maxAttendees && event._count.rsvps >= event.maxAttendees

        return (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  {event.description && (
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  )}
                </div>
                {isEventFull && !userRsvp && (
                  <Badge variant="destructive">Penuh</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.startDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {format(new Date(event.startDate), 'HH:mm', { locale: idLocale })}
                  {event.endDate && ` - ${format(new Date(event.endDate), 'HH:mm', { locale: idLocale })}`}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
                {event.meetLink && (
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4" />
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Link Meeting
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {event._count.rsvps} peserta
                  {event.maxAttendees && ` / ${event.maxAttendees} maks`}
                </div>
              </div>

              {/* RSVP Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant={userRsvp === 'GOING' ? 'default' : 'outline'}
                  onClick={() => handleRSVP(event.id, 'GOING')}
                  disabled={rsvpLoading === event.id || (isEventFull && userRsvp !== 'GOING')}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Hadir
                </Button>
                <Button
                  size="sm"
                  variant={userRsvp === 'MAYBE' ? 'default' : 'outline'}
                  onClick={() => handleRSVP(event.id, 'MAYBE')}
                  disabled={rsvpLoading === event.id}
                  className="flex-1"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Mungkin
                </Button>
                <Button
                  size="sm"
                  variant={userRsvp === 'NOT_GOING' ? 'default' : 'outline'}
                  onClick={() => handleRSVP(event.id, 'NOT_GOING')}
                  disabled={rsvpLoading === event.id}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tidak Hadir
                </Button>
              </div>

              {/* Current RSVP Status */}
              {userRsvp && (
                <div className="text-sm text-center pt-2">
                  <Badge variant="outline">
                    Status Anda: {
                      userRsvp === 'GOING' ? '✓ Hadir' :
                      userRsvp === 'MAYBE' ? '? Mungkin' :
                      '✗ Tidak Hadir'
                    }
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
