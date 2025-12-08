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
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

export default function NewCoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingData, setLoadingData] = useState(true)

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
    mailketingListName: ''
  })

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
  }

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: generateSlug(value)
    }))
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
      
      // For mentor role, we don't need to fetch mentors list
      // The API will automatically assign the current user as mentor
      if (session?.user?.role === 'ADMIN') {
        // Fetch mentors - only for admin
        try {
          const mentorsRes = await fetch('/api/admin/users?role=MENTOR')
          if (mentorsRes.ok) {
            const mentorsData = await mentorsRes.json()
            setMentors(mentorsData.users || [])
          }
        } catch (err) {
          console.log('Mentor API not available:', err)
        }

        // Fetch groups - only for admin
        try {
          const groupsRes = await fetch('/api/admin/groups')
          if (groupsRes.ok) {
            const groupsData = await groupsRes.json()
            setGroups(groupsData.groups || [])
          }
        } catch (err) {
          console.log('Groups API not available:', err)
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      toast.error('Judul kursus wajib diisi')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Deskripsi kursus wajib diisi')
      return
    }
    
    // Price validation - ensure it's a valid number
    const priceValue = formData.price ? parseFloat(formData.price) : 0
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Harga harus valid (minimal 0)')
      return
    }

    try {
      setLoading(true)

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || generateSlug(formData.title),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim() || null,
        price: priceValue, // Ensure it's a number
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        level: formData.level,
        monetizationType: formData.monetizationType,
        mentorId: formData.mentorId || null,
        groupId: formData.groupId || null,
        mailketingListId: formData.mailketingListId || null,
        mailketingListName: formData.mailketingListName || null
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
        toast.success('Kursus berhasil dibuat! Sekarang tambahkan modul dan materi.')
        // Redirect ke halaman edit untuk tambah modul/materi
        router.push(`/mentor/courses/${data.course.id}`)
      } else {
        const errorMsg = data.error || 'Gagal membuat kursus'
        console.error('Create course failed:', errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(`Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
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
              />
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
              />
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

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">URL Thumbnail</Label>
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail}
                onChange={(e) => handleInputChange('thumbnail', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                URL gambar untuk thumbnail kursus (opsional)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Harga & Monetisasi</CardTitle>
            <CardDescription>Pengaturan harga dan tipe akses kursus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monetization Type */}
            <div className="space-y-2">
              <Label htmlFor="monetizationType">
                Tipe Monetisasi <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.monetizationType}
                onValueChange={(value) => handleInputChange('monetizationType', value)}
              >
                <SelectTrigger id="monetizationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Gratis</SelectItem>
                  <SelectItem value="PAID">Berbayar</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription/Membership</SelectItem>
                  <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
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

            {/* Mentor */}
            <div className="space-y-2">
              <Label htmlFor="mentorId">Mentor/Instruktur</Label>
              <Select
                value={formData.mentorId || 'AUTO'}
                onValueChange={(value) => handleInputChange('mentorId', value === 'AUTO' ? '' : value)}
              >
                <SelectTrigger id="mentorId">
                  <SelectValue placeholder="Pilih mentor atau kosongkan (otomatis admin)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Gunakan Profil Admin</SelectItem>
                  {mentors && mentors.length > 0 && mentors.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.user?.name || 'Unknown'} ({mentor.user?.email || 'No email'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Jika dikosongkan, kursus akan menggunakan profil admin sebagai mentor
              </p>
            </div>

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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mailketing Integration</CardTitle>
            <CardDescription>Auto-add pembeli ke mailing list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mailketing List ID */}
            <div className="space-y-2">
              <Label htmlFor="mailketingListId">Mailketing List ID</Label>
              <Input
                id="mailketingListId"
                placeholder="Contoh: list_abc123"
                value={formData.mailketingListId}
                onChange={(e) => handleInputChange('mailketingListId', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                ID list di Mailketing untuk auto-add user setelah pembelian
              </p>
            </div>

            {/* Mailketing List Name */}
            <div className="space-y-2">
              <Label htmlFor="mailketingListName">Nama List</Label>
              <Input
                id="mailketingListName"
                placeholder="Contoh: Pembeli Kelas Ekspor"
                value={formData.mailketingListName}
                onChange={(e) => handleInputChange('mailketingListName', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Nama list untuk ditampilkan (opsional)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/mentor/courses">
            <Button type="button" variant="outline" disabled={loading}>
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
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
    </div>
    </ResponsivePageWrapper>
  )
}
