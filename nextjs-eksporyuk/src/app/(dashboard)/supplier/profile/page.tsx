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
import { Badge } from '@/components/ui/badge'
import { Building2, Upload, X, Loader2, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function SupplierProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    bio: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    website: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    linkedin: '',
  })

  const [logoPreview, setLogoPreview] = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [legalityDocFile, setLegalityDocFile] = useState<File | null>(null)
  const [nibDocFile, setNibDocFile] = useState<File | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/supplier/profile')
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/supplier/profile')
      
      if (response.ok) {
        const data = await response.json()
        const profileData = data.data

        setProfile(profileData)
        setFormData({
          companyName: profileData.companyName || '',
          bio: profileData.bio || '',
          address: profileData.address || '',
          city: profileData.city || '',
          province: profileData.province || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          website: profileData.website || '',
          whatsapp: profileData.whatsapp || '',
          instagram: profileData.instagram || '',
          facebook: profileData.facebook || '',
          linkedin: profileData.linkedin || '',
        })

        if (profileData.logo) setLogoPreview(profileData.logo)
        if (profileData.banner) setBannerPreview(profileData.banner)
      } else {
        toast.error('Gagal memuat profil')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      toast.error('Logo maksimal 500KB')
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      toast.error('Banner maksimal 1MB')
      return
    }

    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleDocUpload = (type: 'legality' | 'nib') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dokumen maksimal 5MB')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diperbolehkan')
      return
    }

    if (type === 'legality') {
      setLegalityDocFile(file)
      toast.success(`File ${file.name} siap diupload`)
    } else {
      setNibDocFile(file)
      toast.success(`File ${file.name} siap diupload`)
    }
  }

  const uploadFile = async (file: File, endpoint: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const data = await response.json()
      return data.url
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName) {
      toast.error('Nama perusahaan wajib diisi')
      return
    }

    setSubmitting(true)

    try {
      let logoUrl = profile?.logo
      let bannerUrl = profile?.banner
      let legalityUrl = profile?.legalityDoc
      let nibUrl = profile?.nibDoc

      // Upload logo if changed
      if (logoFile) {
        setUploadingLogo(true)
        logoUrl = await uploadFile(logoFile, '/api/upload/image')
        setUploadingLogo(false)
        if (!logoUrl) {
          toast.error('Gagal upload logo')
          setSubmitting(false)
          return
        }
      }

      // Upload banner if changed
      if (bannerFile) {
        setUploadingBanner(true)
        bannerUrl = await uploadFile(bannerFile, '/api/upload/image')
        setUploadingBanner(false)
        if (!bannerUrl) {
          toast.error('Gagal upload banner')
          setSubmitting(false)
          return
        }
      }

      // Upload legality document
      if (legalityDocFile) {
        setUploadingDoc(true)
        legalityUrl = await uploadFile(legalityDocFile, '/api/upload/document')
        setUploadingDoc(false)
        if (!legalityUrl) {
          toast.error('Gagal upload dokumen legalitas')
          setSubmitting(false)
          return
        }
      }

      // Upload NIB document
      if (nibDocFile) {
        setUploadingDoc(true)
        nibUrl = await uploadFile(nibDocFile, '/api/upload/document')
        setUploadingDoc(false)
        if (!nibUrl) {
          toast.error('Gagal upload dokumen NIB')
          setSubmitting(false)
          return
        }
      }

      // Update profile
      const response = await fetch('/api/supplier/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          logo: logoUrl,
          banner: bannerUrl,
          legalityDoc: legalityUrl,
          nibDoc: nibUrl
        })
      })

      if (response.ok) {
        toast.success('Profil berhasil diupdate')
        fetchProfile() // Refresh data
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal update profil')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const getVerificationBadge = () => {
    if (!profile) return null

    if (profile.isVerified) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Terverifikasi
        </Badge>
      )
    }

    if (profile.verificationStatus === 'PENDING') {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" />
          Menunggu Verifikasi
        </Badge>
      )
    }

    if (profile.verificationStatus === 'REJECTED') {
      return (
        <Badge className="bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Ditolak
        </Badge>
      )
    }

    return (
      <Badge className="bg-gray-100 text-gray-700">
        <Clock className="w-3 h-3 mr-1" />
        Belum Verifikasi
      </Badge>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profil Supplier</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola informasi perusahaan Anda</p>
          </div>
          {getVerificationBadge()}
        </div>

        {/* Verification Alert */}
        {profile && !profile.isVerified && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Lengkapi Profil untuk Verifikasi</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Upload dokumen legalitas dan NIB untuk mendapatkan badge verifikasi. Profil yang terverifikasi akan mendapat prioritas tampil di direktori supplier.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo & Banner */}
          <Card>
            <CardHeader>
              <CardTitle>Logo & Banner</CardTitle>
              <CardDescription>Upload logo dan banner perusahaan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Logo Perusahaan</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="relative">
                        <img src={logoPreview} alt="Logo" className="w-32 h-32 object-cover mx-auto rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview('')
                            setLogoFile(null)
                          }}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Upload logo</p>
                        <p className="text-xs text-gray-500 mb-3">Maksimal 500KB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Pilih Logo</span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Banner */}
                <div className="space-y-2">
                  <Label>Banner Perusahaan</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {bannerPreview ? (
                      <div className="relative">
                        <img src={bannerPreview} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setBannerPreview('')
                            setBannerFile(null)
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Upload banner</p>
                        <p className="text-xs text-gray-500 mb-3">Maksimal 1MB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      id="banner-upload"
                    />
                    <Label htmlFor="banner-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Pilih Banner</span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Perusahaan</CardTitle>
              <CardDescription>Data utama perusahaan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nama Perusahaan *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="PT. Ekspor Indonesia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Deskripsi Perusahaan</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan tentang perusahaan Anda"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Jawa Barat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Kota</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bandung"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap perusahaan"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="021-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@perusahaan.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media Sosial & Website</CardTitle>
              <CardDescription>Link profil media sosial perusahaan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://perusahaan.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="628123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@perusahaan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="facebook.com/perusahaan"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Legalitas</CardTitle>
              <CardDescription>Upload dokumen untuk verifikasi (Format PDF, maksimal 5MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Legality Doc */}
                <div className="space-y-2">
                  <Label>Dokumen Legalitas Perusahaan</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {profile?.legalityDoc ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <a href={profile.legalityDoc} target="_blank" className="text-blue-600 hover:underline flex-1 truncate">
                          Lihat Dokumen
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">Belum ada dokumen</p>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDocUpload('legality')}
                      className="hidden"
                      id="legality-upload"
                    />
                    <Label htmlFor="legality-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" className="w-full mt-2" asChild>
                        <span>
                          {legalityDocFile ? legalityDocFile.name : 'Pilih File PDF'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* NIB Doc */}
                <div className="space-y-2">
                  <Label>Nomor Induk Berusaha (NIB)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {profile?.nibDoc ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <a href={profile.nibDoc} target="_blank" className="text-blue-600 hover:underline flex-1 truncate">
                          Lihat Dokumen
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">Belum ada dokumen</p>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDocUpload('nib')}
                      className="hidden"
                      id="nib-upload"
                    />
                    <Label htmlFor="nib-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" className="w-full mt-2" asChild>
                        <span>
                          {nibDocFile ? nibDocFile.name : 'Pilih File PDF'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {profile?.verificationReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900">Alasan Penolakan:</p>
                  <p className="text-sm text-red-700 mt-1">{profile.verificationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting || uploadingLogo || uploadingBanner || uploadingDoc}
              size="lg"
            >
              {submitting || uploadingLogo || uploadingBanner || uploadingDoc ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingLogo || uploadingBanner || uploadingDoc ? 'Mengupload...' : 'Menyimpan...'}
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Simpan Profil
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ResponsivePageWrapper>
  )
}
