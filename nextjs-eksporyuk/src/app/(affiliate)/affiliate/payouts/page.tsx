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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <Wallet className="w-6 h-6" style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Penarikan Dana</h1>
            <p className="text-gray-600">Ajukan penarikan komisi affiliate</p>
          </div>
        </div>

        {data && data.balance.available >= data.balance.minPayout && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
            Ajukan Penarikan
          </button>
        )}
      </div>

      {/* Balance Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm mb-1">Saldo Tersedia</p>
            <p className="text-3xl font-bold mb-2">{formatCurrency(data.balance.available)}</p>
            <p className="text-green-100 text-xs">Bisa ditarik</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Sedang Diproses</p>
            <p className="text-3xl font-bold text-yellow-600 mb-2">{formatCurrency(data.balance.pending)}</p>
            <p className="text-xs text-gray-500">Menunggu approval</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Penghasilan</p>
            <p className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(data.balance.totalEarnings)}</p>
            <p className="text-xs text-gray-500">Semua waktu</p>
          </div>
        </div>
      )}

      {/* Bank Account Warning */}
      {data && !data.bankAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                Informasi Rekening Bank Belum Lengkap
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Silakan lengkapi informasi rekening bank Anda di halaman Profil untuk bisa melakukan penarikan dana.
              </p>
              <a
                href="/affiliate/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Lengkapi Profil
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Payout Warning */}
      {data && data.bankAccount && data.balance.available < data.balance.minPayout && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Saldo Belum Mencukupi
              </h3>
              <p className="text-sm text-blue-700">
                Minimal penarikan adalah {formatCurrency(data.balance.minPayout)}. 
                Saldo tersedia Anda saat ini: {formatCurrency(data.balance.available)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payout Form */}
      {showForm && data?.bankAccount && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Form Penarikan Dana</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rekening Tujuan
              </label>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{data.bankAccount.bankName}</p>
                <p className="text-sm text-gray-600">{data.bankAccount.accountNumber}</p>
                <p className="text-sm text-gray-600">{data.bankAccount.accountName}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Penarikan
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0"
                  required
                  min={data.balance.minPayout}
                  max={data.balance.available}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Min: {formatCurrency(data.balance.minPayout)} | Max: {formatCurrency(data.balance.available)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Memproses...' : 'Ajukan Penarikan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          
          {['all', 'pending', 'approved', 'paid', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
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

      {/* Payouts History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Penarikan</h2>
        </div>

        {data && data.payouts.length > 0 ? (
          <div className="overflow-x-auto">
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
        ) : (
          <div className="text-center py-16">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Belum ada riwayat penarikan</p>
            <p className="text-gray-400 text-sm">
              Penarikan Anda akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
    </FeatureLock>
  )
}