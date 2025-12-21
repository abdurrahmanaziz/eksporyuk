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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, MapPin, Phone, Mail, Globe, Loader2, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SupplierOnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    description: '',
    province: '',
    city: '',
    district: '',
    address: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    businessType: '',
  })

  // Check if user already has supplier profile
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/supplier/onboarding')
      return
    }

    if (session?.user?.id) {
      checkSupplierProfile()
    }
  }, [session, status])

  const checkSupplierProfile = async () => {
    try {
      const res = await fetch('/api/supplier/profile/check')
      if (res.ok) {
        const data = await res.json()
        if (data.hasProfile) {
          // Already has supplier profile, redirect to dashboard
          router.push('/supplier/dashboard')
        } else {
          setCheckingProfile(false)
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      setCheckingProfile(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from company name
    if (field === 'companyName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.companyName || !formData.province || !formData.city) {
      toast.error('Nama perusahaan, provinsi, dan kota wajib diisi')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/supplier/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Profil supplier berhasil dibuat!')
        
        // Redirect to package selection
        if (data.redirectToPackage) {
          router.push('/pricing/supplier')
        } else {
          router.push('/supplier/dashboard')
        }
      } else {
        toast.error(data.error || 'Gagal membuat profil supplier')
      }
    } catch (error) {
      console.error('Error creating supplier profile:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lengkapi Profil Supplier Anda
          </h1>
          <p className="text-gray-600">
            Isi informasi perusahaan untuk mulai mempromosikan produk Anda
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Akun Dibuat</span>
          </div>
          <div className="w-16 h-1 bg-blue-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              2
            </div>
            <span className="text-sm font-medium text-blue-600">Profil Perusahaan</span>
          </div>
          <div className="w-16 h-1 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold">
              3
            </div>
            <span className="text-sm font-medium text-gray-500">Pilih Paket</span>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perusahaan</CardTitle>
            <CardDescription>
              Data ini akan ditampilkan di profil publik supplier Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="companyName">
                    Nama Perusahaan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="PT. Contoh Eksportir Indonesia"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="slug">
                    URL Profil (Slug)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {typeof window !== 'undefined' ? window.location.host : 'eksporyuk.com'}/supplier/
                    </span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleChange('slug', e.target.value)}
                      placeholder="nama-perusahaan"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    URL ini akan digunakan untuk mengakses profil perusahaan Anda
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Deskripsi Perusahaan</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Ceritakan tentang perusahaan Anda..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Bidang Usaha</Label>
                  <Select value={formData.businessType} onValueChange={(value) => handleChange('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bidang usaha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUFACTURING">Manufaktur</SelectItem>
                      <SelectItem value="AGRICULTURE">Pertanian</SelectItem>
                      <SelectItem value="FISHERY">Perikanan</SelectItem>
                      <SelectItem value="HANDICRAFT">Kerajinan</SelectItem>
                      <SelectItem value="FOOD_BEVERAGE">Makanan & Minuman</SelectItem>
                      <SelectItem value="TEXTILE">Tekstil</SelectItem>
                      <SelectItem value="FURNITURE">Furniture</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Lokasi Perusahaan
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="province">
                      Provinsi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleChange('province', e.target.value)}
                      placeholder="Contoh: Jawa Barat"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">
                      Kota/Kabupaten <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Contoh: Bandung"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">Kecamatan</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleChange('district', e.target.value)}
                      placeholder="Contoh: Coblong"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Kode Pos</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="40123"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Jl. Contoh No. 123"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Informasi Kontak
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+62 21 1234567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Perusahaan</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="info@perusahaan.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="website">Website (Opsional)</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://www.perusahaan.com"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Lewati Dulu
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Lanjutkan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ResponsivePageWrapper>
  )
}
