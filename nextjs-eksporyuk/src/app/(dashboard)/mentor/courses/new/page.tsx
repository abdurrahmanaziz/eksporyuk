'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle, Upload, Link as LinkIcon, Image } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState, SuccessState, ValidationErrors } from '@/components/ui/error-state'
import { LoadingState, FullPageLoading, FormLoadingOverlay } from '@/components/ui/loading-state'
import { courseValidator, generateSlug } from '@/lib/validation'
import MailketingListSelect from '@/components/admin/MailketingListSelect'
import { Switch } from '@/components/ui/switch'

type Mentor = {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
}

type Group = {
  id: string
  name: string
  slug: string
}

type Membership = {
  id: string
  name: string
  slug: string
  price: number
  isActive: boolean
}

export default function NewCoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Error and validation states
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [successData, setSuccessData] = useState<{ course?: any } | null>(null)
  
  // Thumbnail upload state
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'upload'>('url')
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    thumbnail: '',
    price: '',
    originalPrice: '',
    duration: '',
    level: 'BEGINNER',
    monetizationType: 'FREE',
    mentorId: '',
    groupId: '',
    mailketingListId: '',
    mailketingListName: '',
    // Affiliate settings
    affiliateEnabled: true,
    affiliateCommissionRate: '30',
    affiliateCommissionType: 'PERCENTAGE'
  })

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: value ? generateSlug(value) : ''
    }))
    // Clear validation errors for title
    if (validationErrors.title) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.title
        return newErrors
      })
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (!['ADMIN', 'MENTOR'].includes(session?.user?.role || '')) {
        router.push('/dashboard')
        return
      }
      fetchInitialData()
    }
  }, [status, session, router])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      setError(null)
      
      // Fetch mentors for admin to select, or show current mentor info
      if (session?.user?.role === 'ADMIN') {
        // Fetch mentors for admin to select
        try {
          const mentorsRes = await fetch('/api/admin/mentors')
          if (mentorsRes.ok) {
            const mentorsData = await mentorsRes.json()
            if (mentorsData.success) {
              setMentors(mentorsData.mentors || [])
            }
          } else {
            console.warn('Failed to fetch mentors:', await mentorsRes.text())
          }
        } catch (err) {
          console.error('Mentor API error:', err)
        }
      }

      // Fetch groups for all roles
      try {
        const groupsRes = await fetch('/api/admin/groups')
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          if (groupsData.success) {
            setGroups(groupsData.groups || [])
          }
        } else {
          console.warn('Failed to fetch groups:', await groupsRes.text())
        }
      } catch (err) {
        console.error('Groups API error:', err)
      }
      
      // Fetch memberships for MEMBERSHIP type courses
      try {
        const membershipsRes = await fetch('/api/admin/memberships')
        if (membershipsRes.ok) {
          const membershipsData = await membershipsRes.json()
          if (membershipsData.success || membershipsData.memberships) {
            setMemberships(membershipsData.memberships || [])
          }
        } else {
          console.warn('Failed to fetch memberships:', await membershipsRes.text())
        }
      } catch (err) {
        console.error('Memberships API error:', err)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      setError('Gagal memuat data awal. Silakan refresh halaman.')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    // Handle boolean values (like affiliateEnabled)
    let processedValue = value
    if (field === 'affiliateEnabled') {
      processedValue = typeof value === 'string' ? value === 'true' : value
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }))
    
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Clear general error
    if (error) {
      setError(null)
    }
  }

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      setUploadingThumbnail(true)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', 'image')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload gagal')
      }

      const data = await res.json()
      
      if (data.url) {
        handleInputChange('thumbnail', data.url)
        toast.success('Thumbnail berhasil diupload')
      } else {
        throw new Error('URL tidak ditemukan dalam response')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal upload thumbnail')
    } finally {
      setUploadingThumbnail(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous states
    setError(null)
    setValidationErrors({})

    // Client-side validation
    const validation = courseValidator.validate(formData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      toast.error(validation.firstError || 'Form tidak valid')
      return
    }

    // Convert numeric fields - only validate price for PAID courses
    const priceValue = formData.price ? parseFloat(formData.price) : 0
    if (formData.monetizationType === 'PAID') {
      if (isNaN(priceValue) || priceValue < 0) {
        setValidationErrors({ price: ['Harga harus berupa angka valid dan tidak negatif'] })
        toast.error('Harga tidak valid')
        return
      }
    }

    // Validate membership selection for MEMBERSHIP type
    if (formData.monetizationType === 'MEMBERSHIP' && selectedMemberships.length === 0) {
      setValidationErrors({ memberships: ['Pilih minimal 1 membership yang dapat mengakses kursus ini'] })
      toast.error('Pilih minimal 1 membership')
      return
    }

    try {
      setLoading(true)

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || generateSlug(formData.title),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim() || null,
        price: priceValue,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        level: formData.level,
        monetizationType: formData.monetizationType,
        mentorId: formData.mentorId || null,
        groupId: formData.groupId || null,
        mailketingListId: formData.mailketingListId || null,
        mailketingListName: formData.mailketingListName || null,
        // Membership access - for MEMBERSHIP type
        membershipIds: formData.monetizationType === 'MEMBERSHIP' ? selectedMemberships : [],
        // Affiliate settings - for PAID courses
        affiliateEnabled: formData.monetizationType === 'PAID' ? formData.affiliateEnabled : false,
        affiliateCommissionRate: formData.monetizationType === 'PAID' && formData.affiliateEnabled 
          ? parseFloat(formData.affiliateCommissionRate) || 0 
          : null,
        affiliateCommissionType: formData.monetizationType === 'PAID' && formData.affiliateEnabled 
          ? formData.affiliateCommissionType 
          : null
      }

      console.log('Creating course with payload:', payload)

      const res = await fetch('/api/mentor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      console.log('API Response:', res.status, data)

      if (res.ok && data.success && data.course) {
        setSuccessData({ course: data.course })
        toast.success('Kursus berhasil dibuat! Sekarang tambahkan modul dan materi.')
        
        // Redirect after short delay
        setTimeout(() => {
          router.push(`/mentor/courses/${data.course.id}`)
        }, 1500)
      } else {
        // Handle different types of errors
        if (res.status === 400 && data.validation) {
          setValidationErrors(data.validation)
          toast.error('Data tidak valid')
        } else if (res.status === 409) {
          setValidationErrors({ slug: ['Slug sudah digunakan, silakan gunakan judul yang lain'] })
          toast.error('Slug sudah digunakan')
        } else if (res.status === 403) {
          setError('Anda tidak memiliki izin untuk membuat kursus')
          toast.error('Tidak memiliki izin')
        } else {
          const errorMsg = data.error || 'Gagal membuat kursus'
          setError(errorMsg)
          toast.error(errorMsg)
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan jaringan'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Handle success state
  if (successData) {
    return (
      <ResponsivePageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <SuccessState
              title="Kursus Berhasil Dibuat!"
              message="Kursus Anda telah berhasil dibuat dan disimpan"
              details={[
                `Judul: ${successData.course?.title}`,
                `Slug: ${successData.course?.slug}`,
                'Status: Draft (menunggu persetujuan)'
              ]}
              actionLabel="Lanjut Tambah Modul"
              onAction={() => router.push(`/admin/courses/${successData.course?.id}`)}
              className="min-h-[400px]"
            />
          </div>
      </ResponsivePageWrapper>
    )
  }

  if (status === 'loading' || loadingData) {
    return (
      <FullPageLoading 
        title="Memuat Halaman..." 
        message="Sedang menyiapkan form pembuatan kursus"
      />
    )
  }

  // Handle initial error state
  if (error && !formData.title) {
    return (
      <ResponsivePageWrapper>
        <ErrorState
            type="network"
            title="Gagal Memuat Halaman"
            message={error}
            showRetry
            showHome
            onRetry={() => {
              setError(null)
              window.location.reload()
            }}
            className="min-h-[400px]"
          />
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <Link href="/mentor/courses">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Buat Kursus Baru</h1>
            <p className="text-muted-foreground">
              Langkah 1: Isi informasi dasar kursus. Setelah disimpan, Anda akan diarahkan untuk menambahkan modul dan materi pembelajaran.
            </p>
          </div>

          {/* Display validation errors */}
          {Object.keys(validationErrors).length > 0 && (
            <ValidationErrors
              errors={validationErrors}
              title="Mohon Perbaiki Kesalahan Berikut"
              className="mb-6"
            />
          )}

          {/* Display general error */}
          {error && (
            <ErrorState
              type="server"
              message={error}
              showRetry
              onRetry={() => setError(null)}
              className="mb-6"
            />
          )}

          <FormLoadingOverlay isVisible={loading} message="Menyimpan kursus...">
            <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Data dasar kursus yang akan dibuat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Kursus <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Kelas Ekspor untuk Pemula"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className={validationErrors.title ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {validationErrors.title && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.title[0]}
                </p>
              )}
            </div>

            {/* Slug - Auto Generated */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug (URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                placeholder="kelas-ekspor-untuk-pemula"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                required
                className={validationErrors.slug ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {validationErrors.slug && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.slug[0]}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                URL slug untuk kursus. Otomatis di-generate dari judul, bisa diedit manual.
              </p>
              {formData.slug && (
                <p className="text-sm text-blue-600">
                  URL Preview: /courses/{formData.slug}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Jelaskan tentang kursus ini..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* Thumbnail with Upload/URL Toggle */}
            <div className="space-y-3">
              <Label>Thumbnail</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={thumbnailMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setThumbnailMode('url')}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  URL
                </Button>
                <Button
                  type="button"
                  variant={thumbnailMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setThumbnailMode('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              
              {thumbnailMode === 'url' ? (
                <div className="space-y-2">
                  <Input
                    id="thumbnail"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.thumbnail}
                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Masukkan URL gambar dari internet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="thumbnailUpload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <label htmlFor="thumbnailUpload" className="cursor-pointer">
                      {uploadingThumbnail ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Mengupload...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-muted rounded-full">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Klik untuk upload</p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG, GIF max 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
              
              {/* Thumbnail Preview */}
              {formData.thumbnail && (
                <div className="relative">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="relative w-full max-w-md">
                    <img 
                      src={formData.thumbnail} 
                      alt="Thumbnail preview" 
                      className="rounded-lg border w-full h-auto object-cover max-h-[200px]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleInputChange('thumbnail', '')}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Harga & Monetisasi</CardTitle>
            <CardDescription>Pengaturan harga dan tipe akses kursus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monetization Type with Clear Explanation */}
            <div className="space-y-2">
              <Label htmlFor="monetizationType">
                Tipe Monetisasi <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.monetizationType}
                onValueChange={(value) => handleInputChange('monetizationType', value)}
              >
                <SelectTrigger id="monetizationType">
                  <SelectValue placeholder="Pilih tipe monetisasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">🆓 Gratis</span>
                      <span className="text-xs text-muted-foreground">Akses bebas tanpa pembayaran</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PAID">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">💰 Berbayar</span>
                      <span className="text-xs text-muted-foreground">Pembelian satuan (one-time payment)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEMBERSHIP">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">👥 Member Only</span>
                      <span className="text-xs text-muted-foreground">Hanya untuk anggota membership aktif</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AFFILIATE">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">🎯 Affiliate Only</span>
                      <span className="text-xs text-muted-foreground">Khusus untuk affiliate/partner aktif</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Monetization type explanation */}
              <div className={`p-3 rounded-lg mt-2 text-sm ${
                formData.monetizationType === 'FREE' ? 'bg-green-50 text-green-700 border border-green-200' :
                formData.monetizationType === 'PAID' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                formData.monetizationType === 'MEMBERSHIP' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {formData.monetizationType === 'FREE' && (
                  <p>✅ Kursus ini dapat diakses oleh semua user secara gratis</p>
                )}
                {formData.monetizationType === 'PAID' && (
                  <p>💳 User harus membayar sekali untuk mengakses kursus ini selamanya</p>
                )}
                {formData.monetizationType === 'MEMBERSHIP' && (
                  <p>🔒 Hanya user dengan membership aktif yang dapat mengakses kursus ini</p>
                )}
                {formData.monetizationType === 'AFFILIATE' && (
                  <p>🎯 Hanya affiliate/partner aktif yang dapat mengakses kursus training ini</p>
                )}
              </div>
            </div>

            {/* Price - Only show for PAID type */}
            {formData.monetizationType === 'PAID' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Harga (Rp) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalPrice">Harga Asli (Rp)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Kosongkan jika sama"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Untuk menampilkan diskon (coret harga)
                </p>
              </div>
            </div>
            )}
            
            {/* Info for FREE/MEMBERSHIP/AFFILIATE types */}
            {formData.monetizationType === 'FREE' && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                ℹ️ Kursus gratis tidak memerlukan pengaturan harga - dapat diakses semua user
              </div>
            )}
            
            {formData.monetizationType === 'AFFILIATE' && (
              <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-700 border border-orange-200">
                🎯 Kursus training khusus affiliate - hanya dapat diakses oleh user dengan role AFFILIATE yang aktif
              </div>
            )}
            
            {/* Membership Selection - Show when MEMBERSHIP type */}
            {formData.monetizationType === 'MEMBERSHIP' && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700 border border-purple-200">
                  👥 Pilih membership yang dapat mengakses kursus ini
                </div>
                
                <div className="space-y-2">
                  <Label>Pilih Membership <span className="text-red-500">*</span></Label>
                  <div className="border rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
                    {memberships.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Belum ada membership. <Link href="/admin/memberships" className="text-blue-600 underline">Buat membership</Link>
                      </p>
                    ) : (
                      memberships.filter(m => m.isActive).map((membership) => (
                        <label
                          key={membership.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedMemberships.includes(membership.id)
                              ? 'bg-purple-50 border-purple-300'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMemberships.includes(membership.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberships(prev => [...prev, membership.id])
                              } else {
                                setSelectedMemberships(prev => prev.filter(id => id !== membership.id))
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{membership.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Rp {membership.price?.toLocaleString('id-ID') || '0'}
                            </p>
                          </div>
                          {selectedMemberships.includes(membership.id) && (
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  {selectedMemberships.length > 0 && (
                    <p className="text-sm text-purple-600">
                      ✓ {selectedMemberships.length} membership dipilih
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detail Kursus</CardTitle>
            <CardDescription>Informasi tambahan tentang kursus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Level */}
            <div className="space-y-2">
              <Label htmlFor="level">Level Kursus</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => handleInputChange('level', value)}
              >
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Pemula</SelectItem>
                  <SelectItem value="INTERMEDIATE">Menengah</SelectItem>
                  <SelectItem value="ADVANCED">Lanjutan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi (jam)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                step="0.5"
                placeholder="Contoh: 10"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Total durasi kursus dalam jam (opsional)
              </p>
            </div>

            {/* Mentor Selection - Only visible for Admin */}
            {session?.user?.role === 'ADMIN' && (
              <div className="space-y-2">
                <Label htmlFor="mentorId">Mentor/Instruktur</Label>
                <Select
                  value={formData.mentorId || 'AUTO'}
                  onValueChange={(value) => handleInputChange('mentorId', value === 'AUTO' ? '' : value)}
                >
                  <SelectTrigger id="mentorId">
                    <SelectValue placeholder="Pilih mentor atau gunakan profil admin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Gunakan Profil Admin
                      </div>
                    </SelectItem>
                    {mentors && mentors.length > 0 && mentors.map((mentor: Mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        <div className="flex flex-col">
                          <span>{mentor.user?.name || 'Unknown Mentor'}</span>
                          <span className="text-xs text-muted-foreground">{mentor.user?.email || 'No email'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Pilih mentor yang akan ditugaskan untuk kursus ini
                </p>
              </div>
            )}
            
            {/* Info for Mentor role */}
            {session?.user?.role === 'MENTOR' && (
              <div className="space-y-2">
                <Label>Mentor/Instruktur</Label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{session.user.name || session.user.email}</p>
                    <p className="text-sm text-blue-700">Anda akan menjadi mentor untuk kursus ini</p>
                  </div>
                </div>
              </div>
            )}

            {/* Group */}
            <div className="space-y-2">
              <Label htmlFor="groupId">Group/Komunitas (Opsional)</Label>
              <Select
                value={formData.groupId || 'NONE'}
                onValueChange={(value) => handleInputChange('groupId', value === 'NONE' ? '' : value)}
              >
                <SelectTrigger id="groupId">
                  <SelectValue placeholder="Pilih group (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak ada group</SelectItem>
                  {groups && groups.length > 0 && groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name || 'Unnamed Group'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Kursus dapat dikaitkan dengan group tertentu
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Settings - Only show for PAID courses */}
        {formData.monetizationType === 'PAID' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pengaturan Afiliasi</CardTitle>
              <CardDescription>Atur komisi afiliasi untuk kursus berbayar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="affiliateEnabled" className="text-base font-medium">
                    Aktifkan Program Afiliasi
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Izinkan afiliator mempromosikan kursus ini dan mendapat komisi
                  </p>
                </div>
                <Switch
                  id="affiliateEnabled"
                  checked={formData.affiliateEnabled}
                  onCheckedChange={(checked) => handleInputChange('affiliateEnabled', checked.toString())}
                />
              </div>

              {/* Affiliate Commission Settings - Only show if enabled */}
              {formData.affiliateEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Commission Type */}
                  <div className="space-y-2">
                    <Label htmlFor="affiliateCommissionType">Tipe Komisi</Label>
                    <Select
                      value={formData.affiliateCommissionType}
                      onValueChange={(value) => handleInputChange('affiliateCommissionType', value)}
                    >
                      <SelectTrigger id="affiliateCommissionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">
                          <div className="flex flex-col">
                            <span>Persentase (%)</span>
                            <span className="text-xs text-muted-foreground">Komisi dihitung dari harga jual</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="FLAT">
                          <div className="flex flex-col">
                            <span>Flat (Rp)</span>
                            <span className="text-xs text-muted-foreground">Komisi tetap per penjualan</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Commission Rate/Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="affiliateCommissionRate">
                      {formData.affiliateCommissionType === 'PERCENTAGE' ? 'Rate Komisi (%)' : 'Jumlah Komisi (Rp)'}
                    </Label>
                    <Input
                      id="affiliateCommissionRate"
                      type="number"
                      min="0"
                      max={formData.affiliateCommissionType === 'PERCENTAGE' ? '100' : undefined}
                      step={formData.affiliateCommissionType === 'PERCENTAGE' ? '1' : '1000'}
                      placeholder={formData.affiliateCommissionType === 'PERCENTAGE' ? '30' : '50000'}
                      value={formData.affiliateCommissionRate}
                      onChange={(e) => handleInputChange('affiliateCommissionRate', e.target.value)}
                    />
                    {/* Commission Preview */}
                    {formData.price && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {formData.affiliateCommissionType === 'PERCENTAGE' ? (
                          <p>
                            💰 Komisi per penjualan: <strong>
                              Rp {((parseFloat(formData.price) || 0) * (parseFloat(formData.affiliateCommissionRate) || 0) / 100).toLocaleString('id-ID')}
                            </strong> ({formData.affiliateCommissionRate}% dari Rp {parseFloat(formData.price).toLocaleString('id-ID')})
                          </p>
                        ) : (
                          <p>
                            💰 Komisi per penjualan: <strong>
                              Rp {parseFloat(formData.affiliateCommissionRate || '0').toLocaleString('id-ID')}
                            </strong> (flat rate)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Info when disabled */}
              {!formData.affiliateEnabled && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  ⚠️ Program afiliasi dinonaktifkan. Afiliator tidak akan mendapat komisi dari penjualan kursus ini.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mailketing Integration</CardTitle>
            <CardDescription>Auto-add pembeli ke mailing list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mailketing List Dropdown */}
            <MailketingListSelect
              value={formData.mailketingListId}
              onChange={(listId, listName) => {
                handleInputChange('mailketingListId', listId)
                handleInputChange('mailketingListName', listName)
              }}
              listNameValue={formData.mailketingListName}
              onListNameChange={(name) => handleInputChange('mailketingListName', name)}
              disabled={loading}
              showUsageInfo={true}
              allowManualInput={true}
              label="Mailketing List"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/courses">
            <Button type="button" variant="outline" disabled={loading}>
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Buat Kursus
              </>
            )}
          </Button>
        </div>
            </form>
          </FormLoadingOverlay>
        </div>
      </ResponsivePageWrapper>
  )
}
