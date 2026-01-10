'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle, Plus, Edit, Trash2, Eye, RefreshCw, Upload, Link, Package, Users, GraduationCap, X, Check, Info, Bell, Send } from 'lucide-react'
import { toast } from 'sonner'
import { FileUpload } from '@/components/ui/file-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import MailketingListSelector from '@/components/admin/MailketingListSelector'

type MembershipStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface MembershipPlan {
  id: string
  name: string
  slug: string
  description: string | null
  formLogo: string | null
  formBanner: string | null
  prices: any
  isPopular: boolean
  salespage: string | null
  followUpMessages: any
  affiliateCommission: number
  isActive: boolean
  status: MembershipStatus
  _count: {
    userMemberships: number
    membershipGroups: number
    membershipCourses: number
    membershipProducts: number
  }
  createdAt: string
}

interface FollowUpMessage {
  title: string
  message: string
}

interface PriceOption {
  duration: 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME'
  label: string // Display name: "6 Bulan", "12 Bulan", "Lifetime"
  price: number
  discount?: number
  pricePerMonth?: number // Auto-calculated harga per bulan
  benefits: string[] // List benefit untuk paket ini
  badge?: string // "Hemat 10%", "Hemat 25%", dst
  isPopular?: boolean // Badge "Paling Laris"
}

