'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import FeatureLock from '@/components/affiliate/FeatureLock'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit, 
  Loader2, 
  Trash2, 
  Copy, 
  ExternalLink, 
  GripVertical, 
  Settings, 
  Link as LinkIcon, 
  Eye, 
  BarChart3, 
  Upload,
  Palette,
  ArrowUp,
  ArrowDown,
  Globe
} from 'lucide-react'
import Image from 'next/image'

interface BioPage {
  id: string
  template: string
  buttonLayout?: string | null
  displayName: string | null
  customHeadline: string | null
  customDescription: string | null
  avatarUrl: string | null
  coverImage: string | null
  whatsappGroupLink: string | null
  whatsappNumber: string | null
  isActive: boolean
  viewCount: number
  ctaButtons: CTAButton[]
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  showSocialIcons?: boolean
  socialFacebook?: string
  socialInstagram?: string
  socialTwitter?: string
  socialTiktok?: string
  socialYoutube?: string
  socialLinkedin?: string
  socialGithub?: string
  socialWebsite?: string
}

interface CTAButton {
  id: string
  buttonText: string
  buttonType: string
  buttonStyle?: string
  backgroundColor: string
  textColor: string
  thumbnailUrl?: string | null
  price?: string | null
  originalPrice?: string | null
  subtitle?: string | null
  showPrice?: boolean
  showThumbnail?: boolean
  titleSize?: string
  subtitleSize?: string
  buttonTextSize?: string
  displayOrder: number
  clicks: number
  isActive: boolean
  targetType?: string
  membershipId?: string | null
  productId?: string | null
  courseId?: string | null
  optinFormId?: string | null
  optinDisplayMode?: string
  customUrl?: string | null
}

