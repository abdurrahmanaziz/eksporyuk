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
import { Plus, Edit, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  usageLimit: number | null
  usageCount: number
  validUntil: string | null
  expiresAt: string | null
  isActive: boolean
  minPurchase: number | null
  isAffiliateEnabled: boolean
  isForRenewal: boolean
  maxGeneratePerAffiliate: number | null
  maxUsagePerCoupon: number | null
  productIds: string[] | null
  membershipIds: string[] | null
  courseIds: string[] | null
  createdAt: string
  updatedAt: string
}

interface SelectableItem {
  id: string
  name: string
  title?: string
}

export default function AdminCouponsPage() {
  const { data: session } = useSession()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  
  // Data sources for multi-select
  const [products, setProducts] = useState<SelectableItem[]>([])
  const [memberships, setMemberships] = useState<SelectableItem[]>([])
  const [courses, setCourses] = useState<SelectableItem[]>([])
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

  useEffect(() => {
    fetchCoupons()
    fetchSelectableData()
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

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      const data = await response.json()
      if (response.ok) {
        setCoupons(data.coupons || [])
      } else {
        toast.error(data.error || 'Failed to fetch coupons')
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Kupon</CardDescription>
            <CardTitle className="text-3xl">{coupons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kupon Aktif</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {coupons.filter(c => c.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kupon Perpanjangan</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {coupons.filter(c => c.isForRenewal).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Affiliate Enabled</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {coupons.filter(c => c.isAffiliateEnabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Penggunaan</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {coupons.reduce((sum, c) => sum + c.usageCount, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kupon</CardTitle>
          <CardDescription>Kelola semua kupon diskon yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Tipe Diskon</TableHead>
                <TableHead>Penggunaan</TableHead>
                <TableHead>Berlaku Hingga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Belum ada kupon. Buat kupon pertama Anda!
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(coupon.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {coupon.isForRenewal && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Perpanjangan</Badge>
                        )}
                        {coupon.isAffiliateEnabled && (
                          <Badge variant="outline">Affiliate</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === 'PERCENTAGE' ? (
                        <span className="text-green-600 font-semibold">
                          {coupon.discountValue}%
                        </span>
                      ) : (
                        <span className="text-blue-600 font-semibold">
                          {formatCurrency(Number(coupon.discountValue))}
                        </span>
                      )}
                      {coupon.minPurchase && (
                        <p className="text-xs text-gray-500 mt-1">
                          Min: {formatCurrency(Number(coupon.minPurchase))}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-semibold">{coupon.usageCount}</span>
                        {coupon.usageLimit && (
                          <span className="text-gray-500"> / {coupon.usageLimit}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(coupon.validUntil || coupon.expiresAt)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                        {coupon.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(coupon)}
                          title={coupon.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {coupon.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-700"
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

      {/* Create/Edit Modal */}
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
                      <div className="border rounded-lg p-3 max-h-32 overflow-y-auto mt-2">
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
                                <span className="text-sm">{membership.name}</span>
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
