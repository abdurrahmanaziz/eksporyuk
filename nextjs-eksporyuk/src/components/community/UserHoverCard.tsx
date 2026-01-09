'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MessageCircle, UserPlus, UserMinus, Eye, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface UserHoverCardProps {
  userId: string
  username: string
  children: React.ReactNode
}

interface UserProfile {
  id: string
  name: string
  username: string
  avatar?: string
  role: string
  bio?: string
  city?: string
  province?: string
  locationVerified?: boolean
  createdAt: string
  _count: {
    posts: number
    followers: number
    following: number
  }
  isFollowing?: boolean
}

export default function UserHoverCard({ userId, username, children }: UserHoverCardProps) {
  const { data: session } = useSession()
  const [showCard, setShowCard] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hoverTimeout, setHoverTimeoutState] = useState<NodeJS.Timeout | null>(null)

  const fetchProfile = async () => {
    if (profile || loading) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/profile-preview`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setIsFollowing(data.isFollowing || false)
      }
    } catch (error) {
      console.error('Failed to fetch profile preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!session?.user?.id || followLoading) return
    
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })
      
      if (res.ok) {
        setIsFollowing(!isFollowing)
        if (profile) {
          setProfile({
            ...profile,
            _count: {
              ...profile._count,
              followers: profile._count.followers + (isFollowing ? -1 : 1)
            }
          })
        }
        toast.success(isFollowing ? 'Berhenti mengikuti' : 'Berhasil mengikuti')
      }
    } catch (error) {
      toast.error('Gagal memproses permintaan')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    })

    const timeout = setTimeout(() => {
      setShowCard(true)
      fetchProfile()
    }, 500) // Delay 500ms sebelum muncul
    
    setHoverTimeoutState(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeoutState(null)
    }
    
    // Delay sebelum hilang agar user bisa klik card
    setTimeout(() => {
      setShowCard(false)
    }, 300)
  }

  const handleCardMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
  }

  const handleCardMouseLeave = () => {
    setShowCard(false)
  }

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block cursor-pointer"
      >
        {children}
      </span>

      {showCard && (
        <div
          className="fixed z-50 animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <Card className="w-80 p-4 shadow-xl border-2 bg-white dark:bg-gray-800">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-16 h-16 border-2 border-gray-200">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={profile.role === 'ADMIN' ? 'destructive' : profile.role === 'MENTOR' ? 'default' : 'secondary'} className="text-xs">
                        {profile.role}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg truncate mt-1">{profile.name}</h3>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* Location */}
                {profile.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.city}, {profile.province}</span>
                    {profile.locationVerified && (
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y">
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile._count.posts}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile._count.followers}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile._count.following}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                </div>

                {/* Joined Date */}
                <div className="text-xs text-gray-500">
                  Joined {format(new Date(profile.createdAt), 'MMM yyyy', { locale: idLocale })}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/chat?user=${profile.username}`}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Link>
                  </Button>
                  
                  {session?.user?.id !== profile.id && (
                    <Button 
                      size="sm" 
                      variant={isFollowing ? "secondary" : "outline"} 
                      className="flex-1"
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/${profile.username}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </>
  )
}
