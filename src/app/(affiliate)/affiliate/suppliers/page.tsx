'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import {
  Store,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Package,
  Search,
  Filter,
} from 'lucide-react'

interface SupplierConversion {
  id: string
  createdAt: string
  commissionAmount: number
  paidOut: boolean
  paidOutAt: string | null
  transaction: {
    id: string
    amount: number
    status: string
    customerName: string | null
    customerEmail: string | null
    paidAt: string | null
    metadata?: any
  }
}

interface SupplierStats {
  totalSuppliers: number
  activeSuppliers: number
  totalCommission: number
  paidCommission: number
  pendingCommission: number
}

export default function AffiliateSuppliersPage() {
  const { data: session } = useSession()
  const [conversions, setConversions] = useState<SupplierConversion[]>([])
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchSupplierConversions()
  }, [statusFilter])

  const fetchSupplierConversions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/affiliate/suppliers?status=${statusFilter}`)
      const result = await response.json()
      if (response.ok) {
        setConversions(result.conversions || [])
        setStats(result.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching supplier conversions:', error)
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

  const filteredConversions = conversions.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.transaction.customerName?.toLowerCase().includes(query) ||
      conv.transaction.customerEmail?.toLowerCase().includes(query)
    )
  })

  const getStatusBadge = (paidOut: boolean) => {
    if (paidOut) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
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

  if (loading && conversions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4"
            style={{ borderTopColor: theme.primary }}
          ></div>
          <p className="text-gray-600">Memuat data supplier...</p>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="suppliers">
      <div className="min-h-screen bg-gray-50 px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <Store className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Supplier Referral</h1>
            <p className="text-gray-600 text-xs sm:text-base">
              Supplier yang daftar melalui link affiliate Anda
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <p className="text-[10px] sm:text-sm text-gray-600">Total Supplier</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <p className="text-[10px] sm:text-sm text-gray-600">Supplier Aktif</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeSuppliers}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              <p className="text-[10px] sm:text-sm text-gray-600">Total Komisi</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-gray-900">
              {formatCurrency(stats.totalCommission)}
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <p className="text-[10px] sm:text-sm text-gray-600">Komisi Dibayar</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-green-600">
              {formatCurrency(stats.paidCommission)}
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <p className="text-[10px] sm:text-sm text-gray-600">Komisi Pending</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingCommission)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 outline-none text-sm"
                style={{ '--tw-ring-color': theme.primary } as any}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={statusFilter === 'all' ? { backgroundColor: theme.primary } : {}}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'paid'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dibayar
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Conversions List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komisi
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredConversions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery
                        ? 'Tidak ada supplier yang cocok dengan pencarian'
                        : 'Belum ada supplier yang daftar melalui link Anda'}
                    </td>
                  </tr>
                ) : (
                  filteredConversions.map((conv) => (
                    <tr key={conv.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conv.transaction.customerName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{conv.transaction.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {conv.transaction.metadata?.packageName || 'Supplier Package'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(conv.transaction.amount)}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(conv.commissionAmount)}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">{getStatusBadge(conv.paidOut)}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm text-gray-600">{formatDate(conv.createdAt)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        <div
          className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border"
          style={{ backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 mt-0.5" style={{ color: theme.primary }} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Tips Meningkatkan Referral Supplier</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bagikan link affiliate Anda ke grup bisnis atau komunitas eksportir</li>
                <li>• Jelaskan benefit bergabung sebagai supplier di platform Eksporyuk</li>
                <li>• Dapatkan komisi 30% dari setiap supplier yang upgrade membership</li>
                <li>• Supplier yang upgrade ke membership komunitas akan masuk ke penjualan affiliate biasa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FeatureLock>
  )
}
