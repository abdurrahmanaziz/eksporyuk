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
}

interface Stats {
  totalSales: number
  totalRevenue: number
  totalTransactions: number
  averageOrderValue: number
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaksi</h1>
        <p className="text-gray-600">Kelola semua transaksi pembayaran</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Penjualan</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalSales.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalTransactions.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Rata-rata Order</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.averageOrderValue)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cari Transaksi
            </label>
            <input
              type="text"
              placeholder="ID, nama, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="SUCCESS">Berhasil</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Gagal</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Metode
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-semibold text-gray-900">
                        {tx.invoiceNumber || tx.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.customerName || tx.user?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tx.customerEmail || tx.user?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">
                          {tx.membership?.membership?.name || tx.product?.name || tx.course?.title || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tx.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(tx.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {tx.paymentMethod || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-6 py-4">
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
