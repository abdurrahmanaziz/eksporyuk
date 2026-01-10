'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search,
  Download,
  Eye,
  Wallet,
  Users,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Building2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface Commission {
  id: string
  transactionId: string
  affiliateId: string
  commissionAmount: number
  commissionRate: number
  commissionType: 'PERCENTAGE' | 'FLAT'
  paidOut: boolean
  paidOutAt: string | null
  createdAt: string
  transaction: {
    id: string
    invoiceNumber: string | null
    amount: number
    type: string
    status: string
    customerName: string | null
    customerEmail: string | null
    itemName: string
    createdAt: string
    paidAt: string | null
  } | null
  affiliate: {
    id: string
    userId: string
    affiliateCode: string
    bankName: string | null
    bankAccountName: string | null
    bankAccountNumber: string | null
    user: {
      id: string
      name: string
      email: string
      whatsapp: string | null
    } | null
    walletBalance: number
  } | null
}

interface Stats {
  totalCommissions: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  paidCount: number
  unpaidCount: number
}

interface ChartData {
  date: string
  amount: number
  count: number
}

export default function AdminAffiliateCommissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Data state
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('30d')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [payoutNotes, setPayoutNotes] = useState('')

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch data
  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        period: periodFilter,
        search: searchQuery,
        page: page.toString(),
        limit: '50'
      })

      const response = await fetch(`/api/admin/affiliate-commissions?${params}`)
      const data = await response.json()

      if (data.success) {
        setCommissions(data.commissions)
        setStats(data.stats)
        setChartData(data.chartData)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    }
    setLoading(false)
  }, [statusFilter, periodFilter, searchQuery, page])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCommissions()
    }
  }, [status, fetchCommissions])

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const unpaidIds = commissions
        .filter(c => !c.paidOut)
        .map(c => c.id)
      setSelectedIds(new Set(unpaidIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
    setSelectAll(false)
  }

  // Process payout
  const handleProcessPayout = async () => {
    if (selectedIds.size === 0) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/affiliate-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversionIds: Array.from(selectedIds),
          notes: payoutNotes
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Berhasil memproses ${data.results?.length || 0} affiliate, total Rp ${data.totalPaid?.toLocaleString('id-ID')}`)
        setSelectedIds(new Set())
        setSelectAll(false)
        setShowPayoutModal(false)
        setPayoutNotes('')
        fetchCommissions()
      } else {
        alert(data.error || 'Gagal memproses pembayaran')
      }
    } catch (error) {
      console.error('Error processing payout:', error)
      alert('Terjadi kesalahan')
    }
    setProcessing(false)
  }

  // Calculate selected total
  const selectedTotal = commissions
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.commissionAmount, 0)

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  // Export CSV
  const handleExport = () => {
    const headers = ['Tanggal', 'Invoice', 'Pembeli', 'Item', 'Jumlah Transaksi', 'Affiliate', 'Kode', 'Komisi', 'Status']
    const rows = commissions.map(c => [
      formatDate(c.createdAt),
      c.transaction?.invoiceNumber || c.transactionId,
      c.transaction?.customerName || '-',
      c.transaction?.itemName || '-',
      c.transaction?.amount || 0,
      c.affiliate?.user?.name || '-',
      c.affiliate?.affiliateCode || '-',
      c.commissionAmount,
      c.paidOut ? 'Sudah Dibayar' : 'Belum Dibayar'
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `affiliate-commissions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Komisi Affiliate</h1>
            <p className="text-muted-foreground">
              Kelola pembayaran komisi affiliate per transaksi
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={fetchCommissions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Komisi</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{stats.totalCommissions} transaksi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Belum Dibayar</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.unpaidAmount)}</p>
                    <p className="text-xs text-muted-foreground">{stats.unpaidCount} transaksi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.paidAmount)}</p>
                    <p className="text-xs text-muted-foreground">{stats.paidCount} transaksi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(stats.totalCommissions > 0 ? stats.totalAmount / stats.totalCommissions : 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">per transaksi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tren Komisi (30 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Komisi']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari affiliate, pembeli, invoice..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="unpaid">Belum Dibayar</SelectItem>
                  <SelectItem value="paid">Sudah Dibayar</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={(value) => { setPeriodFilter(value); setPage(1) }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                  <SelectItem value="15d">15 Hari Terakhir</SelectItem>
                  <SelectItem value="30d">30 Hari Terakhir</SelectItem>
                  <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                  <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{selectedIds.size} komisi dipilih</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(selectedTotal)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSelectedIds(new Set()); setSelectAll(false) }}>
                    Batal Pilih
                  </Button>
                  <Button onClick={() => setShowPayoutModal(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proses Pembayaran
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        disabled={commissions.filter(c => !c.paidOut).length === 0}
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium">Tanggal</th>
                    <th className="p-4 text-left text-sm font-medium">Transaksi</th>
                    <th className="p-4 text-left text-sm font-medium">Affiliate</th>
                    <th className="p-4 text-left text-sm font-medium">Bank Info</th>
                    <th className="p-4 text-right text-sm font-medium">Komisi</th>
                    <th className="p-4 text-center text-sm font-medium">Status</th>
                    <th className="p-4 text-center text-sm font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada data komisi</p>
                      </td>
                    </tr>
                  ) : (
                    commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-muted/30">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedIds.has(commission.id)}
                            onCheckedChange={(checked) => handleSelectOne(commission.id, !!checked)}
                            disabled={commission.paidOut}
                          />
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {formatDate(commission.createdAt)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {commission.transaction?.invoiceNumber || commission.transactionId.substring(0, 12) + '...'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission.transaction?.customerName || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission.transaction?.itemName} • {formatCurrency(commission.transaction?.amount || 0)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {commission.affiliate?.user?.name || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission.affiliate?.affiliateCode || '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Saldo: {formatCurrency(commission.affiliate?.walletBalance || 0)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          {commission.affiliate?.bankName ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{commission.affiliate.bankName}</p>
                              <p className="text-xs text-muted-foreground">
                                {commission.affiliate.bankAccountNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {commission.affiliate.bankAccountName}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum diisi</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div>
                            <p className="font-bold text-green-600">
                              {formatCurrency(commission.commissionAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission.commissionType === 'FLAT' 
                                ? `Flat` 
                                : `${commission.commissionRate}%`}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {commission.paidOut ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Dibayar
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCommission(commission)
                              setShowDetailModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {commissions.length} dari {total} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Payout Modal */}
        <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Pembayaran Komisi</DialogTitle>
              <DialogDescription>
                Anda akan memproses pembayaran untuk {selectedIds.size} komisi
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Pembayaran:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedTotal)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Perhatian</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Saldo wallet affiliate akan berkurang setelah dikonfirmasi. Pastikan Anda sudah transfer manual ke rekening affiliate.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Catatan (opsional)</label>
                <Textarea
                  placeholder="Contoh: Transfer via BCA tanggal 10 Jan 2026"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutModal(false)}>
                Batal
              </Button>
              <Button onClick={handleProcessPayout} disabled={processing}>
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Konfirmasi Pembayaran
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Komisi</DialogTitle>
            </DialogHeader>
            {selectedCommission && (
              <div className="space-y-6">
                {/* Commission Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Jumlah Komisi</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedCommission.commissionAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCommission.commissionType === 'FLAT' 
                        ? 'Flat Rate' 
                        : `${selectedCommission.commissionRate}% dari transaksi`}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    {selectedCommission.paidOut ? (
                      <>
                        <Badge className="bg-green-100 text-green-700 mt-1">Sudah Dibayar</Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedCommission.paidOutAt && formatDate(selectedCommission.paidOutAt)}
                        </p>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 mt-1">Belum Dibayar</Badge>
                    )}
                  </div>
                </div>

                {/* Transaction Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Info Transaksi
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Invoice:</span>
                      <p className="font-medium">{selectedCommission.transaction?.invoiceNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pembeli:</span>
                      <p className="font-medium">{selectedCommission.transaction?.customerName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Item:</span>
                      <p className="font-medium">{selectedCommission.transaction?.itemName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Transaksi:</span>
                      <p className="font-medium">{formatCurrency(selectedCommission.transaction?.amount || 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tanggal Transaksi:</span>
                      <p className="font-medium">
                        {selectedCommission.transaction?.createdAt 
                          ? formatDate(selectedCommission.transaction.createdAt) 
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Affiliate Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Info Affiliate
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nama:</span>
                      <p className="font-medium">{selectedCommission.affiliate?.user?.name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kode Affiliate:</span>
                      <p className="font-medium">{selectedCommission.affiliate?.affiliateCode || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedCommission.affiliate?.user?.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">WhatsApp:</span>
                      <p className="font-medium">{selectedCommission.affiliate?.user?.whatsapp || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saldo Wallet:</span>
                      <p className="font-medium">{formatCurrency(selectedCommission.affiliate?.walletBalance || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Info Bank
                  </h4>
                  {selectedCommission.affiliate?.bankName ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bank:</span>
                        <p className="font-medium">{selectedCommission.affiliate.bankName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">No. Rekening:</span>
                        <p className="font-medium">{selectedCommission.affiliate.bankAccountNumber}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Atas Nama:</span>
                        <p className="font-medium">{selectedCommission.affiliate.bankAccountName}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Info bank belum diisi oleh affiliate</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Tutup
              </Button>
              {selectedCommission && !selectedCommission.paidOut && (
                <Button onClick={() => {
                  setSelectedIds(new Set([selectedCommission.id]))
                  setShowDetailModal(false)
                  setShowPayoutModal(true)
                }}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bayar Komisi Ini
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}
