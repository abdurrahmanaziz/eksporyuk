'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import Link from 'next/link'
import { Users, Search, ArrowLeft, MessageCircle, Crown, Shield, Star, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface GroupMember {
  id: string
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN'
  joinedAt: string
  user: {
    id: string
    name: string
    username?: string
    email: string
    avatar?: string
    isOnline?: boolean
    location?: string
    bio?: string
    membershipType?: string
  }
}

interface Group {
  id: string
  name: string
  slug: string
  description?: string
  thumbnail?: string
  coverImage?: string
  type: 'PUBLIC' | 'PRIVATE'
  _count: {
    members: number
    posts: number
  }
}

export default function GroupMembersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const groupSlug = params?.slug as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (groupSlug) {
      fetchGroupDetails()
      fetchGroupMembers()
    }
  }, [groupSlug])

  useEffect(() => {
    filterMembers()
  }, [members, searchQuery])

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${groupSlug}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data.group)
      } else {
        toast.error('Grup tidak ditemukan')
        router.push('/community/groups')
      }
    } catch (error) {
      console.error('Error fetching group:', error)
      toast.error('Gagal memuat data grup')
    }
  }

  const fetchGroupMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/groups/${groupSlug}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      } else {
        toast.error('Gagal memuat data member')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Gagal memuat data member')
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = members
    
    if (searchQuery.trim()) {
      filtered = members.filter(member => 
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredMembers(filtered)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive" className="text-xs"><Crown className="w-3 h-3 mr-1" />Admin</Badge>
      case 'MODERATOR':
        return <Badge variant="secondary" className="text-xs"><Shield className="w-3 h-3 mr-1" />Moderator</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Member</Badge>
    }
  }

  const startChat = async (userId: string) => {
    if (!session?.user?.id) {
      toast.error('Anda harus login untuk memulai chat')
      return
    }

    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/chat?room=${data.roomId}`)
      } else {
        toast.error('Gagal memulai chat')
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Gagal memulai chat')
    }
  }

  if (!group && !loading) {
    return (
      <ResponsivePageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Grup Tidak Ditemukan</h3>
              <p className="text-gray-600 mb-4">Grup yang Anda cari tidak ada atau telah dihapus.</p>
              <Button onClick={() => router.push('/community/groups')}>
                Kembali ke Daftar Grup
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/community/groups/${groupSlug}`)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali
              </Button>
              
              {group?.thumbnail && (
                <Avatar className="w-12 h-12">
                  <AvatarImage src={group.thumbnail} />
                  <AvatarFallback>{group?.name?.[0]}</AvatarFallback>
                </Avatar>
              )}
              
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  Member {group?.name}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {group?._count?.members || 0} member tergabung
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari member berdasarkan nama atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Memuat member...</p>
            </CardContent>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? 'Member Tidak Ditemukan' : 'Belum Ada Member'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Coba kata kunci pencarian lain' 
                  : 'Grup ini belum memiliki member'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Daftar Member
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    {/* Member Info */}
                    <Link 
                      href={`/profile/${member.user.username || member.user.name}`}
                      className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={member.user.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {member.user.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {member.user.name}
                          </p>
                          {getRoleBadge(member.role)}
                          {member.user.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        
                        {member.user.username && (
                          <p className="text-sm text-gray-600 truncate">
                            @{member.user.username}
                          </p>
                        )}
                        
                        {member.user.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {member.user.location}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-1">
                          Bergabung {new Date(member.joinedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </Link>

                    {/* Action Buttons */}
                    {session?.user?.id !== member.user.id && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startChat(member.user.id)}
                          className="text-xs px-3 h-8"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Chat
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}