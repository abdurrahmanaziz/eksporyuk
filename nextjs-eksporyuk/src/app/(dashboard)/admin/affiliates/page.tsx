'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from 'next/navigation'
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  UserCheck,
  UserX,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface AffiliateStats {
  totalAffiliates: number
  activeAffiliates: number
  pendingApproval: number
  totalEarnings: number
  pendingPayouts: number
  totalPayouts: number
}

interface Affiliate {
  id: string
  userId: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  affiliateCode: string
  shortLinkUsername?: string
  tier: number
  commissionRate: number
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  isActive: boolean
  approvedAt?: string
  createdAt: string
  wallet?: {
    balance: number
    balancePending: number
    totalEarnings: number
    totalPayout: number
  }
}

export default function AffiliatesManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Check admin access
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchData()
    }
  }, [status, session, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch affiliates with filters
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      
      const response = await fetch(`/api/admin/affiliates?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setAffiliates(data.affiliates || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleApprove = async () => {
    if (!selectedAffiliate) return
    
    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/approve`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Affiliate berhasil disetujui!')
        setShowApproveModal(false)
        setSelectedAffiliate(null)
        fetchData()
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error approving affiliate:', error)
      alert('❌ Terjadi kesalahan saat menyetujui affiliate')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedAffiliate || !rejectReason.trim()) {
      alert('⚠️ Mohon isi alasan penolakan')
      return
    }
    
    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Affiliate berhasil ditolak')
        setShowRejectModal(false)
        setSelectedAffiliate(null)
        setRejectReason('')
        fetchData()
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error rejecting affiliate:', error)
      alert('❌ Terjadi kesalahan saat menolak affiliate')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (affiliate: Affiliate) => {
    if (!confirm(`Yakin ingin ${affiliate.isActive ? 'menonaktifkan' : 'mengaktifkan'} affiliate ini?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliate.id}/toggle-status`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('✅ Status berhasil diupdate')
        fetchData()
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('❌ Terjadi kesalahan')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data affiliate...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Manajemen Affiliate
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola approval, komisi, dan payout affiliate
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/affiliates/payouts')}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Kelola Payout
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Affiliate
              </CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeAffiliates} aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Approval
              </CardTitle>
              <Clock className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingApproval}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Menunggu review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Earnings
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalEarnings)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Komisi dihasilkan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Payout
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.pendingPayouts)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Menunggu pencairan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari nama, email, atau kode affiliate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Cari</Button>
            </form>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending Approval</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-600">Affiliate</th>
                  <th className="text-left p-4 font-medium text-gray-600">Kode</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-right p-4 font-medium text-gray-600">Klik</th>
                  <th className="text-right p-4 font-medium text-gray-600">Konversi</th>
                  <th className="text-right p-4 font-medium text-gray-600">Earnings</th>
                  <th className="text-right p-4 font-medium text-gray-600">Saldo</th>
                  <th className="text-center p-4 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      Tidak ada data affiliate
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
                            {affiliate.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{affiliate.user.name}</div>
                            <div className="text-sm text-gray-500">{affiliate.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm">{affiliate.affiliateCode}</div>
                        {affiliate.shortLinkUsername && (
                          <div className="text-xs text-gray-500">@{affiliate.shortLinkUsername}</div>
                        )}
                      </td>
                      <td className="p-4">
                        {!affiliate.approvedAt ? (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>
                        ) : affiliate.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Tidak Aktif</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="w-3 h-3 text-blue-600" />
                          <span className="font-medium">{affiliate.totalClicks}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="font-medium text-green-600">
                            {affiliate.totalConversions}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium text-green-600">
                          {formatCurrency(Number(affiliate.totalEarnings))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {affiliate.wallet ? (
                          <div>
                            <div className="font-medium">
                              {formatCurrency(Number(affiliate.wallet.balance))}
                            </div>
                            {affiliate.wallet.balancePending > 0 && (
                              <div className="text-xs text-orange-600">
                                +{formatCurrency(Number(affiliate.wallet.balancePending))} pending
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAffiliate(affiliate)
                              setShowDetailModal(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {!affiliate.approvedAt ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setShowApproveModal(true)
                                }}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setShowRejectModal(true)
                                }}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={affiliate.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}
                              onClick={() => handleToggleStatus(affiliate)}
                            >
                              {affiliate.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Affiliate</DialogTitle>
            <DialogDescription>
              Informasi lengkap affiliate dan performa
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nama</label>
                  <p className="mt-1">{selectedAffiliate.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1">{selectedAffiliate.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Kode Affiliate</label>
                  <p className="mt-1 font-mono">{selectedAffiliate.affiliateCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Short Link</label>
                  <p className="mt-1">
                    {selectedAffiliate.shortLinkUsername || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    {!selectedAffiliate.approvedAt ? (
                      <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                    ) : selectedAffiliate.isActive ? (
                      <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Tidak Aktif</Badge>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Statistik Performa</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Klik</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedAffiliate.totalClicks}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Konversi</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedAffiliate.totalConversions}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Earnings</div>
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(Number(selectedAffiliate.totalEarnings))}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAffiliate.wallet && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Informasi Wallet</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Saldo Tersedia</label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(Number(selectedAffiliate.wallet.balance))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Saldo Pending</label>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(Number(selectedAffiliate.wallet.balancePending))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Total Payout</label>
                      <p className="text-lg font-medium">
                        {formatCurrency(Number(selectedAffiliate.wallet.totalPayout))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Total Earnings</label>
                      <p className="text-lg font-medium">
                        {formatCurrency(Number(selectedAffiliate.wallet.totalEarnings))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Bergabung</label>
                    <p>{formatDate(selectedAffiliate.createdAt)}</p>
                  </div>
                  {selectedAffiliate.approvedAt && (
                    <div>
                      <label className="text-gray-600">Disetujui</label>
                      <p>{formatDate(selectedAffiliate.approvedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Affiliate</DialogTitle>
            <DialogDescription>
              Konfirmasi persetujuan affiliate ini
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Anda akan menyetujui <strong>{selectedAffiliate.user.name}</strong> sebagai affiliate.
                  Mereka akan mendapatkan akses penuh ke dashboard affiliate dan dapat mulai mempromosikan produk.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-600">Email</label>
                  <p className="font-medium">{selectedAffiliate.user.email}</p>
                </div>
                <div>
                  <label className="text-gray-600">Kode Affiliate</label>
                  <p className="font-mono font-medium">{selectedAffiliate.affiliateCode}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {actionLoading ? 'Memproses...' : 'Ya, Setujui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Affiliate</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan
            </DialogDescription>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Anda akan menolak aplikasi affiliate dari <strong>{selectedAffiliate.user.name}</strong>.
                  Mereka akan menerima notifikasi email tentang penolakan ini.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan (misal: tidak memenuhi syarat, profil tidak lengkap, dll)"
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false)
                setRejectReason('')
              }}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="bg-gradient-to-r from-red-600 to-rose-600"
            >
              {actionLoading ? 'Memproses...' : 'Ya, Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
