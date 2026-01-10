'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  MapPin, 
  Users, 
  Navigation, 
  Filter,
  UserCheck,
  Building2,
  ChevronRight,
  Loader2,
  AlertCircle,
  Globe
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface Member {
  id: string
  name: string
  username: string | null
  avatar: string | null
  bio: string | null
  role: string
  province: string | null
  city: string | null
  district: string | null
  latitude: number | null
  longitude: number | null
  locationVerified: boolean
  isOnline: boolean
  lastSeenAt: string | null
  createdAt: string
  distance?: number | null
  _count: {
    followers: number
    following: number
  }
}

interface LocationFilter {
  name: string
  count: number
}

export default function MemberDirectoryPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [provinces, setProvinces] = useState<LocationFilter[]>([])
  const [cities, setCities] = useState<LocationFilter[]>([])
  const [availableProvinces, setAvailableProvinces] = useState<Array<{name: string, cities: string[]}>>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [useNearby, setUseNearby] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  // Fetch provinces list
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => setAvailableProvinces(data.provinces || []))
      .catch(console.error)
  }, [])

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const province = availableProvinces.find(p => p.name === selectedProvince)
      setAvailableCities(province?.cities || [])
    } else {
      setAvailableCities([])
    }
    setSelectedCity('')
  }, [selectedProvince, availableProvinces])

  // Fetch members
  useEffect(() => {
    fetchMembers()
  }, [selectedProvince, selectedCity, pagination.page, useNearby, userLocation])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (selectedProvince) params.set('province', selectedProvince)
      if (selectedCity) params.set('city', selectedCity)
      if (searchQuery) params.set('search', searchQuery)
      if (useNearby && userLocation) {
        params.set('lat', userLocation.lat.toString())
        params.set('lng', userLocation.lng.toString())
      }

      const res = await fetch(`/api/members/directory?${params}`)
      
      // Handle access denied (not premium member)
      if (res.status === 403) {
        setAccessDenied(true)
        setLoading(false)
        return
      }
      
      const data = await res.json()
      
      setMembers(data.members || [])
      setPagination(prev => ({ ...prev, ...data.pagination }))
      setProvinces(data.filters?.provinces || [])
      setCities(data.filters?.cities || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchMembers()
  }

  const handleGetNearby = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolocation')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setUseNearby(true)
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.')
        setGettingLocation(false)
      }
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'MENTOR': return 'bg-purple-100 text-purple-800'
      case 'AFFILIATE': return 'bg-green-100 text-green-800'
      case 'MEMBER_PREMIUM': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin'
      case 'MENTOR': return 'Mentor'
      case 'AFFILIATE': return 'Affiliate'
      case 'MEMBER_PREMIUM': return 'Premium'
      case 'MEMBER_FREE': return 'Member'
      default: return role
    }
  }

  // Show access denied screen for non-premium users
  if (accessDenied) {
    return (
      <ResponsivePageWrapper>
        <div className="container mx-auto p-4 max-w-2xl">
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                <Users className="h-10 w-10 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Member Regional</h2>
                <p className="text-muted-foreground text-lg">
                  Fitur Eksklusif Member Premium
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-left max-w-md mx-auto">
                <h3 className="font-semibold mb-3">Dengan Member Premium, Anda bisa:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Temukan member di sekitar lokasi Anda
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Networking dengan sesama eksportir premium
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Tampil di directory untuk ditemukan member lain
                  </li>
                  <li className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    Filter berdasarkan provinsi dan kota
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/membership">
                  <Button size="lg" className="w-full sm:w-auto">
                    Upgrade ke Premium
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Kembali ke Dashboard
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
      <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Member Regional
        </h1>
        <p className="text-muted-foreground mt-1">
          Temukan member EksporYuk di sekitar Anda untuk networking dan kolaborasi
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Province Select */}
            <Select value={selectedProvince || 'all'} onValueChange={(val) => setSelectedProvince(val === 'all' ? '' : val)}>
              <SelectTrigger>
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Provinsi</SelectItem>
                {availableProvinces.map((province, idx) => (
                  <SelectItem key={`province-${province.name}-${idx}`} value={province.name}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Select */}
            <Select 
              value={selectedCity || 'all'} 
              onValueChange={(val) => setSelectedCity(val === 'all' ? '' : val)}
              disabled={!selectedProvince}
            >
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder={selectedProvince ? "Pilih Kota" : "Pilih provinsi dulu"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kota</SelectItem>
                {availableCities.map((city, idx) => (
                  <SelectItem key={`city-${city}-${idx}`} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Nearby Button */}
            <Button 
              variant={useNearby ? "default" : "outline"} 
              onClick={handleGetNearby}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {useNearby ? 'Terdekat Aktif' : 'Cari Terdekat'}
            </Button>
          </div>

          {/* Active Filters */}
          {(selectedProvince || selectedCity || useNearby) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedProvince && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {selectedProvince}
                  <button onClick={() => setSelectedProvince('')} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedCity}
                  <button onClick={() => setSelectedCity('')} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {useNearby && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  Pencarian Terdekat
                  <button onClick={() => { setUseNearby(false); setUserLocation(null) }} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-xs text-muted-foreground">Total Member</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{provinces.length}</p>
                <p className="text-xs text-muted-foreground">Provinsi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{members.filter(m => m.locationVerified).length}</p>
                <p className="text-xs text-muted-foreground">Lokasi Terverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{members.filter(m => m.isOnline).length}</p>
                <p className="text-xs text-muted-foreground">Online Sekarang</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Province Quick Filter */}
      {provinces.length > 0 && !selectedProvince && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Provinsi Populer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {provinces.slice(0, 10).map((prov) => (
                <Button
                  key={prov.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProvince(prov.name)}
                  className="flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  {prov.name}
                  <Badge variant="secondary" className="ml-1 text-xs">{prov.count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : members.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tidak ada member yang ditemukan dengan filter ini. Coba ubah kriteria pencarian Anda.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar || ''} alt={member.name} />
                      <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{member.name}</h3>
                      <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                    
                    {member.username && (
                      <p className="text-sm text-muted-foreground">@{member.username}</p>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">
                        {member.city || 'Kota tidak diset'}
                        {member.province && `, ${member.province}`}
                      </span>
                      {member.locationVerified && (
                        <span title="Lokasi terverifikasi">
                          <UserCheck className="h-3 w-3 text-green-500 ml-1" />
                        </span>
                      )}
                    </div>

                    {member.distance !== null && member.distance !== undefined && (
                      <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                        <Navigation className="h-3 w-3" />
                        <span>{member.distance.toFixed(1)} km dari Anda</span>
                      </div>
                    )}

                    {member.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{member._count.followers} pengikut</span>
                      <span>{member._count.following} mengikuti</span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {member.isOnline ? (
                          <span className="text-green-600">● Online</span>
                        ) : member.lastSeenAt ? (
                          `Terakhir online ${formatDistanceToNow(new Date(member.lastSeenAt), { addSuffix: true, locale: id })}`
                        ) : (
                          'Offline'
                        )}
                      </span>
                      <Link href={`/${member.username || member.id}`}>
                        <Button size="sm" variant="ghost" className="h-7">
                          Lihat Profil
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Sebelumnya
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* Complete Profile Alert */}
      {session?.user && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900">Lengkapi Profil Lokasi Anda</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Agar member lain dapat menemukan Anda di direktori, lengkapi informasi domisili di halaman profil.
                </p>
                <Link href="/profile">
                  <Button size="sm" className="mt-3">
                    Lengkapi Profil
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </ResponsivePageWrapper>
  )
}
