'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Users, ChevronRight, Navigation } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  name: string
  username: string | null
  avatar: string | null
  province: string | null
  city: string | null
  isOnline: boolean
  distance?: number
  _count: {
    followers: number
    following: number
  }
}

interface NearbyMembersWidgetProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export default function NearbyMembersWidget({
  limit = 5,
  showHeader = true,
  className = ''
}: NearbyMembersWidgetProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationRequested, setLocationRequested] = useState(false)

  useEffect(() => {
    // Try to get user location on mount
    if (navigator.geolocation && !locationRequested) {
      setLocationRequested(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          // If location denied, just fetch all members with location
          fetchMembers()
        },
        { enableHighAccuracy: false, timeout: 5000 }
      )
    } else {
      fetchMembers()
    }
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchMembers(userLocation)
    }
  }, [userLocation])

  const fetchMembers = async (location?: {lat: number, lng: number}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (location) {
        params.set('lat', location.lat.toString())
        params.set('lng', location.lng.toString())
        params.set('radius', '100') // 100km radius
      }
      
      const res = await fetch(`/api/members/directory?${params}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (members.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {userLocation ? 'Member Terdekat' : 'Member Aktif'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {members.map((member) => (
          <Link 
            key={member.id}
            href={`/${member.username || member.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar || ''} alt={member.name} />
                <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {member.isOnline && (
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {member.city || member.province || 'Lokasi tidak diset'}
                </span>
              </div>
              {member.distance !== undefined && member.distance !== null && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Navigation className="h-3 w-3" />
                  <span>{member.distance.toFixed(1)} km</span>
                </div>
              )}
            </div>
          </Link>
        ))}
        
        <Link href="/member-directory">
          <Button variant="ghost" size="sm" className="w-full mt-2">
            Lihat Semua Member
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Compact version for sidebar
export function MemberDirectoryLink({ className = '' }: { className?: string }) {
  return (
    <Link href="/member-directory">
      <div className={`flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors cursor-pointer ${className}`}>
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <MapPin className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Region</p>
          <p className="text-xs text-muted-foreground">Temukan member terdekat</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}
