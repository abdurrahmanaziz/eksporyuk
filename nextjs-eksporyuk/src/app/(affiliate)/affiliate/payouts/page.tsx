'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { getRoleTheme } from '@/lib/role-themes'
import FeatureLock from '@/components/affiliate/FeatureLock'
import {
  Wallet,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Filter,
} from 'lucide-react'

interface BankAccount {
  bankName: string
  accountName: string
  accountNumber: string
}

interface Payout {
  id: string
  amount: number
  status: string
  bankName: string | null
  accountName: string | null
  accountNumber: string | null
  notes: string | null
  approvedBy: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
}

interface PayoutsData {
  balance: {
    available: number
    pending: number
    totalEarnings: number
    minPayout: number
  }
  payouts: Payout[]
  bankAccount: BankAccount | null
}

export default function PayoutsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<PayoutsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all')
  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
  })

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/affiliate/payouts?status=${statusFilter}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!data?.bankAccount) {
      alert('Silakan lengkapi informasi rekening bank di halaman Profil terlebih dahulu')
      return
    }

    const amount = parseFloat(formData.amount)
    
    if (isNaN(amount) || amount <= 0) {
      alert('Jumlah penarikan tidak valid')
      return
    }

    if (data && amount < data.balance.minPayout) {
      alert(`Minimal penarikan adalah ${formatCurrency(data.balance.minPayout)}`)
      return
    }

    if (data && amount > data.balance.available) {
      alert('Saldo tidak mencukupi')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/affiliate/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          notes: formData.notes,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Request penarikan berhasil diajukan!')
        setShowForm(false)
        setFormData({ amount: '', notes: '' })
        fetchPayouts()
      } else {
        alert(result.error || 'Gagal mengajukan penarikan')
      }
    } catch (error) {
      console.error('Error submitting payout:', error)
      alert('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" />
            Disetujui
          </span>
        )
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Dibayar
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Ditolak
          </span>
        )
      default:
        return <span className="text-xs text-gray-500">{status}</span>
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto mb-4" 
               style={{ borderTopColor: theme.primary }}></div>
          <p className="text-gray-600">Memuat data penarikan...</p>
        </div>
      </div>
    )
  }

  return (
    <FeatureLock feature="payouts">
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Penarikan Dana</h1>
            <p className="text-gray-600 text-xs sm:text-base">Ajukan penarikan komisi affiliate</p>
          </div>
        </div>

        {data && data.balance.available >= data.balance.minPayout && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            Ajukan Penarikan
          </button>
        )}
      </div>

      {/* Balance Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <p className="text-green-100 text-[10px] sm:text-sm mb-0.5 sm:mb-1">Saldo Tersedia</p>
            <p className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
              <span className="hidden sm:inline">{formatCurrency(data.balance.available)}</span>
              <span className="sm:hidden">{(data.balance.available / 1000000).toFixed(1)}jt</span>
            </p>
            <p className="text-green-100 text-[10px] sm:text-xs">Bisa ditarik</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Sedang Diproses</p>
            <p className="text-xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
              <span className="hidden sm:inline">{formatCurrency(data.balance.pending)}</span>
              <span className="sm:hidden">{(data.balance.pending / 1000000).toFixed(1)}jt</span>
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">Menunggu approval</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total Penghasilan</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
              <span className="hidden sm:inline">{formatCurrency(data.balance.totalEarnings)}</span>
              <span className="sm:hidden">{(data.balance.totalEarnings / 1000000).toFixed(1)}jt</span>
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">Semua waktu</p>
          </div>
        </div>
      )}

      {/* Bank Account Warning */}
      {data && !data.bankAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">
                Informasi Rekening Bank Belum Lengkap
              </h3>
              <p className="text-xs sm:text-sm text-yellow-700 mb-2 sm:mb-3">
                Silakan lengkapi informasi rekening bank Anda di halaman Profil untuk bisa melakukan penarikan dana.
              </p>
              <a
                href="/affiliate/profile"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs sm:text-sm font-medium"
              >
                Lengkapi Profil
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Payout Warning */}
      {data && data.bankAccount && data.balance.available < data.balance.minPayout && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                Saldo Belum Mencukupi
              </h3>
              <p className="text-xs sm:text-sm text-blue-700">
                Minimal penarikan adalah {formatCurrency(data.balance.minPayout)}. 
                Saldo tersedia Anda saat ini: {formatCurrency(data.balance.available)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payout Form */}
      {showForm && data?.bankAccount && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Form Penarikan Dana</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Rekening Tujuan
              </label>
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                <p className="text-xs sm:text-sm font-medium text-gray-900">{data.bankAccount.bankName}</p>
                <p className="text-xs sm:text-sm text-gray-600">{data.bankAccount.accountNumber}</p>
                <p className="text-xs sm:text-sm text-gray-600">{data.bankAccount.accountName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Jumlah Penarikan
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-2.5 sm:top-3 text-gray-500 text-sm">Rp</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="0"
                  required
                  min={data.balance.minPayout}
                  max={data.balance.available}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                Min: {formatCurrency(data.balance.minPayout)} | Max: {formatCurrency(data.balance.available)}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                rows={3}
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? 'Memproses...' : 'Ajukan Penarikan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {['all', 'pending', 'approved', 'paid', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all capitalize ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Semua' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payouts History */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-sm sm:text-lg font-bold text-gray-900">Riwayat Penarikan</h2>
        </div>

        {data && data.payouts.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {data.payouts.map((payout) => (
                <div key={payout.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(payout.createdAt)}</span>
                    {getStatusBadge(payout.status)}
                  </div>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(payout.amount)}</p>
                  <div className="text-xs text-gray-600">
                    <p className="font-medium">{payout.bankName || 'N/A'}</p>
                    <p>{payout.accountNumber || 'N/A'} - {payout.accountName || 'N/A'}</p>
                  </div>
                  {payout.notes && (
                    <p className="text-xs text-gray-500">{payout.notes}</p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Jumlah
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Rekening Bank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Catatan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(payout.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(payout.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{payout.bankName || 'N/A'}</p>
                        <p className="text-gray-500">{payout.accountNumber || 'N/A'}</p>
                        <p className="text-gray-500">{payout.accountName || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                      {payout.paidAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          Dibayar: {formatDate(payout.paidAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs">
                        {payout.notes || '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="text-center py-8 sm:py-16">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-lg font-medium mb-1 sm:mb-2">Belum ada riwayat penarikan</p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Penarikan Anda akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
    </FeatureLock>
  )
}