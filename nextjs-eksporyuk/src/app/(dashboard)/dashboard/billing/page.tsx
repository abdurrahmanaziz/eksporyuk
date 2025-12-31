'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  Package,
  Star,
  Tag,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface Transaction {
  id: string
  invoiceNumber: string
  itemName: string
  itemType: string
  amount: number
  originalAmount: number | null
  discount: number | null
  discountAmount: number | null
  uniqueCode: number | null
  finalAmount: number
  status: string
  paymentMethod: string | null
  paymentUrl: string | null
  expiresAt: string | null
  timeRemaining: string | null
  expiresIn: number | null
  paidAt: string | null
  createdAt: string
  vaNumber: string | null
  vaBank: string | null
}

interface BillingData {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  summary: {
    pending: number
    paid: number
    totalPending: number
  }
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<BillingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchBilling = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/user/billing?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch billing')
      }
      
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching billing:', err)
      setError(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBilling()
  }, [page, statusFilter])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('Rp', 'Rp ')
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return {
      date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getItemIcon = (itemName: string, status: string) => {
    const lowerName = itemName.toLowerCase()
    if (lowerName.includes('lifetime') || lowerName.includes('premium')) {
      return <Star className="w-4 h-4" />
    }
    if (lowerName.includes('promo') || lowerName.includes('diskon')) {
      return <Tag className="w-4 h-4" />
    }
    return <Package className="w-4 h-4" />
  }

  const getItemIconBg = (itemName: string) => {
    const lowerName = itemName.toLowerCase()
    if (lowerName.includes('lifetime') || lowerName.includes('premium')) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
    }
    if (lowerName.includes('promo') || lowerName.includes('diskon')) {
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    }
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Memuat data tagihan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full mx-4 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Gagal Memuat Data</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => fetchBilling()} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Tagihan Saya</h1>
          <p className="text-slate-500 dark:text-slate-400">Kelola dan bayar tagihan membership Anda di satu tempat.</p>
        </div>

        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Belum Dibayar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Belum Dibayar</p>
                <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-500">{data.summary.pending}</h2>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Sudah Dibayar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Sudah Dibayar</p>
                <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{data.summary.paid}</h2>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Total Pending */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Pending</p>
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500">{formatPrice(data.summary.totalPending)}</h2>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 relative z-10">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-100/50 dark:bg-blue-500/5 rounded-full blur-2xl"></div>
            </div>
          </div>
        )}

        {/* Filter & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu Pembayaran</SelectItem>
                <SelectItem value="SUCCESS">Lunas</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <button 
              onClick={() => fetchBilling(true)}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {data?.pagination && (
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-800 dark:text-white">
                {((page - 1) * 8) + 1}-{Math.min(page * 8, data.pagination.total)}
              </span> dari <span className="font-medium text-slate-800 dark:text-white">{data.pagination.total}</span> tagihan
            </div>
          )}
        </div>

        {/* Transaction Table */}
        {data?.transactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Belum Ada Tagihan</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Anda belum memiliki tagihan atau transaksi</p>
            <Link href="/pricing">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Lihat Paket Membership
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Membership & ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Jumlah</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data?.transactions.map((tx, index) => {
                    const { date, time } = formatDate(tx.createdAt)
                    const isFirstPending = tx.status === 'PENDING' && index === 0
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-1 ${getItemIconBg(tx.itemName)}`}>
                              {getItemIcon(tx.itemName, tx.status)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{tx.itemName}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                {tx.invoiceNumber}
                                <button
                                  onClick={() => copyToClipboard(tx.invoiceNumber, tx.id)}
                                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                                >
                                  {copiedId === tx.id ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {date}
                          <span className="text-xs text-slate-400 block">{time}</span>
                        </td>
                        <td className="px-6 py-4">
                          {tx.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${isFirstPending ? 'animate-pulse' : ''}`}></span>
                              Menunggu
                            </span>
                          )}
                          {tx.status === 'SUCCESS' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              Lunas
                            </span>
                          )}
                          {tx.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <XCircle className="w-3 h-3" />
                              Gagal
                            </span>
                          )}
                          {tx.status === 'REFUNDED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                              <XCircle className="w-3 h-3" />
                              Refunded
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(tx.finalAmount)}</p>
                          {tx.uniqueCode && tx.uniqueCode > 0 && (
                            <p className="text-[10px] text-slate-400">Termasuk kode unik: +{tx.uniqueCode}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {tx.status === 'PENDING' && tx.paymentUrl && (
                            isFirstPending ? (
                              <Link href={tx.paymentUrl} target="_blank">
                                <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-1 mx-auto">
                                  Bayar
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            ) : (
                              <Link href={tx.paymentUrl} target="_blank">
                                <button className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs font-semibold px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                                  Bayar
                                </button>
                              </Link>
                            )
                          )}
                          {tx.status === 'SUCCESS' && tx.paidAt && (
                            <span className="text-xs text-slate-400">
                              {formatDate(tx.paidAt).date}
                            </span>
                          )}
                          {(tx.status === 'FAILED' || tx.status === 'REFUNDED') && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex justify-center pt-2 pb-8">
            <nav className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-500 px-2">Halaman {page} dari {data.pagination.totalPages}</span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={!data.pagination.hasMore}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
