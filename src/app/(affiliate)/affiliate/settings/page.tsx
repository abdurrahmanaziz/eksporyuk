'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Save,
  CreditCard,
  Bell,
  Loader2,
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  whatsapp: string | null
  avatar: string | null
  bio: string | null
  address: string | null
  city: string | null
  province: string | null
  profileCompleted: boolean
}

interface BankAccount {
  bankName: string
  accountName: string
  accountNumber: string
}

export default function AffiliateSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    bankName: '',
    accountName: '',
    accountNumber: '',
  })
  
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
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/affiliate/profile')
      const result = await response.json()
      
      if (response.ok) {
        setProfile(result.user)
        setFormData({
          name: result.user.name || '',
          phone: result.user.phone || '',
          whatsapp: result.user.whatsapp || '',
          bio: result.user.bio || '',
          address: result.user.address || '',
          city: result.user.city || '',
          province: result.user.province || '',
        })
        if (result.bankAccount) {
          setBankAccount(result.bankAccount)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
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
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, avatar: data.url } : null)
        toast.success('Foto profil berhasil diperbarui')
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

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi')
      return
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
          bankAccount: bankAccount.bankName ? bankAccount : undefined,
        }),
      })

      if (response.ok) {
        toast.success('Profil berhasil disimpan!')
        fetchProfile()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan profil')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-8 w-8 text-purple-600" />
          Pengaturan Profil
        </h1>
        <p className="text-gray-600 mt-2">
          Kelola informasi profil affiliate Anda
        </p>
      </div>
          {/* Avatar Section */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-600" />
                Foto Profil
              </CardTitle>
              <CardDescription>
                Upload foto profil untuk personalisasi akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-purple-100">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                      {formData.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors inline-flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Ganti Foto
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
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG atau GIF. Maksimal 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Informasi Pribadi
              </CardTitle>
              <CardDescription>
                Data pribadi yang akan ditampilkan di profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Nomor Telepon <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp <span className="text-red-500">*</span></Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio / Deskripsi Singkat</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Info */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                Alamat
              </CardTitle>
              <CardDescription>
                Informasi alamat untuk keperluan administrasi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Provinsi</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Contoh: Jawa Barat"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Kota/Kabupaten</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Contoh: Bandung"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Account */}
          <Card className="shadow-lg border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Rekening Bank
              </CardTitle>
              <CardDescription>
                Untuk pencairan komisi affiliate Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bankName">Nama Bank</Label>
                  <Input
                    id="bankName"
                    value={bankAccount.bankName}
                    onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                    placeholder="Contoh: BCA, Mandiri"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="accountName">Nama Pemilik Rekening</Label>
                  <Input
                    id="accountName"
                    value={bankAccount.accountName}
                    onChange={(e) => setBankAccount({ ...bankAccount, accountName: e.target.value })}
                    placeholder="Nama sesuai rekening"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Nomor Rekening</Label>
                  <Input
                    id="accountNumber"
                    value={bankAccount.accountNumber}
                    onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                    placeholder="Nomor rekening"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/affiliate/dashboard')}
          className="border-gray-300"
        >
          Batal
        </Button>
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan Profil
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
