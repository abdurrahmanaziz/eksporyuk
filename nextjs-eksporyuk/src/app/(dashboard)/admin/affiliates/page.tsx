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
  totalSales: number
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
  totalSales: number
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                Total Omset
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalSales || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total penjualan via affiliate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Komisi
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalEarnings)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dari semua penjualan affiliate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Saldo Pending
              </CardTitle>
              <Wallet className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.pendingPayouts)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Siap untuk ditarik
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Payout
              </CardTitle>
              <ArrowDownRight className="w-4 h-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(stats.totalPayouts)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sudah dicairkan
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

      {/* Affiliates Table - Compact Design */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Affiliate</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left p-4 font-medium text-gray-600">Affiliate</th>
                  <th className="text-left p-4 font-medium text-gray-600">Kode</th>
                  <th className="text-center p-4 font-medium text-gray-600">Status</th>
                  <th className="text-right p-4 font-medium text-gray-600">Total Komisi</th>
                  <th className="text-center p-4 font-medium text-gray-600 w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500">
                      Tidak ada data affiliate
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {affiliate.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate max-w-[180px]">{affiliate.user.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[180px]">{affiliate.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{affiliate.affiliateCode}</span>
                      </td>
                      <td className="p-4 text-center">
                        {!affiliate.approvedAt ? (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Pending</Badge>
                        ) : affiliate.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-semibold text-green-600 text-sm">
                          {formatCurrency(Number(affiliate.totalEarnings))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {affiliate.totalConversions} transaksi
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAffiliate(affiliate)
                              setShowDetailModal(true)
                            }}
                            className="text-xs h-8"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Detail
                          </Button>
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

      {/* Detail Modal - Enhanced with Actions */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {selectedAffiliate && (
            <div className="space-y-0">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl shrink-0 border-2 border-white/30">
                    {selectedAffiliate.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl">{selectedAffiliate.user.name}</h3>
                    <p className="text-white/80 text-sm">{selectedAffiliate.user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-xs bg-white/20 px-2 py-1 rounded">{selectedAffiliate.affiliateCode}</span>
                      {selectedAffiliate.shortLinkUsername && (
                        <span className="text-xs text-white/70">@{selectedAffiliate.shortLinkUsername}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {!selectedAffiliate.approvedAt ? (
                      <Badge className="bg-orange-200 text-orange-800 border-0">Pending</Badge>
                    ) : selectedAffiliate.isActive ? (
                      <Badge className="bg-green-200 text-green-800 border-0">Aktif</Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-800 border-0">Nonaktif</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl text-center border border-blue-100">
                    <ArrowUpRight className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{selectedAffiliate.totalClicks}</div>
                    <div className="text-xs text-blue-600/70 font-medium">Total Klik</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl text-center border border-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{selectedAffiliate.totalConversions}</div>
                    <div className="text-xs text-green-600/70 font-medium">Konversi</div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl text-center border border-indigo-100">
                    <DollarSign className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                    <div className="text-base font-bold text-indigo-600">{formatCurrency(Number(selectedAffiliate.totalSales || 0))}</div>
                    <div className="text-xs text-indigo-600/70 font-medium">Total Omset</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl text-center border border-purple-100">
                    <Wallet className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                    <div className="text-base font-bold text-purple-600">{formatCurrency(Number(selectedAffiliate.totalEarnings))}</div>
                    <div className="text-xs text-purple-600/70 font-medium">Total Komisi</div>
                  </div>
                </div>

                {/* Wallet Info */}
                {selectedAffiliate.wallet && (
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-700">
                      <Wallet className="w-4 h-4" /> Informasi Wallet
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Saldo Tersedia</label>
                        <p className="text-lg font-bold text-green-600 mt-1">
                          {formatCurrency(Number(selectedAffiliate.wallet.balance))}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Saldo Pending</label>
                        <p className="text-lg font-bold text-orange-500 mt-1">
                          {formatCurrency(Number(selectedAffiliate.wallet.balancePending))}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Total Payout</label>
                        <p className="font-semibold text-gray-700 mt-1">{formatCurrency(Number(selectedAffiliate.wallet.totalPayout))}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Total Earnings</label>
                        <p className="font-semibold text-gray-700 mt-1">{formatCurrency(Number(selectedAffiliate.wallet.totalEarnings))}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Info */}
                <div className="flex justify-center gap-6 text-sm text-gray-500 py-3 border-y">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Bergabung: {formatDate(selectedAffiliate.createdAt)}</span>
                  </div>
                  {selectedAffiliate.approvedAt && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Disetujui: {formatDate(selectedAffiliate.approvedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {!selectedAffiliate.approvedAt ? (
                    <>
                      <Button
                        onClick={() => {
                          setShowDetailModal(false)
                          setShowApproveModal(true)
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 flex-1 h-11"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Setujui Affiliate
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDetailModal(false)
                          setShowRejectModal(true)
                        }}
                        className="flex-1 h-11"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Tolak
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant={selectedAffiliate.isActive ? "destructive" : "default"}
                      onClick={() => {
                        handleToggleStatus(selectedAffiliate)
                        setShowDetailModal(false)
                      }}
                      className={`w-full h-11 ${!selectedAffiliate.isActive ? "bg-gradient-to-r from-green-600 to-emerald-600" : ""}`}
                    >
                      {selectedAffiliate.isActive ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Nonaktifkan Affiliate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aktifkan Affiliate
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>      {/* Approve Modal */}
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
