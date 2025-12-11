'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { getRoleTheme } from '@/lib/role-themes'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Search,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  CreditCard,
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface Transaction {
  id: string
  amount: number
  originalAmount: number | null
  discountAmount: number | null
  affiliateShare: number | null
  status: string
  type: string
  paymentMethod: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  invoiceNumber: string | null
  createdAt: string
  user?: {
    name: string
    email: string
    memberCode: string | null
  }
  membership?: {
    membership: {
      name: string
    }
  }
  product?: {
    name: string
  }
  course?: {
    title: string
  }
  coupon?: {
    code: string
  } | null
  affiliateConversion?: {
    commissionAmount: number
    commissionRate: number
    paidOut: boolean
    affiliate: {
      user: {
        name: string
        memberCode: string | null
      }
    }
  } | null
}

interface Stats {
  totalSales: number
  totalRevenue: number
  totalTransactions: number
  averageOrderValue: number
  totalCommissions: number
  pendingCommissions: number
  successTransactions: number
  failedTransactions: number
  pendingTransactions: number
  totalDiscount: number
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    successTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    totalDiscount: 0,
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const theme = getRoleTheme(session?.user?.role || 'ADMIN')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, statusFilter, dateFrom, dateTo])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchTransactions(), fetchStats()])
    setLoading(false)
  }

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (dateFrom) params.append('startDate', dateFrom)
      if (dateTo) params.append('endDate', dateTo)

      const response = await fetch(`/api/admin/transactions?${params}`)
      const data = await response.json()
      
      if (data.transactions) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('startDate', dateFrom)
      if (dateTo) params.append('endDate', dateTo)

      const response = await fetch(`/api/admin/transactions/stats?${params}`)
      const data = await response.json()
      
      // Ensure stats has valid structure with fallback values
      setStats({
        totalSales: data?.totalSales ?? 0,
        totalRevenue: data?.totalRevenue ?? 0,
        totalTransactions: data?.totalTransactions ?? 0,
        averageOrderValue: data?.averageOrderValue ?? 0,
        totalCommissions: data?.totalCommissions ?? 0,
        pendingCommissions: data?.pendingCommissions ?? 0,
        successTransactions: data?.successTransactions ?? 0,
        failedTransactions: data?.failedTransactions ?? 0,
        pendingTransactions: data?.pendingTransactions ?? 0,
        totalDiscount: data?.totalDiscount ?? 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (dateFrom) params.append('startDate', dateFrom)
      if (dateTo) params.append('endDate', dateTo)

      const response = await fetch(`/api/admin/transactions/export?${params}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Berhasil
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Gagal
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredTransactions = transactions.filter(tx => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      tx.id.toLowerCase().includes(searchLower) ||
      tx.invoiceNumber?.toLowerCase().includes(searchLower) ||
      tx.customerName?.toLowerCase().includes(searchLower) ||
      tx.customerEmail?.toLowerCase().includes(searchLower) ||
      tx.user?.name.toLowerCase().includes(searchLower) ||
      tx.user?.email.toLowerCase().includes(searchLower) ||
      tx.membership?.membership?.name.toLowerCase().includes(searchLower) ||
      tx.product?.name.toLowerCase().includes(searchLower) ||
      tx.course?.title.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <ResponsivePageWrapper>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Kelola semua transaksi pembayaran</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-md">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sukses</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.successTransactions}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.pendingTransactions}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-md">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gagal</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.failedTransactions}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Komisi Aff</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                {formatCurrency(stats.totalCommissions)}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border-0">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Diskon</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(stats.totalDiscount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cari Transaksi
            </label>
            <input
              type="text"
              placeholder="ID, nama, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="SUCCESS">Berhasil</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Gagal</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Member ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Harga Asli
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Diskon
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Final
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Affiliate
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      {tx.user?.memberCode ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                          {tx.user.memberCode}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.customerName || tx.user?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.customerEmail || tx.user?.email || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {tx.membership?.membership?.name || tx.product?.name || tx.course?.title || 'N/A'}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {tx.type || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">
                        {formatCurrency(tx.originalAmount || tx.amount)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {tx.discountAmount && tx.discountAmount > 0 ? (
                        <div>
                          <p className="text-sm font-medium text-red-600">
                            -{formatCurrency(tx.discountAmount)}
                          </p>
                          {tx.coupon && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                              {tx.coupon.code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(tx.amount)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {tx.affiliateConversion ? (
                        <div>
                          <p className="text-xs text-gray-600">{tx.affiliateConversion.affiliate.user.name}</p>
                          <p className="text-sm font-medium text-blue-600">
                            {formatCurrency(tx.affiliateConversion.commissionAmount)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${tx.affiliateConversion.paidOut ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {tx.affiliateConversion.paidOut ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">
                        {formatDate(tx.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
          </p>
        </div>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