export default function AffiliateBioPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bioPage, setBioPage] = useState<BioPage | null>(null)
  const [previewCTAs, setPreviewCTAs] = useState<CTAButton[]>([])
  const [username, setUsername] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('links')
  const [showCTAForm, setShowCTAForm] = useState(false)
  const [editingCTA, setEditingCTA] = useState<CTAButton | null>(null)
  const [deletingCTA, setDeletingCTA] = useState<string | null>(null)
  
  // Dropdown data states
  const [memberships, setMemberships] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [optinForms, setOptinForms] = useState<any[]>([])

  const [ctaFormData, setCtaFormData] = useState({
    buttonText: '',
    buttonType: 'custom',
    buttonStyle: 'solid',
    backgroundColor: '#8B5CF6',
    textColor: '#FFFFFF',
    thumbnailUrl: '',
    price: '',
    originalPrice: '',
    subtitle: '',
    showPrice: false,
    showThumbnail: false,
    titleSize: 'sm',
    subtitleSize: 'xs',
    buttonTextSize: 'sm',
    targetType: 'custom',
    customUrl: '',
    membershipId: '',
    productId: '',
    courseId: '',
    optinFormId: '',
    optinDisplayMode: 'button'
  })

  const [formData, setFormData] = useState({
    template: 'modern',
    buttonLayout: 'stack',
    displayName: '',
    customHeadline: '',
    customDescription: '',
    avatarUrl: null as string | null,
    coverImage: null as string | null,
    whatsappNumber: '',
    whatsappGroupLink: '',
    isActive: true,
    primaryColor: '#8B5CF6',
    secondaryColor: '#3B82F6',
    fontFamily: 'inter',
    showSocialIcons: true,
    socialFacebook: '',
    socialInstagram: '',
    socialTwitter: '',
    socialTiktok: '',
    socialYoutube: '',
    socialLinkedin: '',
    socialGithub: '',
    socialWebsite: ''
  })

  useEffect(() => {
    fetchBioPage()
    fetchDropdownData()
  }, [])

  // Update preview saat bioPage berubah
  useEffect(() => {
    if (bioPage?.ctaButtons) {
      setPreviewCTAs(bioPage.ctaButtons)
    }
  }, [bioPage])

  const fetchDropdownData = async () => {
    try {
      const [membershipsRes, productsRes, coursesRes, eventsRes, optinFormsRes] = await Promise.all([
        fetch('/api/memberships?forAffiliate=true'),
        fetch('/api/products'),
        fetch('/api/courses'),
        fetch('/api/events'),
        fetch('/api/affiliate/optin-forms')
      ])

      if (membershipsRes.ok) {
        const data = await membershipsRes.json()
        setMemberships(data.memberships || data || [])
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || data || [])
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || data || [])
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || data || [])
      }

      if (optinFormsRes.ok) {
        const data = await optinFormsRes.json()
        setOptinForms(data.optinForms || data.forms || data || [])
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const fetchBioPage = async () => {
    try {
      const res = await fetch('/api/affiliate/bio')
      const data = await res.json()

      if (res.status === 403) {
        toast.error('Anda belum terdaftar sebagai affiliate. Silakan daftar terlebih dahulu.')
        setLoading(false)
        return
      }

      if (res.ok && data.bioPage) {
        console.log('Bio page data loaded:', {
          displayName: data.bioPage.displayName,
          hasAvatar: !!data.bioPage.avatarUrl,
          avatarLength: data.bioPage.avatarUrl?.length,
          hasCover: !!data.bioPage.coverImage,
          coverLength: data.bioPage.coverImage?.length
        })
        setBioPage(data.bioPage)
        setUsername(data.username)
        setFormData({
          template: data.bioPage.template || 'modern',
          buttonLayout: data.bioPage.buttonLayout || 'stack',
          displayName: data.bioPage.displayName || '',
          customHeadline: data.bioPage.customHeadline || '',
          customDescription: data.bioPage.customDescription || '',
          avatarUrl: data.bioPage.avatarUrl || null,
          coverImage: data.bioPage.coverImage || null,
          whatsappNumber: data.bioPage.whatsappNumber || '',
          whatsappGroupLink: data.bioPage.whatsappGroupLink || '',
          isActive: data.bioPage.isActive,
          primaryColor: data.bioPage.primaryColor || '#8B5CF6',
          secondaryColor: data.bioPage.secondaryColor || '#3B82F6',
          fontFamily: data.bioPage.fontFamily || 'inter',
          showSocialIcons: data.bioPage.showSocialIcons !== false,
          socialFacebook: data.bioPage.socialFacebook || '',
          socialInstagram: data.bioPage.socialInstagram || '',
          socialTwitter: data.bioPage.socialTwitter || '',
          socialTiktok: data.bioPage.socialTiktok || '',
          socialYoutube: data.bioPage.socialYoutube || '',
          socialLinkedin: data.bioPage.socialLinkedin || '',
          socialGithub: data.bioPage.socialGithub || '',
          socialWebsite: data.bioPage.socialWebsite || ''
        })
      } else if (data.username) {
        setUsername(data.username)
      }
    } catch (error) {
      console.error('Error fetching bio page:', error)
      toast.error('Gagal memuat Bio Page')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    // Capture current formData state and convert empty strings to null
    const currentFormData = {
      ...formData,
      avatarUrl: formData.avatarUrl || null,
      coverImage: formData.coverImage || null
    }
    
    try {
      console.log('=== PREPARING TO SAVE ===')
      console.log('Display Name:', currentFormData.displayName)
      console.log('Avatar URL:', currentFormData.avatarUrl ? 'EXISTS' : 'NULL')
      console.log('Avatar URL length:', currentFormData.avatarUrl?.length || 0)
      console.log('Avatar URL is base64:', currentFormData.avatarUrl?.startsWith('data:image/') || false)
      console.log('Cover Image:', currentFormData.coverImage ? 'EXISTS' : 'NULL')
      console.log('Cover Image length:', currentFormData.coverImage?.length || 0)
      console.log('Cover Image is base64:', currentFormData.coverImage?.startsWith('data:image/') || false)
      
      const res = await fetch('/api/affiliate/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFormData)
      })

      const data = await res.json()
      
      console.log('=== SAVE RESPONSE ===')
      console.log('Status:', res.status)
      console.log('OK:', res.ok)
      console.log('Message:', data.message)
      if (data.bioPage) {
        console.log('Saved Avatar exists:', !!data.bioPage.avatarUrl)
        console.log('Saved Avatar length:', data.bioPage.avatarUrl?.length || 0)
        console.log('Saved Cover exists:', !!data.bioPage.coverImage)
        console.log('Saved Cover length:', data.bioPage.coverImage?.length || 0)
      }

      if (res.ok) {
        toast.success('Bio Page berhasil disimpan!')
        await fetchBioPage()
      } else {
        if (res.status === 403) {
          toast.error('Anda belum terdaftar sebagai affiliate. Silakan hubungi admin.')
        } else {
          toast.error(data.error || 'Gagal menyimpan Bio Page')
        }
      }
    } catch (error) {
      console.error('Error saving bio page:', error)
      toast.error('Gagal menyimpan Bio Page')
    } finally {
      setSaving(false)
    }
  }

  const getBioUrl = () => {
    if (!username) return ''
    return `${window.location.origin}/bio/${username}`
  }

  const copyBioUrl = () => {
    const url = getBioUrl()
    navigator.clipboard.writeText(url)
    toast.success('Link Bio Page berhasil disalin!')
  }

  const handleOpenCTAForm = (cta?: CTAButton) => {
    if (cta) {
      setEditingCTA(cta)
      setCtaFormData({
        buttonText: cta.buttonText,
        buttonType: cta.buttonType,
        buttonStyle: cta.buttonStyle || 'button',
        backgroundColor: cta.backgroundColor,
        textColor: cta.textColor,
        thumbnailUrl: cta.thumbnailUrl || '',
        price: cta.price || '',
        originalPrice: cta.originalPrice || '',
        subtitle: cta.subtitle || '',
        showPrice: cta.showPrice || false,
        showThumbnail: cta.showThumbnail || false,
        titleSize: cta.titleSize || 'sm',
        subtitleSize: cta.subtitleSize || 'xs',
        buttonTextSize: cta.buttonTextSize || 'sm',
        targetType: cta.targetType || 'custom',
        customUrl: cta.customUrl || '',
        membershipId: cta.membershipId || '',
        productId: cta.productId || '',
        courseId: cta.courseId || '',
        optinFormId: cta.optinFormId || '',
        optinDisplayMode: cta.optinDisplayMode || 'button'
      })
    } else {
      setEditingCTA(null)
      setCtaFormData({
        buttonText: '',
        buttonType: 'custom',
        buttonStyle: 'button',
        backgroundColor: '#8B5CF6',
        textColor: '#FFFFFF',
        thumbnailUrl: '',
        price: '',
        originalPrice: '',
        subtitle: '',
        showPrice: false,
        showThumbnail: false,
        titleSize: 'sm',
        subtitleSize: 'xs',
        buttonTextSize: 'sm',
        targetType: 'custom',
        customUrl: '',
        membershipId: '',
        productId: '',
        courseId: '',
        optinFormId: '',
        optinDisplayMode: 'button'
      })
    }
    setShowCTAForm(true)
  }

  const handleSaveCTA = async () => {
    if (!ctaFormData.buttonText.trim()) {
      toast.error('Teks button harus diisi')
      return
    }

    setSaving(true)
    try {
      const url = editingCTA 
        ? `/api/affiliate/bio/cta/${editingCTA.id}`
        : '/api/affiliate/bio/cta'
      
      const cleanData = {
        buttonText: ctaFormData.buttonText,
        buttonType: ctaFormData.buttonType,
        buttonStyle: ctaFormData.buttonStyle || 'button',
        targetType: ctaFormData.targetType,
        customUrl: ctaFormData.customUrl || null,
        backgroundColor: ctaFormData.backgroundColor,
        textColor: ctaFormData.textColor,
        thumbnailUrl: ctaFormData.thumbnailUrl || null,
        price: ctaFormData.price || null,
        originalPrice: ctaFormData.originalPrice || null,
        subtitle: ctaFormData.subtitle || null,
        showPrice: ctaFormData.showPrice || false,
        showThumbnail: ctaFormData.showThumbnail || false,
        titleSize: ctaFormData.titleSize || 'sm',
        subtitleSize: ctaFormData.subtitleSize || 'xs',
        buttonTextSize: ctaFormData.buttonTextSize || 'sm',
        ...(ctaFormData.membershipId && { membershipId: ctaFormData.membershipId }),
        ...(ctaFormData.productId && { productId: ctaFormData.productId }),
        ...(ctaFormData.courseId && { courseId: ctaFormData.courseId }),
        ...(ctaFormData.optinFormId && { optinFormId: ctaFormData.optinFormId }),
        ...(ctaFormData.optinFormId && { optinDisplayMode: ctaFormData.optinDisplayMode || 'button' })
      }
      
      const res = await fetch(url, {
        method: editingCTA ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      })

      if (res.ok) {
        toast.success(editingCTA ? 'CTA Button berhasil diupdate!' : 'CTA Button berhasil ditambahkan!')
        setShowCTAForm(false)
        await fetchBioPage()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan CTA Button')
      }
    } catch (error) {
      console.error('Error saving CTA:', error)
      toast.error('Gagal menyimpan CTA Button')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCTA = async (ctaId: string) => {
    try {
      const res = await fetch(`/api/affiliate/bio/cta/${ctaId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('CTA Button berhasil dihapus!')
        setDeletingCTA(null)
        await fetchBioPage()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus CTA Button')
      }
    } catch (error) {
      console.error('Error deleting CTA:', error)
      toast.error('Gagal menghapus CTA Button')
    }
  }

  const handleReorderCTA = async (ctaId: string, direction: 'up' | 'down') => {
    if (!bioPage?.ctaButtons) return

    const currentIndex = bioPage.ctaButtons.findIndex(cta => cta.id === ctaId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= bioPage.ctaButtons.length) return

    const currentCTA = bioPage.ctaButtons[currentIndex]
    const targetCTA = bioPage.ctaButtons[targetIndex]

    try {
      await Promise.all([
        fetch(`/api/affiliate/bio/cta/${currentCTA.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: targetCTA.displayOrder })
        }),
        fetch(`/api/affiliate/bio/cta/${targetCTA.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: currentCTA.displayOrder })
        })
      ])

      toast.success('Urutan CTA Button berhasil diubah!')
      await fetchBioPage()
    } catch (error) {
      console.error('Error reordering CTA:', error)
      toast.error('Gagal mengubah urutan CTA Button')
    }
  }

  const handleImageUpload = (field: 'avatarUrl' | 'coverImage', file: File) => {
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

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      console.log(`=== IMAGE UPLOADED ===`)
      console.log(`Field: ${field}`)
      console.log(`File type: ${file.type}`)
      console.log(`File size: ${file.size} bytes`)
      console.log(`Base64 length: ${base64.length} characters`)
      console.log(`Base64 prefix: ${base64.substring(0, 50)}`)
      
      setFormData(prev => {
        const updated = { ...prev, [field]: base64 }
        console.log(`=== FORM DATA UPDATED ===`)
        console.log(`${field} in updated formData:`, !!updated[field])
        console.log(`${field} length:`, updated[field]?.length || 0)
        return updated
      })
      
      const message = field === 'avatarUrl' 
        ? 'Foto profil berhasil diupload. Jangan lupa klik "Simpan" untuk menyimpan perubahan!' 
        : 'Cover image berhasil diupload. Jangan lupa klik "Simpan" untuk menyimpan perubahan!'
      toast.success(message, { duration: 4000 })
    }
    reader.onerror = () => {
      toast.error('Gagal membaca file')
    }
    reader.readAsDataURL(file)
  }

  // Use getBioUrl() instead of hardcoded URL
  const bioLink = getBioUrl()

  if (loading) {
    return (
      <FeatureLock feature="bio">
        <ResponsivePageWrapper>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-500">Memuat Bio Page...</p>
            </div>
          </div>
        </ResponsivePageWrapper>
      </FeatureLock>
    )
  }

  return (
    <FeatureLock feature="bio">
      <ResponsivePageWrapper>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Link Affiliate</h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => window.open(getBioUrl(), '_blank')}
                    disabled={!bioLink}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-[1fr,400px] gap-8">
              {/* Left Column - Editor */}
              <div className="space-y-6">
                {/* Profile Card */}
                <Card className="border-0 shadow-lg overflow-visible relative">
                  <div 
                    className="h-32 relative overflow-hidden rounded-t-lg"
                  >
                    {formData.coverImage ? (
                      <Image 
                        src={formData.coverImage} 
                        alt="Cover" 
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
                    )}
                    <label className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors cursor-pointer group">
                      <Edit className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('coverImage', e.target.files[0])}
                      />
                      <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Upload Cover
                      </span>
                    </label>
                  </div>
                  
                  {/* Avatar - positioned outside cover */}
                  <div className="absolute top-20 left-6 z-10">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden group relative shadow-lg">
                      {formData.avatarUrl ? (
                        <Image 
                          src={formData.avatarUrl} 
                          alt="Avatar" 
                          width={96} 
                          height={96} 
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                          <span className="text-white text-2xl font-bold">{session?.user?.name?.charAt(0) || formData.displayName?.charAt(0) || 'U'}</span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Upload className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload('avatarUrl', e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-16 px-6 pb-6">
                    <div className="mb-4">
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Nama Anda"
                        className="text-2xl font-bold border-0 px-0 text-gray-900 bg-transparent placeholder:text-gray-400"
                      />
                      <Input
                        value={formData.customHeadline}
                        onChange={(e) => setFormData({ ...formData, customHeadline: e.target.value })}
                        placeholder="Tagline atau headline"
                        className="text-sm text-gray-500 border-0 px-0 bg-transparent placeholder:text-gray-400"
                      />
                    </div>

                    {/* Link Preview */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <LinkIcon className="w-5 h-5 text-purple-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Link Affiliate</p>
                        <p className="text-sm text-gray-500 truncate">{bioLink}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={copyBioUrl}
                        disabled={!bioLink}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        Share Link
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full bg-white shadow-lg border-0 p-1">
                    <TabsTrigger value="links" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                      Links
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger value="statistic" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                      Statistic
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="links" className="mt-6 space-y-4">
                    {/* Block Management */}
                    {!showCTAForm ? (
                      <Card className="border-0 shadow-lg">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Block List</h3>
                            <Button 
                              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                              onClick={() => handleOpenCTAForm()}
                            >
                              <Plus className="w-4 h-4" />
                              Add New Block
                            </Button>
                          </div>

                          {/* CTA Buttons List */}
                          <div className="space-y-3">
                            {bioPage?.ctaButtons && bioPage.ctaButtons.length > 0 ? (
                              bioPage.ctaButtons
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((cta) => (
                                <div 
                                  key={cta.id}
                                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                                >
                                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                  
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                                    style={{ backgroundColor: cta.backgroundColor }}
                                  >
                                    {cta.buttonText.charAt(0)}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{cta.buttonText}</p>
                                    {cta.customUrl && (
                                      <p className="text-sm text-gray-500 truncate">{cta.customUrl}</p>
                                    )}
                                    <p className="text-xs text-gray-400">{cta.clicks} clicks</p>
                                  </div>

                                  <Switch
                                    checked={cta.isActive}
                                    onCheckedChange={async (checked) => {
                                      try {
                                        await fetch(`/api/affiliate/bio/cta/${cta.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ isActive: checked })
                                        })
                                        fetchBioPage()
                                      } catch (error) {
                                        console.error('Error updating CTA status:', error)
                                      }
                                    }}
                                  />

                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleReorderCTA(cta.id, 'up')}
                                    >
                                      <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleReorderCTA(cta.id, 'down')}
                                    >
                                      <ArrowDown className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleOpenCTAForm(cta)}
                                    >
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => setDeletingCTA(cta.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12 text-gray-500">
                                <LinkIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium mb-2">Belum Ada Block</h3>
                                <p className="mb-4">Tambahkan block pertama untuk link affiliate Anda</p>
                                <Button 
                                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                                  onClick={() => handleOpenCTAForm()}
                                >
                                  <Plus className="w-4 h-4" />
                                  Tambah Block
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ) : (
                      // CTA Form
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {editingCTA ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {editingCTA ? 'Edit Block' : 'Tambah Block Baru'}
                          </CardTitle>
                          <CardDescription>
                            {editingCTA ? 'Edit informasi block' : 'Buat block baru untuk bio page Anda'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4">
                            <div>
                              <Label htmlFor="buttonText">Teks Button</Label>
                              <Input
                                id="buttonText"
                                value={ctaFormData.buttonText}
                                onChange={(e) => setCtaFormData({ ...ctaFormData, buttonText: e.target.value })}
                                placeholder="Contoh: Kunjungi Website Saya"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="targetType">Jenis Target</Label>
                                <Select
                                  value={ctaFormData.targetType}
                                  onValueChange={(value) => setCtaFormData({ ...ctaFormData, targetType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="custom">Custom URL</SelectItem>
                                    <SelectItem value="membership">Membership</SelectItem>
                                    <SelectItem value="product">Product</SelectItem>
                                    <SelectItem value="course">Course</SelectItem>
                                    <SelectItem value="optin">Optin Form</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="buttonStyle">Style Button</Label>
                                <Select
                                  value={ctaFormData.buttonStyle}
                                  onValueChange={(value) => setCtaFormData({ ...ctaFormData, buttonStyle: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="solid">🟦 Solid</SelectItem>
                                    <SelectItem value="outline">⬜ Outline</SelectItem>
                                    <SelectItem value="gradient">🌈 Gradient</SelectItem>
                                    <SelectItem value="shadow">💎 Shadow</SelectItem>
                                    <SelectItem value="rounded">⭕ Rounded</SelectItem>
                                    <SelectItem value="minimal">📄 Minimal</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {ctaFormData.targetType === 'custom' && (
                              <div>
                                <Label htmlFor="customUrl">URL Custom</Label>
                                <Input
                                  id="customUrl"
                                  value={ctaFormData.customUrl}
                                  onChange={(e) => setCtaFormData({ ...ctaFormData, customUrl: e.target.value })}
                                  placeholder="https://example.com"
                                />
                              </div>
                            )}

                            {ctaFormData.targetType === 'membership' && (
                              <div>
                                <Label htmlFor="membershipId">Pilih Membership</Label>
                                <Select
                                  value={ctaFormData.membershipId}
                                  onValueChange={(value) => {
                                    const selectedItem = memberships.find(m => m.id === value)
                                    setCtaFormData({ 
                                      ...ctaFormData, 
                                      membershipId: value,
                                      thumbnailUrl: selectedItem?.image || selectedItem?.thumbnail || '',
                                      buttonText: ctaFormData.buttonText || selectedItem?.name || '',
                                      price: ctaFormData.price || selectedItem?.price || ''
                                    })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih membership" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {memberships.map((membership) => (
                                      <SelectItem key={membership.id} value={membership.id}>
                                        {membership.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {ctaFormData.targetType === 'product' && (
                              <div>
                                <Label htmlFor="productId">Pilih Product</Label>
                                <Select
                                  value={ctaFormData.productId}
                                  onValueChange={(value) => {
                                    const selectedItem = products.find(p => p.id === value)
                                    setCtaFormData({ 
                                      ...ctaFormData, 
                                      productId: value,
                                      thumbnailUrl: selectedItem?.image || selectedItem?.thumbnail || '',
                                      buttonText: ctaFormData.buttonText || selectedItem?.name || '',
                                      price: ctaFormData.price || selectedItem?.price || ''
                                    })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {ctaFormData.targetType === 'course' && (
                              <div>
                                <Label htmlFor="courseId">Pilih Course</Label>
                                <Select
                                  value={ctaFormData.courseId}
                                  onValueChange={(value) => {
                                    const selectedItem = courses.find(c => c.id === value)
                                    setCtaFormData({ 
                                      ...ctaFormData, 
                                      courseId: value,
                                      thumbnailUrl: selectedItem?.image || selectedItem?.thumbnail || '',
                                      buttonText: ctaFormData.buttonText || selectedItem?.title || '',
                                      price: ctaFormData.price || selectedItem?.price || ''
                                    })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih course" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {courses.map((course) => (
                                      <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {ctaFormData.targetType === 'optin' && (
                              <div>
                                <Label htmlFor="optinFormId">Pilih Optin Form</Label>
                                <Select
                                  value={ctaFormData.optinFormId}
                                  onValueChange={(value) => setCtaFormData({ ...ctaFormData, optinFormId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih optin form" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {optinForms.map((form) => (
                                      <SelectItem key={form.id} value={form.id}>
                                        {form.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="backgroundColor">Warna Background</Label>
                                <Input
                                  id="backgroundColor"
                                  type="color"
                                  value={ctaFormData.backgroundColor}
                                  onChange={(e) => setCtaFormData({ ...ctaFormData, backgroundColor: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="textColor">Warna Teks</Label>
                                <Input
                                  id="textColor"
                                  type="color"
                                  value={ctaFormData.textColor}
                                  onChange={(e) => setCtaFormData({ ...ctaFormData, textColor: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button onClick={handleSaveCTA} disabled={saving}>
                              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              {editingCTA ? 'Update Block' : 'Tambah Block'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowCTAForm(false)}>
                              Batal
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tombol Simpan di Tab Links */}
                    {!showCTAForm && (
                      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
                        <CardContent className="p-4">
                          <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            💾 Simpan Semua Perubahan
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="appearance" className="mt-6">
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          Customize Appearance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="template">Template Bio Page</Label>
                          <Select
                            value={formData.template}
                            onValueChange={(value) => setFormData({ ...formData, template: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">🎨 Modern</SelectItem>
                              <SelectItem value="minimal">📱 Minimal</SelectItem>
                              <SelectItem value="bold">🔥 Bold</SelectItem>
                              <SelectItem value="elegant">💜 Elegant</SelectItem>
                              <SelectItem value="creative">🌟 Creative</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">Pilih template yang sesuai dengan brand Anda</p>
                        </div>

                        <div>
                          <Label htmlFor="customDescription">Deskripsi</Label>
                          <Textarea
                            id="customDescription"
                            value={formData.customDescription}
                            onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
                            placeholder="Ceritakan sedikit tentang Anda..."
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="primaryColor">Warna Utama</Label>
                            <Input
                              id="primaryColor"
                              type="color"
                              value={formData.primaryColor}
                              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="secondaryColor">Warna Sekunder</Label>
                            <Input
                              id="secondaryColor"
                              type="color"
                              value={formData.secondaryColor}
                              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="isActive">Aktifkan Bio Page</Label>
                          <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          />
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Simpan Pengaturan
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="statistic" className="mt-6">
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Statistik
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{bioPage?.viewCount || 0}</h3>
                          <p className="text-gray-500">Total Views</p>
                        </div>

                        {bioPage?.ctaButtons && bioPage.ctaButtons.length > 0 && (
                          <div className="space-y-3 mt-6">
                            <h4 className="font-medium text-gray-900">Clicks per Button</h4>
                            {bioPage.ctaButtons.map((cta) => (
                              <div key={cta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium truncate">{cta.buttonText}</span>
                                <span className="text-sm text-gray-500">{cta.clicks} clicks</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tombol Simpan di Tab Statistic */}
                    <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50 mt-4">
                      <CardContent className="p-4">
                        <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
                          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          💾 Simpan Semua Perubahan
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column - Mobile Preview */}
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Preview</h3>
                  <button className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1 mx-auto">
                    <span>Customize UI</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Frame */}
                <div className="relative mx-auto" style={{ width: '320px' }}>
                  <div className="relative bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                    
                    <div className="bg-white rounded-[32px] overflow-hidden" style={{ height: '640px' }}>
                      <div className="bg-gray-900 text-white px-6 py-2 flex items-center justify-between text-xs">
                        <span>9:41</span>
                        <span>100%</span>
                      </div>

                      <div className="h-32 relative overflow-hidden">
                        {formData.coverImage ? (
                          <Image 
                            src={formData.coverImage} 
                            alt="Cover" 
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div 
                            className="w-full h-full"
                            style={{ 
                              background: `linear-gradient(135deg, ${formData.primaryColor || '#8B5CF6'} 0%, ${formData.secondaryColor || '#3B82F6'} 100%)`
                            }}
                          />
                        )}
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                          <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                            {formData.avatarUrl ? (
                              <Image 
                                src={formData.avatarUrl} 
                                alt="Avatar" 
                                width={80} 
                                height={80} 
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                                <span className="text-white text-xl font-bold">{formData.displayName?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pt-14 pb-6 overflow-y-auto" style={{ height: 'calc(640px - 152px)' }}>
                        <div className="text-center mb-6">
                          <h2 className="text-lg font-bold text-gray-900 mb-1">{formData.displayName || session?.user?.name || 'Your Name'}</h2>
                          <p className="text-xs text-gray-600 mb-3">
                            {formData.customHeadline || 'Hi creator ceo, I make creative video about your marketing business, tutorials, and freelancing'}
                          </p>
                          
                          {formData.customDescription && (
                            <p className="text-xs text-gray-600 mb-3">
                              {formData.customDescription}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {previewCTAs && previewCTAs.length > 0 ? (
                            previewCTAs
                              .filter(cta => cta.isActive)
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map((cta) => {
                                // Button style classes
                                const getButtonStyle = () => {
                                  const baseClass = "flex items-center gap-3 p-3 transition-all"
                                  const style = cta.buttonStyle || 'solid'
                                  
                                  switch(style) {
                                    case 'outline':
                                      return `${baseClass} rounded-xl border-2 bg-transparent`
                                    case 'gradient':
                                      return `${baseClass} rounded-xl bg-gradient-to-r shadow-lg`
                                    case 'shadow':
                                      return `${baseClass} rounded-xl shadow-xl hover:shadow-2xl`
                                    case 'rounded':
                                      return `${baseClass} rounded-full`
                                    case 'minimal':
                                      return `${baseClass} rounded-lg border`
                                    default: // solid
                                      return `${baseClass} rounded-xl`
                                  }
                                }
                                
                                return (
                                  <div 
                                    key={cta.id}
                                    className={getButtonStyle()}
                                    style={
                                      cta.buttonStyle === 'outline' ? { 
                                        borderColor: cta.backgroundColor,
                                        color: cta.backgroundColor
                                      } : cta.buttonStyle === 'gradient' ? {
                                        backgroundImage: `linear-gradient(to right, ${cta.backgroundColor}, ${cta.textColor})`,
                                        color: '#FFFFFF'
                                      } : { 
                                        backgroundColor: cta.backgroundColor, 
                                        color: cta.textColor 
                                      }
                                    }
                                  >
                                    {cta.thumbnailUrl && cta.showThumbnail && (
                                      <div className="w-12 h-12 rounded-lg bg-black/10 flex-shrink-0 overflow-hidden">
                                        <Image src={cta.thumbnailUrl} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{cta.buttonText}</p>
                                      {cta.subtitle && (
                                        <p className="text-xs opacity-80 truncate">{cta.subtitle}</p>
                                      )}
                                      {cta.price && cta.showPrice && (
                                        <p className="text-xs font-bold">{cta.price}</p>
                                      )}
                                    </div>
                                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                  </div>
                                )
                              })
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <LinkIcon className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-xs">Belum ada link</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Alert Dialog */}
          <AlertDialog open={!!deletingCTA} onOpenChange={() => setDeletingCTA(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus CTA Button</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus CTA button ini? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deletingCTA && handleDeleteCTA(deletingCTA)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ResponsivePageWrapper>
    </FeatureLock>
  )
}