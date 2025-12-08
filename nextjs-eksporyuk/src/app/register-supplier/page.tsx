'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Check, Loader2, Building2, MapPin, Phone, Mail, Lock, User, Package } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SupplierPackage {
  id: string
  name: string
  slug: string
  type: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  duration: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
  price: number
  originalPrice?: number
  description?: string
  isActive: boolean
  features: {
    maxProducts: number
    chatEnabled: boolean
    verifiedBadge: boolean
    customURL: boolean
    statistics: boolean
    ranking: boolean
    priority: boolean
    catalogDownload: boolean
    multiLanguage: boolean
  }
}

export default function RegisterSupplierPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<SupplierPackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // User account data
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Company basic data
    companyName: '',
    companyLocation: '',
    companyPhone: '',
    companyEmail: '',
    
    // Selected package
    packageId: '',
  })

  // Fetch packages when entering step 2
  const fetchPackages = async () => {
    setLoadingPackages(true)
    try {
      const response = await fetch('/api/supplier/packages')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.packages) {
          setPackages(data.packages)
          
          // Auto-select FREE package if available
          const freePackage = data.packages.find((pkg: SupplierPackage) => pkg.type === 'FREE')
          if (freePackage && !formData.packageId) {
            setFormData(prev => ({ ...prev, packageId: freePackage.id }))
          }
        }
      } else {
        toast.error('Failed to load packages')
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Error loading packages')
    } finally {
      setLoadingPackages(false)
    }
  }

  const handleNext = () => {
    // Validation step 1
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        toast.error('Please fill all required fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      if (!formData.companyName || !formData.companyLocation) {
        toast.error('Please fill company basic information')
        return
      }
      
      // Fetch packages for step 2
      fetchPackages()
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!formData.packageId) {
      toast.error('Please select a package')
      return
    }

    console.log('[REGISTER_SUPPLIER] Starting registration...')
    setLoading(true)
    
    try {
      console.log('[REGISTER_SUPPLIER] Sending request to API...')
      const response = await fetch('/api/supplier/register-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('[REGISTER_SUPPLIER] API Response:', data)

      if (response.ok) {
        toast.success('Registration successful!')
        
        // Redirect based on package type
        if (data.requiresPayment && data.checkoutUrl) {
          console.log('[REGISTER_SUPPLIER] Redirecting to payment:', data.checkoutUrl)
          // PREMIUM package - redirect to payment
          setTimeout(() => {
            window.location.href = data.checkoutUrl
          }, 1000)
        } else if (data.shouldLogin) {
          console.log('[REGISTER_SUPPLIER] FREE package - auto login then redirect')
          // FREE package - auto login, then redirect to dashboard
          toast.loading('Logging you in...')
          
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          })

          if (result?.ok) {
            console.log('[REGISTER_SUPPLIER] Login successful, redirecting to dashboard')
            toast.success('Welcome to Eksporyuk!')
            setTimeout(() => {
              window.location.href = '/supplier/dashboard'
            }, 500)
          } else {
            console.error('[REGISTER_SUPPLIER] Auto-login failed:', result?.error)
            toast.error('Registration successful, but auto-login failed. Please login manually.')
            router.push('/login')
          }
        } else {
          console.log('[REGISTER_SUPPLIER] Registration complete, redirecting to dashboard')
          // Fallback - redirect to dashboard
          router.push('/supplier/dashboard')
        }
      } else {
        console.log('[REGISTER_SUPPLIER] Registration failed:', data.error)
        
        // Special handling for email already registered
        if (data.error && data.error.includes('already registered')) {
          toast.error(
            <div>
              <p className="font-semibold">Email sudah terdaftar!</p>
              <p className="text-sm">Silakan <a href="/login" className="underline">login</a> atau gunakan email lain.</p>
            </div>
          )
        } else {
          toast.error(data.error || 'Registration failed')
        }
      }
    } catch (error) {
      console.error('[REGISTER_SUPPLIER] Error:', error)
      toast.error('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find(pkg => pkg.id === formData.packageId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-4xl font-bold mb-2">Daftar Sebagai Supplier</h1>
          <p className="text-gray-600">Jual produk Anda ke ribuan pembeli di platform kami</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Data Diri</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Pilih Paket</span>
            </div>
          </div>
        </div>

        {/* Step 1: User Data + Company Basic */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun & Perusahaan</CardTitle>
              <CardDescription>Lengkapi data diri Anda dan informasi dasar perusahaan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Account Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Data Akun
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nama Lengkap Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@contoh.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="08123456789"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min. 6 karakter"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Ketik ulang password"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Basic Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Informasi Perusahaan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nama Perusahaan *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="PT. Contoh Indonesia"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyLocation">Lokasi Perusahaan *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="companyLocation"
                        value={formData.companyLocation}
                        onChange={(e) => setFormData({ ...formData, companyLocation: e.target.value })}
                        placeholder="Jakarta, Indonesia"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Telepon Perusahaan</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="companyPhone"
                        value={formData.companyPhone}
                        onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                        placeholder="021-12345678"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email Perusahaan</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="companyEmail"
                        type="email"
                        value={formData.companyEmail}
                        onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                        placeholder="info@perusahaan.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Data lengkap seperti logo, banner, dokumen legalitas, dan produk 
                  dapat Anda lengkapi setelah pendaftaran di dashboard supplier.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleNext} size="lg">
                  Selanjutnya
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Pilih Paket Membership</CardTitle>
              <CardDescription>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingPackages ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-gray-500 mt-2">Memuat paket...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tidak ada paket tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map((pkg) => {
                    const isSelected = formData.packageId === pkg.id
                    const discount = pkg.originalPrice && pkg.originalPrice > pkg.price
                      ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
                      : 0

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setFormData({ ...formData, packageId: pkg.id })}
                        className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{pkg.name}</h3>
                            <Badge variant={pkg.type === 'FREE' ? 'secondary' : 'default'} className="mt-1">
                              {pkg.type}
                            </Badge>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>

                        <div className="mb-4">
                          {discount > 0 && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm line-through text-gray-500">
                                Rp {pkg.originalPrice?.toLocaleString('id-ID')}
                              </span>
                              <Badge variant="destructive" className="text-xs">{discount}% OFF</Badge>
                            </div>
                          )}
                          <div className="text-3xl font-bold">
                            {pkg.price === 0 ? 'GRATIS' : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pkg.duration === 'MONTHLY' && '/ Bulan'}
                            {pkg.duration === 'YEARLY' && '/ Tahun'}
                            {pkg.duration === 'LIFETIME' && 'Selamanya'}
                          </div>
                        </div>

                        {pkg.description && (
                          <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-green-600" />
                            <span>
                              {pkg.features.maxProducts === -1
                                ? 'Produk Unlimited'
                                : `${pkg.features.maxProducts} Produk`}
                            </span>
                          </div>
                          {pkg.features.chatEnabled && (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Chat dengan Pembeli</span>
                            </div>
                          )}
                          {pkg.features.verifiedBadge && (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Badge Terverifikasi</span>
                            </div>
                          )}
                          {pkg.features.statistics && (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Analitik & Statistik</span>
                            </div>
                          )}
                          {pkg.features.customURL && (
                            <div className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>URL Khusus</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Package Summary */}
              {selectedPackage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Paket Terpilih:</strong> {selectedPackage.name} - 
                    {selectedPackage.price === 0 ? ' GRATIS' : ` Rp ${selectedPackage.price.toLocaleString('id-ID')}`}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !formData.packageId} size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedPackage?.price === 0 ? 'Daftar Gratis' : 'Lanjut ke Pembayaran'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Login di sini
            </Link>
          </p>
          <p className="mt-2">
            Sudah jadi member dan ingin upgrade ke supplier?{' '}
            <Link href="/become-supplier" className="text-blue-600 hover:underline font-medium">
              Klik di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
