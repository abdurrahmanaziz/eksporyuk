'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from 'lucide-react'

interface Payout {
  id: string
  userId: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  bankName: string
  accountNumber: string
  accountName: string
  notes?: string
  createdAt: string
  processedAt?: string
  processedBy?: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    affiliateProfile?: {
      affiliateCode: string
      tier: number
      totalEarnings: number
    }
  }
  wallet?: {
    balance: number
    balancePending: number
    totalEarnings: number
    totalPayout: number
  }
}

interface PayoutStats {
  totalRequests: number
  pendingAmount: number
  approvedAmount: number
  rejectedCount: number
}

export default function AdminAffiliatePayoutsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data state
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<PayoutStats>({
    totalRequests: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedCount: 0,
  })

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modal state
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // UI state
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Check admin access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/admin/affiliates/payouts?${params}`)
      const data = await response.json()

      if (data.success) {
        setPayouts(data.payouts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchData()
    }
  }, [status, session, statusFilter])

  // Handle approve payout
  const handleApprove = async () => {
    if (!selectedPayout) return

    try {
      setActionLoading(true)

      const response = await fetch(
        `/api/admin/affiliates/payouts/${selectedPayout.id}/approve`,
        { method: 'POST' }
      )

      const data = await response.json()

      if (data.success) {
        alert('✅ Payout berhasil disetujui!')
        setShowApproveModal(false)
        setSelectedPayout(null)
        fetchData()
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error approving payout:', error)
      alert('❌ Gagal menyetujui payout')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle reject payout
  const handleReject = async () => {
    if (!selectedPayout || !rejectReason.trim()) {
      alert('⚠️ Alasan penolakan harus diisi!')
      return
    }

    try {
      setActionLoading(true)

      const response = await fetch(
        `/api/admin/affiliates/payouts/${selectedPayout.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        }
      )

      const data = await response.json()

      if (data.success) {
        alert('✅ Payout berhasil ditolak')
        setShowRejectModal(false)
        setSelectedPayout(null)
        setRejectReason('')
        fetchData()
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error rejecting payout:', error)
      alert('❌ Gagal menolak payout')
    } finally {
      setActionLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500">⏳ Pending</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-500">✅ Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500">❌ Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading payouts...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/affiliates')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-2">
            Kelola Payout Affiliate
          </h1>
          <p className="text-gray-600 mt-1">
            Proses permintaan penarikan dana affiliate
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Permintaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.pendingAmount)}
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Dibayarkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.approvedAmount)}
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">
                {stats.rejectedCount}
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama, email, kode affiliate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData}>
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Affiliate</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Bank</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada data payout
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {payout.user.avatar ? (
                            <img
                              src={payout.user.avatar}
                              alt={payout.user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                              {payout.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{payout.user.name}</div>
                            <div className="text-sm text-gray-500">{payout.user.email}</div>
                            {payout.user.affiliateProfile && (
                              <div className="text-xs text-orange-600">
                                {payout.user.affiliateProfile.affiliateCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-green-600">
                          {formatCurrency(payout.amount)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{payout.bankName}</div>
                          <div className="text-gray-500">{payout.accountNumber}</div>
                          <div className="text-gray-500">{payout.accountName}</div>
                        </div>
                      </td>
                      <td className="p-3">{getStatusBadge(payout.status)}</td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(payout.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayout(payout)
                              setShowDetailModal(true)
                            }}
                          >
                            Detail
                          </Button>
                          {payout.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedPayout(payout)
                                  setShowApproveModal(true)
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedPayout(payout)
                                  setShowRejectModal(true)
                                }}
                              >
                                Reject
                              </Button>
                            </>
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
            <DialogTitle>Detail Payout</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Affiliate</label>
                  <div className="mt-1 font-medium">{selectedPayout.user.name}</div>
                  <div className="text-sm text-gray-500">{selectedPayout.user.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Kode Affiliate</label>
                  <div className="mt-1 font-medium">
                    {selectedPayout.user.affiliateProfile?.affiliateCode || '-'}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Informasi Bank</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Bank</label>
                    <div className="font-medium">{selectedPayout.bankName}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nomor Rekening</label>
                    <div className="font-medium">{selectedPayout.accountNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nama Rekening</label>
                    <div className="font-medium">{selectedPayout.accountName}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Informasi Payout</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Amount</label>
                    <div className="font-bold text-green-600 text-xl">
                      {formatCurrency(selectedPayout.amount)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedPayout.status)}</div>
                  </div>
                </div>
              </div>

              {selectedPayout.wallet && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Wallet Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600">Balance</label>
                      <div className="font-medium">{formatCurrency(selectedPayout.wallet.balance)}</div>
                    </div>
                    <div>
                      <label className="text-gray-600">Balance Pending</label>
                      <div className="font-medium">{formatCurrency(selectedPayout.wallet.balancePending)}</div>
                    </div>
                    <div>
                      <label className="text-gray-600">Total Earnings</label>
                      <div className="font-medium text-green-600">
                        {formatCurrency(selectedPayout.wallet.totalEarnings)}
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-600">Total Payout</label>
                      <div className="font-medium">{formatCurrency(selectedPayout.wallet.totalPayout)}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPayout.notes && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedPayout.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui payout ini?
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{selectedPayout.user.name}</div>
                    <div className="text-sm text-gray-600">{selectedPayout.user.email}</div>
                    <div className="font-bold text-green-600 text-xl mt-2">
                      {formatCurrency(selectedPayout.amount)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedPayout.bankName} - {selectedPayout.accountNumber}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Setelah disetujui, balance akan dikurangi dari wallet affiliate dan status tidak dapat diubah kembali.
                </p>
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
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Approve Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan payout
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-medium">{selectedPayout.user.name}</div>
                <div className="text-sm text-gray-600">{selectedPayout.user.email}</div>
                <div className="font-bold text-red-600 text-lg mt-1">
                  {formatCurrency(selectedPayout.amount)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan payout..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Affiliate akan menerima email notifikasi dengan alasan penolakan yang Anda berikan.
                </p>
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
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? 'Processing...' : 'Reject Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
