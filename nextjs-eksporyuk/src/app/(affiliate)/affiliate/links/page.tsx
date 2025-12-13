'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import toast from 'react-hot-toast'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { 
  Copy, Check, Share2, ExternalLink, TrendingUp, Users, DollarSign, 
  Archive, ArchiveRestore, Link2, Package, BookOpen, Crown, Truck,
  Search, RefreshCw, Plus, Eye, EyeOff, Ticket
} from 'lucide-react'

// Types
interface AffiliateLink {
  id: string
  code: string
  url: string
  linkType?: string
  targetType?: string
  targetName?: string
  clicks: number
  conversions: number
  revenue: number
  isArchived: boolean
  createdAt: string
  membership?: { id: string; name: string; slug: string }
  product?: { id: string; name: string; slug: string }
  course?: { id: string; title: string }
  supplier?: { id: string; companyName: string; province: string; city: string }
  couponCode?: string
}

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  isOwnCoupon: boolean
  source: 'affiliate' | 'admin'
  membershipIds?: string[]
  productIds?: string[]
  courseIds?: string[]
}

// Tab Types
type MainTabType = 'list' | 'create'
type FilterTabType = 'all' | 'membership' | 'product' | 'course' | 'supplier' | 'event'

// Main Tabs
const MAIN_TABS: { key: MainTabType; label: string; icon: any }[] = [
  { key: 'list', label: 'Semua Link', icon: Link2 },
  { key: 'create', label: 'Buat Link Baru', icon: Plus },
]

// Filter Tabs
const FILTER_TABS: { key: FilterTabType; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'Semua', icon: Link2, color: 'text-gray-600' },
  { key: 'membership', label: 'Membership', icon: Crown, color: 'text-amber-600' },
  { key: 'product', label: 'Produk', icon: Package, color: 'text-blue-600' },
  { key: 'course', label: 'Kelas', icon: BookOpen, color: 'text-green-600' },
  { key: 'supplier', label: 'Supplier', icon: Truck, color: 'text-purple-600' },
  { key: 'event', label: 'Event', icon: BookOpen, color: 'text-red-600' },
]

