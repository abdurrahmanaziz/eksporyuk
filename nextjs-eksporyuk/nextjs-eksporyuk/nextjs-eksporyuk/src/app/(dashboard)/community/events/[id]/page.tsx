'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Link as LinkIcon, 
  CheckCircle, 
  XCircle, 
  Star,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale'

interface Event {
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
  isPublished: boolean;
  isFeatured: boolean;
  attendeesCount: number;
  availableSlots: number | null;
  maxAttendees: number | null;
  creator: {
    id: string;
    name: string;
    avatar: string | null;
  };
  group: {
    id: string;
    name: string;
    slug: string;
  } | null;
  userRsvp?: {
    id: string;
    status: string;
  };
}

export default function CommunityEventDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [resolvedParams.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }
      const data = await response.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      router.push('/community/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (status: string = 'GOING') => {
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch(`/api/events/${resolvedParams.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchEvent();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal mendaftar');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Gagal mendaftar ke event');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!confirm('Yakin ingin membatalkan pendaftaran?')) return;

    try {
      setRegistering(true);
      const response = await fetch(`/api/events/${resolvedParams.id}/register`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEvent();
      }
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
    } finally {
      setRegistering(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ONLINE: 'bg-blue-100 text-blue-800',
      OFFLINE: 'bg-green-100 text-green-800',
      HYBRID: 'bg-purple-100 text-purple-800',
      WEBINAR: 'bg-blue-100 text-blue-800',
      WORKSHOP: 'bg-purple-100 text-purple-800',
      MEETUP: 'bg-green-100 text-green-800',
      CONFERENCE: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const isEventFull = () => {
    return event?.maxAttendees !== null && event && event.attendeesCount >= event.maxAttendees;
  };

  const isEventPast = () => {
    return event && new Date(event.endDate) < new Date();
  };

  const isEventStarted = () => {
    return event && new Date(event.startDate) <= new Date();
  };

  const canAccessMeeting = () => {
    return event?.userRsvp && event.userRsvp.status === 'GOING' && isEventStarted();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: idLocale });
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

  return (
    <ResponsivePageWrapper>
      {/* Navigation Menu */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
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
              <Button variant="default" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event
              </Button>
            </Link>
            <Link href="/community/members">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Region
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Back Button & Content */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/community/events">
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Event
          </Button>
        </Link>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Memuat event...</p>
          </div>
        ) : !event ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Event tidak ditemukan</h3>
            <p className="text-gray-600">Event yang Anda cari tidak tersedia</p>
          </div>
        ) : (
          <>
            {/* Hero Image */}
            {event.thumbnail ? (
              <div
                className="h-64 md:h-80 bg-cover bg-center rounded-lg mb-6"
                style={{ backgroundImage: `url(${event.thumbnail})` }}
              />
            ) : (
              <div className="h-64 md:h-80 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-6 flex items-center justify-center">
                <Calendar className="w-24 h-24 text-white opacity-50" />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      {event.isFeatured && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {isEventPast() && (
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

                    {/* Title */}
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{event.title}</h1>
                      <p className="text-gray-600 mt-2">oleh {event.creator.name}</p>
                    </div>

                    <Separator />

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Tanggal</div>
                          <div className="font-medium">{formatDate(event.startDate)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Waktu</div>
                          <div className="font-medium">
                            {formatTime(event.startDate)} - {formatTime(event.endDate)} WIB
                          </div>
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Lokasi</div>
                            <div className="font-medium">{event.location}</div>
                          </div>
                        </div>
                      )}

                      {event.meetingUrl && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Video className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Format</div>
                            <div className="font-medium">Online Meeting</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Peserta</div>
                          <div className="font-medium">
                            {event.attendeesCount}
                            {event.maxAttendees ? ` / ${event.maxAttendees}` : ' terdaftar'}
                          </div>
                        </div>
                      </div>

                      {event.price > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500">Harga</div>
                          <div className="text-xl font-bold text-green-600">
                            Rp {event.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Description */}
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Tentang Event</h2>
                      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    {/* Meeting Access (for registered users) */}
                    {canAccessMeeting() && event.meetingUrl && (
                      <>
                        <Separator />
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-green-900">Anda terdaftar! Link meeting:</h3>
                          </div>
                          <div className="space-y-2">
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <LinkIcon className="w-4 h-4" />
                              {event.meetingUrl}
                            </a>
                            {event.meetingId && (
                              <div className="text-sm">
                                <span className="text-gray-500">Meeting ID: </span>
                                <span className="font-mono font-medium">{event.meetingId}</span>
                              </div>
                            )}
                            {event.meetingPassword && (
                              <div className="text-sm">
                                <span className="text-gray-500">Password: </span>
                                <span className="font-mono font-medium">{event.meetingPassword}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Recording */}
                    {isEventPast() && event.recordingUrl && (
                      <>
                        <Separator />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">Rekaman Tersedia</h3>
                          <a
                            href={event.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <Video className="w-4 h-4" />
                            Tonton Rekaman
                          </a>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Registration Card */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {event.userRsvp ? (
                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          {event.userRsvp.status === 'GOING' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : event.userRsvp.status === 'MAYBE' ? (
                            <Clock className="w-6 h-6 text-yellow-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <span className="font-semibold">
                            {event.userRsvp.status === 'GOING'
                              ? 'Anda akan hadir!'
                              : event.userRsvp.status === 'MAYBE'
                              ? 'Mungkin hadir'
                              : 'Tidak hadir'}
                          </span>
                        </div>

                        {!isEventPast() && (
                          <>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handleCancelRsvp}
                              disabled={registering}
                            >
                              Batalkan Pendaftaran
                            </Button>

                            {event.userRsvp.status !== 'GOING' && (
                              <Button
                                className="w-full"
                                onClick={() => handleRegister('GOING')}
                                disabled={registering || isEventFull()}
                              >
                                Ubah ke Hadir
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        {!session ? (
                          <div className="space-y-3">
                            <p className="text-sm text-center text-gray-600">
                              Silakan login untuk mendaftar event ini
                            </p>
                            <Link href="/login">
                              <Button className="w-full">Login untuk Daftar</Button>
                            </Link>
                          </div>
                        ) : isEventPast() ? (
                          <div className="text-center">
                            <p className="text-gray-600">Event sudah selesai</p>
                          </div>
                        ) : isEventFull() ? (
                          <div className="text-center">
                            <p className="text-red-600 font-medium">Event sudah penuh</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Semua {event.maxAttendees} slot sudah terisi
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Button
                              className="w-full"
                              size="lg"
                              onClick={() => handleRegister('GOING')}
                              disabled={registering}
                            >
                              {registering ? 'Mendaftar...' : 'Daftar Sekarang'}
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleRegister('MAYBE')}
                              disabled={registering}
                            >
                              Mungkin Hadir
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {event.availableSlots !== null && event.availableSlots > 0 && (
                      <p className="text-sm text-center text-gray-600">
                        {event.availableSlots} slot tersisa
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Organizer Card */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-semibold">Diselenggarakan oleh</h3>
                    <div className="flex items-center gap-3">
                      {event.creator.avatar ? (
                        <img
                          src={event.creator.avatar}
                          alt={event.creator.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {event.creator.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{event.creator.name}</div>
                        <div className="text-sm text-gray-500">Event Organizer</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Group Card */}
                {event.group && (
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <h3 className="font-semibold">Bagian dari Grup</h3>
                      <Link href={`/community/groups/${event.group.slug}`}>
                        <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                            {event.group.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{event.group.name}</div>
                            <div className="text-sm text-blue-600">Lihat Grup →</div>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ResponsivePageWrapper>
  );
}
