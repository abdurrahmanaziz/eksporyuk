'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import Link from 'next/link'
import { Users, MapPin, MessageCircle, Calendar, Search, Filter, Shield, Crown, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import MemberLocationBadge from '@/components/member/MemberLocationBadge'

interface Member {
  id: string
  name: string
  username?: string
  email: string
  avatar?: string
  role: string
  city?: string
  province?: string
  locationVerified?: boolean
  bio?: string
  company?: string
  jobTitle?: string
  memberSince: string
  _count?: {
    posts: number
    followers: number
    following: number
  }
}

export default function CommunityMembersPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'nearby' | 'active'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular'>('name')

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [members, searchQuery, filter, sortBy])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/community/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = members

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    switch (filter) {
      case 'verified':
        filtered = filtered.filter(member => member.locationVerified)
        break
      case 'nearby':
        // Filter by same city if user has city data
        filtered = filtered.filter(member => 
          member.city && session?.user && 'city' in session.user && member.city === (session.user as any).city
        )
        break
      case 'active':
        filtered = filtered.filter(member => member._count && member._count.posts > 0)
        break
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime())
        break
      case 'popular':
        filtered.sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0))
        break
    }

    setFilteredMembers(filtered)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { icon: Shield, color: 'bg-red-100 text-red-800', label: 'Admin' }
      case 'MENTOR':
        return { icon: Award, color: 'bg-blue-100 text-blue-800', label: 'Mentor' }
      case 'MEMBER_PREMIUM':
        return { icon: Crown, color: 'bg-yellow-100 text-yellow-800', label: 'Premium' }
      default:
        return null
    }
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-0 shadow-md">
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-purple-600" />
                Member Komunitas
              </h1>
              <p className="text-gray-600">
                Temukan dan terhubung dengan member-member dari ekspor di seluruh negeri
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
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Calendar className="w-4 h-4 mr-2" />
                Event
              </Button>
            </Link>
            <Link href="/community/members">
              <Button variant="default" size="sm" className="whitespace-nowrap shadow-sm">
                <Users className="w-4 h-4 mr-2" />
                Region
              </Button>
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Cari member..."
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
                  variant={filter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('verified')}
                >
                  Terverifikasi
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                >
                  Aktif
                </Button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              <span className="text-sm text-gray-600 flex items-center">Urutkan:</span>
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('name')}
              >
                Nama
              </Button>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
              >
                Terbaru
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popular')}
              >
                Populer
              </Button>
            </div>
          </div>

          {/* Member Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-b from-gray-200 to-gray-300 rounded-full mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada member ditemukan
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Tidak ada member yang sesuai dengan pencarian Anda'
                  : 'Belum ada member tersedia'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => {
              const roleBadge = getRoleBadge(member.role)
              
              return (
                <Link key={member.id} href={`/${member.username || member.name}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      {/* Avatar & Name */}
                      <div className="flex flex-col items-center text-center mb-4">
                        <Avatar className="w-20 h-20 mb-3 border-4 border-indigo-100">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-200 to-purple-200">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                          {member.name}
                        </h3>

                        {/* Role Badge */}
                        {roleBadge && (
                          <Badge className={`${roleBadge.color} mb-2 text-xs`}>
                            <roleBadge.icon className="w-3 h-3 mr-1" />
                            {roleBadge.label}
                          </Badge>
                        )}

                        {/* Location */}
                        {member.city && (
                          <div className="mb-2">
                            <MemberLocationBadge
                              city={member.city}
                              province={member.province}
                              locationVerified={member.locationVerified}
                              size="sm"
                              showLink={false}
                            />
                          </div>
                        )}
                      </div>

                      {/* Job & Company */}
                      {(member.jobTitle || member.company) && (
                        <div className="text-center mb-4 text-sm text-gray-600 border-b border-gray-100 pb-3">
                          {member.jobTitle && <div className="font-medium text-gray-900">{member.jobTitle}</div>}
                          {member.company && <div className="text-xs">{member.company}</div>}
                        </div>
                      )}

                      {/* Bio */}
                      {member.bio && (
                        <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">
                          {member.bio}
                        </p>
                      )}

                      {/* Stats */}
                      {member._count && (
                        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg mb-4 text-center text-sm">
                          <div>
                            <div className="font-bold text-gray-900">
                              {member._count.posts || 0}
                            </div>
                            <div className="text-xs text-gray-600">Post</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {member._count.followers || 0}
                            </div>
                            <div className="text-xs text-gray-600">Followers</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {member._count.following || 0}
                            </div>
                            <div className="text-xs text-gray-600">Following</div>
                          </div>
                        </div>
                      )}

                      {/* Message Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-sm h-9 hover:bg-indigo-50"
                        onClick={(e) => {
                          e.preventDefault()
                          // Handle message
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Pesan
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
