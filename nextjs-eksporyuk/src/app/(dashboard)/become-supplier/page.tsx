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
import { Badge } from '@/components/ui/badge'
import { Check, Upload, Building2, Shield, Package } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierPackage {
  id: string
  name: string
  type: string
  duration: string
  price: number
  originalPrice?: number
  features: any
  description?: string
}

const PROVINCES = [
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi',
  'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan',
  'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung',
  'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan',
  'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan',
  'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara'
]

export default function BecomeSupplierPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<SupplierPackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [step, setStep] = useState(1)

  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    bio: '',
    businessCategory: '',
    province: '',
    city: '',
    address: '',
    contactPerson: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    whatsapp: '',
    website: '',
  })

  // Files
  const [files, setFiles] = useState({
    logo: null as File | null,
    banner: null as File | null,
    legalityDoc: null as File | null,
    nibDoc: null as File | null,
  })

  useEffect(() => {
    fetchPackages()
    checkExistingProfile()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/supplier/packages')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.packages) {
          setPackages(data.packages)
          
          // Auto select FREE package
          const freePackage = data.packages.find((pkg: SupplierPackage) => pkg.type === 'FREE')
          if (freePackage) {
            setSelectedPackageId(freePackage.id)
          } else if (data.packages.length > 0) {
            // Fallback to first package
            setSelectedPackageId(data.packages[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to load packages')
    }
  }

  const checkExistingProfile = async () => {
    try {
      const response = await fetch('/api/supplier/profile')
      if (response.ok) {
        toast.info('You already have a supplier profile')
        router.push('/supplier/dashboard')
      }
    } catch (error) {
      // No profile yet, continue
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleCompanyNameChange = (value: string) => {
    setFormData({
      ...formData,
      companyName: value,
      slug: generateSlug(value),
    })
  }

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles({ ...files, [field]: file })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPackageId) {
      toast.error('Please select a package')
      return
    }

    console.log('[BECOME_SUPPLIER] Starting registration...')
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value)
      })
      
      formDataToSend.append('packageId', selectedPackageId)
      
      // Append files
      if (files.logo) formDataToSend.append('logo', files.logo)
      if (files.banner) formDataToSend.append('banner', files.banner)
      if (files.legalityDoc) formDataToSend.append('legalityDoc', files.legalityDoc)
      if (files.nibDoc) formDataToSend.append('nibDoc', files.nibDoc)

      console.log('[BECOME_SUPPLIER] Sending request to API...')
      const response = await fetch('/api/supplier/register', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()
      console.log('[BECOME_SUPPLIER] API Response:', data)

      if (response.ok) {
        // Check if payment is required
        if (data.requiresPayment && data.paymentUrl) {
          console.log('[BECOME_SUPPLIER] Redirecting to payment:', data.paymentUrl)
          toast.success('Profile created! Redirecting to payment...')
          // Small delay to show toast
          setTimeout(() => {
            window.location.href = data.paymentUrl
          }, 1000)
        } else {
          // FREE package
          console.log('[BECOME_SUPPLIER] Registration complete, redirecting to dashboard')
          toast.success('Registration successful! Welcome to EksporYuk Supplier Network.')
          router.push('/supplier/dashboard')
        }
      } else {
        console.error('[BECOME_SUPPLIER] Registration failed:', data.error)
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('[BECOME_SUPPLIER] Error:', error)
      toast.error('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find(p => p.id === selectedPackageId)

  return (
    <ResponsivePageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Become a Supplier</h1>
          <p className="text-gray-500">Join EksporYuk supplier network and grow your export business</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Company Info</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-sm font-medium">Documents</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium">Select Package</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Tell us about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      placeholder="PT. Export Indonesia"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">eksporyuk.com/supplier/</span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="pt-export-indonesia"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Company Description</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about your business..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessCategory">Business Category</Label>
                    <Select
                      value={formData.businessCategory}
                      onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Fashion & Apparel">Fashion & Apparel</SelectItem>
                        <SelectItem value="Handicraft">Handicraft</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Cosmetics">Cosmetics</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => setFormData({ ...formData, province: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((prov) => (
                          <SelectItem key={prov} value={prov}>
                            {prov}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Jakarta"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Sudirman No. 123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+62812345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+62812345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://company.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>
                    Next: Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Company Documents & Branding
                </CardTitle>
                <CardDescription>Upload your company logo, banner, and legal documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="logo" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {files.logo ? files.logo.name : 'Click to upload logo'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 2MB)</p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner">Company Banner</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        id="banner"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="banner" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {files.banner ? files.banner.name : 'Click to upload banner'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalityDoc">Legalitas PT (Kemenkumham)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        id="legalityDoc"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('legalityDoc', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="legalityDoc" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {files.legalityDoc ? files.legalityDoc.name : 'Click to upload'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nibDoc">NIB (OSS)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        id="nibDoc"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('nibDoc', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="nibDoc" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          {files.nibDoc ? files.nibDoc.name : 'Click to upload'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(3)}>
                    Next: Select Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Package */}
          {step === 3 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Select Membership Package
                  </CardTitle>
                  <CardDescription>Choose the package that fits your business needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                          selectedPackageId === pkg.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center space-y-4">
                          <Badge variant={pkg.type === 'FREE' ? 'secondary' : 'default'}>
                            {pkg.type}
                          </Badge>
                          <h3 className="font-bold text-xl">{pkg.name}</h3>
                          <div>
                            <p className="text-3xl font-bold">
                              {pkg.price === 0 ? 'Gratis' : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                            </p>
                            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                              <p className="text-sm text-gray-500 line-through">
                                Rp {pkg.originalPrice.toLocaleString('id-ID')}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              {pkg.duration === 'MONTHLY' ? '/bulan' : pkg.duration === 'YEARLY' ? '/tahun' : ''}
                            </p>
                          </div>
                          <div className="text-left text-sm space-y-2">
                            <p className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              Products: {pkg.features.maxProducts === -1 ? 'Unlimited' : pkg.features.maxProducts}
                            </p>
                            <p className="flex items-center gap-2">
                              {pkg.features.chatEnabled ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="w-4 h-4 text-gray-300">✗</span>
                              )}
                              Chat Enabled
                            </p>
                            <p className="flex items-center gap-2">
                              {pkg.features.verifiedBadge ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="w-4 h-4 text-gray-300">✗</span>
                              )}
                              Verified Badge
                            </p>
                            <p className="flex items-center gap-2">
                              {pkg.features.customURL ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="w-4 h-4 text-gray-300">✗</span>
                              )}
                              Custom URL
                            </p>
                            <p className="flex items-center gap-2">
                              {pkg.features.statistics ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="w-4 h-4 text-gray-300">✗</span>
                              )}
                              Statistics & Analytics
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Processing...' : selectedPackage?.price === 0 ? 'Complete Registration' : 'Continue to Payment'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </ResponsivePageWrapper>
  )
}
