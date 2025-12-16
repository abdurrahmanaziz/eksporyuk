'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
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
} from 'lucide-react'

interface Conversion {
  id: string
  createdAt: string
  commissionAmount: number
  commissionRate: number
  paidOut: boolean
  paidOutAt: string | null
  transaction: {
    id: string
    amount: number
    customerName: string | null
    customerEmail: string | null
    status: string
    product?: {
      name: string
    }
    userProduct?: {
      product: {
        name: string
      }
    }
  }
}

interface ConversionsData {
  conversions: Conversion[]
  total: number
  totalEarnings: number
  paidOut: number
  pending: number
}

export default function ConversionsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ConversionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchConversions()
  }, [page, statusFilter])

  const fetchConversions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/affiliate/conversions?page=${page}&limit=${limit}&status=${statusFilter}&search=${searchQuery}`
      )
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching conversions:', error)
    } finally {
      setLoading(false)
    }
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getStatusBadge = (paidOut: boolean) => {
    if (paidOut) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Dibayar
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    )
  }

  const handleSearch = () => {
    setPage(1)
    fetchConversions()
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat data konversi...</p>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="conversions">
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Konversi & Penjualan</h1>
            <p className="text-gray-600 text-xs sm:text-base">Daftar semua penjualan dari link affiliate kamu</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total Konversi</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <p className="text-green-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Total Komisi</p>
            <p className="text-lg sm:text-3xl font-bold">
              <span className="hidden sm:inline">{formatCurrency(data.totalEarnings)}</span>
              <span className="sm:hidden">{(data.totalEarnings / 1000000).toFixed(1)}jt</span>
            </p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Sudah Dibayar</p>
            <p className="text-lg sm:text-3xl font-bold text-green-600">
              <span className="hidden sm:inline">{formatCurrency(data.paidOut)}</span>
              <span className="sm:hidden">{(data.paidOut / 1000000).toFixed(1)}jt</span>
            </p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Pending</p>
            <p className="text-lg sm:text-3xl font-bold text-yellow-600">
              <span className="hidden sm:inline">{formatCurrency(data.pending)}</span>
              <span className="sm:hidden">{(data.pending / 1000000).toFixed(1)}jt</span>
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari customer, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  statusFilter === 'paid'
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Dibayar
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
            </div>

            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">Cari</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conversions Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {data && data.conversions.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {data.conversions.map((conversion) => (
                <div key={conversion.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(conversion.createdAt)}</span>
                    {getStatusBadge(conversion.paidOut)}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conversion.transaction.userProduct?.product.name || 
                     conversion.transaction.product?.name || 
                     'Produk'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{conversion.transaction.customerName || 'N/A'}</span>
                    <span className="text-gray-600">{formatCurrency(Number(conversion.transaction.amount))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Rate: {Number(conversion.commissionRate).toFixed(0)}%</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(Number(conversion.commissionAmount))}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Komisi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.conversions.map((conversion) => (
                  <tr key={conversion.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(conversion.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {conversion.transaction.userProduct?.product.name || 
                         conversion.transaction.product?.name || 
                         'Produk'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {conversion.transaction.customerName || 'N/A'}
                        </div>
                        {conversion.transaction.customerEmail && (
                          <div className="text-xs text-gray-500">
                            {conversion.transaction.customerEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(conversion.transaction.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {Number(conversion.commissionRate).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(Number(conversion.commissionAmount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(conversion.paidOut)}
                      {conversion.paidOut && conversion.paidOutAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(conversion.paidOutAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="text-center py-8 sm:py-16">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-lg font-medium mb-1 sm:mb-2">Belum ada konversi</p>
            <p className="text-gray-400 text-xs sm:text-sm px-4">
              Mulai promosikan link affiliate kamu untuk mendapatkan konversi
            </p>
          </div>
        )}

        {/* Pagination */}
        {data && data.conversions.length > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-600">
              {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)} dari {data.total}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600">
                {page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= data.total}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 text-xs sm:text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </FeatureLock>
  )
}
