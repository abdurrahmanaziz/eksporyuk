'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import MemberOnboardingChecklist from '@/components/member/MemberOnboardingChecklist'
import Link from 'next/link'
import { Users, Lock, Eye, EyeOff, Plus, Search, Filter, MessageCircle, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Group {
  id: string
  slug: string
  name: string
  description: string
  avatar: string | null
  coverImage: string | null
  type: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
  owner: {
    id: string
    name: string
    image: string | null
  }
  members?: Array<{
    role: string
    joinedAt: string
  }>
  _count?: {
    members: number
    posts: number
  }
}

export default function GroupsPage() {
  const { data: session, status } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'my' | 'public' | 'private'>('all')
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      checkProfileAndFetchGroups()
    }
  }, [status, filter])

  useEffect(() => {
    filterGroups()
  }, [groups, searchQuery])

  const checkProfileAndFetchGroups = async () => {
    try {
      setLoading(true)
      
      // First check profile completion
      const profileRes = await fetch('/api/member/onboarding')
      const profileData = await profileRes.json()
      
      if (profileData.success) {
        setProfileComplete(profileData.data.profileCompleted)
        
        // If profile not complete, don't fetch groups
        if (!profileData.data.profileCompleted) {
          setLoading(false)
          return
        }
      }

      // Fetch groups if profile is complete
      await fetchGroups()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const params = new URLSearchParams({
        includeCount: 'true',
        ...(filter === 'my' && { myGroups: 'true' }),
        ...(filter === 'public' && { type: 'PUBLIC' }),
        ...(filter === 'private' && { type: 'PRIVATE' }),
      })

      const res = await fetch(`/api/groups?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const filterGroups = () => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query)
    )
    setFilteredGroups(filtered)
  }

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'PRIVATE':
        return <Lock className="w-4 h-4" />
      case 'HIDDEN':
        return <EyeOff className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  const getGroupBadge = (type: string) => {
    const colors = {
      PUBLIC: 'bg-green-100 text-green-800',
      PRIVATE: 'bg-yellow-100 text-yellow-800',
      HIDDEN: 'bg-gray-100 text-gray-800',
    }
    return colors[type as keyof typeof colors] || colors.PUBLIC
  }

  const isMember = (group: Group) => {
    return group.members && group.members.length > 0
  }

  // Profile not complete - show block
  if (profileComplete === false && !loading) {
    return (
      <ResponsivePageWrapper>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-orange-500" />
              Grup Komunitas
            </h1>
            <p className="text-gray-600 mt-1">
              Bergabung dengan grup member Ekspor Yuk
            </p>
          </div>
          
          <MemberOnboardingChecklist variant="alert" />
          
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-8">
              <div className="text-center">
                <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Profil Belum Lengkap
                </h3>
                <p className="text-gray-600 mb-4">
                  Lengkapi profil Anda terlebih dahulu untuk bergabung ke grup komunitas
                </p>
                <Link href="/dashboard/complete-profile">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Lengkapi Profil Sekarang
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-0 shadow-md">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    <Users className="w-8 h-8 text-indigo-600" />
                    Grup Komunitas
                  </h1>
                  <p className="text-gray-600">
                    Bergabung dengan komunitas ekspor untuk belajar dan berkolaborasi
                  </p>
                </div>
                {session?.user?.role === 'ADMIN' && (
                  <Link href="/admin/groups">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Buat Grup
                    </Button>
                  </Link>
                )}
              </div>
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
              <Button variant="default" size="sm" className="whitespace-nowrap shadow-sm">
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
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" />
                Member Directory
              </Button>
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Cari grup..."
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
                {session && (
                  <Button
                    variant={filter === 'my' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('my')}
                  >
                    Grup Saya
                  </Button>
                )}
                <Button
                  variant={filter === 'public' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('public')}
                >
                  Publik
                </Button>
                <Button
                  variant={filter === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('private')}
                >
                  Privat
                </Button>
              </div>
            </div>
          </div>

      {/* Groups Grid */}
      <div className="space-y-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-0 shadow-md">
                <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300" />
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card className="border-0 shadow-md">
              <CardContent className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum ada grup
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Tidak ada grup yang sesuai dengan pencarian Anda'
                    : 'Belum ada grup tersedia saat ini'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Link key={group.id} href={`/community/groups/${group.slug}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                    {/* Cover Image */}
                    <div
                      className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={
                        group.coverImage
                          ? {
                              backgroundImage: `url(${group.coverImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                          : undefined
                      }
                    >
                      <div className="p-4 flex justify-between items-start h-full bg-gradient-to-b from-black/20 to-transparent">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getGroupBadge(
                            group.type
                          )}`}
                        >
                          {getGroupIcon(group.type)}
                          {group.type === 'PUBLIC'
                            ? 'Publik'
                            : group.type === 'PRIVATE'
                            ? 'Privat'
                            : 'Tersembunyi'}
                        </span>
                        {isMember(group) && (
                          <Badge className="bg-green-100 text-green-800">Bergabung</Badge>
                        )}
                      </div>
                    </div>

                    {/* Group Content */}
                    <CardContent className="p-6">
                      {/* Group Avatar and Name */}
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="w-12 h-12 -mt-12 border-4 border-white shadow-md">
                          <AvatarImage src={group.avatar} alt={group.name} />
                          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">
                            {group.name}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {group.description}
                      </p>

                      {/* Owner */}
                      <div className="mb-4 pb-4 border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Dibuat oleh</p>
                        <p className="text-sm font-medium text-gray-900">{group.owner.name}</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{group._count?.members || 0}</p>
                          <p className="text-xs text-gray-600">Member</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{group._count?.posts || 0}</p>
                          <p className="text-xs text-gray-600">Postingan</p>
                        </div>
                      </div>

                      {/* Join Button */}
                      {!isMember(group) && (
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            // Handle join
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 h-9"
                        >
                          Bergabung
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
      </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
