'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  User,
  MapPin,
  Phone,
  Mail,
  Save,
  Loader2,
  Camera,
  Building2,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProfileData {
  id: string
  name: string
  email: string
  username: string | null
  avatar: string | null
  coverImage: string | null
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

interface LocationData {
  provinces: Array<{ name: string; cities: string[] }>
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [emailChangeToken, setEmailChangeToken] = useState('')
  
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

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  const [emailData, setEmailData] = useState({
    newEmail: '',
    verificationCode: '',
  })

  const [locationData, setLocationData] = useState<LocationData>({ provinces: [] })
  const [availableCities, setAvailableCities] = useState<string[]>([])

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }
    fetchProfile()
    fetchLocationData()
  }, [session])

  useEffect(() => {
    if (formData.province && locationData.provinces.length > 0) {
      const province = locationData.provinces.find(p => p.name === formData.province)
      setAvailableCities(province?.cities || [])
    }
  }, [formData.province, locationData.provinces])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      
      if (!res.ok) {
        console.error('Profile API error:', data.error || res.statusText)
        if (res.status === 401) {
          toast.error('Session expired, silakan login ulang')
          router.push('/login')
          return
        }
        if (res.status === 404) {
          toast.error('User tidak ditemukan - session mismatch')
          // Auto redirect to clear session page
          setTimeout(() => {
            router.push('/clear-session')
          }, 1500)
          return
        }
        toast.error(data.error || 'Gagal memuat profil')
        return
      }
      
      if (data.user) {
        setProfile(data.user)
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
      } else {
        toast.error('Data profil tidak ditemukan')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Gagal memuat profil - cek koneksi internet')
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationData = async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      setLocationData(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolocation')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }))
        setGettingLocation(false)
        toast.success('Lokasi GPS berhasil didapatkan')
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Gagal mendapatkan lokasi GPS')
        setGettingLocation(false)
      }
    )
  }

  const handleGenerateUsername = () => {
    if (!formData.name) {
      toast.error('Isi nama terlebih dahulu')
      return
    }
    
    const generated = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 20) + '_' + Date.now().toString().slice(-4)
    
    setFormData(prev => ({ ...prev, username: generated }))
    toast.success('Username berhasil di-generate')
  }

  const handleCopyProfileLink = () => {
    if (!formData.username) {
      toast.error('Username belum diisi')
      return
    }
    
    const link = `${window.location.origin}/${formData.username}`
    navigator.clipboard.writeText(link)
    toast.success('Link profil berhasil disalin')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null)
        toast.success('Foto profil berhasil diupload')
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.avatarUrl,
          }
        })
      } else {
        toast.error(data.error || 'Gagal upload foto')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)

    try {
      const formData = new FormData()
      formData.append('cover', file)

      const res = await fetch('/api/user/cover', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(prev => prev ? { ...prev, coverImage: data.coverUrl } : null)
        toast.success('Cover photo berhasil diupload')
      } else {
        toast.error(data.error || 'Gagal upload cover photo')
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      toast.error('Terjadi kesalahan saat upload')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleRemoveCover = async () => {
    try {
      const res = await fetch('/api/user/cover', {
        method: 'DELETE',
      })

      if (res.ok) {
        setProfile(prev => prev ? { ...prev, coverImage: null } : null)
        toast.success('Cover photo berhasil dihapus')
      } else {
        toast.error('Gagal menghapus cover photo')
      }
    } catch (error) {
      console.error('Error removing cover:', error)
      toast.error('Terjadi kesalahan')
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

      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
        setProfile(data.user)
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            username: data.user.username,
          }
        })
      } else {
        toast.error(data.error || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi
    if (passwordData.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok')
      return
    }

    setChangingPassword(true)

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Password berhasil dibuat')
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        toast.error(data.error || 'Gagal membuat password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi email baru harus gmail.com
    if (!emailData.newEmail.endsWith('@gmail.com')) {
      toast.error('Email baru harus menggunakan Gmail (@gmail.com)')
      return
    }

    // Validasi email baru tidak sama dengan email lama
    if (emailData.newEmail === profile?.email) {
      toast.error('Email baru tidak boleh sama dengan email saat ini')
      return
    }

    setChangingEmail(true)

    try {
      const res = await fetch('/api/user/change-email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: emailData.newEmail,
        })
      })

      const data = await res.json()

      if (res.ok) {
        setEmailChangeToken(data.token)
        setShowEmailVerification(true)
        toast.success('Kode verifikasi telah dikirim ke email baru Anda')
      } else {
        toast.error(data.error || 'Gagal mengirim kode verifikasi')
      }
    } catch (error) {
      console.error('Error requesting email change:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailData.verificationCode || emailData.verificationCode.length !== 6) {
      toast.error('Kode verifikasi harus 6 digit')
      return
    }

    setChangingEmail(true)

    try {
      const res = await fetch('/api/user/change-email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: emailChangeToken,
          code: emailData.verificationCode,
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Email berhasil diubah! Silakan login kembali dengan email baru.')
        // Reset form
        setEmailData({ newEmail: '', verificationCode: '' })
        setShowEmailVerification(false)
        setEmailChangeToken('')
        // Refresh profile
        await fetchProfile()
        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            email: data.newEmail,
          }
        })
      } else {
        toast.error(data.error || 'Gagal memverifikasi kode')
      }
    } catch (error) {
      console.error('Error verifying email change:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleCancelEmailChange = () => {
    setShowEmailVerification(false)
    setEmailData({ newEmail: '', verificationCode: '' })
    setEmailChangeToken('')
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!profile) {
    return (
      <ResponsivePageWrapper>
        <div className="container mx-auto p-4 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <p>Gagal memuat profil. Session mismatch dengan database.</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/clear-session')}
                  className="bg-white hover:bg-gray-50"
                >
                  Fix Session Mismatch
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="bg-white hover:bg-gray-50"
                >
                  Refresh
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>💡 Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Penyebab:</strong> User ID di session tidak cocok dengan database (biasanya setelah seed/reset database)</p>
              <p><strong>Solusi Otomatis:</strong></p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Klik tombol "Fix Session Mismatch" di atas</li>
                <li>Akan auto clear session dan redirect ke login</li>
                <li>Login dengan: <code className="bg-muted px-1 py-0.5 rounded">admin@eksporyuk.com</code> / <code className="bg-muted px-1 py-0.5 rounded">password123</code></li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Edit Profil
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola informasi profil dan lokasi Anda
        </p>
      </div>

      {/* Cover Photo Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Cover Photo
          </CardTitle>
          <CardDescription>
            Tambahkan cover photo untuk mempercantik profil Anda (maks 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden group">
            {profile.coverImage && (
              <img
                src={profile.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-2">
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {profile.coverImage ? 'Ganti Cover' : 'Upload Cover'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
              
              {profile.coverImage && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveCover}
                >
                  Hapus Cover
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-background">
                <AvatarImage src={profile.avatar || undefined} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.username && (
                <div className="flex items-center gap-2 mt-2">
                  <Link 
                    href={`/${profile.username}`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Lihat Profil Publik
                  </Link>
                </div>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {profile.role.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pribadi
            </CardTitle>
            <CardDescription>
              Informasi dasar dan kontak Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username (untuk profil publik)</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') 
                  }))}
                  placeholder="username_anda"
                  className="flex-1"
                />
                {!formData.username && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateUsername}
                  >
                    Generate
                  </Button>
                )}
                {formData.username && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyProfileLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.username && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  /{formData.username}
                </p>
              )}
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
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Bio akan ditampilkan di profil publik Anda
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informasi Lokasi / Domisili
            </CardTitle>
            <CardDescription>
              Lokasi Anda untuk Member Directory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    id="province"
                    value={formData.province || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value, city: '' }))}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Provinsi</option>
                    {locationData.provinces.map((prov, idx) => (
                      <option key={`province-${idx}`} value={prov.name}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Kota/Kabupaten *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!formData.province}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="">{formData.province ? "Pilih Kota" : "Pilih provinsi dulu"}</option>
                    {availableCities.map((city, idx) => (
                      <option key={`city-${idx}`} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">Kecamatan</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="Kecamatan"
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
                placeholder="Alamat lengkap..."
                rows={2}
              />
            </div>

            <Separator />

            {/* GPS Coordinates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Koordinat GPS (Opsional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Untuk pencarian member terdekat
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Dapatkan Lokasi
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="-6.200000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="106.816666"
                  />
                </div>
              </div>

              {formData.latitude && formData.longitude && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Lokasi GPS terverifikasi. Member lain dapat menemukan Anda berdasarkan jarak.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving} className="flex-1 sm:flex-initial">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Profil
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Batal
          </Button>
        </div>
      </form>

      {/* Security - Change Email & Password - Separated from main form to avoid nesting */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Ubah email dan password akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Email Section */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Ubah Email</h4>
                <p className="text-sm text-muted-foreground">
                  Email baru harus menggunakan Gmail (@gmail.com)
                </p>
              </div>

              {!showEmailVerification ? (
                <form onSubmit={handleRequestEmailChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentEmail">Email Saat Ini</Label>
                    <Input
                      id="currentEmail"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email Baru (Gmail)</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={emailData.newEmail}
                      onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                      placeholder="emailbaru@gmail.com"
                      required
                    />
                    {emailData.newEmail && !emailData.newEmail.endsWith('@gmail.com') && (
                      <p className="text-xs text-red-600">✗ Email harus menggunakan Gmail (@gmail.com)</p>
                    )}
                    {emailData.newEmail && emailData.newEmail.endsWith('@gmail.com') && (
                      <p className="text-xs text-green-600">✓ Format email valid</p>
                    )}
                  </div>

                  <Button type="submit" disabled={changingEmail || !emailData.newEmail.endsWith('@gmail.com')}>
                    {changingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengirim Kode...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Kirim Kode Verifikasi
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailChange} className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Kode verifikasi 6 digit telah dikirim ke <strong>{emailData.newEmail}</strong>. 
                      Silakan cek inbox atau folder spam.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Kode Verifikasi</Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      value={emailData.verificationCode}
                      onChange={(e) => setEmailData(prev => ({ 
                        ...prev, 
                        verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                      }))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={changingEmail || emailData.verificationCode.length !== 6}>
                      {changingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Memverifikasi...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verifikasi & Ubah Email
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEmailChange}>
                      Batal
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <Separator />

            {/* Change Password Section */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Buat Password Baru</h4>
                <p className="text-sm text-muted-foreground">
                  Password minimal 6 karakter
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Minimal 6 karakter"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Ketik ulang password baru"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && (
                  <p className={`text-xs ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Membuat Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Buat Password
                  </>
                )}
              </Button>
            </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
