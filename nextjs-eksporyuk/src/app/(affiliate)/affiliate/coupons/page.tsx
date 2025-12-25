'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { useSession } from 'next-auth/react'
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
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  Copy, 
  Eye, 
  Ticket, 
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Tag,
  Percent,
  DollarSign
} from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TemplateCoupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  isActive: boolean
  maxGeneratePerAffiliate: number | null
  maxUsagePerCoupon: number | null
  validUntil: string | null
}

interface AffiliateCoupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  usageCount: number
  usageLimit: number | null
  isActive: boolean
  validUntil: string | null
  basedOnCoupon: {
    code: string
  } | null
  createdAt: string
}

export default function AffiliateCouponsPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<TemplateCoupon[]>([])
  const [myCoupons, setMyCoupons] = useState<AffiliateCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCoupon | null>(null)
  const [customCode, setCustomCode] = useState('')
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<AffiliateCoupon | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [templatesRes, myCouponsRes] = await Promise.all([
        fetch('/api/affiliate/coupons/templates'),
        fetch('/api/affiliate/coupons'),
      ])

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      } else if (templatesRes.status === 401) {
        const error = await templatesRes.json()
        console.error('Templates access denied:', error)
        toast.error(error.error || 'Akses ditolak - Anda harus memiliki role AFFILIATE')
      }

      if (myCouponsRes.ok) {
        const data = await myCouponsRes.json()
        setMyCoupons(data.coupons || [])
      } else if (myCouponsRes.status === 401) {
        const error = await myCouponsRes.json()
        console.error('Coupons access denied:', error)
        toast.error(error.error || 'Akses ditolak - Anda harus memiliki role AFFILIATE')
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Gagal memuat data kupon')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCoupon = async () => {
    if (!selectedTemplate) return

    if (!customCode || customCode.length < 4) {
      toast.error('Kode kupon harus minimal 4 karakter')
      return
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9]+$/
    if (!codeRegex.test(customCode.toUpperCase())) {
      toast.error('Kode kupon hanya boleh huruf dan angka')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/affiliate/coupons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          customCode: customCode.toUpperCase(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Kupon berhasil dibuat!')
        setShowGenerateModal(false)
        setCustomCode('')
        setSelectedTemplate(null)
        fetchData()
      } else {
        const errorData = await response.json()
        console.error('Generate coupon error:', errorData)
        toast.error(errorData.error || 'Gagal membuat kupon')
      }
    } catch (error) {
      console.error('Error generating coupon:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleCoupon = async (coupon: AffiliateCoupon) => {
    setTogglingId(coupon.id)
    try {
      const response = await fetch(`/api/affiliate/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      if (response.ok) {
        toast.success(coupon.isActive ? 'Kupon dinonaktifkan' : 'Kupon diaktifkan')
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengubah status kupon')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return
    
    setDeletingId(couponToDelete.id)
    try {
      const response = await fetch(`/api/affiliate/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Kupon berhasil dihapus')
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus kupon')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setCouponToDelete(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode kupon disalin!')
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

  const canGenerateMore = (template: TemplateCoupon) => {
    if (!template.maxGeneratePerAffiliate) return true
    const myGeneratedCount = myCoupons.filter(
      c => c.basedOnCoupon?.code === template.code
    ).length
    return myGeneratedCount < template.maxGeneratePerAffiliate
  }

  const getGeneratedCount = (template: TemplateCoupon) => {
    return myCoupons.filter(c => c.basedOnCoupon?.code === template.code).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data kupon...</p>
        </div>
      </div>
    )
  }

  // Check if user has affiliate role
  const isAffiliate = session?.user?.role === 'AFFILIATE' || 
                      session?.user?.role === 'ADMIN' || 
                      session?.user?.role === 'FOUNDER' || 
                      session?.user?.role === 'CO_FOUNDER'

  if (!isAffiliate) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md border-2 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Akses Ditolak</CardTitle>
              <CardDescription>
                Halaman ini hanya dapat diakses oleh user dengan role AFFILIATE, ADMIN, FOUNDER, atau CO_FOUNDER.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Role Anda saat ini: <Badge variant="outline">{session?.user?.role || 'Tidak diketahui'}</Badge>
                </p>
                <p className="text-sm text-gray-600">
                  Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="coupons">
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 md:p-8 border border-orange-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
              <Ticket className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kupon Affiliate</h1>
              <p className="text-gray-600 mt-1">Generate dan kelola kupon diskon Anda sendiri</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-orange-100">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardDescription>Template Tersedia</CardDescription>
                  <CardTitle className="text-2xl">{templates.length}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-2 border-green-100">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardDescription>Kupon Saya</CardDescription>
                  <CardTitle className="text-2xl text-green-600">{myCoupons.length}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-2 border-purple-100">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardDescription>Total Penggunaan</CardDescription>
                  <CardTitle className="text-2xl text-purple-600">
                    {myCoupons.reduce((sum, c) => sum + c.usageCount, 0)}x
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>



        {/* Available Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-600" />
                  Template Kupon Tersedia
                </CardTitle>
                <CardDescription>
                  Pilih template dan buat kode kupon unik Anda sendiri
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Belum ada template kupon</p>
                <p className="text-sm mt-1">Admin belum membuat template kupon untuk affiliate</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const canGenerate = canGenerateMore(template)
                  const generatedCount = getGeneratedCount(template)

                  return (
                    <Card key={template.id} className="border-2 hover:border-orange-200 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <code className="text-lg font-mono font-bold text-orange-600">
                              {template.code}
                            </code>
                            <CardDescription className="mt-1 line-clamp-2">
                              {template.description || 'Tidak ada deskripsi'}
                            </CardDescription>
                          </div>
                          {template.discountType === 'PERCENTAGE' ? (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              {template.discountValue}%
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(Number(template.discountValue))}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Berlaku hingga:</span>
                            <span className="font-semibold">
                              {formatDate(template.validUntil)}
                            </span>
                          </div>
                          {template.maxGeneratePerAffiliate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Limit generate:</span>
                              <span className="font-semibold">
                                {generatedCount} / {template.maxGeneratePerAffiliate}
                              </span>
                            </div>
                          )}
                          {template.maxUsagePerCoupon && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Max usage:</span>
                              <span className="font-semibold">
                                {template.maxUsagePerCoupon}x per kupon
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setShowGenerateModal(true)
                          }}
                          disabled={!canGenerate || !template.isActive}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {canGenerate ? 'Buat Kupon' : 'Limit Tercapai'}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Coupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-green-600" />
              Kupon Saya
            </CardTitle>
            <CardDescription>Daftar kupon yang sudah Anda buat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Kupon</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead>Penggunaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Belum ada kupon</p>
                        <p className="text-sm">Buat kupon pertama Anda dari template di atas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    myCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-orange-50 text-orange-700 rounded font-mono text-sm font-bold">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCode(coupon.code)}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {coupon.basedOnCoupon && (
                            <p className="text-xs text-gray-500 mt-1">
                              Template: {coupon.basedOnCoupon.code}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              {coupon.discountValue}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              {formatCurrency(Number(coupon.discountValue))}
                            </Badge>
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
                          <Badge 
                            variant={coupon.isActive ? 'default' : 'secondary'}
                            className={coupon.isActive ? 'bg-green-100 text-green-800' : ''}
                          >
                            {coupon.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleCoupon(coupon)}
                              disabled={togglingId === coupon.id}
                              className="h-8 w-8 p-0"
                            >
                              {togglingId === coupon.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : coupon.isActive ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setCouponToDelete(coupon)
                                setShowDeleteDialog(true)
                              }}
                              disabled={deletingId === coupon.id || coupon.usageCount > 0}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === coupon.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Generate Modal */}
        {showGenerateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-600" />
                  Buat Kupon Baru
                </CardTitle>
                <CardDescription>
                  Buat kode kupon unik dari template yang dipilih
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Template Kupon</Label>
                  <div className="mt-2 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div className="flex justify-between items-center">
                      <code className="font-mono font-bold text-lg text-orange-700">{selectedTemplate.code}</code>
                      {selectedTemplate.discountType === 'PERCENTAGE' ? (
                        <Badge className="bg-green-100 text-green-800">
                          {selectedTemplate.discountValue}% OFF
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          {formatCurrency(Number(selectedTemplate.discountValue))} OFF
                        </Badge>
                      )}
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="customCode" className="text-sm font-medium">
                    Kode Kupon Anda <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customCode"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="NAMAKAMU50"
                    maxLength={20}
                    className="mt-2 font-mono text-lg uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tips: Gunakan nama + angka agar mudah diingat. Contoh: BUDI25, SARI50
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowGenerateModal(false)
                      setCustomCode('')
                      setSelectedTemplate(null)
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleGenerateCoupon}
                    disabled={generating || customCode.length < 4}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Kupon
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Kupon?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus kupon <strong>{couponToDelete?.code}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCoupon}
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
