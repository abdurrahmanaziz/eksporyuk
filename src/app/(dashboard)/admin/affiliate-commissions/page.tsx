'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Coins, Clock, CheckCircle2, XCircle, Search, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Commission {
  id: string
  transactionId: string
  transaction: {
    id: string
    invoiceNumber: string
    amount: number
    status: string
    createdAt: string
    buyer: { name: string; email: string } | null
    item: string
    itemType: string
  } | null
  affiliate: { id: string; userId: string; name: string; email: string } | null
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
}

export default function AdminAffiliateCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats>({ totalCommissions: 0, pendingAmount: 0, paidAmount: 0, refundedAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, period: periodFilter, search, page: page.toString(), limit: '20' })
      const res = await fetch(`/api/admin/affiliate-commissions?${params}`)
      const data = await res.json()
      if (data.success) {
        setCommissions(data.data)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCommissions() }, [statusFilter, periodFilter, page])

  const handleMarkAsPaid = async () => {
    if (selectedIds.length === 0) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/affiliate-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversionIds: selectedIds })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSelectedIds([])
        fetchCommissions()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to update')
    } finally {
      setProcessing(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    const pendingIds = commissions.filter(c => !c.paidOut && c.status !== 'REFUNDED').map(c => c.id)
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds)
  }

  const getStatusBadge = (c: Commission) => {
    if (c.status === 'REFUNDED') return <Badge variant="destructive">Refund</Badge>
    if (c.paidOut) return <Badge className="bg-green-500">Dibayar</Badge>
    return <Badge variant="secondary">Pending</Badge>
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Komisi Affiliate</h1>
          <p className="text-muted-foreground">Kelola komisi affiliate dari semua transaksi</p>
        </div>
        <Button onClick={fetchCommissions} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Komisi</CardTitle><Coins className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Refund</CardTitle><XCircle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(stats.refundedAmount)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daftar Komisi</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari affiliate atau invoice..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchCommissions()} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Semua</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Dibayar</SelectItem><SelectItem value="refunded">Refund</SelectItem></SelectContent></Select>
            <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); setPage(1) }}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Periode" /></SelectTrigger><SelectContent><SelectItem value="all">Semua</SelectItem><SelectItem value="7d">7 Hari</SelectItem><SelectItem value="15d">15 Hari</SelectItem><SelectItem value="30d">30 Hari</SelectItem><SelectItem value="thisMonth">Bulan Ini</SelectItem></SelectContent></Select>
            {selectedIds.length > 0 && <Button onClick={handleMarkAsPaid} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Bayar ({selectedIds.length})</Button>}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Coins className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Belum ada data komisi</p></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><Checkbox checked={selectedIds.length === commissions.filter(c => !c.paidOut && c.status !== 'REFUNDED').length && selectedIds.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Komisi</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell><Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} disabled={c.paidOut || c.status === 'REFUNDED'} /></TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="font-mono text-sm">{c.transaction?.invoiceNumber || '-'}</TableCell>
                      <TableCell><div className="font-medium">{c.affiliate?.name || '-'}</div><div className="text-xs text-muted-foreground">{c.affiliate?.email}</div></TableCell>
                      <TableCell><div>{c.transaction?.item || '-'}</div><div className="text-xs text-muted-foreground">{c.transaction?.itemType === 'membership' ? 'Membership' : 'Produk'}</div></TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{formatCurrency(c.commissionAmount)}<div className="text-xs text-muted-foreground">{c.commissionType === 'PERCENTAGE' ? `${c.commissionRate}%` : 'Flat'}</div></TableCell>
                      <TableCell className="text-center">{getStatusBadge(c)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
