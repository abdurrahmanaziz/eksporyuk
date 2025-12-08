'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface EarningsData {
  summary: {
    totalEarnings: number
    paidOut: number
    pending: number
    available: number
  }
  monthly: Array<{
    month: string
    earnings: number
    conversions: number
  }>
  transactions: Array<{
    id: string
    createdAt: string
    commissionAmount: number
    commissionRate: number
    paidOut: boolean
    paidOutAt: string | null
    transaction: {
      amount: number
      customerName: string | null
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
  }>
}

export default function EarningsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchEarnings()
  }, [statusFilter, period])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/affiliate/earnings?status=${statusFilter}&period=${period}`
      )
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
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
    }).format(new Date(dateString))
  }

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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat data penghasilan...</p>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="earnings">
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <DollarSign className="w-6 h-6" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penghasilan</h1>
          <p className="text-gray-600">Rincian komisi dan pendapatan affiliate</p>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm mb-1">Total Penghasilan</p>
            <p className="text-3xl font-bold mb-2">{formatCurrency(data.summary.totalEarnings)}</p>
            <p className="text-blue-100 text-xs">Semua waktu</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Sudah Dibayar</p>
            <p className="text-3xl font-bold text-green-600 mb-2">{formatCurrency(data.summary.paidOut)}</p>
            <p className="text-xs text-gray-500">Transfer selesai</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mb-2">{formatCurrency(data.summary.pending)}</p>
            <p className="text-xs text-gray-500">Menunggu pembayaran</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm mb-1">Tersedia</p>
            <p className="text-3xl font-bold mb-2">{formatCurrency(data.summary.available)}</p>
            <p className="text-green-100 text-xs">Bisa ditarik</p>
          </div>
        </div>
      )}

      {/* Monthly Trend Chart */}
      {data && data.monthly.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Trend Penghasilan Bulanan</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPeriod('30d')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === '30d'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setPeriod('90d')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === '90d'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                90 Hari
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  formatter={(value: any) => [formatCurrency(value), 'Penghasilan']}
                />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke={theme.primary}
                  strokeWidth={3}
                  dot={{ fill: theme.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'paid'
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Dibayar
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Komisi</h2>
        </div>
        
        {data && data.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Produk
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Nilai Transaksi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Komisi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {item.transaction.userProduct?.product.name || 
                         item.transaction.product?.name || 
                         'Produk'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.transaction.customerName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(Number(item.transaction.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {Number(item.commissionRate).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(Number(item.commissionAmount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.paidOut)}
                      {item.paidOut && item.paidOutAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(item.paidOutAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Belum ada penghasilan</p>
            <p className="text-gray-400 text-sm">
              Mulai promosikan produk untuk mendapatkan komisi
            </p>
          </div>
        )}
      </div>
    </div>
    </FeatureLock>
  )
}
