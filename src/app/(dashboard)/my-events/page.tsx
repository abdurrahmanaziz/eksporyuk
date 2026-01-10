'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Video, CheckCircle, Clock as ClockIcon, XCircle, ExternalLink, Ticket, Users, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';

interface EventRSVP {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
    location: string | null;
    meetingUrl: string | null;
    meetingId: string | null;
    meetingPassword: string | null;
    recordingUrl: string | null;
    price: number;
    thumbnail: string | null;
    creator: {
      id: string;
      name: string;
    };
  };
}

export default function MyEventsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<EventRSVP[]>([]);
  const [pastEvents, setPastEvents] = useState<EventRSVP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    fetchMyEvents();
  }, [session]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      const data = await response.json();
      
      const now = new Date();
      const myRsvps: EventRSVP[] = [];

      data.events?.forEach((event: any) => {
        if (event.userRsvp) {
          myRsvps.push({
            id: event.userRsvp.id,
            status: event.userRsvp.status,
            event: {
              id: event.id,
              title: event.title,
              description: event.description,
              type: event.type,
              startDate: event.startDate,
              endDate: event.endDate,
              location: event.location,
              meetingUrl: event.meetingUrl,
              meetingId: event.meetingId,
              meetingPassword: event.meetingPassword,
              recordingUrl: event.recordingUrl,
              price: event.price,
              thumbnail: event.thumbnail,
              creator: event.creator,
            },
          });
        }
      });

      const upcoming = myRsvps.filter(
        (rsvp) => new Date(rsvp.event.endDate) >= now
      );
      const past = myRsvps.filter(
        (rsvp) => new Date(rsvp.event.endDate) < now
      );

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error fetching my events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      WEBINAR: 'bg-blue-100 text-blue-800',
      WORKSHOP: 'bg-purple-100 text-purple-800',
      MEETUP: 'bg-green-100 text-green-800',
      CONFERENCE: 'bg-orange-100 text-orange-800',
      ONLINE: 'bg-blue-100 text-blue-800',
      OFFLINE: 'bg-green-100 text-green-800',
      HYBRID: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GOING':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'MAYBE':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'NOT_GOING':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const isEventStarted = (startDate: string) => {
    return new Date(startDate) <= new Date();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const renderEventCard = (rsvp: EventRSVP, isPast: boolean = false) => {
    const event = rsvp.event;
    const canAccessMeeting = rsvp.status === 'GOING' && isEventStarted(event.startDate);

    return (
      <Card key={rsvp.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {event.thumbnail ? (
                <div
                  className="w-full md:w-48 h-32 bg-cover bg-center rounded-lg"
                  style={{ backgroundImage: `url(${event.thumbnail})` }}
                />
              ) : (
                <div className="w-full md:w-48 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(rsvp.status)}
                      <span className="text-sm font-medium">
                        {rsvp.status === 'GOING'
                          ? 'Hadir'
                          : rsvp.status === 'MAYBE'
                          ? 'Mungkin'
                          : 'Tidak Hadir'}
                      </span>
                    </div>
                    {isPast && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        Selesai
                      </Badge>
                    )}
                    {event.price === 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        GRATIS
                      </Badge>
                    )}
                  </div>
                  <Link href={`/community/events/${event.id}`}>
                    <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                      {event.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500">oleh {event.creator.name}</p>
                </div>

                <Link href={`/community/events/${event.id}`}>
                  <Button variant="outline" size="sm">
                    Lihat Detail
                  </Button>
                </Link>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

              {/* Event Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.startDate)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatTime(event.startDate)} - {formatTime(event.endDate)} WIB
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}

                {event.meetingUrl && (
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Online Meeting</span>
                  </div>
                )}
              </div>

              {/* Meeting Access (for upcoming events) */}
              {!isPast && canAccessMeeting && event.meetingUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900">Meeting sedang berlangsung!</span>
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Gabung Sekarang
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {event.meetingId && (
                    <div className="text-xs text-green-800 mt-1">
                      ID: {event.meetingId}
                      {event.meetingPassword && ` • Password: ${event.meetingPassword}`}
                    </div>
                  )}
                </div>
              )}

              {/* Recording Access (for past events) */}
              {isPast && event.recordingUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Rekaman tersedia</span>
                    <a
                      href={event.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Tonton
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ResponsivePageWrapper>
      {/* Navigation Menu */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-3">
          <Link href="/community/feed">
            <Button variant="outline" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Feed
            </Button>
          </Link>
          <Link href="/community/groups">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Grup
            </Button>
          </Link>
          <Link href="/community/events">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Event
            </Button>
          </Link>
          <Button variant="default" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Event Saya
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Saya</h1>
          <p className="text-gray-600">Event yang Anda daftarkan</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat event...</p>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Mendatang ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Selesai ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Anda belum mendaftar event apapun</p>
                    <Link href="/community/events">
                      <Button>Jelajahi Event</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                upcomingEvents.map((rsvp) => renderEventCard(rsvp, false))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada event selesai</p>
                  </CardContent>
                </Card>
              ) : (
                pastEvents.map((rsvp) => renderEventCard(rsvp, true))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ResponsivePageWrapper>
  );
}
