'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Camera,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  ChevronRight,
  MessageCircle,
  Shield,
  Users,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

// Indonesian provinces data
const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'Kepulauan Riau',
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
  'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan'
]

interface ProfileData {
  name: string
  avatar: string
  phone: string
  whatsapp: string
  province: string
  city: string
  district: string
  address: string
  bio: string
}

export default function CompleteProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [missingFields, setMissingFields] = useState<string[]>([])
  
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    avatar: '',
    phone: '',
    whatsapp: '',
    province: '',
    city: '',
    district: '',
    address: '',
    bio: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOnboardingData()
    }
  }, [status])

  const fetchOnboardingData = async () => {
    try {
      const res = await fetch('/api/member/onboarding')
      const data = await res.json()
      
      if (data.success) {
        // If already completed, redirect to dashboard
        if (data.data.profileCompleted) {
          setProfileCompleted(true)
          router.push('/dashboard')
          return
        }
        
        // Pre-fill form with existing data
        const user = data.data.user
        setFormData({
          name: user.name || '',
          avatar: user.avatar || '',
          phone: user.phone || '',
          whatsapp: user.whatsapp || user.phone || '',
          province: user.province || '',
          city: user.city || '',
          district: user.district || '',
          address: user.address || '',
          bio: user.bio || '',
        })
        
        setProgress(data.data.profile.progress)
        setMissingFields(data.data.profile.missingFields)
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error)
      toast.error('Gagal memuat data profil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', 'image') // Add type parameter for API validation

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await res.json()
      
      if (data.success && data.url) {
        setFormData(prev => ({ ...prev, avatar: data.url }))
        toast.success('Foto profil berhasil diupload')
      } else {
        throw new Error(data.error || 'Upload gagal')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengupload foto profil')
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi'
    if (!formData.avatar) newErrors.avatar = 'Foto profil wajib diupload'
    if (!formData.phone) newErrors.phone = 'Nomor telepon wajib diisi'
    if (!formData.whatsapp) newErrors.whatsapp = 'Nomor WhatsApp wajib diisi'
    if (!formData.province) newErrors.province = 'Provinsi wajib dipilih'
    if (!formData.city) newErrors.city = 'Kota/Kabupaten wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/member/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Profil berhasil dilengkapi! 🎉')
        router.push('/dashboard')
      } else {
        toast.error(data.error || 'Gagal menyimpan profil')
        if (data.errors) {
          data.errors.forEach((err: string) => toast.error(err))
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Terjadi kesalahan saat menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-gray-600">Memuat data profil...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (profileCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Profil sudah lengkap, mengalihkan...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lengkapi Profil Anda
            </h1>
            <p className="text-gray-600">
              Untuk mengakses materi dan grup eksklusif, lengkapi profil Anda terlebih dahulu
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress Profil</span>
                <span className="text-sm text-orange-600 font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {missingFields.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {missingFields.length} field tersisa untuk dilengkapi
                </p>
              )}
            </CardContent>
          </Card>

          {/* Benefits Alert */}
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Shield className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Kenapa harus melengkapi profil?</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Akses ke semua materi kelas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Bergabung ke grup WhatsApp eksklusif
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Mendapatkan sertifikat dengan nama Anda
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Terhubung dengan member lain
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Semua field bertanda <span className="text-red-500">*</span> wajib diisi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage src={formData.avatar} />
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                        {formData.name?.charAt(0) || session?.user?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Foto Profil <span className="text-red-500">*</span></p>
                    <p className="text-xs text-gray-500">JPG, PNG. Maks 5MB</p>
                  </div>
                  {errors.avatar && (
                    <p className="text-sm text-red-500">{errors.avatar}</p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">
                      WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={`pl-10 ${errors.whatsapp ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.whatsapp && (
                      <p className="text-sm text-red-500">{errors.whatsapp}</p>
                    )}
                  </div>
                </div>

                {/* Province & City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">
                      Provinsi <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${errors.province ? 'border-red-500' : 'border-input'}`}
                    >
                      <option value="">Pilih Provinsi</option>
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="text-sm text-red-500">{errors.province}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Kota/Kabupaten <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Masukkan kota/kabupaten"
                        className={`pl-10 ${errors.city ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* District (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="district">
                    Kecamatan <span className="text-gray-400 text-sm">(Opsional)</span>
                  </Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="Masukkan kecamatan"
                  />
                </div>

                {/* Address (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Alamat Lengkap <span className="text-gray-400 text-sm">(Opsional)</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    rows={2}
                  />
                </div>

                {/* Bio (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="bio">
                    Tentang Saya <span className="text-gray-400 text-sm">(Opsional)</span>
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Ceritakan sedikit tentang diri Anda..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan & Lanjutkan
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Setelah melengkapi profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Akses Materi Kelas</p>
                    <p className="text-sm text-gray-500">Mulai belajar dari materi-materi eksklusif</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Gabung Grup Komunitas</p>
                    <p className="text-sm text-gray-500">Bergabung dengan sesama member</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Grup WhatsApp Eksklusif</p>
                    <p className="text-sm text-gray-500">Dapatkan link grup WhatsApp sesuai membership</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
