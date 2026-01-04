'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  Crown,
  Shield,
  Eye,
  ExternalLink,
  ArrowRight,
  Plus
} from 'lucide-react'

interface MyGroup {
  id: string
  name: string
  description: string
  image: string | null
  type: string
  memberCount: number
  joinedAt: string
  role?: string
}

export default function MyGroupsPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<MyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMyGroups()
  }, [])

  const fetchMyGroups = async () => {
    try {
      const response = await fetch('/api/member/my-groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-blue-500" />
      case 'MODERATOR':
        return <Settings className="w-4 h-4 text-green-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'MODERATOR':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PRIVATE':
        return 'bg-red-100 text-red-800'
      case 'PROTECTED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Skeleton className="h-10 w-full max-w-md" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grup Saya</h1>
          <p className="text-gray-600">Kelola dan akses semua grup yang Anda ikuti</p>
        </div>
        
        <Link href="/member/community/groups">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Cari Grup Lain
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Cari grup..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
            <div className="text-sm text-gray-600">Total Grup</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {groups.filter(g => g.role === 'OWNER' || g.role === 'ADMIN').length}
            </div>
            <div className="text-sm text-gray-600">Grup Admin</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {groups.reduce((acc, g) => acc + g.memberCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Member</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Grup tidak ditemukan' : 'Belum bergabung grup'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Coba kata kunci yang berbeda atau hapus filter pencarian'
                : 'Bergabunglah dengan komunitas dan mulai berdiskusi dengan sesama member'
              }
            </p>
            <Link href="/member/community/groups">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Jelajahi Grup
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Group Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {group.image ? (
                      <Image
                        src={group.image}
                        alt={group.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {group.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(group.role) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                        {getRoleIcon(group.role)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={getTypeColor(group.type)}>
                        {group.type}
                      </Badge>
                      {group.role && (
                        <Badge variant="outline" className={getRoleBadgeColor(group.role)}>
                          {group.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {group.description}
                </p>

                {/* Stats & Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.memberCount}
                    </span>
                    <span className="text-xs">
                      Bergabung {new Date(group.joinedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  
                  <Link href={`/member/groups/${group.id}`}>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                      <Eye className="w-4 h-4 mr-1" />
                      Lihat
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}