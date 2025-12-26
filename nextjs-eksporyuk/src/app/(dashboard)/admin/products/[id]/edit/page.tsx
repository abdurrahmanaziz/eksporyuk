'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  productType: string
  productStatus: string
  accessLevel: string
  category?: string
  tags?: string | string[]
  thumbnail?: string
  seoMetaTitle?: string
  seoMetaDescription?: string
  seoKeywords?: string
  ctaButtonText?: string
  eventDate?: string
  eventEndDate?: string
  eventDuration?: number
  eventUrl?: string
  meetingId?: string
  meetingPassword?: string
  eventVisibility?: string
  eventPassword?: string
  maxParticipants?: number
  enableUpsale: boolean
  upsaleDiscount?: number
  upsaleMessage?: string
  upsaleTargetMemberships?: string
  groupId?: string
  stock?: number
  salesPageUrl?: string
  isActive: boolean
  isFeatured: boolean
  commissionType: string
  affiliateCommissionRate: number
  courses?: Array<{ id: string; course: { id: string; title: string; slug: string } }>
}

interface MembershipPlan {
  id: string
  name: string
  slug: string
}

interface Course {
  id: string
  title: string
  slug: string
}

interface Group {
  id: string
  name: string
  slug: string
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const resolvedParams = params
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    originalPrice: 0,
    productType: 'DIGITAL',
    productStatus: 'DRAFT',
    accessLevel: 'PUBLIC',
    category: '',
    tags: [] as string[],
    thumbnail: '',
    seoMetaTitle: '',
    seoMetaDescription: '',
    seoKeywords: '',
    ctaButtonText: 'Beli Sekarang',
    eventDate: '',
    eventEndDate: '',
    eventDuration: 0,
    eventUrl: '',
    meetingId: '',
    meetingPassword: '',
    eventVisibility: 'PUBLIC',
    eventPassword: '',
    maxParticipants: 0,
    enableUpsale: true,
    upsaleDiscount: 0,
    upsaleMessage: '',
    groupId: '',
    stock: 0,
    salesPageUrl: '',
    isActive: true,
    isFeatured: false,
    commissionType: 'PERCENTAGE',
    affiliateCommissionRate: 30,
  })

  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!resolvedParams.id) return
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch product
      const productRes = await fetch(`/api/admin/products/${resolvedParams.id}`)
      if (!productRes.ok) {
        toast.error('Produk tidak ditemukan')
        router.push('/admin/products')
        return
      }
      
      const productData = await productRes.json()
      const prod = productData.product

      // Parse tags
      const parsedTags = typeof prod.tags === 'string' 
        ? JSON.parse(prod.tags || '[]') 
        : (prod.tags || [])

      // Parse upsale memberships
      const parsedUpsaleMemberships = typeof prod.upsaleTargetMemberships === 'string'
        ? JSON.parse(prod.upsaleTargetMemberships || '[]')
        : (prod.upsaleTargetMemberships || [])

      setProduct(prod)
      setFormData({
        name: prod.name || '',
        slug: prod.slug || '',
        description: prod.description || '',
        price: Number(prod.price) || 0,
        originalPrice: Number(prod.originalPrice) || 0,
        productType: prod.productType || 'DIGITAL',
        productStatus: prod.productStatus || 'DRAFT',
        accessLevel: prod.accessLevel || 'PUBLIC',
        category: prod.category || '',
        tags: parsedTags,
        thumbnail: prod.thumbnail || '',
        seoMetaTitle: prod.seoMetaTitle || '',
        seoMetaDescription: prod.seoMetaDescription || '',
        seoKeywords: prod.seoKeywords || '',
        ctaButtonText: prod.ctaButtonText || 'Beli Sekarang',
        eventDate: prod.eventDate ? new Date(prod.eventDate).toISOString().split('T')[0] : '',
        eventEndDate: prod.eventEndDate ? new Date(prod.eventEndDate).toISOString().split('T')[0] : '',
        eventDuration: Number(prod.eventDuration) || 0,
        eventUrl: prod.eventUrl || '',
        meetingId: prod.meetingId || '',
        meetingPassword: prod.meetingPassword || '',
        eventVisibility: prod.eventVisibility || 'PUBLIC',
        eventPassword: prod.eventPassword || '',
        maxParticipants: Number(prod.maxParticipants) || 0,
        enableUpsale: prod.enableUpsale !== false,
        upsaleDiscount: Number(prod.upsaleDiscount) || 0,
        upsaleMessage: prod.upsaleMessage || '',
        groupId: prod.groupId || '',
        stock: Number(prod.stock) || 0,
        salesPageUrl: prod.salesPageUrl || '',
        isActive: prod.isActive !== false,
        isFeatured: prod.isFeatured === true,
        commissionType: prod.commissionType || 'PERCENTAGE',
        affiliateCommissionRate: Number(prod.affiliateCommissionRate) || 30,
      })

      setSelectedMemberships(parsedUpsaleMemberships)
      setSelectedCourses(prod.courses?.map((pc: any) => pc.course.id) || [])

      // Fetch reference data
      const [membershipRes, coursesRes, groupsRes] = await Promise.all([
        fetch('/api/admin/membership-plans'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/groups'),
      ])

      if (membershipRes.ok) {
        const data = await membershipRes.json()
        setMembershipPlans(data.plans || [])
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || formData.price < 0) {
      toast.error('Nama, deskripsi, dan harga wajib diisi')
      return
    }

    setSaving(true)

    try {
      const productData: any = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || null,
        stock: Number(formData.stock) || null,
        affiliateCommissionRate: Number(formData.affiliateCommissionRate) || 30,
        tags: formData.tags.length > 0 ? formData.tags : null,
        courseIds: selectedCourses.length > 0 ? selectedCourses : null,
        upsaleTargetMemberships: selectedMemberships.length > 0 ? selectedMemberships : null,
      }

      const response = await fetch(`/api/admin/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah produk')
      }

      toast.success('Produk berhasil diperbarui!')
      router.push('/admin/products')
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah produk')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Memuat produk...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Produk</h1>
            <p className="text-muted-foreground">{formData.name}</p>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
            <TabsTrigger value="pricing">Harga & SEO</TabsTrigger>
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="upsale">Upsale</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Edit informasi umum produk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productType">Tipe Produk</Label>
                    <Select
                      value={formData.productType}
                      onValueChange={(value) => handleChange('productType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIGITAL">Digital Product</SelectItem>
                        <SelectItem value="EVENT">Event/Webinar</SelectItem>
                        <SelectItem value="COURSE_BUNDLE">Bundle Kelas</SelectItem>
                        <SelectItem value="EBOOK">Ebook</SelectItem>
                        <SelectItem value="TEMPLATE">Template/Resource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productStatus">Status Produk</Label>
                    <Select
                      value={formData.productStatus}
                      onValueChange={(value) => handleChange('productStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessLevel">Level Akses</Label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(value) => handleChange('accessLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="MEMBER_ONLY">Member Only</SelectItem>
                      <SelectItem value="PREMIUM_ONLY">Premium Only</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Masukkan nama produk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="slug-produk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Deskripsi produk..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="e.g., Ekspor, Training"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Tambah tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Tambah
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-xs hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Pricing & SEO */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Harga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Harga Original (Rp)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => handleChange('originalPrice', e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoMetaTitle">Meta Title</Label>
                  <Input
                    id="seoMetaTitle"
                    value={formData.seoMetaTitle}
                    onChange={(e) => handleChange('seoMetaTitle', e.target.value)}
                    placeholder="SEO title..."
                    maxLength={60}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoMetaDescription">Meta Description</Label>
                  <Textarea
                    id="seoMetaDescription"
                    value={formData.seoMetaDescription}
                    onChange={(e) => handleChange('seoMetaDescription', e.target.value)}
                    placeholder="SEO description..."
                    maxLength={160}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">Keywords</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={(e) => handleChange('seoKeywords', e.target.value)}
                    placeholder="kata kunci, terpisah, dengan koma"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Event */}
          {formData.productType === 'EVENT' && (
            <TabsContent value="event" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detail Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Tanggal Event</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => handleChange('eventDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventEndDate">Tanggal Berakhir</Label>
                      <Input
                        id="eventEndDate"
                        type="date"
                        value={formData.eventEndDate}
                        onChange={(e) => handleChange('eventEndDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventUrl">URL Event/Zoom</Label>
                    <Input
                      id="eventUrl"
                      value={formData.eventUrl}
                      onChange={(e) => handleChange('eventUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meetingId">Meeting ID</Label>
                      <Input
                        id="meetingId"
                        value={formData.meetingId}
                        onChange={(e) => handleChange('meetingId', e.target.value)}
                        placeholder="Meeting ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meetingPassword">Password</Label>
                      <Input
                        id="meetingPassword"
                        value={formData.meetingPassword}
                        onChange={(e) => handleChange('meetingPassword', e.target.value)}
                        placeholder="Password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Maksimal Peserta</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Tab 4: Content */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Konten & Grup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Grup Komunitas</Label>
                  <Select
                    value={formData.groupId || 'none'}
                    onValueChange={(value) => handleChange('groupId', value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih grup..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada grup</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kelas yang Disertakan</Label>
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCourses([...selectedCourses, course.id])
                            } else {
                              setSelectedCourses(
                                selectedCourses.filter((id) => id !== course.id)
                              )
                            }
                          }}
                        />
                        <Label
                          htmlFor={`course-${course.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {course.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Upsale */}
          <TabsContent value="upsale" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Upsale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableUpsale">Aktifkan Upsale</Label>
                  <Switch
                    id="enableUpsale"
                    checked={formData.enableUpsale}
                    onCheckedChange={(checked) => handleChange('enableUpsale', checked)}
                  />
                </div>

                {formData.enableUpsale && (
                  <>
                    <div className="space-y-2">
                      <Label>Target Membership untuk Upsale</Label>
                      <div className="space-y-2">
                        {membershipPlans.map((plan) => (
                          <div key={plan.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`membership-${plan.id}`}
                              checked={selectedMemberships.includes(plan.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMemberships([...selectedMemberships, plan.id])
                                } else {
                                  setSelectedMemberships(
                                    selectedMemberships.filter((id) => id !== plan.id)
                                  )
                                }
                              }}
                            />
                            <Label
                              htmlFor={`membership-${plan.id}`}
                              className="cursor-pointer font-normal"
                            >
                              {plan.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upsaleDiscount">Diskon Upsale (%)</Label>
                      <Input
                        id="upsaleDiscount"
                        type="number"
                        value={formData.upsaleDiscount}
                        onChange={(e) => handleChange('upsaleDiscount', e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upsaleMessage">Pesan Upsale</Label>
                      <Textarea
                        id="upsaleMessage"
                        value={formData.upsaleMessage}
                        onChange={(e) => handleChange('upsaleMessage', e.target.value)}
                        placeholder="Pesan yang ditampilkan saat offering membership..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Settings */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Produk Aktif</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Featured</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionType">Tipe Komisi Affiliate</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value) => handleChange('commissionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FIXED">Fixed (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliateCommissionRate">Komisi Affiliate</Label>
                  <Input
                    id="affiliateCommissionRate"
                    type="number"
                    value={formData.affiliateCommissionRate}
                    onChange={(e) => handleChange('affiliateCommissionRate', e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesPageUrl">URL Sales Page</Label>
                  <Input
                    id="salesPageUrl"
                    value={formData.salesPageUrl}
                    onChange={(e) => handleChange('salesPageUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Batal</Link>
          </Button>
          <Button onClick={onSubmit} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
    </ResponsivePageWrapper>
  )
}
