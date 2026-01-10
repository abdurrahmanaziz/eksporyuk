'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Coins, 
  Clock, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Commission {
  id: string
  transactionId: string
  transaction: {
    id: string
    invoiceNumber: string
    amount: number
    status: string
    createdAt: string
    buyer: {
      name: string
      email: string
    } | null
    item: string
    itemType: string
  } | null
  commissionAmount: number
  commissionRate: number
  commissionType: string
  paidOut: boolean
  paidAt: string | null
  status: string
  createdAt: string
}

interface Stats {
  totalCommissions: number
  pendingAmount: number
  paidAmount: number
  refundedAmount: number
  totalTransactions: number
  pendingCount: number
  paidCount: number
}

export default function AffiliateCommissionsPage() {
  const { data: session } = useSession()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCommissions: 0,
    pendingAmount: 0,
    paidAmount: 0,
    refundedAmount: 0,
    totalTransactions: 0,
    pendingCount: 0,
    paidCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        period: periodFilter,
        page: page.toString(),
        limit: '20'
      })
      
      const res = await fetch(`/api/affiliate/commissions?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setCommissions(data.data)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommissions()
  }, [statusFilter, periodFilter, page])

  const getStatusBadge = (commission: Commission) => {
    if (commission.status === 'REFUNDED') {
      return <Badge variant="destructive">Refund</Badge>
    }
    if (commission.paidOut) {
      return <Badge className="bg-green-500">Dibayar</Badge>
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Komisi Saya</h1>
          <p className="text-muted-foreground">
            Lihat riwayat komisi dari transaksi affiliate Anda
          </p>
        </div>
        <Button onClick={fetchCommissions} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTransactions} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} transaksi menunggu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidCount} transaksi dibayar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refund</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.refundedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Komisi dari refund
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Riwayat Komisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Sudah Dibayar</SelectItem>
                <SelectItem value="refunded">Refund</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                <SelectItem value="15d">15 Hari Terakhir</SelectItem>
                <SelectItem value="30d">30 Hari Terakhir</SelectItem>
                <SelectItem value="thisMonth">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data komisi</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Pembeli</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Nilai Transaksi</TableHead>
                      <TableHead className="text-right">Komisi</TableHead>
                      <TableHead className="text-center">Rate</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(commission.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {commission.transaction?.invoiceNumber || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{commission.transaction?.buyer?.name || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {commission.transaction?.buyer?.email || ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{commission.transaction?.item || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {commission.transaction?.itemType === 'membership' ? 'Membership' : 'Produk'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(commission.transaction?.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(commission.commissionAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {commission.commissionType === 'PERCENTAGE' 
                              ? `${commission.commissionRate}%` 
                              : 'Flat'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(commission)}
                          {commission.paidAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(commission.paidAt)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Cara Kerja Komisi</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                <li>Komisi dihitung otomatis saat pembeli melakukan transaksi menggunakan link affiliate Anda</li>
                <li>Status <strong>Pending</strong> berarti komisi menunggu verifikasi admin</li>
                <li>Status <strong>Dibayar</strong> berarti komisi sudah masuk ke saldo wallet Anda</li>
                <li>Anda dapat menarik saldo di menu <strong>Penarikan</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
