/**
 * SupplierProfileForm Component
 * 
 * Form 5 tab untuk supplier profile sesuai PRD:
 * Tab 1: Identitas Usaha
 * Tab 2: Alamat & Lokasi  
 * Tab 3: Kontak Perusahaan
 * Tab 4: Legalitas & Dokumen
 * Tab 5: Bio & Keunggulan
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Phone, FileText, Award, Upload, CheckCircle } from 'lucide-react'

const PROVINCES = [
  'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi',
  'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan',
  'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung',
  'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan',
  'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan',
  'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara'
]

export interface SupplierProfileData {
  // Tab 1: Identitas Usaha
  companyName: string
  slug: string
  legalEntityType: string // PT, CV, UD, Perorangan
  businessField: string
  mainProducts: string
  establishedYear: number | null
  businessCategory: string

  // Tab 2: Alamat & Lokasi
  address: string
  province: string
  city: string
  district: string
  postalCode: string
  productionLocation: string

  // Tab 3: Kontak
  contactPerson: string
  picPosition: string
  email: string
  businessEmail: string
  phone: string
  whatsapp: string
  website: string

  // Tab 4: Legalitas (files handled separately)
  nibNumber: string
  npwpNumber: string
  siupNumber: string
  
  // Tab 5: Bio
  bio: string
  companyAdvantages: string
  uniqueValue: string
}

interface SupplierProfileFormProps {
  initialData?: Partial<SupplierProfileData>
  onSubmit: (data: SupplierProfileData, files: any) => Promise<void>
  isSubmitting?: boolean
}

export default function SupplierProfileForm({ 
  initialData, 
  onSubmit,
  isSubmitting = false 
}: SupplierProfileFormProps) {
  const [activeTab, setActiveTab] = useState('identitas')
  const [completedTabs, setCompletedTabs] = useState<string[]>([])
  
  const [formData, setFormData] = useState<SupplierProfileData>({
    // Tab 1
    companyName: initialData?.companyName || '',
    slug: initialData?.slug || '',
    legalEntityType: initialData?.legalEntityType || '',
    businessField: initialData?.businessField || '',
    mainProducts: initialData?.mainProducts || '',
    establishedYear: initialData?.establishedYear || null,
    businessCategory: initialData?.businessCategory || '',
    
    // Tab 2
    address: initialData?.address || '',
    province: initialData?.province || '',
    city: initialData?.city || '',
    district: initialData?.district || '',
    postalCode: initialData?.postalCode || '',
    productionLocation: initialData?.productionLocation || '',
    
    // Tab 3
    contactPerson: initialData?.contactPerson || '',
    picPosition: initialData?.picPosition || '',
    email: initialData?.email || '',
    businessEmail: initialData?.businessEmail || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || '',
    website: initialData?.website || '',
    
    // Tab 4
    nibNumber: initialData?.nibNumber || '',
    npwpNumber: initialData?.npwpNumber || '',
    siupNumber: initialData?.siupNumber || '',
    
    // Tab 5
    bio: initialData?.bio || '',
    companyAdvantages: initialData?.companyAdvantages || '',
    uniqueValue: initialData?.uniqueValue || ''
  })

  const [files, setFiles] = useState({
    logo: null as File | null,
    banner: null as File | null,
    legalityDoc: null as File | null,
    nibDoc: null as File | null,
  })

  const handleCompanyNameChange = (value: string) => {
    setFormData({
      ...formData,
      companyName: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    })
  }

  const handleFileChange = (fieldName: keyof typeof files, file: File | null) => {
    setFiles({ ...files, [fieldName]: file })
  }

  const validateTab = (tab: string): boolean => {
    switch (tab) {
      case 'identitas':
        return !!(formData.companyName && formData.legalEntityType && formData.businessField)
      case 'alamat':
        return !!(formData.province && formData.city && formData.address)
      case 'kontak':
        return !!(formData.contactPerson && formData.email && formData.phone)
      case 'legalitas':
        return true // Optional
      case 'bio':
        return !!(formData.bio)
      default:
        return true
    }
  }

  const handleNextTab = () => {
    if (validateTab(activeTab)) {
      if (!completedTabs.includes(activeTab)) {
        setCompletedTabs([...completedTabs, activeTab])
      }
      
      const tabs = ['identitas', 'alamat', 'kontak', 'legalitas', 'bio']
      const currentIndex = tabs.indexOf(activeTab)
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1])
      }
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all tabs
    const allTabs = ['identitas', 'alamat', 'kontak', 'legalitas', 'bio']
    const allValid = allTabs.every(tab => validateTab(tab))
    
    if (!allValid) {
      alert('Mohon lengkapi semua tab yang wajib diisi')
      return
    }

    await onSubmit(formData, files)
  }

  const tabs = [
    { id: 'identitas', label: 'Identitas Usaha', icon: Building2, required: true },
    { id: 'alamat', label: 'Alamat & Lokasi', icon: MapPin, required: true },
    { id: 'kontak', label: 'Kontak Perusahaan', icon: Phone, required: true },
    { id: 'legalitas', label: 'Legalitas', icon: FileText, required: false },
    { id: 'bio', label: 'Bio & Keunggulan', icon: Award, required: true }
  ]

  return (
    <form onSubmit={handleSubmitForm}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isCompleted = completedTabs.includes(tab.id)
            const isActive = activeTab === tab.id
            
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 relative"
              >
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />}
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
                {tab.required && <span className="text-red-500">*</span>}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab 1: Identitas Usaha */}
        <TabsContent value="identitas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Identitas Usaha
              </CardTitle>
              <CardDescription>
                Informasi dasar tentang perusahaan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nama Perusahaan *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="PT. Ekspor Jaya"
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
                      placeholder="pt-ekspor-jaya"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalEntityType">Bentuk Badan Usaha *</Label>
                  <Select
                    value={formData.legalEntityType}
                    onValueChange={(value) => setFormData({ ...formData, legalEntityType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bentuk usaha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                      <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                      <SelectItem value="UD">UD (Usaha Dagang)</SelectItem>
                      <SelectItem value="Koperasi">Koperasi</SelectItem>
                      <SelectItem value="Perorangan">Perorangan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Tahun Berdiri</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.establishedYear || ''}
                    onChange={(e) => setFormData({ ...formData, establishedYear: parseInt(e.target.value) || null })}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessField">Bidang Usaha *</Label>
                <Input
                  id="businessField"
                  value={formData.businessField}
                  onChange={(e) => setFormData({ ...formData, businessField: e.target.value })}
                  placeholder="Contoh: Manufaktur Furniture, Pengolahan Makanan, dll"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainProducts">Produk Utama *</Label>
                <Textarea
                  id="mainProducts"
                  value={formData.mainProducts}
                  onChange={(e) => setFormData({ ...formData, mainProducts: e.target.value })}
                  placeholder="Sebutkan produk-produk utama yang Anda hasilkan/jual"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCategory">Kategori Bisnis</Label>
                <Select
                  value={formData.businessCategory}
                  onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
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

              <div className="flex justify-end pt-4">
                <Button type="button" onClick={handleNextTab}>
                  Lanjut ke Alamat & Lokasi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Alamat & Lokasi */}
        <TabsContent value="alamat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Alamat & Lokasi
              </CardTitle>
              <CardDescription>
                Lokasi perusahaan dan fasilitas produksi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Raya Ekspor No. 123"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih provinsi" />
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

                <div className="space-y-2">
                  <Label htmlFor="city">Kota/Kabupaten *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Jakarta Selatan"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">Kecamatan</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Kebayoran Baru"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Kode Pos</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionLocation">Lokasi Produksi</Label>
                <Textarea
                  id="productionLocation"
                  value={formData.productionLocation}
                  onChange={(e) => setFormData({ ...formData, productionLocation: e.target.value })}
                  placeholder="Jika berbeda dengan alamat perusahaan, sebutkan lokasi fasilitas produksi"
                  rows={2}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab('identitas')}>
                  Kembali
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Lanjut ke Kontak
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Kontak */}
        <TabsContent value="kontak">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Kontak Perusahaan
              </CardTitle>
              <CardDescription>
                Informasi kontak untuk komunikasi bisnis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Nama PIC *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Budi Santoso"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="picPosition">Jabatan PIC</Label>
                  <Input
                    id="picPosition"
                    value={formData.picPosition}
                    onChange={(e) => setFormData({ ...formData, picPosition: e.target.value })}
                    placeholder="Direktur / Manager Ekspor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Pribadi *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email Bisnis</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    placeholder="info@perusahaan.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://perusahaan.com"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab('alamat')}>
                  Kembali
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Lanjut ke Legalitas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Legalitas */}
        <TabsContent value="legalitas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Legalitas & Dokumen
              </CardTitle>
              <CardDescription>
                Dokumen dan nomor legalitas (opsional, bisa dilengkapi nanti)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nibNumber">Nomor NIB</Label>
                  <Input
                    id="nibNumber"
                    value={formData.nibNumber}
                    onChange={(e) => setFormData({ ...formData, nibNumber: e.target.value })}
                    placeholder="1234567890123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="npwpNumber">Nomor NPWP</Label>
                  <Input
                    id="npwpNumber"
                    value={formData.npwpNumber}
                    onChange={(e) => setFormData({ ...formData, npwpNumber: e.target.value })}
                    placeholder="12.345.678.9-012.000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siupNumber">Nomor SIUP</Label>
                  <Input
                    id="siupNumber"
                    value={formData.siupNumber}
                    onChange={(e) => setFormData({ ...formData, siupNumber: e.target.value })}
                    placeholder="1234/SIUP/2023"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo Perusahaan</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500">Format: JPG, PNG. Maks 2MB</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner Perusahaan</Label>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500">Format: JPG, PNG. Maks 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalityDoc">Dokumen Legalitas</Label>
                  <Input
                    id="legalityDoc"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('legalityDoc', e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500">Akta pendirian, SK, dll. Maks 5MB</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nibDoc">Dokumen NIB</Label>
                  <Input
                    id="nibDoc"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('nibDoc', e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500">Format: PDF, JPG, PNG. Maks 5MB</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab('kontak')}>
                  Kembali
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Lanjut ke Bio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Bio & Keunggulan */}
        <TabsContent value="bio">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Bio & Keunggulan
              </CardTitle>
              <CardDescription>
                Ceritakan tentang perusahaan dan keunggulan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Deskripsi Perusahaan *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Ceritakan tentang perusahaan Anda, visi, misi, dan pengalaman bisnis..."
                  rows={5}
                  required
                />
                <p className="text-xs text-gray-500">Min. 100 karakter</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAdvantages">Keunggulan Perusahaan</Label>
                <Textarea
                  id="companyAdvantages"
                  value={formData.companyAdvantages}
                  onChange={(e) => setFormData({ ...formData, companyAdvantages: e.target.value })}
                  placeholder="Apa keunggulan kompetitif perusahaan Anda? (kualitas, harga, delivery, sertifikasi, dll)"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniqueValue">Unique Value Proposition</Label>
                <Textarea
                  id="uniqueValue"
                  value={formData.uniqueValue}
                  onChange={(e) => setFormData({ ...formData, uniqueValue: e.target.value })}
                  placeholder="Apa yang membuat perusahaan Anda berbeda dari kompetitor?"
                  rows={4}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab('legalitas')}>
                  Kembali
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut ke Assessment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
