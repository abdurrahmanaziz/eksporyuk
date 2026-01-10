'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Clock, Search, Check, X, DollarSign, 
  Loader2, AlertCircle, Wallet, RefreshCw,
  User, Package, Calendar
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { toast } from 'sonner'

interface PendingRevenue {
  id: string
  status: string
  type: string
  amount: number
  createdAt: string
  wallet: {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
  transaction?: {
    id: string
    amount: number
    type: string
    status: string
    createdAt: string
    customerName: string
    customerEmail: string
    productId: string
    product?: {
      name: string
    }
  }
}

export default function AdminPendingRevenuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [pendingRevenues, setPendingRevenues] = useState<PendingRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Action modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean
    action: 'approve' | 'reject' | null
    revenue: PendingRevenue | null
  }>({ open: false, action: null, revenue: null })
  const [actionNote, setActionNote] = useState('')
  const [adjustedAmount, setAdjustedAmount] = useState<number | undefined>()
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    fetchPendingRevenues()
  }, [session, status, router])

  const fetchPendingRevenues = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/pending-revenue')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPendingRevenues(data.data || [])
    } catch (error) {
      console.error('Error fetching pending revenues:', error)
      toast.error('Gagal memuat data pending revenue')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionModal.revenue || !actionModal.action) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/pending-revenue/${actionModal.revenue.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.action,
          note: actionNote,
          adjustedAmount: actionModal.action === 'approve' ? adjustedAmount : undefined
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message || `Revenue berhasil di-${actionModal.action === 'approve' ? 'approve' : 'reject'}`)
        fetchPendingRevenues()
        closeActionModal()
      } else {
        toast.error(data.error || 'Gagal memproses aksi')
      }
    } catch (error) {
      console.error('Error processing action:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const closeActionModal = () => {
    setActionModal({ open: false, action: null, revenue: null })
    setActionNote('')
    setAdjustedAmount(undefined)
  }

  const openActionModal = (revenue: PendingRevenue, action: 'approve' | 'reject') => {
    setActionModal({ open: true, action, revenue })
    if (action === 'approve') {
      setAdjustedAmount(revenue.amount)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'AFFILIATE_COMMISSION':
        return <Badge variant="secondary">Komisi Affiliate</Badge>
      case 'MENTOR_SHARE':
        return <Badge variant="secondary">Bagi Hasil Mentor</Badge>
      case 'FOUNDER_SHARE':
        return <Badge variant="secondary">Bagi Hasil Founder</Badge>
      case 'COFOUNDER_SHARE':
        return <Badge variant="secondary">Bagi Hasil Co-Founder</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-500">Admin</Badge>
      case 'MENTOR':
        return <Badge className="bg-blue-500">Mentor</Badge>
      case 'AFFILIATE':
        return <Badge className="bg-green-500">Affiliate</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Filter logic
  const filteredRevenues = pendingRevenues.filter(revenue => {
    const matchesSearch = 
      revenue.wallet?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.wallet?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.transaction?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || revenue.status === statusFilter
    const matchesType = typeFilter === 'all' || revenue.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Stats
  const stats = {
    total: pendingRevenues.length,
    pending: pendingRevenues.filter(r => r.status === 'PENDING').length,
    approved: pendingRevenues.filter(r => r.status === 'APPROVED').length,
    rejected: pendingRevenues.filter(r => r.status === 'REJECTED').length,
    totalPendingAmount: pendingRevenues
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + r.amount, 0)
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Revenue</h1>
            <p className="text-gray-600">Kelola komisi dan bagi hasil yang menunggu persetujuan</p>
          </div>
          <Button onClick={fetchPendingRevenues} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-xl font-bold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pending</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalPendingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama, email, atau produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="AFFILIATE_COMMISSION">Komisi Affiliate</SelectItem>
                  <SelectItem value="MENTOR_SHARE">Bagi Hasil Mentor</SelectItem>
                  <SelectItem value="FOUNDER_SHARE">Bagi Hasil Founder</SelectItem>
                  <SelectItem value="COFOUNDER_SHARE">Bagi Hasil Co-Founder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pending Revenue</CardTitle>
            <CardDescription>
              {filteredRevenues.length} dari {pendingRevenues.length} data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRevenues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">Tidak ada data pending revenue</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRevenues.map((revenue) => (
                      <TableRow key={revenue.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{revenue.wallet?.user?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{revenue.wallet?.user?.email}</p>
                              <div className="mt-1">{getRoleBadge(revenue.wallet?.user?.role || '')}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(revenue.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{revenue.transaction?.product?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(revenue.amount)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(revenue.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{formatDate(revenue.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {revenue.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => openActionModal(revenue, 'approve')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openActionModal(revenue, 'reject')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Action Modal */}
        <Dialog open={actionModal.open} onOpenChange={(open) => !open && closeActionModal()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionModal.action === 'approve' ? 'Approve Revenue' : 'Reject Revenue'}
              </DialogTitle>
              <DialogDescription>
                {actionModal.action === 'approve' 
                  ? 'Revenue akan ditransfer ke wallet penerima.'
                  : 'Revenue akan ditolak dan tidak ditransfer.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Revenue Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Penerima:</span>
                  <span className="font-medium">{actionModal.revenue?.wallet?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipe:</span>
                  <span>{actionModal.revenue?.type?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(actionModal.revenue?.amount || 0)}
                  </span>
                </div>
              </div>

              {/* Adjusted Amount (only for approve) */}
              {actionModal.action === 'approve' && (
                <div className="space-y-2">
                  <Label>Adjusted Amount (opsional)</Label>
                  <Input
                    type="number"
                    value={adjustedAmount}
                    onChange={(e) => setAdjustedAmount(Number(e.target.value))}
                    placeholder="Biarkan kosong untuk menggunakan amount default"
                  />
                  <p className="text-xs text-gray-500">
                    Ubah jika ingin menyesuaikan jumlah yang akan ditransfer
                  </p>
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label>Catatan {actionModal.action === 'reject' && '(wajib untuk reject)'}</Label>
                <Textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeActionModal} disabled={actionLoading}>
                Batal
              </Button>
              <Button
                onClick={handleAction}
                disabled={actionLoading || (actionModal.action === 'reject' && !actionNote)}
                className={actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}
