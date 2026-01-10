'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
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
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  Layout, 
  Plus, 
  Edit,
  Loader2, 
  Trash2, 
  Eye, 
  ExternalLink,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  GripVertical,
  Settings,
  Palette,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

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
  const [username, setUsername] = useState<string | null>(null)
  const [showCTAModal, setShowCTAModal] = useState(false)
  const [editingCTA, setEditingCTA] = useState<CTAButton | null>(null)
  const [deletingCTA, setDeletingCTA] = useState<string | null>(null)
  const [ctaFormData, setCtaFormData] = useState({
    buttonText: '',
    buttonType: 'custom',
    buttonStyle: 'button',
    backgroundColor: '#3B82F6',
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

  // Dropdown data states
  const [memberships, setMemberships] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [optinForms, setOptinForms] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  // Auto-populate data from selected item
  const autoPopulateFromItem = (itemType: string, itemId: string) => {
    let selectedItem: any = null
    
    if (itemType === 'membership') {
      selectedItem = memberships.find(m => m.id === itemId)
      if (selectedItem && ctaFormData.buttonStyle !== 'button') {
        setCtaFormData(prev => ({
          ...prev,
          buttonText: prev.buttonText || selectedItem.name,
          subtitle: prev.subtitle || selectedItem.formDescription?.substring(0, 100) || '',
          thumbnailUrl: prev.thumbnailUrl || selectedItem.formBanner || '',
          price: prev.price || `Rp ${selectedItem.price?.toLocaleString('id-ID')}` || '',
          showThumbnail: true,
          showPrice: true
        }))
      }
    } else if (itemType === 'product') {
      selectedItem = products.find(p => p.id === itemId)
      if (selectedItem && ctaFormData.buttonStyle !== 'button') {
        setCtaFormData(prev => ({
          ...prev,
          buttonText: prev.buttonText || selectedItem.name,
          subtitle: prev.subtitle || selectedItem.shortDescription?.substring(0, 100) || '',
          thumbnailUrl: prev.thumbnailUrl || selectedItem.thumbnail || '',
          price: prev.price || `Rp ${selectedItem.price?.toLocaleString('id-ID')}` || '',
          showThumbnail: true,
          showPrice: true
        }))
      }
    } else if (itemType === 'course') {
      selectedItem = courses.find(c => c.id === itemId)
      if (selectedItem && ctaFormData.buttonStyle !== 'button') {
        setCtaFormData(prev => ({
          ...prev,
          buttonText: prev.buttonText || selectedItem.title,
          subtitle: prev.subtitle || selectedItem.description?.substring(0, 100) || '',
          thumbnailUrl: prev.thumbnailUrl || selectedItem.thumbnail || '',
          price: prev.price || (selectedItem.price > 0 ? `Rp ${selectedItem.price?.toLocaleString('id-ID')}` : 'Gratis'),
          showThumbnail: true,
          showPrice: true
        }))
      }
    } else if (itemType === 'event') {
      selectedItem = events.find(e => e.id === itemId)
      if (selectedItem && ctaFormData.buttonStyle !== 'button') {
        setCtaFormData(prev => ({
          ...prev,
          buttonText: prev.buttonText || selectedItem.title,
          subtitle: prev.subtitle || selectedItem.description?.substring(0, 100) || '',
          thumbnailUrl: prev.thumbnailUrl || selectedItem.thumbnail || '',
          price: prev.price || (selectedItem.price > 0 ? `Rp ${selectedItem.price?.toLocaleString('id-ID')}` : 'Gratis'),
          showThumbnail: true,
          showPrice: true
        }))
      }
    }
  }

  const [formData, setFormData] = useState({
    template: 'modern',
    buttonLayout: 'stack',
    displayName: '',
    customHeadline: '',
    customDescription: '',
    avatarUrl: '',
    coverImage: '',
    whatsappNumber: '',
    whatsappGroupLink: '',
    isActive: true,
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
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
  }, [])

  useEffect(() => {
    if (showCTAModal) {
      fetchDropdownData()
    }
  }, [showCTAModal])

  const fetchDropdownData = async () => {
    console.log('📥 Fetching dropdown data...')
    setLoadingDropdowns(true)
    try {
      // Fetch all data in parallel
      const [membershipsRes, productsRes, coursesRes, eventsRes, optinFormsRes] = await Promise.all([
        fetch('/api/memberships'),
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
        console.log('Optin Forms Response:', data)
        const forms = data.optinForms || data.forms || data || []
        console.log('Setting optin forms:', forms.length, 'forms')
        setOptinForms(forms)
      } else {
        console.error('Failed to fetch optin forms:', optinFormsRes.status)
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    } finally {
      setLoadingDropdowns(false)
    }
  }

  useEffect(() => {
    if (showCTAModal) {
      fetchDropdownData()
    }
  }, [showCTAModal])

  const fetchBioPage = async () => {
    try {
      console.log('🔄 Fetching bio page...')
      const res = await fetch('/api/affiliate/bio')
      const data = await res.json()

      console.log('Bio Page Response:', { 
        status: res.status, 
        ok: res.ok,
        hasBioPage: !!data.bioPage,
        ctaButtonsCount: data.bioPage?.ctaButtons?.length || 0
      })

      // Check if user is not an affiliate FIRST
      if (res.status === 403) {
        toast.error('Anda belum terdaftar sebagai affiliate. Silakan daftar terlebih dahulu.')
        setLoading(false)
        return
      }

      if (res.ok && data.bioPage) {
        console.log('✅ Setting bio page state with', data.bioPage.ctaButtons?.length || 0, 'CTA buttons')
        setBioPage(data.bioPage)
        setUsername(data.username)
        setFormData({
          template: data.bioPage.template || 'modern',
          buttonLayout: data.bioPage.buttonLayout || 'stack',
          displayName: data.bioPage.displayName || '',
          customHeadline: data.bioPage.customHeadline || '',
          customDescription: data.bioPage.customDescription || '',
          avatarUrl: data.bioPage.avatarUrl || '',
          coverImage: data.bioPage.coverImage || '',
          whatsappNumber: data.bioPage.whatsappNumber || '',
          whatsappGroupLink: data.bioPage.whatsappGroupLink || '',
          isActive: data.bioPage.isActive,
          primaryColor: data.bioPage.primaryColor || '#3B82F6',
          secondaryColor: data.bioPage.secondaryColor || '#10B981',
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
    try {
      console.log('Saving Bio Page:', formData)
      const res = await fetch('/api/affiliate/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      console.log('Save Response:', { status: res.status, data })

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

  const handleOpenCTAModal = (cta?: CTAButton) => {
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
        backgroundColor: '#3B82F6',
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
    setShowCTAModal(true)
  }

  const handleImageUpload = (field: 'avatarUrl' | 'coverImage', file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, [field]: reader.result as string })
    }
    reader.readAsDataURL(file)
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
      
      // Clean up data - only send non-empty values for foreign keys
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

      console.log('Sending CTA data:', cleanData)
      
      const res = await fetch(url, {
        method: editingCTA ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      })

      console.log('CTA Save Response:', { 
        status: res.status, 
        ok: res.ok,
        method: editingCTA ? 'PUT' : 'POST',
        url 
      })

      if (res.ok) {
        const responseData = await res.json()
        console.log('CTA Save Success:', responseData)
        toast.success(editingCTA ? 'CTA Button berhasil diupdate!' : 'CTA Button berhasil ditambahkan!')
        setShowCTAModal(false)
        console.log('Fetching bio page after CTA save...')
        await fetchBioPage()
        console.log('Bio page refreshed!')
      } else {
        const data = await res.json()
        console.error('CTA Save Error:', data)
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
      // Swap display orders
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

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Memuat Bio Page...</p>
            </div>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="bio">
    <ResponsivePageWrapper>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <Layout className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Bio Link</h1>
                <p className="text-sm text-gray-600">Kelola halaman bio untuk promosi affiliate Anda</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bioPage && username && (
                <>
                  <Button
                    variant="outline"
                    onClick={copyBioUrl}
                    className="gap-2 border-purple-200 hover:bg-purple-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Salin Link
                  </Button>
                  <Link href={`/bio/${username}`} target="_blank">
                    <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md">
                      <Eye className="h-4 w-4" />
                      Share Url
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {username && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <LinkIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-900 mb-1">Lynk-id Link</p>
                    <code className="text-sm font-semibold text-purple-700">
                      {getBioUrl()}
                    </code>
                  </div>
                </div>
                <Button
                  onClick={copyBioUrl}
                  size="sm"
                  variant="secondary"
                  className="bg-white hover:bg-gray-50 shadow-sm"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Bio Settings */}
          <div className="space-y-6">
            <Card className="shadow-lg border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <CardTitle className="text-lg">Pengaturan Bio Page</CardTitle>
                <CardDescription>
                  Atur tampilan dan informasi di Bio Page Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Pilih Template</Label>
                  <Select value={formData.template} onValueChange={(value) => setFormData({ ...formData, template: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded"></div>
                          <span>Modern - Gradient & Clean</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="minimal">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded"></div>
                          <span>Minimal - Simple & Elegant</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bold">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded"></div>
                          <span>Bold - Vibrant & Eye-catching</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="elegant">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded"></div>
                          <span>Elegant - Luxury & Premium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="creative">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-cyan-500 rounded"></div>
                          <span>Creative - Fun & Unique</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Pilih template yang sesuai dengan brand Anda
                  </p>
                </div>

                <div>
                  <Label htmlFor="buttonLayout">Layout CTA Buttons</Label>
                  <Select value={formData.buttonLayout} onValueChange={(value) => setFormData({ ...formData, buttonLayout: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih layout button" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stack">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="w-12 h-2 bg-blue-500 rounded"></div>
                              <div className="w-12 h-2 bg-blue-500 rounded"></div>
                              <div className="w-12 h-2 bg-blue-500 rounded"></div>
                            </div>
                            <span className="font-medium">Stack (Vertikal)</span>
                          </div>
                          <span className="text-xs text-gray-500">Button penuh vertikal - Classic</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="grid-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <div className="flex flex-col gap-0.5">
                                <div className="w-6 h-2 bg-blue-500 rounded"></div>
                                <div className="w-6 h-2 bg-blue-500 rounded"></div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="w-6 h-2 bg-blue-500 rounded"></div>
                                <div className="w-6 h-2 bg-blue-500 rounded"></div>
                              </div>
                            </div>
                            <span className="font-medium">Grid 2 Kolom</span>
                          </div>
                          <span className="text-xs text-gray-500">2 button per baris - Modern</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="grid-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <div className="flex flex-col gap-0.5">
                                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                              </div>
                            </div>
                            <span className="font-medium">Grid 3 Kolom</span>
                          </div>
                          <span className="text-xs text-gray-500">3 button per baris (desktop)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="compact">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <div className="flex flex-col gap-0.5">
                                <div className="w-7 h-1.5 bg-blue-500 rounded"></div>
                                <div className="w-7 h-1.5 bg-blue-500 rounded"></div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="w-7 h-1.5 bg-blue-500 rounded"></div>
                                <div className="w-7 h-1.5 bg-blue-500 rounded"></div>
                              </div>
                            </div>
                            <span className="font-medium">Compact</span>
                          </div>
                          <span className="text-xs text-gray-500">Button kecil 2 per baris - Space saving</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="masonry">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <div className="flex flex-col gap-0.5">
                                <div className="w-5 h-3 bg-blue-500 rounded"></div>
                                <div className="w-5 h-1.5 bg-blue-500 rounded"></div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="w-5 h-1.5 bg-blue-500 rounded"></div>
                                <div className="w-5 h-3 bg-blue-500 rounded"></div>
                              </div>
                            </div>
                            <span className="font-medium">Masonry</span>
                          </div>
                          <span className="text-xs text-gray-500">Dynamic grid - Creative & unique</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Pilih layout untuk tampilan CTA buttons di bio page
                  </p>
                </div>

                <div>
                  <Label htmlFor="avatar">Avatar / Foto Profil</Label>
                  <div className="flex items-center gap-4">
                    {formData.avatarUrl && (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('avatarUrl', file)
                        }}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 400x400px</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cover">Cover Image</Label>
                  <div className="space-y-2">
                    {formData.coverImage && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload('coverImage', file)
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">Recommended: 1200x400px</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="displayName">Nama Tampilan</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Contoh: John Doe"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nama yang akan ditampilkan di bio page Anda
                  </p>
                </div>

                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={formData.customHeadline}
                    onChange={(e) => setFormData({ ...formData, customHeadline: e.target.value })}
                    placeholder="Contoh: Ahli Ekspor & Mentor Bisnis"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.customDescription}
                    onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
                    placeholder="Ceritakan tentang Anda dan apa yang Anda tawarkan..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number (untuk kontak)</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="628123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 628xxx (tanpa +, tanpa spasi)
                  </p>
                </div>

                <div>
                  <Label htmlFor="waGroup">Link Grup WhatsApp</Label>
                  <Input
                    id="waGroup"
                    value={formData.whatsappGroupLink}
                    onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                    placeholder="https://chat.whatsapp.com/xxxxx"
                  />
                </div>

                <div>
                  <Label>Warna Template</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="primaryColor" className="text-xs">Warna Primer</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor" className="text-xs">Warna Sekunder</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          placeholder="#10B981"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fontFamily">Font Style</Label>
                  <Select value={formData.fontFamily} onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter - Modern Sans Serif</SelectItem>
                      <SelectItem value="poppins">Poppins - Clean & Friendly</SelectItem>
                      <SelectItem value="montserrat">Montserrat - Bold & Strong</SelectItem>
                      <SelectItem value="playfair">Playfair Display - Elegant Serif</SelectItem>
                      <SelectItem value="roboto">Roboto - Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Social Media Links</Label>
                    <Switch
                      checked={formData.showSocialIcons}
                      onCheckedChange={(checked) => setFormData({ ...formData, showSocialIcons: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Facebook URL"
                      value={formData.socialFacebook}
                      onChange={(e) => setFormData({ ...formData, socialFacebook: e.target.value })}
                      disabled={!formData.showSocialIcons}
                    />
                    <Input
                      placeholder="Instagram URL"
                      value={formData.socialInstagram}
                      onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
                      disabled={!formData.showSocialIcons}
                    />
                    <Input
                      placeholder="Twitter/X URL"
                      value={formData.socialTwitter}
                      onChange={(e) => setFormData({ ...formData, socialTwitter: e.target.value })}
                      disabled={!formData.showSocialIcons}
                    />
                    <Input
                      placeholder="TikTok URL"
                      value={formData.socialTiktok}
                      onChange={(e) => setFormData({ ...formData, socialTiktok: e.target.value })}
                      disabled={!formData.showSocialIcons}
                    />
                    <Input
                      placeholder="YouTube URL"
                      value={formData.socialYoutube}
                      onChange={(e) => setFormData({ ...formData, socialYoutube: e.target.value })}
                      disabled={!formData.showSocialIcons}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Status Bio Page</Label>
                    <p className="text-sm text-gray-500">
                      {formData.isActive ? 'Bio Page aktif dan bisa diakses' : 'Bio Page tidak aktif'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-200"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Bio Page'}
                </Button>
              </CardContent>
            </Card>

            {/* CTA Buttons Section */}
            <Card className="shadow-lg border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">CTA Buttons</CardTitle>
                    <CardDescription>
                      Tombol aksi di Bio Page Anda
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowCTAModal(true)}
                    disabled={!bioPage}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah CTA
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!bioPage ? (
                  <div className="text-center py-8 text-gray-500">
                    <Layout className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Simpan Bio Page terlebih dahulu untuk menambah CTA Button</p>
                  </div>
                ) : bioPage.ctaButtons && bioPage.ctaButtons.length > 0 ? (
                  <div className="space-y-3">
                    {bioPage.ctaButtons.map((cta) => (
                      <div
                        key={cta.id}
                        className="flex items-center justify-between p-4 border border-purple-100 rounded-lg hover:bg-purple-50/50 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{cta.buttonText}</h4>
                            <p className="text-sm text-gray-500">
                              {cta.buttonType} • {cta.clicks} clicks
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReorderCTA(cta.id, 'up')}
                            disabled={bioPage.ctaButtons.findIndex(c => c.id === cta.id) === 0}
                            className="hover:bg-purple-100"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReorderCTA(cta.id, 'down')}
                            disabled={bioPage.ctaButtons.findIndex(c => c.id === cta.id) === bioPage.ctaButtons.length - 1}
                            className="hover:bg-purple-100"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenCTAModal(cta)}
                            className="hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeletingCTA(cta.id)}
                            className="hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="h-12 w-12 mx-auto mb-3 text-purple-300" />
                    <p className="text-gray-600 mb-2">Belum ada CTA Button</p>
                    <Button 
                      onClick={() => setShowCTAModal(true)}
                      className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                    >
                      Tambah CTA Button Pertama
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Preview */}
          <div className="space-y-6">
            <Card className="shadow-lg border-purple-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                  Live Preview
                </CardTitle>
                <CardDescription>Ini adalah tampilan bio page Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden shadow-inner">
                  {/* Preview Cover */}
                  {formData.coverImage && (
                    <div className="w-full h-32 relative">
                      <img
                        src={formData.coverImage}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Preview Avatar & Name */}
                    <div className="text-center mb-4">
                      {formData.avatarUrl && (
                        <div className="relative w-16 h-16 mx-auto mb-3 -mt-12">
                          <img
                            src={formData.avatarUrl}
                            alt="Avatar Preview"
                            className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-bold">
                        {formData.displayName || username || 'Your Name'}
                      </h3>
                      {formData.customHeadline && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formData.customHeadline}
                        </p>
                      )}
                      {formData.customDescription && (
                        <p className="text-xs text-gray-600 mt-2">
                          {formData.customDescription}
                        </p>
                      )}
                    </div>

                    {/* Preview WhatsApp Buttons */}
                    {(formData.whatsappNumber || formData.whatsappGroupLink) && (
                      <div className="flex gap-2 mb-3">
                        {formData.whatsappNumber && (
                          <button className="flex-1 bg-green-600 text-white text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            WhatsApp
                          </button>
                        )}
                        {formData.whatsappGroupLink && (
                          <button className="flex-1 border border-gray-300 text-gray-700 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Join Grup
                          </button>
                        )}
                      </div>
                    )}

                    {/* Preview CTA Buttons */}
                    {bioPage?.ctaButtons && bioPage.ctaButtons.length > 0 && (
                      <div className="space-y-2">
                        {bioPage.ctaButtons.slice(0, 3).map((cta) => {
                          const getTextSizeClass = (size?: string) => {
                            const map: Record<string, string> = {
                              'xs': 'text-xs',
                              'sm': 'text-sm', 
                              'base': 'text-base',
                              'lg': 'text-lg',
                              'xl': 'text-xl'
                            }
                            return map[size || 'sm'] || 'text-sm'
                          }

                          // Render card styles
                          if (cta.buttonStyle === 'card' && cta.showThumbnail && cta.thumbnailUrl) {
                            return (
                              <div key={cta.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <img src={cta.thumbnailUrl} alt={cta.buttonText} className="w-full h-20 object-cover" />
                                <div className="p-2">
                                  <h4 className={`font-semibold ${getTextSizeClass(cta.titleSize)} mb-1`}>{cta.buttonText}</h4>
                                  {cta.subtitle && <p className={`${getTextSizeClass(cta.subtitleSize)} text-gray-600 mb-1 line-clamp-1`}>{cta.subtitle}</p>}
                                  {cta.showPrice && cta.price && (
                                    <p className="text-xs font-bold text-blue-600">{cta.price}</p>
                                  )}
                                </div>
                              </div>
                            )
                          }

                          if (cta.buttonStyle === 'card-horizontal' && cta.showThumbnail && cta.thumbnailUrl) {
                            return (
                              <div key={cta.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden flex">
                                <img src={cta.thumbnailUrl} alt={cta.buttonText} className="w-16 h-16 object-cover" />
                                <div className="flex-1 p-2">
                                  <h4 className={`font-semibold ${getTextSizeClass(cta.titleSize)} line-clamp-1`}>{cta.buttonText}</h4>
                                  {cta.subtitle && <p className={`${getTextSizeClass(cta.subtitleSize)} text-gray-600 line-clamp-1`}>{cta.subtitle}</p>}
                                </div>
                              </div>
                            )
                          }

                          if (cta.buttonStyle === 'card-product' && cta.showThumbnail && cta.thumbnailUrl) {
                            return (
                              <div key={cta.id} className="bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg overflow-hidden">
                                <img src={cta.thumbnailUrl} alt={cta.buttonText} className="w-full h-20 object-cover" />
                                <div className="p-2">
                                  <h4 className={`font-semibold ${getTextSizeClass(cta.titleSize)} mb-1`}>{cta.buttonText}</h4>
                                  {cta.showPrice && cta.price && (
                                    <p className="text-xs font-bold text-blue-600">{cta.price}</p>
                                  )}
                                </div>
                              </div>
                            )
                          }

                          // Default button style
                          return (
                            <button
                              key={cta.id}
                              style={{
                                backgroundColor: cta.backgroundColor,
                                color: cta.textColor
                              }}
                              className={`w-full py-2.5 px-4 rounded-lg ${getTextSizeClass(cta.titleSize)} font-medium`}
                            >
                              {cta.buttonText}
                            </button>
                          )
                        })}
                        {bioPage.ctaButtons.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{bioPage.ctaButtons.length - 3} more buttons
                          </p>
                        )}
                      </div>
                    )}

                    {!bioPage?.ctaButtons?.length && (
                      <div className="text-center py-4 text-gray-400 text-xs">
                        <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No CTA buttons yet</p>
                      </div>
                    )}

                    {/* Preview Footer */}
                    <div className="text-center mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-400">
                        Powered by <span className="font-semibold">Ekspor Yuk</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {bioPage && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-3xl font-bold">{bioPage.viewCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Clicks</p>
                    <p className="text-3xl font-bold">
                      {bioPage.ctaButtons?.reduce((sum, cta) => sum + cta.clicks, 0) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CTA Buttons</p>
                    <p className="text-3xl font-bold">
                      {bioPage.ctaButtons?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>✅ Gunakan headline yang menarik perhatian</p>
                <p>✅ Tambahkan deskripsi yang jelas dan singkat</p>
                <p>✅ Buat CTA button yang spesifik</p>
                <p>✅ Gunakan WhatsApp untuk komunikasi cepat</p>
                <p>✅ Pantau statistik secara berkala</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Modal */}
        <Dialog open={showCTAModal} onOpenChange={setShowCTAModal}>
          <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader className="space-y-3 px-6 pt-6">
              <DialogTitle className="text-xl">
                {editingCTA ? 'Edit CTA Button' : 'Tambah CTA Button'}
              </DialogTitle>
              <DialogDescription className="text-base">
                Buat tombol call-to-action untuk Bio Page Anda
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-4 overflow-y-auto flex-1">
              <div>
                <Label htmlFor="buttonText" className="text-sm mb-2 block">Teks Button *</Label>
                <Input
                  id="buttonText"
                  value={ctaFormData.buttonText}
                  onChange={(e) => setCtaFormData({ ...ctaFormData, buttonText: e.target.value })}
                  placeholder="Contoh: Kelas Ekspor Yuk"
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="buttonType" className="text-sm mb-2 block">Tipe Button</Label>
                <Select
                  value={ctaFormData.buttonType}
                  onValueChange={(value) => {
                    console.log('🔄 Button type changed to:', value)
                    console.log('📊 Current optinForms count:', optinForms.length)
                    setCtaFormData({ ...ctaFormData, buttonType: value })
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom URL</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="optin">Optin Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="buttonStyle" className="text-sm mb-2 block">Style Tampilan</Label>
                <Select
                  value={ctaFormData.buttonStyle}
                  onValueChange={(value) => setCtaFormData({ ...ctaFormData, buttonStyle: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-6 bg-blue-500 rounded"></div>
                        <span>Button Biasa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-8 bg-white border-2 border-gray-300 rounded"></div>
                        <span>Card Vertikal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="card-horizontal">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-6 bg-white border-2 border-gray-300 rounded"></div>
                        <span>Card Horizontal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="card-product">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-8 bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-200 rounded"></div>
                        <span>Card Produk (dengan harga)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih style tampilan button - Card cocok untuk produk/course
                </p>
              </div>

              {/* Font Size Settings - Untuk semua style */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h4 className="font-bold text-sm text-blue-900">Pengaturan Ukuran Teks</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="titleSize" className="text-xs mb-2 block font-semibold">
                      {ctaFormData.buttonStyle === 'button' ? 'Teks Button' : 'Judul'}
                    </Label>
                    <Select
                      value={ctaFormData.titleSize || 'sm'}
                      onValueChange={(value) => setCtaFormData({ ...ctaFormData, titleSize: value })}
                    >
                      <SelectTrigger className="h-10 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xs">
                          <span className="text-xs">Kecil (XS)</span>
                        </SelectItem>
                        <SelectItem value="sm">
                          <span className="text-sm">Sedang (SM)</span>
                        </SelectItem>
                        <SelectItem value="base">
                          <span className="text-base">Besar (BASE)</span>
                        </SelectItem>
                        <SelectItem value="lg">
                          <span className="text-lg">XL (LG)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ctaFormData.buttonStyle !== 'button' && (
                    <>
                      <div>
                        <Label htmlFor="subtitleSize" className="text-xs mb-2 block font-semibold">Subtitle</Label>
                        <Select
                          value={ctaFormData.subtitleSize || 'xs'}
                          onValueChange={(value) => setCtaFormData({ ...ctaFormData, subtitleSize: value })}
                        >
                          <SelectTrigger className="h-10 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">
                              <span className="text-xs">Kecil (XS)</span>
                            </SelectItem>
                            <SelectItem value="sm">
                              <span className="text-sm">Sedang (SM)</span>
                            </SelectItem>
                            <SelectItem value="base">
                              <span className="text-base">Besar (BASE)</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="buttonTextSize" className="text-xs mb-2 block font-semibold">Tombol</Label>
                        <Select
                          value={ctaFormData.buttonTextSize || 'sm'}
                          onValueChange={(value) => setCtaFormData({ ...ctaFormData, buttonTextSize: value })}
                        >
                          <SelectTrigger className="h-10 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">
                              <span className="text-xs">Kecil (XS)</span>
                            </SelectItem>
                            <SelectItem value="sm">
                              <span className="text-sm">Sedang (SM)</span>
                            </SelectItem>
                            <SelectItem value="base">
                              <span className="text-base">Besar (BASE)</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 {ctaFormData.buttonStyle === 'button' ? 'Atur ukuran teks button' : 'Atur ukuran judul, subtitle, dan tombol'}
                </p>
              </div>

              {/* Show additional fields for card styles */}
              {ctaFormData.buttonStyle !== 'button' && (
                <>
                  <div>
                    <Label htmlFor="subtitle" className="text-sm mb-2 block">Subtitle / Deskripsi Singkat</Label>
                    <Input
                      id="subtitle"
                      value={ctaFormData.subtitle}
                      onChange={(e) => setCtaFormData({ ...ctaFormData, subtitle: e.target.value })}
                      placeholder="Contoh: Kelas lengkap untuk pemula"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="thumbnailUrl" className="text-sm mb-2 block">URL Gambar Thumbnail</Label>
                    <Input
                      id="thumbnailUrl"
                      value={ctaFormData.thumbnailUrl}
                      onChange={(e) => setCtaFormData({ ...ctaFormData, thumbnailUrl: e.target.value })}
                      placeholder="https://..."
                      className="h-11"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={ctaFormData.showThumbnail}
                        onCheckedChange={(checked) => setCtaFormData({ ...ctaFormData, showThumbnail: checked })}
                      />
                      <Label className="text-xs">Tampilkan gambar thumbnail</Label>
                    </div>
                  </div>

                  {ctaFormData.buttonStyle === 'card-product' && (
                    <>
                      <div>
                        <Label htmlFor="price" className="text-sm mb-2 block">Harga</Label>
                        <Input
                          id="price"
                          value={ctaFormData.price}
                          onChange={(e) => setCtaFormData({ ...ctaFormData, price: e.target.value })}
                          placeholder="Rp 299.000"
                          className="h-11"
                        />
                      </div>

                      <div>
                        <Label htmlFor="originalPrice" className="text-sm mb-2 block">Harga Coret (opsional)</Label>
                        <Input
                          id="originalPrice"
                          value={ctaFormData.originalPrice}
                          onChange={(e) => setCtaFormData({ ...ctaFormData, originalPrice: e.target.value })}
                          placeholder="Rp 499.000"
                          className="h-11"
                        />
                        <p className="text-xs text-gray-500 mt-1">Untuk menampilkan diskon</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ctaFormData.showPrice}
                          onCheckedChange={(checked) => setCtaFormData({ ...ctaFormData, showPrice: checked })}
                        />
                        <Label className="text-xs">Tampilkan harga di card</Label>
                      </div>
                    </>
                  )}
                </>
              )}

              {ctaFormData.buttonType === 'custom' && (
                <div>
                  <Label htmlFor="customUrl" className="text-sm mb-2 block">Custom URL</Label>
                  <Input
                    id="customUrl"
                    value={ctaFormData.customUrl}
                    onChange={(e) => setCtaFormData({ ...ctaFormData, customUrl: e.target.value })}
                    placeholder="https://..."
                    className="h-11"
                  />
                </div>
              )}

              {ctaFormData.buttonType === 'membership' && (
                <div>
                  <Label htmlFor="membershipId" className="text-sm mb-2 block">Pilih Membership *</Label>
                  {loadingDropdowns ? (
                    <div className="h-11 bg-gray-100 rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={ctaFormData.membershipId}
                      onValueChange={(value) => {
                        setCtaFormData({ ...ctaFormData, membershipId: value })
                        autoPopulateFromItem('membership', value)
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih membership..." />
                      </SelectTrigger>
                      <SelectContent>
                        {memberships.length > 0 ? (
                          memberships.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">Tidak ada membership tersedia</div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {ctaFormData.buttonType === 'product' && (
                <div>
                  <Label htmlFor="productId" className="text-sm mb-2 block">Pilih Produk *</Label>
                  {loadingDropdowns ? (
                    <div className="h-11 bg-gray-100 rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={ctaFormData.productId}
                      onValueChange={(value) => {
                        setCtaFormData({ ...ctaFormData, productId: value })
                        autoPopulateFromItem('product', value)
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih produk..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length > 0 ? (
                          products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">Tidak ada produk tersedia</div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {ctaFormData.buttonType === 'course' && (
                <div>
                  <Label htmlFor="courseId" className="text-sm mb-2 block">Pilih Kursus *</Label>
                  {loadingDropdowns ? (
                    <div className="h-11 bg-gray-100 rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={ctaFormData.courseId}
                      onValueChange={(value) => {
                        setCtaFormData({ ...ctaFormData, courseId: value })
                        autoPopulateFromItem('course', value)
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih kursus..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.length > 0 ? (
                          courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">Tidak ada kursus tersedia</div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {ctaFormData.buttonType === 'event' && (
                <div>
                  <Label htmlFor="eventId" className="text-sm mb-2 block">Pilih Event *</Label>
                  {loadingDropdowns ? (
                    <div className="h-11 bg-gray-100 rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={ctaFormData.courseId}
                      onValueChange={(value) => {
                        setCtaFormData({ ...ctaFormData, courseId: value })
                        autoPopulateFromItem('event', value)
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih event..." />
                      </SelectTrigger>
                      <SelectContent>
                        {events.length > 0 ? (
                          events.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">Tidak ada event tersedia</div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {ctaFormData.buttonType === 'optin' && (
                <>
                  <div>
                    <Label htmlFor="optinFormId" className="text-sm mb-2 block">Pilih Optin Form *</Label>
                    {(() => {
                      console.log('🎯 Rendering Optin Form section')
                      console.log('📋 loadingDropdowns:', loadingDropdowns)
                      console.log('📋 optinForms:', optinForms)
                      console.log('📋 optinForms.length:', optinForms.length)
                      return null
                    })()}
                    {loadingDropdowns ? (
                      <div className="h-11 bg-gray-100 rounded-md flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <Select
                        value={ctaFormData.optinFormId}
                        onValueChange={(value) => setCtaFormData({ ...ctaFormData, optinFormId: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih optin form..." />
                        </SelectTrigger>
                        <SelectContent>
                          {optinForms.length > 0 ? (
                            optinForms.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.formName}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-500">Tidak ada optin form tersedia</div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="optinDisplayMode" className="text-sm mb-2 block">
                      Mode Tampilan Form *
                    </Label>
                    <Select
                      value={ctaFormData.optinDisplayMode}
                      onValueChange={(value) => setCtaFormData({ ...ctaFormData, optinDisplayMode: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="button">
                          <div className="flex flex-col">
                            <span className="font-medium">Button / Modal</span>
                            <span className="text-xs text-gray-500">Klik button untuk buka popup form</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="inline">
                          <div className="flex flex-col">
                            <span className="font-medium">Inline / Embed</span>
                            <span className="text-xs text-gray-500">Form langsung tampil di bio page</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bgColor" className="text-sm mb-2 block">Warna Button</Label>
                  <Input
                    id="bgColor"
                    type="color"
                    value={ctaFormData.backgroundColor}
                    onChange={(e) => setCtaFormData({ ...ctaFormData, backgroundColor: e.target.value })}
                    className="h-12 cursor-pointer"
                  />
                </div>

                <div>
                  <Label htmlFor="textColor" className="text-sm mb-2 block">Warna Teks</Label>
                  <Input
                    id="textColor"
                    type="color"
                    value={ctaFormData.textColor}
                    onChange={(e) => setCtaFormData({ ...ctaFormData, textColor: e.target.value })}
                    className="h-12 cursor-pointer"
                  />
                </div>
              </div>

              <div className="px-4 py-4 bg-gray-50 rounded-lg">
                <button
                  style={{
                    backgroundColor: ctaFormData.backgroundColor,
                    color: ctaFormData.textColor
                  }}
                  className="w-full py-3 px-6 rounded-lg font-medium"
                >
                  {ctaFormData.buttonText || 'Preview Button'}
                </button>
              </div>
            </div>

            <DialogFooter className="gap-3 px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-purple-50 sticky bottom-0">
              <Button variant="outline" onClick={() => setShowCTAModal(false)} className="flex-1 h-11 border-purple-200 hover:bg-purple-50">
                Batal
              </Button>
              <Button onClick={handleSaveCTA} disabled={saving} className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingCTA} onOpenChange={() => setDeletingCTA(null)}>
          <AlertDialogContent className="shadow-xl border-red-100">
            <AlertDialogHeader className="bg-gradient-to-r from-red-50 to-orange-50 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-red-100">
              <AlertDialogTitle className="text-red-900">Hapus CTA Button?</AlertDialogTitle>
              <AlertDialogDescription className="text-red-700">
                Apakah Anda yakin ingin menghapus CTA Button ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingCTA && handleDeleteCTA(deletingCTA)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-md"
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