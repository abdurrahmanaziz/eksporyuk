'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  ShoppingBag, 
  GraduationCap, 
  Crown, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  Eye,
  RefreshCw,
  Calendar,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

interface Transaction {
  id: string
  invoiceNumber: string | null
  type: 'MEMBERSHIP' | 'PRODUCT' | 'COURSE' | 'SUPPLIER' | 'OTHER'
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  amount: number
  description: string | null
  paymentMethod: string | null
  paymentUrl: string | null
  externalId: string | null
  createdAt: string
  paidAt: string | null
  expiredAt: string | null
  product?: {
    id: string
    name: string
    thumbnail: string | null
  } | null
  course?: {
    id: string
    title: string
    thumbnail: string | null
  } | null
  membership?: {
    id: string
    membershipId: string
    membership?: {
      name: string
    }
  } | null
}

interface TransactionStats {
  total: number
  pending: number
  paid: number
  failed: number
  totalAmount: number
}

const statusConfig = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  PAID: { label: 'Berhasil', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  FAILED: { label: 'Gagal', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  EXPIRED: { label: 'Kadaluarsa', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertCircle },
  REFUNDED: { label: 'Dikembalikan', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: RefreshCw },
}

const typeConfig = {
  MEMBERSHIP: { label: 'Membership', icon: Crown, color: 'text-purple-600' },
  PRODUCT: { label: 'Produk', icon: Package, color: 'text-blue-600' },
  COURSE: { label: 'Kursus', icon: GraduationCap, color: 'text-green-600' },
  SUPPLIER: { label: 'Database Supplier', icon: ShoppingBag, color: 'text-orange-600' },
  OTHER: { label: 'Lainnya', icon: CreditCard, color: 'text-gray-600' },
}

export default function TransactionsPage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchTransactions()
    fetchStats()
  }, [statusFilter, typeFilter, currentPage])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/user/transactions?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.transactions)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/transactions/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchTransactions()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTransactionTitle = (tx: Transaction) => {
    if (tx.type === 'MEMBERSHIP' && tx.membership?.membership?.name) {
      return `Membership ${tx.membership.membership.name}`
    }
    if (tx.type === 'PRODUCT' && tx.product?.name) {
      return tx.product.name
    }
    if (tx.type === 'COURSE' && tx.course?.title) {
      return tx.course.title
    }
    return tx.description || 'Transaksi'
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-gray-600 mt-1">Lihat semua transaksi pembelian Anda</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transaksi</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Menunggu</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Berhasil</p>
                  <p className="text-xl font-bold">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pembayaran</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Section */}
      <Card className="mb-6 border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="PAID">Berhasil</SelectItem>
                  <SelectItem value="FAILED">Gagal</SelectItem>
                  <SelectItem value="EXPIRED">Kadaluarsa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="MEMBERSHIP">Membership</SelectItem>
                  <SelectItem value="PRODUCT">Produk</SelectItem>
                  <SelectItem value="COURSE">Kursus</SelectItem>
                  <SelectItem value="SUPPLIER">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Belum Ada Transaksi</h3>
              <p className="text-gray-500 mt-1">Transaksi Anda akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => {
                const statusInfo = statusConfig[tx.status] || statusConfig.PENDING
                const typeInfo = typeConfig[tx.type] || typeConfig.OTHER
                const StatusIcon = statusInfo.icon
                const TypeIcon = typeInfo.icon

                return (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-lg bg-gray-100 ${typeInfo.color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-gray-900 truncate">
                              {getTransactionTitle(tx)}
                            </h4>
                            <Badge variant="outline" className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            {tx.invoiceNumber && (
                              <span className="font-mono">{tx.invoiceNumber}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(tx.createdAt), 'd MMM yyyy, HH:mm', { locale: localeId })}
                            </span>
                          </div>

                          {tx.paymentMethod && (
                            <p className="text-xs text-gray-400 mt-1">
                              {tx.paymentMethod}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(Number(tx.amount))}
                        </p>
                        
                        <div className="flex gap-2">
                          {tx.status === 'PENDING' && tx.paymentUrl && (
                            <Button size="sm" asChild>
                              <Link href={tx.paymentUrl} target="_blank">
                                Bayar
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/transactions/${tx.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
