'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Wallet,
  Copy,
  Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
        limit: '10',
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
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Pembayaran
          </Badge>
        )
      case 'SUCCESS':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Lunas
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-600 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Gagal
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data tagihan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gagal Memuat Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchBilling()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tagihan Saya</h1>
          <p className="text-gray-600">Kelola dan bayar tagihan membership Anda</p>
        </div>

        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700">Belum Dibayar</p>
                    <p className="text-xl font-bold text-yellow-800">{data.summary.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Sudah Dibayar</p>
                    <p className="text-xl font-bold text-green-800">{data.summary.paid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total Pending</p>
                    <p className="text-xl font-bold text-blue-800">{formatPrice(data.summary.totalPending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu Pembayaran</SelectItem>
                <SelectItem value="SUCCESS">Lunas</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" onClick={() => fetchBilling(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          {data?.transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Tagihan</h3>
                <p className="text-gray-600 mb-4">Anda belum memiliki tagihan atau transaksi</p>
                <Link href="/pricing">
                  <Button>
                    Lihat Paket Membership
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            data?.transactions.map((tx) => (
              <Card 
                key={tx.id} 
                className={`transition-all hover:shadow-md ${
                  tx.status === 'PENDING' ? 'border-yellow-200 bg-yellow-50/30' : ''
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left - Invoice Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          tx.status === 'PENDING' ? 'bg-yellow-100' :
                          tx.status === 'SUCCESS' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${
                            tx.status === 'PENDING' ? 'text-yellow-600' :
                            tx.status === 'SUCCESS' ? 'text-green-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{tx.itemName}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-mono truncate">{tx.invoiceNumber}</span>
                            <button
                              onClick={() => copyToClipboard(tx.invoiceNumber, tx.id)}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              {copiedId === tx.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {getStatusBadge(tx.status)}
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{formatDate(tx.createdAt)}</span>
                        {tx.status === 'PENDING' && tx.timeRemaining && tx.expiresIn && tx.expiresIn > 0 && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-yellow-600 font-medium">
                              Sisa {tx.timeRemaining}
                            </span>
                          </>
                        )}
                      </div>

                      {/* VA Info for pending */}
                      {tx.status === 'PENDING' && tx.vaNumber && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">No. Virtual Account ({tx.vaBank})</p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-semibold text-gray-900">{tx.vaNumber}</span>
                            <button
                              onClick={() => copyToClipboard(tx.vaNumber!, `va-${tx.id}`)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedId === `va-${tx.id}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right - Amount & Action */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        {tx.discountAmount && tx.discountAmount > 0 && (
                          <p className="text-sm text-gray-400 line-through">
                            {formatPrice(tx.originalAmount || tx.amount)}
                          </p>
                        )}
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(tx.finalAmount)}
                        </p>
                        {tx.uniqueCode && tx.uniqueCode > 0 && (
                          <p className="text-xs text-gray-500">
                            Termasuk kode unik: +{tx.uniqueCode}
                          </p>
                        )}
                      </div>
                      
                      {tx.status === 'PENDING' && tx.paymentUrl && (
                        <Link href={tx.paymentUrl} target="_blank">
                          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                            Bayar Sekarang
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                      
                      {tx.status === 'SUCCESS' && tx.paidAt && (
                        <p className="text-sm text-green-600">
                          Dibayar {formatDate(tx.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600 px-4">
              Halaman {page} dari {data.pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!data.pagination.hasMore}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
