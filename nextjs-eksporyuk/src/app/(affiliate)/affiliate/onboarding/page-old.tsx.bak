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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  User,
  Camera,
  CreditCard,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building2,
  PartyPopper,
  Rocket,
} from 'lucide-react'

interface OnboardingData {
  profileCompleted: boolean
  bankInfoCompleted: boolean
  totalProgress: number
}

export default function AffiliateOnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  
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
  
  // Bank data state
  const [bankData, setBankData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
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
        if (profileData.bankAccount) {
          setBankData(profileData.bankAccount)
        }
      }
      
      // Fetch onboarding status
      const onboardingRes = await fetch('/api/affiliate/onboarding')
      const onboardingResult = await onboardingRes.json()
      
      if (onboardingResult.success) {
        setOnboardingData(onboardingResult.data)
        
        // If both profile and bank info are completed, redirect to dashboard
        if (onboardingResult.data.profileCompleted && onboardingResult.data.bankInfoCompleted) {
          router.push('/affiliate')
          return
        }
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

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      setUploadingAvatar(true)
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setAvatar(data.url)
        toast.success('Foto berhasil diupload')
      } else {
        toast.error('Gagal mengunggah foto')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Gagal mengunggah foto')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi')
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

    try {
      setSaving(true)
      const response = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          bio: formData.bio,
          address: formData.address,
          city: formData.city,
          province: formData.province,
        }),
      })

      if (response.ok) {
        toast.success('Profil berhasil disimpan!')
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan profil')
        return false
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Gagal menyimpan profil')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveBankInfo = async () => {
    if (!bankData.bankName.trim()) {
      toast.error('Nama bank wajib diisi')
      return false
    }
    if (!bankData.accountName.trim()) {
      toast.error('Nama pemilik rekening wajib diisi')
      return false
    }
    if (!bankData.accountNumber.trim()) {
      toast.error('Nomor rekening wajib diisi')
      return false
    }

    try {
      setSaving(true)
      const response = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccount: bankData,
        }),
      })

      if (response.ok) {
        toast.success('Rekening berhasil disimpan!')
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan rekening')
        return false
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Gagal menyimpan rekening')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      
      // Submit profile data
      const profileResponse = await fetch('/api/affiliate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar,
          ...formData,
        })
      })

      if (!profileResponse.ok) {
        throw new Error('Gagal menyimpan profil')
      }

      // Submit bank data
      const bankResponse = await fetch('/api/affiliate/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankData)
      })

      if (!bankResponse.ok) {
        throw new Error('Gagal menyimpan informasi rekening')
      }

      // Update onboarding completion status
      await fetch('/api/affiliate/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'profile',
          completed: true
        })
      })

      await fetch('/api/affiliate/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'bank',
          completed: true
        })
      })

      toast.success('Selamat! Onboarding selesai 🎉')
      router.push('/affiliate')
      
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
        <div className="p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Akun Affiliate</h1>
          <p className="text-gray-600 mt-1">Lengkapi semua informasi untuk memulai perjalanan affiliate Anda</p>
        </div>

        {/* Single Form */}
        <div className="space-y-8">
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
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors inline-flex items-center gap-2 text-sm font-medium">
                      <Camera className="h-4 w-4" />
                        Upload Foto
                      </div>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG. Maks 5MB</p>
                  </div>
                </div>

                {/* Name & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="bio">Bio Singkat</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Ceritakan sedikit tentang Anda (opsional)"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Bank Info */}
          {currentStep === 2 && (
            <>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Rekening Bank
                </CardTitle>
                <CardDescription>
                  Untuk pencairan komisi affiliate Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Penting:</strong> Pastikan data rekening sesuai dengan identitas Anda untuk kelancaran pencairan komisi.
                  </p>
                </div>

                <div>
                  <Label htmlFor="bankName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Nama Bank <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    placeholder="Contoh: BCA, Mandiri, BRI, BNI"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="accountName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountName"
                    value={bankData.accountName}
                    onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                    placeholder="Nama sesuai buku rekening"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="accountNumber" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    Nomor Rekening <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    placeholder="Nomor rekening Anda"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <PartyPopper className="h-5 w-5" />
                  Selamat! 🎉
                </CardTitle>
                <CardDescription>
                  Akun affiliate Anda sudah siap digunakan
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Onboarding Selesai!</h3>
                  <p className="text-gray-600 mb-6">
                    Profil dan rekening Anda sudah lengkap. Sekarang Anda bisa mulai mempromosikan produk dan mendapatkan komisi!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <CheckCircle2 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-900">Profil Lengkap</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <CheckCircle2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Rekening Tersimpan</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4">
                    <p className="text-sm text-purple-800">
                      <strong>Langkah selanjutnya:</strong> Buat link affiliate pertama Anda dan mulai promosikan!
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="px-6 pb-6 pt-4 border-t bg-gray-50 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1 || saving}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Lanjutkan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Mulai Affiliate
              </Button>
            )}
          </div>
        </Card>

        {/* Skip Option */}
        {currentStep < 3 && (
          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/affiliate/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Lewati untuk saat ini
            </button>
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
