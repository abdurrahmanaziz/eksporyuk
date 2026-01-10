'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  User,
  Camera,
  Loader2,
  Sparkles,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Mail,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AffiliateOnboardingPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false)
  
  // Form data state
  const [avatar, setAvatar] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    bio: '',
    address: '',
    city: '',
    province: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch profile data
      const profileRes = await fetch('/api/affiliate/profile')
      const profileData = await profileRes.json()
      
      if (profileRes.ok) {
        setAvatar(profileData.user?.avatar || null)
        setFormData({
          name: profileData.user?.name || '',
          phone: profileData.user?.phone || '',
          whatsapp: profileData.user?.whatsapp || '',
          bio: profileData.user?.bio || '',
          address: profileData.user?.address || '',
          city: profileData.user?.city || '',
          province: profileData.user?.province || '',
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF')
      return
    }

    try {
      setUploadingAvatar(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvatar(data.url)
        toast.success('Avatar berhasil diupload')
        const input = document.getElementById('avatar-upload') as HTMLInputElement
        if (input) input.value = ''
      } else {
        toast.error('Gagal mengupload avatar')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengupload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    try {
      setSendingVerificationEmail(true)
      
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      
      // Handle rate limiting
      if (response.status === 429) {
        toast.error(data.error || 'Terlalu banyak permintaan. Silakan coba lagi nanti.')
        if (data.details) {
          toast.info(data.details)
        }
        return
      }
      
      if (response.ok && data.success) {
        toast.success('Email verifikasi telah dikirim! Cek inbox Anda.')
        if (data.warning) {
          toast.info(data.warning, { duration: 5000 })
        }
      } else {
        toast.error(data.error || 'Gagal mengirim email verifikasi')
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
      toast.error('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setSendingVerificationEmail(false)
    }
  }

  const handleMarkEmailVerified = async () => {
    try {
      const response = await fetch('/api/affiliate/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'email',
          completed: true
        })
      })

      if (response.ok) {
        // Update session 
        await updateSession()
        toast.success('Email Anda terverifikasi!')
      } else {
        toast.error('Gagal memverifikasi email')
      }
    } catch (error) {
      console.error('Error marking email verified:', error)
      toast.error('Gagal memverifikasi email')
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nama lengkap wajib diisi')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Nomor telepon wajib diisi')
      return false
    }
    if (!formData.whatsapp.trim()) {
      toast.error('Nomor WhatsApp wajib diisi')
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      setSaving(true)
      
      const allData = {
        avatar,
        ...formData,
      }
      
      const response = await fetch('/api/affiliate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData)
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan data')
      }

      // Mark profile as completed
      await fetch('/api/affiliate/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'profile',
          completed: true
        })
      })

      toast.success('Selamat! Setup akun affiliate berhasil 🎉')
      router.push('/affiliate/dashboard')
      
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  // Check if email needs verification (only if NOT via Google with Gmail)
  const needsEmailVerification = !session?.user?.emailVerified

  return (
    <ResponsivePageWrapper>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Akun Affiliate</h1>
          <p className="text-gray-600 mt-1">Lengkapi informasi untuk memulai perjalanan affiliate Anda</p>
        </div>

        {/* Single Form */}
        <div className="space-y-8">
          {/* Email Status Section - Just informational, not blocking */}
          <Card className={`shadow-lg ${needsEmailVerification ? 'border-blue-100 bg-blue-50' : 'border-green-100 bg-green-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {needsEmailVerification ? (
                  <>
                    <Mail className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">Email: {session?.user?.email}</p>
                      <p className="text-sm text-blue-700">Verifikasi email opsional - bisa dilakukan nanti</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900">Email Terverifikasi</p>
                      <p className="text-sm text-green-700">{session?.user?.email}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Section */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Informasi Profil
              </CardTitle>
              <CardDescription>
                Data diri dan informasi kontak Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-purple-100">
                    <AvatarImage src={avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl">
                      {formData.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div 
                    className="cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <div className={`px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium ${
                      uploadingAvatar 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}>
                      <Camera className="h-4 w-4" />
                      {uploadingAvatar ? 'Mengupload...' : 'Upload Foto'}
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP, GIF. Maks 5MB</p>
                </div>
              </div>

              {/* Name & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Nomor Telepon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="province" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Provinsi
                  </Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Contoh: Jawa Barat"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Kota
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Contoh: Bandung"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Alamat
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat lengkap"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio Singkat</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan sedikit tentang Anda (opsional)"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-4 pb-8">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Selesaikan Setup
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