export default function AffiliateLinksPage() {
  const { data: session, status } = useSession()
  
  // State
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [generatingCouponForLink, setGeneratingCouponForLink] = useState<string | null>(null)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [selectedLinkForCoupon, setSelectedLinkForCoupon] = useState<AffiliateLink | null>(null)
  const [selectedCouponForLink, setSelectedCouponForLink] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mainTab, setMainTab] = useState<MainTabType>('list')
  const [filterTab, setFilterTab] = useState<FilterTabType>('all')
  
  // Form state
  const [selectedLinkType, setSelectedLinkType] = useState<'CHECKOUT' | 'SALESPAGE_INTERNAL' | 'SALESPAGE_EXTERNAL'>('CHECKOUT')
  const [selectedTargetType, setSelectedTargetType] = useState<'membership' | 'product' | 'course' | 'supplier' | 'event'>('membership')
  const [selectedTargetId, setSelectedTargetId] = useState('')
  const [selectedCouponCode, setSelectedCouponCode] = useState('')
  const [selectedCouponId, setSelectedCouponId] = useState('')
  
  // Data state
  const [memberships, setMemberships] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [affiliateCoupons, setAffiliateCoupons] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }

    if (status === 'authenticated') {
      fetchAllData()
    }
  }, [status, showArchived])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchLinks(),
      fetchMemberships(),
      fetchProducts(),
      fetchCourses(),
      fetchSuppliers(),
      fetchCoupons(),
      fetchAffiliateCoupons()
    ])
    setLoading(false)
  }

  const fetchLinks = async () => {
    try {
      const url = showArchived 
        ? '/api/affiliate/links?archived=true' 
        : '/api/affiliate/links'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.links) {
        const enrichedLinks = data.links.map((link: any) => ({
          ...link,
          targetType: link.membership ? 'membership' : link.product ? 'product' : link.course ? 'course' : link.supplier ? 'supplier' : 'general',
          targetName: link.membership?.name || link.product?.name || link.course?.title || link.supplier?.companyName || 'Semua Produk'
        }))
        setLinks(enrichedLinks)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
      toast.error('Gagal memuat link')
    }
  }

  const fetchMemberships = async () => {
    try {
      const response = await fetch('/api/memberships/packages')
      const data = await response.json()
      if (data.packages) setMemberships(data.packages)
    } catch (error) {
      console.error('Error fetching memberships:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.products) setProducts(data.products)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?includeAll=true')
      const data = await response.json()
      if (data.courses) setCourses(data.courses.filter((c: any) => c.isPublished))
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?verified=true')
      const data = await response.json()
      if (data.suppliers) setSuppliers(data.suppliers)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/affiliate/coupons/all')
      const data = await response.json()
      if (data.coupons) setCoupons(data.coupons)
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const fetchAffiliateCoupons = async () => {
    try {
      const response = await fetch('/api/affiliate/coupons')
      const data = await response.json()
      if (data.coupons) setAffiliateCoupons(data.coupons)
    } catch (error) {
      console.error('Error fetching affiliate coupons:', error)
    }
  }

  // Filter available coupons based on selected target type and target id
  const availableCoupons = useMemo(() => {
    if (!selectedTargetType) return []
    
    return coupons.filter(coupon => {
      if (selectedTargetType === 'membership') {
        const ids = coupon.membershipIds || []
        // If no membershipIds (empty array or null), coupon applies to ALL memberships
        if (!ids || ids.length === 0) return true
        // If targetId is selected, check if coupon applies to that specific membership
        if (selectedTargetId) return ids.includes(selectedTargetId)
        // If no targetId selected (generating for all), show all membership coupons
        return true
      }
      if (selectedTargetType === 'product') {
        const ids = coupon.productIds || []
        if (!ids || ids.length === 0) return true
        if (selectedTargetId) return ids.includes(selectedTargetId)
        return true
      }
      if (selectedTargetType === 'course') {
        const ids = coupon.courseIds || []
        if (!ids || ids.length === 0) return true
        if (selectedTargetId) return ids.includes(selectedTargetId)
        return true
      }
      if (selectedTargetType === 'supplier') {
        // Suppliers don't have specific coupon targeting yet
        return true
      }
      
      return false
    })
  }, [coupons, selectedTargetType, selectedTargetId])

  // Filter links
  const filteredLinks = useMemo(() => {
    let filtered = links

    if (filterTab !== 'all') {
      filtered = filtered.filter(link => {
        if (filterTab === 'membership') return link.membership || link.targetType === 'membership'
        if (filterTab === 'product') return link.product || link.targetType === 'product'
        if (filterTab === 'course') return link.course || link.targetType === 'course'
        if (filterTab === 'supplier') return link.targetType === 'supplier'
        return true
      })
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(link => 
        link.code.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query) ||
        link.targetName?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [links, filterTab, searchQuery])

  // Stats
  const tabStats = useMemo(() => {
    const stats: Record<FilterTabType, { count: number; clicks: number; conversions: number }> = {
      all: { count: links.length, clicks: 0, conversions: 0 },
      membership: { count: 0, clicks: 0, conversions: 0 },
      product: { count: 0, clicks: 0, conversions: 0 },
      course: { count: 0, clicks: 0, conversions: 0 },
      supplier: { count: 0, clicks: 0, conversions: 0 },
      event: { count: 0, clicks: 0, conversions: 0 },
    }

    links.forEach(link => {
      stats.all.clicks += link.clicks
      stats.all.conversions += link.conversions

      if (link.membership || link.targetType === 'membership') {
        stats.membership.count++
        stats.membership.clicks += link.clicks
        stats.membership.conversions += link.conversions
      } else if (link.product || link.targetType === 'product') {
        stats.product.count++
        stats.product.clicks += link.clicks
        stats.product.conversions += link.conversions
      } else if (link.course || link.targetType === 'course') {
        stats.course.count++
        stats.course.clicks += link.clicks
        stats.course.conversions += link.conversions
      } else if (link.targetType === 'supplier') {
        stats.supplier.count++
        stats.supplier.clicks += link.clicks
        stats.supplier.conversions += link.conversions
      }
    })

    return stats
  }, [links])

  const generateNewLink = async () => {
    if (!selectedCouponCode) {
      toast.error('Pilih kupon terlebih dahulu')
      return
    }

    setGenerating(true)
    try {
      const payload = {
        linkType: selectedLinkType,
        targetType: selectedTargetType,
        targetId: selectedTargetId || null,
        couponCode: selectedCouponCode,
      }
      
      console.log('🚀 Sending generate link request:', payload)
      
      const response = await fetch('/api/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      console.log('📡 Response status:', response.status)
      
      const data = await response.json()
      
      console.log('📦 Response data:', data)
      
      if (data.link) {
        await fetchLinks()
        setMainTab('list')
        resetForm()
        toast.success('Link berhasil dibuat!')
        
        navigator.clipboard.writeText(data.link.url)
        toast.success('Link sudah dicopy ke clipboard!')
      } else if (data.error) {
        console.error('❌ API Error:', data.error)
        toast.error(data.error)
      }
    } catch (error) {
      console.error('❌ Error generating link:', error)
      toast.error('Gagal membuat link')
    } finally {
      setGenerating(false)
    }
  }

  const resetForm = () => {
    setSelectedLinkType('CHECKOUT')
    setSelectedTargetType('membership')
    setSelectedTargetId('')
    setSelectedCouponCode('')
    setSelectedCouponId('')
  }

  // New function for the redesigned smart generator
  const handleGenerateLinks = async () => {
    if (!selectedTargetType) {
      toast.error('Pilih tipe produk terlebih dahulu!')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/affiliate/links/smart-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: selectedTargetType,
          targetId: selectedTargetId || null, // null = generate for all products of this type
          couponId: selectedCouponId || null, // Selected coupon by affiliate
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchLinks() // Refresh the links list
        setMainTab('list')
        resetForm()
        
        if (data.note) {
          toast.error(data.note, { duration: 5000 })
        }
        
        toast.success(`🎉 Berhasil generate ${data.linksCreated} link affiliate!`)
        
        // Show summary of what was generated
        if (data.linksCreated > 0) {
          setTimeout(() => {
            const couponInfo = data.couponUsed ? `Kupon: ${data.couponUsed}` : 'Tanpa Kupon'
            toast.success(`✅ Sales Page: ${data.salesPageLinks || 0} | Checkout: ${data.checkoutLinks || 0} | ${couponInfo}`)
          }, 1000)
        }
      } else if (data.error) {
        console.error('❌ API Error:', data.error)
        toast.error(data.error)
      }
    } catch (error) {
      console.error('❌ Error generating links:', error)
      toast.error('Gagal generate link')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      toast.success('Link dicopy!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('Gagal copy link')
    }
  }

  const toggleArchiveLink = async (linkId: string, currentStatus: boolean) => {
    setArchivingId(linkId)
    try {
      const response = await fetch(`/api/affiliate/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentStatus }),
      })
      
      if (response.ok) {
        await fetchLinks()
        toast.success(currentStatus ? 'Link dipulihkan' : 'Link diarsipkan')
      }
    } catch (error) {
      toast.error('Gagal mengubah status link')
    } finally {
      setArchivingId(null)
    }
  }

  const quickGenerateCoupon = async (link: AffiliateLink) => {
    // Check if affiliate has any coupons (from all coupons including admin)
    if (coupons.length === 0) {
      toast.error('Belum ada kupon tersedia. Hubungi admin untuk membuat kupon.')
      return
    }
    
    // Filter coupons applicable to this link's target
    let applicableCoupons = coupons
    
    if (link.membership) {
      applicableCoupons = coupons.filter(coupon => {
        const ids = coupon.membershipIds || []
        return ids.length === 0 || ids.includes(link.membership.id)
      })
    } else if (link.product) {
      applicableCoupons = coupons.filter(coupon => {
        const ids = coupon.productIds || []
        return ids.length === 0 || ids.includes(link.product.id)
      })
    } else if (link.course) {
      applicableCoupons = coupons.filter(coupon => {
        const ids = coupon.courseIds || []
        return ids.length === 0 || ids.includes(link.course.id)
      })
    }
    
    if (applicableCoupons.length === 0) {
      toast.error('Tidak ada kupon yang berlaku untuk link ini')
      return
    }
    
    // Show modal with applicable coupons
    setSelectedLinkForCoupon(link)
    setSelectedCouponForLink('')
    setShowCouponModal(true)
  }

  const attachCouponToLink = async () => {
    if (!selectedCouponForLink || !selectedLinkForCoupon) {
      toast.error('Pilih kupon terlebih dahulu')
      return
    }

    setGeneratingCouponForLink(selectedLinkForCoupon.id)
    try {
      // Get selected coupon from all available coupons (including admin coupons)
      const selectedCoupon = coupons.find(c => c.id === selectedCouponForLink)
      if (!selectedCoupon) {
        toast.error('Kupon tidak ditemukan')
        return
      }

      // Update link with coupon
      const response = await fetch(`/api/affiliate/links/${selectedLinkForCoupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: selectedCoupon.code
        })
      })
      
      if (response.ok) {
        toast.success(`Kupon ${selectedCoupon.code} berhasil ditambahkan ke link!`)
        // Close modal and refresh
        setShowCouponModal(false)
        setSelectedLinkForCoupon(null)
        setSelectedCouponForLink('')
        fetchLinks()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menambahkan kupon')
      }
    } catch (error) {
      console.error('Error attaching coupon:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setGeneratingCouponForLink(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getLinkTypeBadge = (linkType?: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      SALESPAGE_INTERNAL: { label: '🔗 Salespage', color: 'bg-blue-100 text-blue-700' },
      CHECKOUT: { label: '💳 Checkout', color: 'bg-green-100 text-green-700' },
      CHECKOUT_PRO: { label: '🎯 Checkout Pro', color: 'bg-purple-100 text-purple-700' },
      SALESPAGE_EXTERNAL: { label: '🔄 Alternatif', color: 'bg-gray-100 text-gray-700' },
    }
    const badge = badges[linkType || 'CHECKOUT'] || badges.CHECKOUT
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getTargetTypeBadge = (link: AffiliateLink) => {
    if (link.membership) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700">👑 {link.membership.name}</span>
    }
    if (link.product) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">📦 {link.product.name}</span>
    }
    if (link.course) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">📚 {link.course.title}</span>
    }
    if (link.supplier) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">🚚 {link.supplier.companyName}</span>
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">🌐 Semua Produk</span>
  }

  const totalClicks = filteredLinks.reduce((sum, link) => sum + link.clicks, 0)
  const totalConversions = filteredLinks.reduce((sum, link) => sum + link.conversions, 0)
  const totalRevenue = filteredLinks.reduce((sum, link) => sum + link.revenue, 0)
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="links">
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-12">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Link Affiliate</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Kelola semua link affiliate untuk membership, produk, kelas, dan supplier</p>
        </div>

        {/* Welcome Hero Section - Only show when no links exist */}
        {links.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-6 text-center shadow-sm">
            <div className="max-w-2xl mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Link2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                🎉 Selamat Datang di Program Affiliate!
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-lg leading-relaxed">
                Mulai perjalanan affiliate Anda sekarang! Buat link pertama dan dapatkan komisi hingga <span className="font-semibold text-green-600">30%</span> dari setiap penjualan yang berhasil.
              </p>
              <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center">
                <button
                  onClick={() => setMainTab('create')}
                  className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                >
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  Buat Link Pertama Sekarang
                  <div className="w-2 h-2 bg-white rounded-full animate-ping ml-1"></div>
                </button>
                <div className="text-xs sm:text-sm text-gray-500">
                  📈 Rata-rata affiliate mendapat <span className="font-semibold text-green-600">Rp 500K-2jt/bulan</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-[10px] sm:text-xs font-medium">Total Klik</span>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-[10px] sm:text-xs font-medium">Konversi</span>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalConversions}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-[10px] sm:text-xs font-medium">Rate</span>
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-[10px] sm:text-xs font-medium">Total Komisi</span>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            </div>
            <p className="text-base sm:text-xl font-bold text-orange-600">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Quick Action Bar - Only show when there are existing links */}
        {links.length > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="text-white">
                <p className="font-semibold text-sm sm:text-base">💡 Tingkatkan Penghasilan Anda!</p>
                <p className="text-xs sm:text-sm text-green-100">Buat link baru untuk produk lain dan raih lebih banyak komisi</p>
              </div>
              <button
                onClick={() => setMainTab('create')}
                className="w-full sm:w-auto bg-white text-green-600 hover:text-green-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Buat Link Baru
              </button>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white overflow-x-auto">
            <div className="flex min-w-max">
              {MAIN_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = mainTab === tab.key
                const isCreateTab = tab.key === 'create'
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setMainTab(tab.key)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b-2 transition-all transform whitespace-nowrap text-xs sm:text-base ${
                      isActive
                        ? isCreateTab
                          ? 'border-green-500 text-green-700 bg-gradient-to-r from-green-50 to-green-100 shadow-sm scale-105'
                          : 'border-orange-500 text-orange-600 bg-orange-50/50'
                        : isCreateTab
                          ? 'border-transparent text-green-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50/30 font-semibold'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } ${isCreateTab ? 'relative' : ''}`}
                  >
                    {isCreateTab && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                        Baru
                      </div>
                    )}
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      isActive 
                        ? isCreateTab ? 'text-green-600' : 'text-orange-500' 
                        : isCreateTab ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className={`font-semibold ${isCreateTab ? 'text-green-700' : ''}`}>
                      {tab.label}
                    </span>
                    {isCreateTab && !isActive && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping hidden sm:block"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6">
            {mainTab === 'list' ? (
              /* LIST TAB */
              <div className="space-y-4 sm:space-y-6">
                {/* Filter Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto scrollbar-hide -mb-px gap-1">
                    {FILTER_TABS.map((tab) => {
                      const Icon = tab.icon
                      const stat = tabStats[tab.key]
                      const isActive = filterTab === tab.key
                      
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setFilterTab(tab.key)}
                          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap text-[10px] sm:text-sm ${
                            isActive
                              ? 'border-orange-500 text-orange-600 bg-orange-50/30'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-orange-500' : tab.color}`} />
                          <span className="font-medium">{tab.label}</span>
                          <span className={`px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full ${
                            isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {stat.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:items-center sm:justify-between">
                  <div className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari link..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        showArchived
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showArchived ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                      {showArchived ? 'Aktif' : 'Arsip'}
                    </button>
                    
                    <button
                      onClick={fetchAllData}
                      className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Links - Card View for Mobile, Table for Desktop */}
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {filteredLinks.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4">
                        <Link2 className="h-8 w-8 text-orange-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {searchQuery ? 'Tidak ada link yang cocok' : 'Belum Ada Link Affiliate'}
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm">
                        {searchQuery 
                          ? 'Coba gunakan kata kunci lain' 
                          : 'Mulai dengan membuat link pertama Anda'
                        }
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setMainTab('create')}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg"
                        >
                          <Plus className="h-5 w-5" />
                          Buat Link Sekarang
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredLinks.map((link) => (
                      <div 
                        key={link.id} 
                        className={`bg-white border rounded-xl p-4 shadow-sm ${link.isArchived ? 'bg-gray-50/50 border-gray-200' : 'border-gray-200'}`}
                      >
                        {/* Header - Code & Badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-mono text-sm font-semibold text-orange-600">{link.code}</span>
                            <div className="flex flex-wrap items-center gap-1">
                              {getLinkTypeBadge(link.linkType)}
                              {getTargetTypeBadge(link)}
                              {link.isArchived && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-600">Arsip</span>
                              )}
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => copyToClipboard(link.url, link.id)}
                              className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
                              title="Copy link"
                            >
                              {copiedId === link.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              title="Buka link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => quickGenerateCoupon(link)}
                              disabled={generatingCouponForLink === link.id}
                              className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors disabled:opacity-50"
                              title="Generate Kupon"
                            >
                              {generatingCouponForLink === link.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Ticket className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleArchiveLink(link.id, link.isArchived)}
                              disabled={archivingId === link.id}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                link.isArchived
                                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                              title={link.isArchived ? 'Pulihkan' : 'Arsipkan'}
                            >
                              {archivingId === link.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : link.isArchived ? (
                                <ArchiveRestore className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* URL */}
                        <div className="bg-gray-50 rounded-lg p-2 mb-3">
                          <code className="text-xs text-gray-700 break-all">{link.url}</code>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Klik</p>
                            <p className="font-bold text-blue-600">{link.clicks}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Konversi</p>
                            <p className="font-bold text-green-600">{link.conversions}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">Komisi</p>
                            <p className="font-bold text-orange-600 text-xs">{formatCurrency(link.revenue)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kode & Target</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Klik</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Konversi</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Komisi</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredLinks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-16">
                              <div className="text-center">
                                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6">
                                  <Link2 className="h-12 w-12 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  {searchQuery ? 'Tidak ada link yang cocok' : 'Belum Ada Link Affiliate'}
                                </h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                  {searchQuery 
                                    ? 'Coba gunakan kata kunci lain untuk pencarian yang lebih baik' 
                                    : 'Mulai perjalanan affiliate Anda dengan membuat link pertama. Link ini akan membantu Anda mendapatkan komisi dari setiap penjualan.'
                                  }
                                </p>
                                {!searchQuery && (
                                  <button
                                    onClick={() => setMainTab('create')}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                  >
                                    <Plus className="h-6 w-6" />
                                    Buat Link Pertama Sekarang
                                    <div className="w-2 h-2 bg-white rounded-full animate-ping ml-1"></div>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredLinks.map((link) => (
                            <tr key={link.id} className={`hover:bg-gray-50 transition-colors ${link.isArchived ? 'bg-gray-50/50' : ''}`}>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1.5">
                                  <span className="font-mono text-sm font-semibold text-orange-600">{link.code}</span>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {getLinkTypeBadge(link.linkType)}
                                    {getTargetTypeBadge(link)}
                                    {link.isArchived && (
                                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-600">Arsip</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-xs text-gray-700 break-all block max-w-xs">{link.url}</code>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-gray-900">{link.clicks}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-gray-900">{link.conversions}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-bold text-green-600">{formatCurrency(link.revenue)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => copyToClipboard(link.url, link.id)}
                                    className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
                                    title="Copy link"
                                  >
                                    {copiedId === link.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                    title="Buka link"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                  <button
                                    onClick={() => quickGenerateCoupon(link)}
                                    disabled={generatingCouponForLink === link.id}
                                    className="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors disabled:opacity-50"
                                    title="Generate Kupon"
                                  >
                                    {generatingCouponForLink === link.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Ticket className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => toggleArchiveLink(link.id, link.isArchived)}
                                    disabled={archivingId === link.id}
                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                      link.isArchived
                                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                    title={link.isArchived ? 'Pulihkan' : 'Arsipkan'}
                                  >
                                    {archivingId === link.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : link.isArchived ? (
                                      <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* CREATE TAB */
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 flex flex-wrap items-center gap-2">
                        🚀 Generator Link Affiliate
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full">Auto Generate</span>
                      </h3>
                      <p className="text-gray-700 mb-3 sm:mb-4 text-sm">
                        Pilih produk yang ingin Anda afiliasikan, sistem akan otomatis generate semua link yang dibutuhkan:
                        <span className="font-semibold text-green-600"> Sales Page & Checkout!</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium">Auto Sales & Checkout</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="font-medium">Gunakan Kupon Anda</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="font-medium">Komisi hingga 30%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1: Choose Product Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">1</span>
                    Pilih Tipe Produk
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setSelectedTargetType('membership')
                        setSelectedTargetId('')
                      }}
                      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl border-2 transition-all ${
                        selectedTargetType === 'membership'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <Crown className="h-6 w-6 sm:h-8 sm:w-8" />
                      <div className="text-center">
                        <span className="font-semibold text-xs sm:text-sm">Membership</span>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Paket berlangganan</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedTargetType('product')
                        setSelectedTargetId('')
                      }}
                      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl border-2 transition-all ${
                        selectedTargetType === 'product'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <Package className="h-6 w-6 sm:h-8 sm:w-8" />
                      <div className="text-center">
                        <span className="font-semibold text-xs sm:text-sm">Produk</span>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">E-book, template</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTargetType('course')
                        setSelectedTargetId('')
                      }}
                      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl border-2 transition-all ${
                        selectedTargetType === 'course'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
                      <div className="text-center">
                        <span className="font-semibold text-xs sm:text-sm">Kelas</span>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Course & training</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTargetType('supplier')
                        setSelectedTargetId('')
                      }}
                      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl border-2 transition-all ${
                        selectedTargetType === 'supplier'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <Truck className="h-6 w-6 sm:h-8 sm:w-8" />
                      <div className="text-center">
                        <span className="font-semibold text-xs sm:text-sm">Supplier</span>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Produsen & vendor</div>
                      </div>
                    </button>

                    {/* Event type */}
                    <button
                      onClick={() => {
                        setSelectedTargetType('event')
                        setSelectedTargetId('')
                      }}
                      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl border-2 transition-all ${
                        selectedTargetType === 'event'
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <div className="text-center">
                        <span className="font-semibold text-xs sm:text-sm">Event</span>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Workshop & seminar</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 2: Show Available Products (conditional) */}
                {selectedTargetType && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">2</span>
                      Pilih {selectedTargetType === 'membership' ? 'Paket Membership' : 
                             selectedTargetType === 'product' ? 'Produk Digital' : 
                             selectedTargetType === 'course' ? 'Kelas Online' : 
                             selectedTargetType === 'supplier' ? 'Supplier' : 
                             'Event'}
                    </label>
                    
                    {/* Show all products grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      {selectedTargetType === 'membership' && memberships.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTargetId(item.id)}
                          className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left overflow-hidden group ${
                            selectedTargetId === item.id
                              ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl transform scale-[1.02]'
                              : 'border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white'
                          }`}
                        >
                          {/* Icon */}
                          <div className="mb-2 sm:mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2">{item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{item.description || 'Paket membership premium'}</p>
                          
                          {/* Price */}
                          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-2 sm:mb-3">
                            Rp {(item.price || 0).toLocaleString('id-ID').replace(/,/g, '.')}
                          </div>
                          
                          {/* Duration Badge */}
                          {item.duration && (
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-medium rounded-full">
                              <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {item.duration === 'ONE_MONTH' ? '1 Bulan' : 
                               item.duration === 'THREE_MONTHS' ? '3 Bulan' :
                               item.duration === 'SIX_MONTHS' ? '6 Bulan' :
                               item.duration === 'TWELVE_MONTHS' ? '12 Bulan' : 'Lifetime'}
                            </div>
                          )}
                        </button>
                      ))}

                      {selectedTargetType === 'product' && products.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTargetId(item.id)}
                          className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left overflow-hidden group ${
                            selectedTargetId === item.id
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl transform scale-[1.02]'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
                          }`}
                        >
                          {/* Icon */}
                          <div className="mb-2 sm:mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2">{item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{item.description || 'Produk digital berkualitas'}</p>
                          
                          {/* Price */}
                          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-2 sm:mb-3">
                            Rp {(item.price || 0).toLocaleString('id-ID').replace(/,/g, '.')}
                          </div>
                          
                          {/* Badge */}
                          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-medium rounded-full">
                            <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Produk Digital
                          </div>
                        </button>
                      ))}

                      {selectedTargetType === 'course' && courses.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTargetId(item.id)}
                          className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left overflow-hidden group ${
                            selectedTargetId === item.id
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-xl transform scale-[1.02]'
                              : 'border-gray-200 hover:border-green-300 hover:shadow-lg bg-white'
                          }`}
                        >
                          {/* Icon */}
                          <div className="mb-2 sm:mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{item.description || 'Kelas online terbaik'}</p>
                          
                          {/* Price */}
                          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-2 sm:mb-3">
                            Rp {Number(item.price || 0).toLocaleString('id-ID').replace(/,/g, '.')}
                          </div>
                          
                          {/* Badge */}
                          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium rounded-full">
                            <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Kelas Online
                          </div>
                        </button>
                      ))}

                      {selectedTargetType === 'supplier' && suppliers.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTargetId(item.id)}
                          className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left overflow-hidden group ${
                            selectedTargetId === item.id
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl transform scale-[1.02]'
                              : 'border-gray-200 hover:border-purple-300 hover:shadow-lg bg-white'
                          }`}
                        >
                          {/* Icon */}
                          <div className="mb-2 sm:mb-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2">{item.companyName}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{item.description || 'Supplier terpercaya'}</p>
                          
                          {/* Location */}
                          <div className="text-xs sm:text-sm font-semibold text-purple-600 mb-2 sm:mb-3">
                            📍 {item.city}, {item.province}
                          </div>
                          
                          {/* Badge */}
                          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded-full">
                            <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Supplier
                          </div>
                        </button>
                      ))}

                      {/* Events placeholder - we can add this later */}
                      {selectedTargetType === 'event' && (
                        <div className="col-span-full p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                          <svg className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">Event Coming Soon</h3>
                          <p className="text-gray-500 text-xs sm:text-base">Fitur affiliate event sedang dalam pengembangan</p>
                        </div>
                      )}
                    </div>

                    {/* Show all products option */}
                    <button
                      onClick={() => setSelectedTargetId('')}
                      className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                        selectedTargetId === ''
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Generate Link untuk Semua {selectedTargetType === 'membership' ? 'Membership' : 
                                                       selectedTargetType === 'product' ? 'Produk' : 
                                                       selectedTargetType === 'course' ? 'Kelas' : 'Supplier'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            Buat link universal untuk promosi semua {selectedTargetType}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Step 3: Select Coupon */}
                {selectedTargetType && (
                  <div className="mt-4 sm:mt-6">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">3</span>
                      Pilih Kupon (Opsional)
                    </label>
                    
                    {availableCoupons.length === 0 ? (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900 mb-1 text-sm sm:text-base">Belum Ada Kupon</h3>
                            <p className="text-xs sm:text-sm text-yellow-800 mb-2">
                              Link akan dibuat tanpa kupon diskon.
                            </p>
                            <a 
                              href="/affiliate/coupons" 
                              className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
                            >
                              Buat Kupon Sekarang →
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        <select
                          value={selectedCouponId}
                          onChange={(e) => setSelectedCouponId(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm sm:text-base"
                        >
                          <option value="">Tanpa Kupon</option>
                          {availableCoupons.map((coupon) => (
                            <option key={coupon.id} value={coupon.id}>
                              {coupon.code} - {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `Rp ${coupon.discountValue.toLocaleString('id-ID').replace(/,/g, '.')}`} off
                            </option>
                          ))}
                        </select>
                        
                        {selectedCouponId && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 sm:p-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-800">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Kupon terpilih akan otomatis ditambahkan</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Generate Button */}
                {selectedTargetType && (
                  <div className="mt-6 sm:mt-8">
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <div className="text-center">
                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">4</span>
                          🎉 Generate Link Sekarang!
                        </h3>
                        <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base">
                          Sistem akan otomatis generate <span className="font-semibold text-green-600">semua jenis link</span>:
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                          <div className="bg-white p-2 sm:p-3 rounded-lg">
                            <div className="text-blue-600 font-semibold text-[10px] sm:text-sm">🔗 Sales Page</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Promosi & awareness</div>
                          </div>
                          <div className="bg-white p-2 sm:p-3 rounded-lg">
                            <div className="text-green-600 font-semibold text-[10px] sm:text-sm">💳 Checkout</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Direct purchase</div>
                          </div>
                          <div className="bg-white p-2 sm:p-3 rounded-lg">
                            <div className="text-purple-600 font-semibold text-[10px] sm:text-sm">🎫 Kupon</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{selectedCouponId ? 'Dengan diskon' : 'Tanpa kupon'}</div>
                          </div>
                        </div>
                        <button
                          onClick={handleGenerateLinks}
                          disabled={generating}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                        >
                          {generating ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Generate Semua Link!
                              <div className="w-2 h-2 bg-white rounded-full animate-ping ml-1 hidden sm:block"></div>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Cards */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 sm:p-5">
                    <h3 className="font-semibold text-orange-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      Cara Kerja Affiliate
                    </h3>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">1.</span>
                        <span>Generate link untuk produk yang dipromosikan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">2.</span>
                        <span>Bagikan link ke calon pembeli</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">3.</span>
                        <span>Komisi masuk otomatis saat ada pembelian</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-5">
                    <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                      Tips Maksimalkan Komisi
                    </h3>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Gunakan kupon untuk menarik pembeli baru</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Fokus promosi produk dengan komisi tertinggi</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>Ikuti challenge untuk bonus tambahan</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button for Mobile */}
        {mainTab === 'list' && (
          <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 lg:hidden">
            <button
              onClick={() => setMainTab('create')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
              style={{
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4), 0 4px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
              <span className="sr-only">Buat Link Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Tambah Kupon ke Link */}
      {showCouponModal && selectedLinkForCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ticket className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Tambah Kupon ke Link</h2>
                </div>
                <button
                  onClick={() => {
                    setShowCouponModal(false)
                    setSelectedLinkForCoupon(null)
                    setSelectedCouponForLink('')
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Link Info */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Link2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Link Affiliate</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Kode: <span className="font-mono font-bold text-orange-600">{selectedLinkForCoupon.code}</span>
                    </p>
                    {selectedLinkForCoupon.membership && (
                      <p className="text-sm text-gray-600">
                        Target: <span className="font-semibold">👑 {selectedLinkForCoupon.membership.name}</span>
                      </p>
                    )}
                    {selectedLinkForCoupon.product && (
                      <p className="text-sm text-gray-600">
                        Target: <span className="font-semibold">📦 {selectedLinkForCoupon.product.name}</span>
                      </p>
                    )}
                    {selectedLinkForCoupon.course && (
                      <p className="text-sm text-gray-600">
                        Target: <span className="font-semibold">📚 {selectedLinkForCoupon.course.title}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Coupon Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-purple-500" />
                  Pilih Kupon dari Daftar
                </label>
                
                {(() => {
                  // Filter applicable coupons (including admin coupons)
                  let applicableCoupons = coupons
                  
                  if (selectedLinkForCoupon.membership) {
                    applicableCoupons = coupons.filter(coupon => {
                      const ids = coupon.membershipIds || []
                      return ids.length === 0 || ids.includes(selectedLinkForCoupon.membership.id)
                    })
                  } else if (selectedLinkForCoupon.product) {
                    applicableCoupons = coupons.filter(coupon => {
                      const ids = coupon.productIds || []
                      return ids.length === 0 || ids.includes(selectedLinkForCoupon.product.id)
                    })
                  } else if (selectedLinkForCoupon.course) {
                    applicableCoupons = coupons.filter(coupon => {
                      const ids = coupon.courseIds || []
                      return ids.length === 0 || ids.includes(selectedLinkForCoupon.course.id)
                    })
                  }

                  if (applicableCoupons.length === 0) {
                    return (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                        <div className="text-yellow-600 mb-2">⚠️</div>
                        <p className="text-gray-700 font-medium mb-2">Tidak ada kupon yang berlaku</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Kupon yang tersedia tidak berlaku untuk {selectedLinkForCoupon.membership?.name || selectedLinkForCoupon.product?.name || selectedLinkForCoupon.course?.title}
                        </p>
                        <a
                          href="/affiliate/coupons"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Buat Kupon Baru
                        </a>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {applicableCoupons.map((coupon) => (
                        <button
                          key={coupon.id}
                          onClick={() => setSelectedCouponForLink(coupon.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            selectedCouponForLink === coupon.id
                              ? 'border-purple-500 bg-purple-50 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-lg text-gray-900">{coupon.code}</span>
                                {coupon.discountType === 'PERCENTAGE' ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-bold rounded">
                                    {coupon.discountValue}% OFF
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded">
                                    Rp {Number(coupon.discountValue).toLocaleString('id-ID')} OFF
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                {coupon.membershipIds && coupon.membershipIds.length > 0 && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                    👑 {coupon.membershipIds.length} Membership
                                  </span>
                                )}
                                {coupon.productIds && coupon.productIds.length > 0 && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    📦 {coupon.productIds.length} Produk
                                  </span>
                                )}
                                {coupon.courseIds && coupon.courseIds.length > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                    📚 {coupon.courseIds.length} Kelas
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedCouponForLink === coupon.id
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedCouponForLink === coupon.id && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowCouponModal(false)
                    setSelectedLinkForCoupon(null)
                    setSelectedCouponForLink('')
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  disabled={generatingCouponForLink !== null}
                >
                  Batal
                </button>
                <button
                  onClick={attachCouponToLink}
                  disabled={!selectedCouponForLink || generatingCouponForLink !== null}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {generatingCouponForLink ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Menambahkan...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-5 w-5" />
                      Tambah Kupon
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureLock>
  )
}
