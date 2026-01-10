'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  MapPin, 
  Phone, 
  Building2, 
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  id: string
  name: string
  email: string
  username: string | null
  avatar: string | null
  bio: string | null
  phone: string | null
  whatsapp: string | null
  province: string | null
  city: string | null
  district: string | null
  address: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  locationVerified: boolean
  profileCompleted: boolean
  role: string
}

export default function ProfileCompletionCard() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [completionPercent, setCompletionPercent] = useState(0)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    phone: '',
    whatsapp: '',
    province: '',
    city: '',
    district: '',
    address: '',
    postalCode: '',
    latitude: '',
    longitude: '',
  })

  // Location data
  const [locationData, setLocationData] = useState<Array<{ name: string; cities: string[] }>>([])
  const [cities, setCities] = useState<string[]>([])
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchLocationData()
  }, [])

  useEffect(() => {
    if (formData.province && locationData.length > 0) {
      const province = locationData.find(p => p.name === formData.province)
      setCities(province?.cities || [])
    } else {
      setCities([])
    }
  }, [formData.province, locationData])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      if (data.user) {
        setProfile(data.user)
        setCompletionPercent(data.completionPercent || 0)
        setFormData({
          name: data.user.name || '',
          username: data.user.username || '',
          bio: data.user.bio || '',
          phone: data.user.phone || '',
          whatsapp: data.user.whatsapp || '',
          province: data.user.province || '',
          city: data.user.city || '',
          district: data.user.district || '',
          address: data.user.address || '',
          postalCode: data.user.postalCode || '',
          latitude: data.user.latitude?.toString() || '',
          longitude: data.user.longitude?.toString() || '',
        })
        // Auto expand if not complete
        if (data.completionPercent < 100) {
          setExpanded(true)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationData = async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      setLocationData(data.provinces || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil')
      }

      toast.success('Profil berhasil diperbarui!')
      setProfile(data.user)
      
      // Recalculate completion
      const requiredFields = ['name', 'phone', 'province', 'city']
      const completed = requiredFields.filter(f => formData[f as keyof typeof formData]).length
      setCompletionPercent(Math.round((completed / requiredFields.length) * 100))

      // Update session if name changed
      if (data.user.name !== session?.user?.name) {
        await update({ name: data.user.name })
      }

    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung geolocation')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }))
        toast.success('Lokasi berhasil didapatkan!')
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        toast.error('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={completionPercent < 100 ? 'border-amber-200 bg-amber-50/50' : ''}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${completionPercent === 100 ? 'bg-green-100' : 'bg-amber-100'}`}>
              {completionPercent === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Profil & Lokasi
                {completionPercent === 100 && (
                  <Badge className="bg-green-100 text-green-700">Lengkap</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {completionPercent < 100 
                  ? 'Lengkapi profil untuk tampil di Member Directory' 
                  : 'Profil Anda sudah lengkap'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{completionPercent}%</p>
              <Progress value={completionPercent} className="w-24 h-2" />
            </div>
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Pribadi
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username (untuk profil publik)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      placeholder="username_anda"
                      className="flex-1"
                    />
                    {!formData.username && formData.name && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const generated = formData.name
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .substring(0, 20) + '_' + Date.now().toString().slice(-4)
                          setFormData(prev => ({ ...prev, username: generated }))
                        }}
                      >
                        Generate
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL profil: /{formData.username || 'username_anda'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">No. WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Ceritakan tentang diri Anda..."
                  rows={3}
                />
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Informasi Lokasi / Domisili
              </h4>
              
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Lengkapi lokasi domisili agar member lain dapat menemukan Anda di <strong>Member Directory</strong> untuk networking dan kolaborasi bisnis.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi *</Label>
                  <Select 
                    value={formData.province} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, province: value, city: '' }))
                    }}
                  >
                    <SelectTrigger>
                      <Building2 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Pilih Provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationData.map((prov, index) => (
                        <SelectItem key={`province-${index}-${prov.name}`} value={prov.name}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Kota/Kabupaten *</Label>
                  <Select 
                    value={formData.city} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                    disabled={!formData.province}
                  >
                    <SelectTrigger>
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={formData.province ? "Pilih Kota" : "Pilih provinsi dulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city, index) => (
                        <SelectItem key={`city-${index}-${city}`} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">Kecamatan</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="Nama kecamatan"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Kode Pos</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan..."
                  rows={2}
                />
              </div>

              {/* GPS Coordinates */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Koordinat GPS (Opsional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Aktifkan lokasi untuk pencarian terdekat yang lebih akurat
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4 mr-2" />
                    )}
                    {gettingLocation ? 'Mendapatkan...' : 'Dapatkan Lokasi'}
                  </Button>
                </div>
                
                {(formData.latitude || formData.longitude) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                        placeholder="-6.xxxxxx"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                        placeholder="106.xxxxxx"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
