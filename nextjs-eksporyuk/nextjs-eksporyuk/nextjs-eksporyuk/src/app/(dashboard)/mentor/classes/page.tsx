'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Plus, 
  Search,
  Loader2,
  PlayCircle,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

interface MentorClass {
  id: string
  title: string
  description: string
  scheduledAt: string
  duration: number
  maxParticipants: number
  currentParticipants: number
  meetingUrl?: string
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  course?: {
    id: string
    title: string
  }
}

export default function MentorClassesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<MentorClass[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      // Check allRoles for multi-role support (user may have MENTOR as additional role)
      const allRoles = session?.user?.allRoles || [session?.user?.role]
      const hasMentorAccess = allRoles.includes('MENTOR') || allRoles.includes('ADMIN')
      if (!hasMentorAccess) {
        router.push('/dashboard')
        return
      }
      fetchClasses()
    }
  }, [status, session, router])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-800">Dijadwalkan</Badge>
      case 'LIVE':
        return <Badge className="bg-red-100 text-red-800">LIVE</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Dibatalkan</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.title.toLowerCase().includes(searchQuery.toLowerCase())
    const now = new Date()
    const classDate = new Date(cls.scheduledAt)
    
    if (filter === 'upcoming') {
      return matchesSearch && classDate > now && cls.status !== 'CANCELLED'
    }
    if (filter === 'completed') {
      return matchesSearch && (cls.status === 'COMPLETED' || classDate < now)
    }
    return matchesSearch
  })

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kelas Saya</h1>
            <p className="text-gray-600 mt-1">Kelola jadwal kelas live dan webinar</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Buat Kelas Baru
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.filter(c => c.status === 'SCHEDULED').length}</p>
                  <p className="text-sm text-gray-600">Kelas Terjadwal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Video className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.filter(c => c.status === 'LIVE').length}</p>
                  <p className="text-sm text-gray-600">Sedang Live</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classes.reduce((sum, c) => sum + c.currentParticipants, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Peserta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Semua
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
            >
              Akan Datang
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Selesai
            </Button>
          </div>
        </div>

        {/* Classes List */}
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Kelas
              </h3>
              <p className="text-gray-600 mb-4">
                Mulai buat kelas live atau webinar untuk siswa Anda
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Buat Kelas Baru
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cls.title}
                        </h3>
                        {getStatusBadge(cls.status)}
                      </div>
                      
                      {cls.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {cls.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(cls.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(cls.scheduledAt)} ({cls.duration} menit)
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {cls.currentParticipants}/{cls.maxParticipants} peserta
                        </div>
                      </div>

                      {cls.course && (
                        <div className="mt-2">
                          <Badge variant="outline">
                            Kursus: {cls.course.title}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {cls.status === 'SCHEDULED' && (
                        <Button className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          Mulai Kelas
                        </Button>
                      )}
                      {cls.status === 'LIVE' && cls.meetingUrl && (
                        <Button asChild className="bg-red-600 hover:bg-red-700">
                          <a href={cls.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="w-4 h-4 mr-2" />
                            Join Live
                          </a>
                        </Button>
                      )}
                      <Button variant="outline">
                        Detail
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
