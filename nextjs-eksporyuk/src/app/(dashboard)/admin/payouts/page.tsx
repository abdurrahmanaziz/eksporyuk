'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  Wallet,
  Search,
  Filter,
  User,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface PayoutRequest {
  id: string
  userId: string
  amount: number
  accountName: string
  accountNumber: string
  bankName: string
  notes: string | null
  status: string
  requestedAt: string
  processedAt: string | null
  rejectedReason: string | null
  user: {
    id: string
    name: string
    email: string
  }
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [rejectReason, setRejectReason] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 }
  })

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter })
      const response = await fetch(`/api/admin/payouts?${params}`)
      const data = await response.json()

      if (data.success) {
        setPayouts(data.payouts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const openActionModal = (payout: PayoutRequest, type: 'approve' | 'reject') => {
    setSelectedPayout(payout)
    setAction(type)
    setActionModalOpen(true)
    setRejectReason('')
  }

  const handleProcess = async () => {
    if (!selectedPayout) return

    if (action === 'reject' && !rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/payouts/${selectedPayout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectedReason: action === 'reject' ? rejectReason : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        setActionModalOpen(false)
        fetchPayouts()
      } else {
        alert(data.error || 'Failed to process payout')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: 'secondary',
      APPROVED: 'default',
      PAID: 'default',
      REJECTED: 'destructive'
    }
    const colors = {
      PENDING: 'bg-yellow-500',
      APPROVED: 'bg-blue-500',
      PAID: 'bg-green-500',
      REJECTED: 'bg-red-500'
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const filteredPayouts = payouts.filter(payout => 
    payout.user.name.toLowerCase().includes(search.toLowerCase()) ||
    payout.user.email.toLowerCase().includes(search.toLowerCase()) ||
    payout.accountNumber.includes(search)
  )

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground">
          Kelola permintaan pencairan saldo affiliate
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending.count}</div>
            <p className="text-xs text-yellow-600 mt-1">
              Rp {stats.pending.amount.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.approved.count}</div>
            <p className="text-xs text-blue-600 mt-1">
              Rp {stats.approved.amount.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.paid.count}</div>
            <p className="text-xs text-green-600 mt-1">
              Rp {stats.paid.amount.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.rejected.count}</div>
            <p className="text-xs text-red-600 mt-1">
              Rp {stats.rejected.amount.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari affiliate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <Button onClick={fetchPayouts} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPayouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada data payout
                </TableCell>
              </TableRow>
            ) : (
              filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    {format(new Date(payout.requestedAt), 'dd MMM yyyy', { locale: id })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.user.name}</p>
                      <p className="text-sm text-muted-foreground">{payout.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.bankName}</p>
                      <p className="text-sm text-muted-foreground font-mono">{payout.accountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    Rp {payout.amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPayout(payout)
                          setDetailModalOpen(true)
                        }}
                      >
                        Detail
                      </Button>
                      {payout.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600"
                            onClick={() => openActionModal(payout, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionModal(payout, 'reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Payout Request</DialogTitle>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informasi Affiliate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="font-medium">{selectedPayout.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedPayout.user.email}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Informasi Bank
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama Bank:</span>
                    <span className="font-medium">{selectedPayout.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama Pemilik:</span>
                    <span className="font-medium">{selectedPayout.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Rekening:</span>
                    <span className="font-mono font-medium">{selectedPayout.accountNumber}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Detail Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah:</span>
                    <span className="font-bold text-green-600 text-lg">
                      Rp {selectedPayout.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedPayout.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal Request:</span>
                    <span>
                      {format(new Date(selectedPayout.requestedAt), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </span>
                  </div>
                  {selectedPayout.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal Diproses:</span>
                      <span>
                        {format(new Date(selectedPayout.processedAt), 'dd MMMM yyyy HH:mm', { locale: id })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedPayout.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Catatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedPayout.notes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedPayout.rejectedReason && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                      <XCircle className="w-4 h-4" />
                      Alasan Penolakan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600">{selectedPayout.rejectedReason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Payout' : 'Reject Payout'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' 
                ? 'Confirm that you want to approve this payout request.' 
                : 'Please provide a reason for rejecting this payout request.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Affiliate:</span>
                  <span className="font-medium">{selectedPayout.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah:</span>
                  <span className="font-bold text-green-600">
                    Rp {selectedPayout.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bank:</span>
                  <span className="font-medium">{selectedPayout.bankName} - {selectedPayout.accountNumber}</span>
                </div>
              </div>

              {action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Jelaskan alasan penolakan..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
