'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import toast from 'react-hot-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Copy, ToggleLeft, ToggleRight, GitFork, Users, TrendingUp } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  usageLimit: number | null
  usageCount: number
  validUntil: string | null
  isActive: boolean
  minPurchase: number | null
  isAffiliateEnabled: boolean
  isForRenewal: boolean
  maxGeneratePerAffiliate: number | null
  maxUsagePerCoupon: number | null
  productIds: string[] | null
  membershipIds: string[] | null
  courseIds: string[] | null
  basedOnCouponId: string | null
  affiliateId: string | null
  parentCoupon?: {
    code: string
    discountType: string
    discountValue: number
  } | null
  _count?: {
    childCoupons: number
  }
  createdAt: string
  updatedAt: string
}

interface SelectableItem {
  id: string
  name: string
  title?: string
  isActive?: boolean
}

interface Affiliate {
  id: string
  userId: string
  affiliateCode: string
  user: {
    name: string
    email: string
  }
}

export default function AdminCouponsPageNew() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('parent')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [childCoupons, setChildCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [selectedParentCoupon, setSelectedParentCoupon] = useState<Coupon | null>(null)
  
  // Data sources
  const [products, setProducts] = useState<SelectableItem[]>([])
  const [memberships, setMemberships] = useState<SelectableItem[]>([])
  const [courses, setCourses] = useState<SelectableItem[]>([])
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loadingData, setLoadingData] = useState(false)
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    usageLimit: '',
    validUntil: '',
    minPurchase: '',
    isActive: true,
    isAffiliateEnabled: false,
    isForRenewal: false,
    maxGeneratePerAffiliate: '',
    maxUsagePerCoupon: '',
    selectedProducts: [] as string[],
    selectedMemberships: [] as string[],
    selectedCourses: [] as string[],
  })

  const [generateFormData, setGenerateFormData] = useState({
    parentCouponId: '',
    affiliateId: '',
    count: '1',
    codePrefix: '',
    customCode: '',
  })

  useEffect(() => {
    fetchCoupons()
    fetchSelectableData()
    fetchAffiliates()
  }, [])

  const fetchSelectableData = async () => {
    setLoadingData(true)
    try {
      const [productsRes, membershipsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/membership-plans'),
        fetch('/api/admin/courses'),
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
      }
      if (membershipsRes.ok) {
        const data = await membershipsRes.json()
        setMemberships(data.plans || [])
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching selectable data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates')
      if (response.ok) {
        const data = await response.json()
        setAffiliates(data.affiliates || [])
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    }
  }

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const [parentRes, allRes] = await Promise.all([
        fetch('/api/admin/coupons?type=parent'),
        fetch('/api/admin/coupons'),
      ])

      if (parentRes.ok) {
        const data = await parentRes.json()
        setCoupons(data.coupons || [])
      }

      if (allRes.ok) {
        const data = await allRes.json()
        const children = (data.coupons || []).filter((c: Coupon) => c.basedOnCouponId)
        setChildCoupons(children)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to fetch coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        validUntil: formData.validUntil || null,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
        isActive: formData.isActive,
        isAffiliateEnabled: formData.isAffiliateEnabled,
        isForRenewal: formData.isForRenewal,
        maxGeneratePerAffiliate: formData.maxGeneratePerAffiliate ? parseInt(formData.maxGeneratePerAffiliate) : null,
        maxUsagePerCoupon: formData.maxUsagePerCoupon ? parseInt(formData.maxUsagePerCoupon) : null,
        productIds: formData.selectedProducts.length > 0 ? formData.selectedProducts : null,
        membershipIds: formData.selectedMemberships.length > 0 ? formData.selectedMemberships : null,
        courseIds: formData.selectedCourses.length > 0 ? formData.selectedCourses : null,
      }

      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons'
      
      const method = editingCoupon ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingCoupon ? 'Kupon berhasil diperbarui' : 'Kupon berhasil dibuat')
        setShowModal(false)
        resetForm()
        fetchCoupons()
      } else {
        toast.error(data.error || 'Gagal menyimpan kupon')
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
      toast.error('Terjadi kesalahan saat menyimpan kupon')
    }
  }

  const handleGenerateChild = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!generateFormData.parentCouponId) {
      toast.error('Pilih kupon parent terlebih dahulu')
      return
    }

    try {
      const response = await fetch('/api/admin/coupons/generate-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentCouponId: generateFormData.parentCouponId,
          affiliateId: generateFormData.affiliateId || null,
          count: parseInt(generateFormData.count) || 1,
          codePrefix: generateFormData.codePrefix || '',
          customCode: generateFormData.customCode || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Kupon turunan berhasil dibuat')
        setShowGenerateModal(false)
        resetGenerateForm()
        fetchCoupons()
      } else {
        toast.error(data.error || 'Gagal generate kupon turunan')
      }
    } catch (error) {
      console.error('Error generating child coupons:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      usageLimit: coupon.usageLimit?.toString() || '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      minPurchase: coupon.minPurchase?.toString() || '',
      isActive: coupon.isActive,
      isAffiliateEnabled: coupon.isAffiliateEnabled,
      isForRenewal: coupon.isForRenewal || false,
      maxGeneratePerAffiliate: coupon.maxGeneratePerAffiliate?.toString() || '',
      maxUsagePerCoupon: coupon.maxUsagePerCoupon?.toString() || '',
      selectedProducts: Array.isArray(coupon.productIds) ? coupon.productIds : [],
      selectedMemberships: Array.isArray(coupon.membershipIds) ? coupon.membershipIds : [],
      selectedCourses: Array.isArray(coupon.courseIds) ? coupon.courseIds : [],
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kupon ini?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Kupon berhasil dihapus')
        fetchCoupons()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus kupon')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Terjadi kesalahan saat menghapus kupon')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      if (response.ok) {
        toast.success(`Kupon ${!coupon.isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
        fetchCoupons()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengubah status kupon')
      }
    } catch (error) {
      console.error('Error toggling coupon:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode kupon disalin!')
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      usageLimit: '',
      validUntil: '',
      minPurchase: '',
      isActive: true,
      isAffiliateEnabled: false,
      isForRenewal: false,
      maxGeneratePerAffiliate: '',
      maxUsagePerCoupon: '',
      selectedProducts: [],
      selectedMemberships: [],
      selectedCourses: [],
    })
    setEditingCoupon(null)
  }

  const resetGenerateForm = () => {
    setGenerateFormData({
      parentCouponId: '',
      affiliateId: '',
      count: '1',
      codePrefix: '',
      customCode: '',
    })
    setSelectedParentCoupon(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak ada batas'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDiscount = (type: string, value: number) => {
    if (type === 'PERCENTAGE') {
      return `${value}%`
    }
    return formatCurrency(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data kupon...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kelola Kupon</h1>
            <p className="text-gray-600 mt-1">Buat dan kelola kupon diskon untuk produk dan membership</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                resetGenerateForm()
                setShowGenerateModal(true)
              }}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <GitFork className="w-4 h-4 mr-2" />
              Generate Kupon Turunan
            </Button>
            <Button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Kupon Baru
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Kupon
              </CardDescription>
              <CardTitle className="text-3xl">{coupons.length + childCoupons.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Kupon Parent</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {coupons.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                Kupon Turunan
              </CardDescription>
              <CardTitle className="text-3xl text-purple-600">
                {childCoupons.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aktif</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {[...coupons, ...childCoupons].filter(c => c.isActive).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Affiliate Ready
              </CardDescription>
              <CardTitle className="text-3xl text-emerald-600">
                {coupons.filter(c => c.isAffiliateEnabled).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Penggunaan</CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                {[...coupons, ...childCoupons].reduce((sum, c) => sum + c.usageCount, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parent" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Kupon Parent ({coupons.length})
            </TabsTrigger>
            <TabsTrigger value="child" className="flex items-center gap-2">
              <GitFork className="w-4 h-4" />
              Kupon Turunan ({childCoupons.length})
            </TabsTrigger>
          </TabsList>

          {/* Parent Coupons Tab */}
          <TabsContent value="parent" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kupon Parent</CardTitle>
                <CardDescription>Kupon induk yang dapat diturunkan ke affiliate</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Diskon</TableHead>
                      <TableHead>Turunan</TableHead>
                      <TableHead>Penggunaan</TableHead>
                      <TableHead>Berlaku Hingga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Belum ada kupon parent. Buat kupon pertama Anda!
                        </TableCell>
                      </TableRow>
                    ) : (
                      coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                                {coupon.code}
                              </code>
                              <button
                                onClick={() => copyCode(coupon.code)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {coupon.isAffiliateEnabled && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <Users className="w-3 h-3 mr-1" />
                                  Affiliate
                                </Badge>
                              )}
                              {coupon.isForRenewal && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  Renewal
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              {formatDiscount(coupon.discountType, coupon.discountValue)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <GitFork className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{coupon._count?.childCoupons || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {coupon.usageCount} / {coupon.usageLimit || '∞'}
                              </span>
                              {coupon.usageLimit && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-orange-600 h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%`
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(coupon.validUntil)}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleToggleActive(coupon)}
                              className="flex items-center gap-1"
                            >
                              {coupon.isActive ? (
                                <>
                                  <ToggleRight className="w-5 h-5 text-green-600" />
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Aktif
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                    Nonaktif
                                  </Badge>
                                </>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => handleEdit(coupon)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(coupon.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Child Coupons Tab */}
          <TabsContent value="child" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kupon Turunan</CardTitle>
                <CardDescription>Kupon yang digenerate dari kupon parent untuk affiliate</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Diskon</TableHead>
                      <TableHead>Penggunaan</TableHead>
                      <TableHead>Berlaku Hingga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {childCoupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Belum ada kupon turunan. Generate kupon dari parent!
                        </TableCell>
                      </TableRow>
                    ) : (
                      childCoupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-purple-50 rounded font-mono text-sm text-purple-700">
                                {coupon.code}
                              </code>
                              <button
                                onClick={() => copyCode(coupon.code)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            {coupon.isForRenewal && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 mt-1">
                                Renewal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {coupon.parentCoupon ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <GitFork className="w-3 h-3 mr-1" />
                                {coupon.parentCoupon.code}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              {formatDiscount(coupon.discountType, coupon.discountValue)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {coupon.usageCount} / {coupon.usageLimit || '∞'}
                              </span>
                              {coupon.usageLimit && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-purple-600 h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%`
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(coupon.validUntil)}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleToggleActive(coupon)}
                              className="flex items-center gap-1"
                            >
                              {coupon.isActive ? (
                                <>
                                  <ToggleRight className="w-5 h-5 text-green-600" />
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Aktif
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                    Nonaktif
                                  </Badge>
                                </>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleDelete(coupon.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Child Coupon Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitFork className="w-5 h-5" />
                  Generate Kupon Turunan
                </CardTitle>
                <CardDescription>
                  Buat kupon turunan dari kupon parent untuk affiliate atau penggunaan khusus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateChild} className="space-y-4">
                  <div>
                    <Label htmlFor="parentCouponId">Pilih Kupon Parent *</Label>
                    <Select
                      value={generateFormData.parentCouponId}
                      onValueChange={(value) => {
                        const selected = coupons.find(c => c.id === value)
                        setGenerateFormData({ ...generateFormData, parentCouponId: value })
                        setSelectedParentCoupon(selected || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kupon parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {coupons.filter(c => c.isAffiliateEnabled).map((coupon) => (
                          <SelectItem key={coupon.id} value={coupon.id}>
                            {coupon.code} - {formatDiscount(coupon.discountType, coupon.discountValue)}
                            {coupon._count?.childCoupons ? ` (${coupon._count.childCoupons} turunan)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedParentCoupon && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                        <p className="text-blue-900 font-medium">Detail Parent:</p>
                        <ul className="mt-1 space-y-1 text-blue-700">
                          <li>• Diskon: {formatDiscount(selectedParentCoupon.discountType, selectedParentCoupon.discountValue)}</li>
                          <li>• Max Generate: {selectedParentCoupon.maxGeneratePerAffiliate || 'Unlimited'}</li>
                          <li>• Max Usage per Kupon: {selectedParentCoupon.maxUsagePerCoupon || 'Unlimited'}</li>
                          <li>• Berlaku Hingga: {formatDate(selectedParentCoupon.validUntil)}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="count">Jumlah Generate</Label>
                      <Input
                        id="count"
                        type="number"
                        min="1"
                        max="100"
                        value={generateFormData.count}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, count: e.target.value })}
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maksimal 100 kupon sekaligus</p>
                    </div>

                    <div>
                      <Label htmlFor="codePrefix">Prefix Kode (Opsional)</Label>
                      <Input
                        id="codePrefix"
                        type="text"
                        value={generateFormData.codePrefix}
                        onChange={(e) => setGenerateFormData({ ...generateFormData, codePrefix: e.target.value.toUpperCase() })}
                        placeholder="Contoh: DINDA"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500 mt-1">Akan jadi: PREFIX-XXXXX</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customCode">Kode Custom (Opsional)</Label>
                    <Input
                      id="customCode"
                      type="text"
                      value={generateFormData.customCode}
                      onChange={(e) => setGenerateFormData({ ...generateFormData, customCode: e.target.value.toUpperCase() })}
                      placeholder="Kosongkan untuk auto-generate"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jika diisi, hanya 1 kupon yang akan dibuat dengan kode ini
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="affiliateId">Assign ke Affiliate (Opsional)</Label>
                    <Select
                      value={generateFormData.affiliateId || "NONE"}
                      onValueChange={(value) => setGenerateFormData({ ...generateFormData, affiliateId: value === "NONE" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih affiliate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Tidak assign ke affiliate</SelectItem>
                        {affiliates.map((affiliate) => (
                          <SelectItem key={affiliate.id} value={affiliate.userId}>
                            {affiliate.user.name} ({affiliate.affiliateCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowGenerateModal(false)
                        resetGenerateForm()
                      }}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={!generateFormData.parentCouponId}
                    >
                      <GitFork className="w-4 h-4 mr-2" />
                      Generate Kupon
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Parent Coupon Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingCoupon ? 'Edit Kupon' : 'Buat Kupon Baru'}</CardTitle>
                <CardDescription>
                  {editingCoupon ? 'Perbarui informasi kupon' : 'Tambahkan kupon diskon baru'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="code">Kode Kupon *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="DISKON50"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Diskon spesial untuk pelanggan baru"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discountType">Tipe Diskon *</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                          <SelectItem value="FIXED">Nominal (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="discountValue">Nilai Diskon *</Label>
                      <Input
                        id="discountValue"
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        placeholder={formData.discountType === 'PERCENTAGE' ? '50' : '100000'}
                        required
                        min="0"
                        step={formData.discountType === 'PERCENTAGE' ? '1' : '1000'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="usageLimit">Batas Penggunaan</Label>
                      <Input
                        id="usageLimit"
                        type="number"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                        placeholder="Kosongkan untuk unlimited"
                        min="1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="validUntil">Berlaku Hingga</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="minPurchase">Minimal Pembelian (Rp)</Label>
                      <Input
                        id="minPurchase"
                        type="number"
                        value={formData.minPurchase}
                        onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                    </div>

                    {/* Applicable Items Section */}
                    <div className="col-span-2 space-y-4 border-t pt-4">
                      <div>
                        <Label className="text-base font-semibold">Berlaku Untuk</Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Kosongkan semua untuk berlaku di semua item
                        </p>
                      </div>

                      {/* Products Multi-Select */}
                      <div>
                        <Label>Produk Spesifik</Label>
                        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto mt-2">
                          {loadingData ? (
                            <p className="text-sm text-gray-500">Memuat produk...</p>
                          ) : products.length === 0 ? (
                            <p className="text-sm text-gray-500">Tidak ada produk</p>
                          ) : (
                            <div className="space-y-2">
                              {products.map((product) => (
                                <label key={product.id} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.selectedProducts.includes(product.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selectedProducts: [...formData.selectedProducts, product.id]
                                        })
                                      } else {
                                        setFormData({
                                          ...formData,
                                          selectedProducts: formData.selectedProducts.filter(id => id !== product.id)
                                        })
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-sm">{product.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Memberships Multi-Select */}
                      <div>
                        <Label>Paket Membership</Label>
                        <div className="border rounded-lg p-3 max-h-40 overflow-y-auto mt-2">
                          {loadingData ? (
                            <p className="text-sm text-gray-500">Memuat membership...</p>
                          ) : memberships.length === 0 ? (
                            <p className="text-sm text-gray-500">Tidak ada membership</p>
                          ) : (
                            <div className="space-y-2">
                              {memberships.map((membership) => (
                                <label key={membership.id} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.selectedMemberships.includes(membership.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selectedMemberships: [...formData.selectedMemberships, membership.id]
                                        })
                                      } else {
                                        setFormData({
                                          ...formData,
                                          selectedMemberships: formData.selectedMemberships.filter(id => id !== membership.id)
                                        })
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-sm flex items-center gap-2">
                                    {membership.name}
                                    {membership.isActive === false && (
                                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Nonaktif</span>
                                    )}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Courses Multi-Select */}
                      <div>
                        <Label>Kursus Spesifik</Label>
                        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto mt-2">
                          {loadingData ? (
                            <p className="text-sm text-gray-500">Memuat kursus...</p>
                          ) : courses.length === 0 ? (
                            <p className="text-sm text-gray-500">Tidak ada kursus</p>
                          ) : (
                            <div className="space-y-2">
                              {courses.map((course) => (
                                <label key={course.id} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.selectedCourses.includes(course.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          selectedCourses: [...formData.selectedCourses, course.id]
                                        })
                                      } else {
                                        setFormData({
                                          ...formData,
                                          selectedCourses: formData.selectedCourses.filter(id => id !== course.id)
                                        })
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-sm">{course.title || course.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">Aktifkan kupon</Label>
                      </div>

                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id="isForRenewal"
                          checked={formData.isForRenewal}
                          onChange={(e) => setFormData({ ...formData, isForRenewal: e.target.checked })}
                          className="rounded border-gray-300 mt-0.5"
                        />
                        <div>
                          <Label htmlFor="isForRenewal" className="cursor-pointer">
                            Kupon untuk perpanjangan membership
                          </Label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Jika dicentang, kupon ini hanya bisa digunakan oleh member yang sudah memiliki membership aktif untuk memperpanjang
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isAffiliateEnabled"
                          checked={formData.isAffiliateEnabled}
                          onChange={(e) => setFormData({ ...formData, isAffiliateEnabled: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isAffiliateEnabled" className="cursor-pointer">
                          Izinkan affiliate menggunakan kupon ini
                        </Label>
                      </div>
                    </div>

                    {formData.isAffiliateEnabled && (
                      <>
                        <div>
                          <Label htmlFor="maxGeneratePerAffiliate">Max Generate per Affiliate</Label>
                          <Input
                            id="maxGeneratePerAffiliate"
                            type="number"
                            value={formData.maxGeneratePerAffiliate}
                            onChange={(e) => setFormData({ ...formData, maxGeneratePerAffiliate: e.target.value })}
                            placeholder="Kosongkan untuk unlimited"
                            min="1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="maxUsagePerCoupon">Max Usage per Kupon</Label>
                          <Input
                            id="maxUsagePerCoupon"
                            type="number"
                            value={formData.maxUsagePerCoupon}
                            onChange={(e) => setFormData({ ...formData, maxUsagePerCoupon: e.target.value })}
                            placeholder="Kosongkan untuk unlimited"
                            min="1"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                    >
                      Batal
                    </Button>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      {editingCoupon ? 'Perbarui' : 'Simpan'} Kupon
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