export default function MembershipPlansPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    salespage: '',
    isPopular: false,
    affiliateCommission: 0.30,
    isActive: true,
    mailketingListId: null as string | null,
    mailketingListName: null as string | null,
    autoAddToList: true,
    autoRemoveOnExpire: false
  })
  
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
  
  const [prices, setPrices] = useState<PriceOption[]>([
    { 
      duration: 'SIX_MONTHS', 
      label: 'Membership 6 Bulan',
      price: 0,
      benefits: [],
      badge: '',
      isPopular: false
    }
  ])
  
  const [followUps, setFollowUps] = useState<FollowUpMessage[]>([
    { title: '', message: '' }
  ])
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [availableGroups, setAvailableGroups] = useState<any[]>([])
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)

  useEffect(() => {
    fetchPlans()
    fetchAvailableResources()
  }, [])

  const fetchAvailableResources = async () => {
    try {
      // Fetch groups
      const groupsRes = await fetch('/api/admin/groups')
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setAvailableGroups(groupsData.groups || [])
      }

      // Fetch courses
      const coursesRes = await fetch('/api/admin/courses')
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setAvailableCourses(coursesData.courses || [])
      }

      // Fetch products
      const productsRes = await fetch('/api/admin/products')
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setAvailableProducts(productsData.products || [])
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/membership-plans')
      if (response.ok) {
        const data = await response.json()
        // Debug: Log status field for each plan
        console.log('=== Plans Status Debug ===')
        data.plans?.forEach((p: any) => {
          console.log(`${p.name}: status=${p.status}`)
        })
        // Filter out Member Free - this is a default role, not a sellable membership
        const filteredPlans = (data.plans || []).filter((p: any) => 
          p.slug !== 'member-free'
        )
        setPlans(filteredPlans)
      } else {
        toast.error('Gagal memuat paket membership')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to load membership plans')
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditMode(false)
    setSelectedPlan(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = async (plan: MembershipPlan) => {
    setEditMode(true)
    setSelectedPlan(plan)
    
    // Set commission type based on value
    const commValue = plan.affiliateCommission || 0.30
    setCommissionType(commValue < 1 ? 'PERCENTAGE' : 'FLAT')
    
    setFormData({
      name: plan.name,
      description: plan.description || '',
      logo: plan.formLogo || '',
      banner: plan.formBanner || '',
      isPopular: plan.isPopular,
      salespage: plan.salespage || '',
      affiliateCommission: commValue,
      isActive: plan.isActive,
      mailketingListId: (plan as any).mailketingListId || null,
      mailketingListName: (plan as any).mailketingListName || null,
      autoAddToList: (plan as any).autoAddToList !== false,
      autoRemoveOnExpire: (plan as any).autoRemoveOnExpire || false
    })
    
    // Properly handle prices with default values to avoid NaN errors
    if (Array.isArray(plan.prices) && plan.prices.length > 0) {
      setPrices(plan.prices.map(p => ({
        duration: p.duration || 'SIX_MONTHS',
        label: p.label || getDurationLabel(p.duration || 'SIX_MONTHS'),
        price: typeof p.price === 'number' ? p.price : parseFloat(p.price || '0'),
        discount: p.discount,
        pricePerMonth: p.pricePerMonth,
        benefits: p.benefits || [],
        badge: p.badge || '',
        isPopular: p.isPopular || false
      })))
    } else {
      setPrices([{ 
        duration: 'SIX_MONTHS',
        label: 'Membership 6 Bulan',
        price: 0,
        benefits: [],
        badge: '',
        isPopular: false
      }])
    }
    
    setFollowUps(Array.isArray(plan.followUpMessages) ? plan.followUpMessages : [{ title: '', message: '' }])
    
    // Load existing relations from API
    try {
      const response = await fetch(`/api/admin/membership-plans/${plan.id}`)
      if (response.ok) {
        const { plan: detailedPlan } = await response.json()
        
        // Extract IDs from relations
        const groupIds = detailedPlan.membershipGroups?.map((mg: any) => mg.groupId) || []
        const courseIds = detailedPlan.membershipCourses?.map((mc: any) => mc.courseId) || []
        const productIds = detailedPlan.membershipProducts?.map((mp: any) => mp.productId) || []
        
        setSelectedGroups(groupIds)
        setSelectedCourses(courseIds)
        setSelectedProducts(productIds)
      }
    } catch (error) {
      console.error('Error loading plan details:', error)
    }
    
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditMode(false)
    setSelectedPlan(null)
    resetForm()
    setLogoFile(null)
    setBannerFile(null)
    setSelectedGroups([])
    setSelectedCourses([])
    setSelectedProducts([])
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logo: '',
      banner: '',
      salespage: '',
      isPopular: false,
      affiliateCommission: 0.30,
      isActive: true,
      mailketingListId: null,
      mailketingListName: null,
      autoAddToList: true,
      autoRemoveOnExpire: false
    })
    setPrices([{ 
      duration: 'SIX_MONTHS',
      label: '6 Bulan',
      price: 0,
      benefits: [],
      badge: '',
      isPopular: false
    }])
    setFollowUps([{ title: '', message: '' }])
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama paket wajib diisi')
      return
    }

    // Skip price validation for Pro (checkout umum)
    const isPro = selectedPlan?.slug === 'pro' || formData.name.toLowerCase().includes('pro')
    if (!isPro && (prices.length === 0 || prices.some(p => p.price <= 0))) {
      toast.error('Mohon tambahkan minimal satu harga yang valid')
      return
    }

    try {
      const url = editMode ? `/api/admin/membership-plans/${selectedPlan?.id}` : '/api/admin/membership-plans'
      const method = editMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          prices: isPro ? [] : prices.filter(p => p.price > 0),
          followUpMessages: followUps.filter(f => f.message.trim()),
          groups: selectedGroups,
          courses: selectedCourses,
          products: selectedProducts
        })
      })

      if (response.ok) {
        toast.success(`Paket membership berhasil ${editMode ? 'diperbarui' : 'dibuat'}`)
        setDialogOpen(false)
        fetchPlans()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menyimpan paket membership')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Gagal menyimpan paket membership')
    }
  }

  const handleDelete = async (id: string) => {
    const plan = plans.find(p => p.id === id)
    if (!plan) return

    // Build detailed warning message
    const warnings: string[] = []
    if (plan._count.userMemberships > 0) {
      warnings.push(`${plan._count.userMemberships} anggota aktif`)
    }
    if (plan._count.membershipGroups > 0) {
      warnings.push(`${plan._count.membershipGroups} grup terkait`)
    }
    if (plan._count.membershipCourses > 0) {
      warnings.push(`${plan._count.membershipCourses} kursus terkait`)
    }
    if (plan._count.membershipProducts > 0) {
      warnings.push(`${plan._count.membershipProducts} produk terkait`)
    }

    let confirmMessage = `⚠️ HAPUS PAKET: ${plan.name}\n\n`
    
    if (warnings.length > 0) {
      confirmMessage += `❌ TIDAK BISA DIHAPUS!\n\nPaket ini terhubung dengan:\n${warnings.map(w => `• ${w}`).join('\n')}\n\n`
      confirmMessage += `💡 Saran: Nonaktifkan paket ini daripada menghapusnya untuk menjaga integritas data.`
      
      alert(confirmMessage)
      return
    } else {
      confirmMessage += `✅ Paket ini aman untuk dihapus (tidak ada data terkait).\n\n`
      confirmMessage += `Apakah Anda yakin ingin menghapus paket ini?\n\n`
      confirmMessage += `⚠️ Tindakan ini TIDAK DAPAT DIBATALKAN!`
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/membership-plans/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Paket membership berhasil dihapus')
        fetchPlans()
      } else {
        // Show detailed error from backend
        const errorMsg = data.details 
          ? `${data.error}\n\n${data.details}\n\n${data.suggestion || ''}`
          : data.error || 'Gagal menghapus paket membership'
        
        toast.error(errorMsg, { duration: 6000 })
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Gagal menghapus paket membership')
    }
  }

  const addPrice = () => {
    setPrices([...prices, { 
      duration: 'SIX_MONTHS', 
      label: 'Membership 6 Bulan',
      price: 0,
      benefits: [],
      badge: '',
      isPopular: false
    }])
  }

  const removePrice = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index))
  }

  const updatePrice = (index: number, field: string, value: any) => {
    const newPrices = [...prices]
    newPrices[index] = { ...newPrices[index], [field]: value }
    
    // Auto-calculate pricePerMonth if not lifetime
    if (field === 'price' || field === 'duration') {
      const p = newPrices[index]
      if (p.duration !== 'LIFETIME') {
        const months = p.duration === 'SIX_MONTHS' ? 6 : 12
        p.pricePerMonth = Math.round(p.price / months)
      }
    }
    
    setPrices(newPrices)
  }

  const addFollowUp = () => {
    setFollowUps([...followUps, { title: '', message: '' }])
  }

  const removeFollowUp = (index: number) => {
    setFollowUps(followUps.filter((_, i) => i !== index))
  }

  const updateFollowUp = (index: number, field: 'title' | 'message', value: any) => {
    const newFollowUps = [...followUps]
    newFollowUps[index] = { ...newFollowUps[index], [field]: value }
    setFollowUps(newFollowUps)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      'SIX_MONTHS': 'Membership 6 Bulan',
      'TWELVE_MONTHS': 'Membership 12 Bulan',
      'LIFETIME': 'Membership Selamanya',
      // Support for imported Sejoli tiers
      '6_MONTH': 'Membership 6 Bulan',
      '12_MONTH': 'Membership 12 Bulan',
      'FREE': 'Membership Gratis'
    }
    return labels[duration] || `Membership ${duration}`
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat paket membership...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paket Membership</h1>
          <p className="text-gray-600">Buat dan kelola paket membership</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.open('/checkout/pro', '_blank')} 
            variant="outline" 
            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Package className="h-4 w-4" />
            Lihat Checkout Umum
          </Button>
          <Button onClick={fetchPlans} variant="outline" className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
          <Button onClick={() => window.location.href = '/admin/membership-plans/create'} className="gap-2 btn-primary">
            <Plus className="h-4 w-4" />
            Buat Paket
          </Button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Paket Membership ({plans.length})</h2>
          <p className="text-sm text-gray-600">
            All membership packages and their configurations
          </p>
        </div>
        <div className="p-6">
          {/* Pro Checkout Info Banner */}
          {plans.some(p => p.slug === 'pro') && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    🎉 Pro Checkout - Kumpulan Semua Paket
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Paket "Pro" menampilkan semua membership aktif dalam satu halaman checkout. 
                    User dapat membandingkan fitur dan memilih paket yang sesuai.
                  </p>
                  <Button 
                    onClick={() => window.open('/checkout/pro', '_blank')}
                    size="sm"
                    className="btn-primary"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Buka Pro Checkout
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Paket Membership</TableHead>
                <TableHead>Transaksi</TableHead>
                <TableHead>Fitur</TableHead>
                <TableHead>Marketing</TableHead>
                <TableHead>Link Checkout</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {plan.formLogo && (
                        <img src={plan.formLogo} alt={plan.name} className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {plan.slug === 'pro' && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-purple-500 text-white text-xs">
                              Checkout Umum
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{plan.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.slug === 'pro' ? (
                      <div className="text-sm text-blue-600 font-medium">Checkout Umum</div>
                    ) : Array.isArray(plan.prices) && plan.prices.length > 0 ? (
                      <div className="space-y-1">
                        {plan.prices.slice(0, 2).map((price: PriceOption, i: number) => (
                          <div key={i} className="flex flex-col">
                            <span className="font-medium text-gray-800 text-sm">
                              {getDurationLabel(price.duration)}
                            </span>
                            <span className="text-blue-600 text-xs font-semibold">
                              {formatCurrency(price.price)}
                            </span>
                          </div>
                        ))}
                        {plan.prices.length > 2 && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            +{plan.prices.length - 2} paket lainnya
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Tidak ada harga</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(plan as any)._count?.userMemberships > 0 ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              {(plan as any)._count.userMemberships} Member
                            </Badge>
                          </div>
                          {(plan as any).userMemberships?.[0]?.transaction?.createdAt && (
                            <div className="text-xs text-gray-500">
                              Terakhir: {new Date((plan as any).userMemberships[0].transaction.createdAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Belum ada member</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {plan._count.membershipGroups > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {plan._count.membershipGroups} Grup
                        </Badge>
                      )}
                      {plan._count.membershipCourses > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {plan._count.membershipCourses} Kelas
                        </Badge>
                      )}
                      {plan._count.membershipProducts > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Package className="h-3 w-3" />
                          {plan._count.membershipProducts} Produk
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center flex-wrap">
                      {plan.isPopular && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">Paling Laris</Badge>
                      )}
                      {plan.prices && Array.isArray(plan.prices) && plan.prices.length > 0 && plan.prices[0].benefits && plan.prices[0].benefits.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 hover:bg-gray-100"
                            >
                              <Info className="h-4 w-4 text-blue-600" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Fitur & Benefit</h4>
                              <div className="space-y-1">
                                {plan.prices[0].benefits.map((benefit: string, i: number) => (
                                  <div key={i} className="flex gap-2 items-start text-sm">
                                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{benefit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      {plan.salespage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(plan.salespage, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          <Link className="h-3 w-3" />
                          Salespage
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {plan.slug === 'pro' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            const checkoutUrl = `${window.location.origin}/checkout/pro`
                            navigator.clipboard.writeText(checkoutUrl)
                            toast.success('Link checkout umum berhasil disalin!')
                          }}
                        >
                          <Link className="h-3 w-3" />
                          /checkout/pro
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            const checkoutUrl = `${window.location.origin}/checkout/${plan.slug || plan.id}`
                            navigator.clipboard.writeText(checkoutUrl)
                            toast.success('Link checkout berhasil disalin!')
                          }}
                        >
                          <Link className="h-3 w-3" />
                          /checkout/{plan.slug || plan.id}
                        </Button>
                      )}
                      {plan.slug !== 'pro' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-2 w-full text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            const checkoutProUrl = `${window.location.origin}/checkout/pro?plan=${plan.id}`
                            navigator.clipboard.writeText(checkoutProUrl)
                            toast.success('Link checkout/pro berhasil disalin!')
                          }}
                        >
                          <Link className="h-3 w-3" />
                          Di /checkout/pro
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {plan._count.userMemberships} pengguna
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      (plan.status || 'PUBLISHED') === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-300' :
                      (plan.status || 'PUBLISHED') === 'DRAFT' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      'bg-gray-100 text-gray-800 border border-gray-300'
                    }>
                      {(plan.status || 'PUBLISHED') === 'PUBLISHED' ? '✅ PUBLISHED' :
                       (plan.status || 'PUBLISHED') === 'DRAFT' ? '📝 DRAFT' :
                       '📦 ARCHIVED'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/membership-plans/${plan.id}/edit`)}
                        title="Edit Plan"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/membership-plans/${plan.id}/reminders`}
                        title="Kelola Reminders"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/membership-plans/${plan.id}/follow-ups`}
                        title="Kelola Follow Up"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/memberships/${plan.id}/courses`}
                        title="Kelola Kursus"
                      >
                        <GraduationCap className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        disabled={plan._count.userMemberships > 0}
                        title="Hapus Plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {plans.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No membership plans found. Create your first plan to get started.
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
