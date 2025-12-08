'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  Trophy, 
  UserPlus, 
  MessageCircle,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
  Medal,
  Crown,
  Award,
  Star
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import OnlineStatusBadge from '@/components/presence/OnlineStatusBadge'
import { format, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Pusher from 'pusher-js'

interface GroupSidebarProps {
  groupId: string
  groupSlug: string
}

interface OnlineMentor {
  id: string
  name: string
  avatar: string | null
  role: string
  isOnline: boolean
  lastActiveAt: string
  isFollowing: boolean
  mentorProfile?: {
    expertise: string | null
    bio: string | null
  }
  _count: {
    followers: number
    following: number
  }
}

interface OnlineMember {
  id: string
  name: string
  avatar: string | null
  role: string
  isOnline: boolean
  lastActiveAt: string
  isFollowing: boolean
  _count: {
    followers: number
    following: number
  }
}

interface GroupEvent {
  id: string
  title: string
  description: string
  type: string
  startDate: string
  endDate: string
  location: string | null
  meetingUrl: string | null
  maxAttendees: number | null
  _count: {
    rsvps: number
  }
  isRSVPd?: boolean
}

interface TopContributor {
  id: string
  name: string
  avatar: string | null
  role: string
  posts: number
  comments: number
  reactions: number
  score: number
  rank: number
}

/**
 * GROUP SIDEBAR
 * Sidebar kanan untuk halaman grup dengan:
 * 1. Mentor Online (dengan tombol follow & chat)
 * 2. Member Aktif (member online dengan green dot)
 * 3. Event Mendatang (upcoming events)
 * 4. Top Kontributor (ranking berdasarkan posts + comments)
 */
export default function GroupSidebar({ groupId, groupSlug }: GroupSidebarProps) {
  const { data: session } = useSession()
  const [onlineMentors, setOnlineMentors] = useState<OnlineMentor[]>([])
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([])
  const [totalOnlineMembers, setTotalOnlineMembers] = useState(0)
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [loading, setLoading] = useState({
    mentors: true,
    members: true,
    events: true,
    contributors: true
  })
  const [followingLoading, setFollowingLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchOnlineMentors()
    fetchOnlineMembers()
    fetchGroupEvents()
    fetchTopContributors()

    // Setup Pusher for real-time updates
    let pusher: Pusher | null = null

    try {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        forceTLS: true
      })

      const channel = pusher.subscribe('public-channel')
      
      // Listen to status changes
      channel.bind('user-status-changed', (data: any) => {
        // Update mentors
        setOnlineMentors(prev =>
          prev.map(mentor =>
            mentor.id === data.userId
              ? { ...mentor, isOnline: data.isOnline }
              : mentor
          )
        )
        // Update members
        setOnlineMembers(prev =>
          prev.map(member =>
            member.id === data.userId
              ? { ...member, isOnline: data.isOnline }
              : member
          )
        )
      })

    } catch (error) {
      console.error('[PUSHER_GROUP_SIDEBAR_ERROR]', error)
    }

    // Refresh online status every 30 seconds
    const interval = setInterval(() => {
      fetchOnlineMentors()
      fetchOnlineMembers()
    }, 30000)

    return () => {
      clearInterval(interval)
      if (pusher) {
        pusher.unsubscribe('public-channel')
        pusher.disconnect()
      }
    }
  }, [groupId, groupSlug])

  const fetchOnlineMentors = async () => {
    try {
      const res = await fetch(`/api/users/presence?role=MENTOR&groupId=${groupId}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setOnlineMentors(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching online mentors:', error)
    } finally {
      setLoading(prev => ({ ...prev, mentors: false }))
    }
  }

  const fetchOnlineMembers = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}/online-members?limit=5`)
      if (res.ok) {
        const data = await res.json()
        setOnlineMembers(data.members || [])
        setTotalOnlineMembers(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching online members:', error)
    } finally {
      setLoading(prev => ({ ...prev, members: false }))
    }
  }

  const fetchGroupEvents = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}/events?status=upcoming&limit=3`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching group events:', error)
    } finally {
      setLoading(prev => ({ ...prev, events: false }))
    }
  }

  const fetchTopContributors = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}/top-contributors?limit=5&period=week`)
      if (res.ok) {
        const data = await res.json()
        setTopContributors(data.contributors || [])
      }
    } catch (error) {
      console.error('Error fetching top contributors:', error)
    } finally {
      setLoading(prev => ({ ...prev, contributors: false }))
    }
  }

  const handleFollow = async (userId: string) => {
    setFollowingLoading(userId)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      })
      
      if (res.ok) {
        // Update local state for mentors
        setOnlineMentors(prev =>
          prev.map(mentor =>
            mentor.id === userId
              ? { ...mentor, isFollowing: !mentor.isFollowing }
              : mentor
          )
        )
        // Update local state for members
        setOnlineMembers(prev =>
          prev.map(member =>
            member.id === userId
              ? { ...member, isFollowing: !member.isFollowing }
              : member
          )
        )
      }
    } catch (error) {
      console.error('Error following user:', error)
    } finally {
      setFollowingLoading(null)
    }
  }

  const handleStartChat = async (userId: string) => {
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (res.ok) {
        const data = await res.json()
        window.location.href = `/chat?room=${data.room.id}`
      }
    } catch (error) {
      console.error('Error starting chat:', error)
    }
  }

  const handleRSVP = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'GOING' })
      })

      if (res.ok) {
        fetchGroupEvents() // Refresh
      }
    } catch (error) {
      console.error('Error RSVP:', error)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />
      default:
        return <span className="w-4 h-4 text-xs text-gray-500 font-medium flex items-center justify-center">#{rank}</span>
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'ADMIN': 'Admin',
      'MENTOR': 'Mentor',
      'MEMBER_PREMIUM': 'Premium',
      'MEMBER_FREE': 'Member',
      'FOUNDER': 'Founder',
      'CO_FOUNDER': 'Co-Founder',
      'AFFILIATE': 'Affiliate'
    }
    return roles[role] || role
  }

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'WEBINAR': 'Webinar',
      'WORKSHOP': 'Workshop',
      'MEETUP': 'Meetup',
      'LIVE_SESSION': 'Live Session',
      'QNA': 'Q&A',
      'OTHER': 'Event'
    }
    return types[type] || type
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 1. MENTOR ONLINE */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Mentor Online
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {loading.mentors ? (
            <p className="text-xs text-gray-500">Memuat...</p>
          ) : onlineMentors.length === 0 ? (
            <p className="text-xs text-gray-500">Tidak ada mentor online</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {onlineMentors.map((mentor) => (
                <div key={mentor.id} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3 border-b last:border-b-0 last:pb-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                      <AvatarImage src={mentor.avatar || undefined} />
                      <AvatarFallback className="text-xs">{mentor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineStatusBadge
                        isOnline={mentor.isOnline}
                        lastSeenAt={mentor.lastActiveAt}
                        size="sm"
                        userId={mentor.id}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {mentor.name}
                    </p>
                    {mentor.mentorProfile?.expertise && (
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate mt-0.5">
                        {mentor.mentorProfile.expertise}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      <Button
                        size="sm"
                        variant={mentor.isFollowing ? "outline" : "default"}
                        className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1"
                        onClick={() => handleFollow(mentor.id)}
                        disabled={followingLoading === mentor.id}
                      >
                        <UserPlus className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">{mentor.isFollowing ? 'Unfollow' : 'Follow'}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                        onClick={() => handleStartChat(mentor.id)}
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. MEMBER AKTIF */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            Member Aktif
            {totalOnlineMembers > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {totalOnlineMembers} online
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {loading.members ? (
            <p className="text-xs text-gray-500">Memuat...</p>
          ) : onlineMembers.length === 0 ? (
            <p className="text-xs text-gray-500">Tidak ada member online</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {onlineMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 sm:gap-3 pb-2 border-b last:border-b-0 last:pb-0">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineStatusBadge
                          isOnline={member.isOnline}
                          lastSeenAt={member.lastActiveAt}
                          size="sm"
                          userId={member.id}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {getRoleLabel(member.role)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => handleStartChat(member.id)}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
              {totalOnlineMembers > 5 && (
                <Link 
                  href={`/community/groups/${groupSlug}/members`}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Lihat semua member <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. EVENT MENDATANG */}
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            Event Mendatang
            {events.length > 0 && (
              <Badge className="ml-auto bg-orange-100 text-orange-700 text-[10px]">
                {events.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
          {loading.events ? (
            <p className="text-xs text-gray-500">Memuat...</p>
          ) : events.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">Tidak ada event mendatang</p>
              <Link 
                href="/community/events"
                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1 mt-2"
              >
                Jelajahi Event <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:space-y-3">
                {events.map((event) => (
                  <Link key={event.id} href={`/community/events/${event.id}`}>
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Badge variant="outline" className="text-[10px] mb-1 px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs text-gray-600">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span>
                              {format(new Date(event.startDate), 'dd MMM, HH:mm', { locale: idLocale })}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-xs text-gray-600">
                              <MapPin className="w-3 h-3 text-orange-600" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-100">
                        <span className="text-[10px] font-medium text-gray-600">
                          👥 {event._count.rsvps} peserta
                        </span>
                        {event.isRSVPd ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700 border-0">
                            ✓ Terdaftar
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleRSVP(event.id)}
                          >
                            RSVP
                          </Button>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="pt-2 border-t border-orange-100 space-y-2">
                <Link 
                  href={`/community/groups/${groupSlug}/events`}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  Event grup lainnya <ChevronRight className="w-3 h-3" />
                </Link>
                <Link 
                  href="/community/events"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Lihat semua event komunitas <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 4. TOP KONTRIBUTOR */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-500" />
            Top Kontributor
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Minggu Ini
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {loading.contributors ? (
            <p className="text-xs text-gray-500">Memuat...</p>
          ) : topContributors.length === 0 ? (
            <p className="text-xs text-gray-500">Belum ada kontribusi minggu ini</p>
          ) : (
            <div className="space-y-2">
              {topContributors.map((contributor, index) => (
                <div 
                  key={contributor.id} 
                  className={`flex items-center gap-2 sm:gap-3 p-2 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {getRankIcon(contributor.rank)}
                  </div>
                  
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={contributor.avatar || undefined} />
                    <AvatarFallback className="text-xs">{contributor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {contributor.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{contributor.posts} post</span>
                      <span>•</span>
                      <span>{contributor.comments} komentar</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-gray-700">
                        {contributor.score}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">poin</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
