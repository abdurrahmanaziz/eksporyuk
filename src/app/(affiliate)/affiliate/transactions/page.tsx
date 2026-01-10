'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
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
  DialogDescription,
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
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  User,
  CreditCard,
  Send,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  Mail,
  Wallet,
} from 'lucide-react'

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

interface Transaction {
  id: string
  transactionId: string
  invoiceNumber: string | null
  amount: number
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  status: string
  paymentMethod: string | null
  paidAt: string | null
  createdAt: string
  productName: string | null
  membershipName: string | null
  itemName: string
  commission: {
    amount: number
    rate: number
    paidOut: boolean
    paidOutAt: string | null
  } | null
}

interface Stats {
  totalTransactions: number
  paidTransactions: number
  pendingTransactions: number
  totalRevenue: number
  totalCommission: number
  paidCommission: number
  pendingCommission: number
}

interface TransactionsData {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: Stats
}

export default function AffiliateTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<TransactionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [limit, setLimit] = useState(20)
  
  // Follow Up States
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpTx, setFollowUpTx] = useState<Transaction | null>(null)
  const [processedMessage, setProcessedMessage] = useState('')
  
  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions()
    }
  }, [status, page, statusFilter, limit])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      })
      if (searchQuery) params.append('search', searchQuery)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/affiliate/transactions?${params}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      } else {
        toast.error('Gagal memuat data transaksi')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTransactions()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'SUCCESS':
      case 'COMPLETED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Lunas
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'EXPIRED':
      case 'FAILED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            {status === 'EXPIRED' ? 'Expired' : 'Gagal'}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        )
    }
  }

  const getCommissionStatusBadge = (commission: Transaction['commission']) => {
    if (!commission) {
      return <span className="text-gray-400 text-sm">-</span>
    }
    
    if (commission.paidOut) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Dibayar
        </Badge>
      )
    }
    
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  // Open follow up dialog
  const handleFollowUp = (tx: Transaction) => {
    setFollowUpTx(tx)
    setFollowUpOpen(true)
    
    const customerName = tx.customerName || 'Pelanggan'
    const firstName = customerName.split(' ')[0]
    const productName = tx.itemName || 'produk'
    
    // Generate default message based on status
    const defaultMsg = tx.status === 'PENDING' 
      ? `Halo ${firstName}! 👋\n\nSaya ${session?.user?.name || 'affiliate'} dari EksporYuk.\n\nSaya lihat pesanan Anda untuk *${productName}* belum diselesaikan.\n\n📦 *Detail Pesanan:*\n• Invoice: ${tx.invoiceNumber || '-'}\n• Total: ${formatCurrency(tx.amount)}\n\nApakah ada kendala saat pembayaran? Saya siap membantu! 😊`
      : `Halo ${firstName}! 👋\n\nTerima kasih sudah membeli *${productName}* di EksporYuk!\n\nPembayaran Anda sudah kami terima. Semoga produknya bermanfaat!\n\nJika ada pertanyaan, jangan ragu untuk menghubungi saya.\n\nSemoga sukses! 🚀`
    
    setProcessedMessage(defaultMsg)
  }

  // Send WhatsApp
  const sendWhatsApp = () => {
    if (!followUpTx || !processedMessage) return
    
    const phone = followUpTx.customerPhone || ''
    const cleanPhone = phone.replace(/\D/g, '')
    const waNumber = cleanPhone.startsWith('62') ? cleanPhone : `62${cleanPhone.replace(/^0/, '')}`
    
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(processedMessage)}`
    window.open(waUrl, '_blank')
    setFollowUpOpen(false)
    toast.success('WhatsApp dibuka')
  }

  // Copy message
  const copyMessage = () => {
    navigator.clipboard.writeText(processedMessage)
    toast.success('Pesan disalin ke clipboard')
  }

  // View detail
  const handleViewDetail = (tx: Transaction) => {
    setSelectedTx(tx)
    setDetailOpen(true)
  }

  // Export to CSV
  const handleExport = () => {
    if (!data?.transactions) return
    
    const headers = ['Tanggal', 'Invoice', 'Customer', 'Email', 'Phone', 'Produk', 'Amount', 'Status', 'Komisi', 'Status Komisi']
    const rows = data.transactions.map(tx => [
      formatDate(tx.createdAt),
      tx.invoiceNumber || '-',
      tx.customerName || '-',
      tx.customerEmail || '-',
      tx.customerPhone || '-',
      tx.itemName,
      tx.amount,
      tx.status,
      tx.commission?.amount || 0,
      tx.commission?.paidOut ? 'Dibayar' : 'Pending',
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `affiliate-transactions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success('Data berhasil diexport')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              Transaksi Affiliate
            </h1>
            <p className="text-gray-600 mt-1">
              Lihat semua transaksi dari referral Anda
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Transaksi</CardTitle>
                <ShoppingCart className="h-5 w-5 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.totalTransactions}</div>
                <p className="text-xs opacity-75">{data.stats.paidTransactions} lunas</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
                <TrendingUp className="h-5 w-5 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.stats.totalRevenue)}</div>
                <p className="text-xs opacity-75">dari referral Anda</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Komisi</CardTitle>
                <Wallet className="h-5 w-5 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.stats.totalCommission)}</div>
                <p className="text-xs opacity-75">{formatCurrency(data.stats.paidCommission)} dibayar</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Komisi Pending</CardTitle>
                <Clock className="h-5 w-5 opacity-75" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.stats.pendingCommission)}</div>
                <p className="text-xs opacity-75">menunggu pencairan</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="shadow-lg border-0 mb-6">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Cari nama, email, invoice..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="SUCCESS">Lunas</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Dari tanggal"
              />

              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Sampai tanggal"
              />

              {/* Search Button */}
              <Button onClick={() => { setPage(1); fetchTransactions() }} className="gap-2">
                <Search className="w-4 h-4" />
                Cari
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Transaksi ({data?.total || 0})
              </CardTitle>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchTransactions} className="gap-1">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[120px]">Invoice</TableHead>
                      <TableHead className="w-[180px]">Pembeli</TableHead>
                      <TableHead className="w-[150px]">Produk</TableHead>
                      <TableHead className="w-[110px]">Amount</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[110px]">Komisi</TableHead>
                      <TableHead className="w-[100px]">Status Komisi</TableHead>
                      <TableHead className="w-[120px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.transactions && data.transactions.length > 0 ? (
                      data.transactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-gray-50">
                          {/* Invoice */}
                          <TableCell>
                            <div className="font-mono font-semibold text-orange-600 text-sm">
                              {tx.invoiceNumber || `INV${tx.id.slice(0, 6).toUpperCase()}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatDate(tx.createdAt)}
                            </div>
                          </TableCell>

                          {/* Pembeli */}
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  {tx.customerName || '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {tx.customerEmail || '-'}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Produk */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900 line-clamp-2">
                                {tx.itemName}
                              </span>
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell>
                            <div className="font-bold text-green-600">
                              {formatCurrency(tx.amount)}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {getStatusBadge(tx.status)}
                          </TableCell>

                          {/* Komisi */}
                          <TableCell>
                            {tx.commission ? (
                              <div className="font-semibold text-orange-600">
                                {formatCurrency(tx.commission.amount)}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>

                          {/* Status Komisi */}
                          <TableCell>
                            {getCommissionStatusBadge(tx.commission)}
                          </TableCell>

                          {/* Aksi */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {/* WhatsApp Follow Up */}
                              {tx.customerPhone && ['SUCCESS', 'PENDING', 'PAID', 'COMPLETED'].includes(tx.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => handleFollowUp(tx)}
                                  title="Follow up via WhatsApp"
                                >
                                  <WhatsAppIcon className="w-4 h-4" />
                                </Button>
                              )}
                              
                              {/* View Detail */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewDetail(tx)}
                                title="Lihat detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="font-medium">Belum ada transaksi</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Bagikan link affiliate Anda untuk mendapatkan transaksi
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, data.total)} dari {data.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 text-sm text-gray-600">
                    {page} / {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow Up Dialog - Modern Design */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
          {/* Header with WhatsApp Gradient */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <WhatsAppIcon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Follow Up WhatsApp</h2>
                <p className="text-green-100 text-sm">Kirim pesan follow up ke pembeli</p>
              </div>
            </div>
          </div>
          
          {followUpTx && (
            <div className="p-5 space-y-4">
              {/* Customer Info Card - Modern Design */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-5 border border-green-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200/30 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                  {/* Customer Avatar & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {(followUpTx.customerName || 'P')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{followUpTx.customerName || 'Pelanggan'}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{followUpTx.customerPhone || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">Invoice</div>
                      <div className="font-mono font-bold text-gray-800 text-sm">{followUpTx.invoiceNumber || '-'}</div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      {getStatusBadge(followUpTx.status)}
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Produk</div>
                    <div className="font-medium text-gray-800">{followUpTx.itemName}</div>
                  </div>
                </div>
              </div>

              {/* Message Editor - Modern Design */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    Pesan WhatsApp
                  </label>
                  <span className="text-xs text-gray-400">{processedMessage.length} karakter</span>
                </div>
                <div className="relative">
                  <textarea
                    value={processedMessage}
                    onChange={(e) => setProcessedMessage(e.target.value)}
                    rows={7}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-400 text-sm resize-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Tulis pesan follow up..."
                  />
                  <div className="absolute bottom-3 right-3 flex gap-1">
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform" onClick={() => setProcessedMessage(prev => prev + ' 👋')}>👋</span>
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform" onClick={() => setProcessedMessage(prev => prev + ' 🚀')}>🚀</span>
                    <span className="text-2xl cursor-pointer hover:scale-110 transition-transform" onClick={() => setProcessedMessage(prev => prev + ' ✨')}>✨</span>
                  </div>
                </div>
              </div>

              {/* Actions - Modern Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-12 rounded-xl border-2 hover:bg-gray-50 font-semibold"
                  onClick={copyMessage}
                >
                  <Copy className="w-4 h-4" />
                  Salin
                </Button>
                <Button
                  className="flex-1 gap-2 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg shadow-green-200 transition-all duration-200 hover:shadow-xl hover:shadow-green-300"
                  onClick={sendWhatsApp}
                  disabled={!followUpTx.customerPhone}
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Kirim WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Modern Design */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
          {selectedTx && (
            <div className="relative">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 p-6 text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="text-orange-100 text-xs font-medium mb-1">INVOICE</div>
                  <div className="text-2xl font-bold font-mono tracking-wide">
                    {selectedTx.invoiceNumber || `INV${selectedTx.id.slice(0, 6).toUpperCase()}`}
                  </div>
                  <div className="text-orange-100 text-sm mt-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(selectedTx.createdAt)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Customer Card */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                    {(selectedTx.customerName || 'P')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{selectedTx.customerName || '-'}</div>
                    <div className="text-sm text-gray-500 truncate">{selectedTx.customerEmail || '-'}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {selectedTx.customerPhone || '-'}
                    </div>
                  </div>
                </div>

                {/* Product */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    PRODUK
                  </div>
                  <div className="font-bold text-gray-900">{selectedTx.itemName}</div>
                </div>

                {/* Amount & Commission Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                    <div className="text-xs text-green-600 font-semibold mb-1">TOTAL</div>
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(selectedTx.amount)}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                    <div className="text-xs text-orange-600 font-semibold mb-1">KOMISI</div>
                    <div className="text-lg font-bold text-orange-700">
                      {selectedTx.commission ? formatCurrency(selectedTx.commission.amount) : '-'}
                    </div>
                  </div>
                </div>

                {/* Status Row */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Status Transaksi</div>
                    {getStatusBadge(selectedTx.status)}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1.5">Status Komisi</div>
                    {getCommissionStatusBadge(selectedTx.commission)}
                  </div>
                </div>

                {/* WhatsApp Button */}
                {selectedTx.customerPhone && ['SUCCESS', 'PENDING', 'PAID', 'COMPLETED'].includes(selectedTx.status) && (
                  <Button
                    className="w-full gap-2 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg shadow-green-200 transition-all duration-200"
                    onClick={() => {
                      setDetailOpen(false)
                      handleFollowUp(selectedTx)
                    }}
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    Follow Up via WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
