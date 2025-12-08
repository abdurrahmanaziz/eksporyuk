'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { redirect } from 'next/navigation'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Eye, X, Download } from 'lucide-react'

type Transaction = {
  id: string
  type: string
  amount: number
  description: string
  metadata: any
  createdAt: string
}

type WalletData = {
  balance: number
  totalEarnings: number
  totalPayouts: number
  transactions: Transaction[]
}

export default function UserWalletPage() {
  const { data: session, status } = useSession()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status, session])

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet')
      const data = await response.json()
      if (data.wallet) {
        // Map response to match our WalletData type
        setWallet({
          balance: data.wallet.balance || 0,
          totalEarnings: data.wallet.totalEarnings || 0,
          totalPayouts: data.wallet.totalPayout || 0,
          transactions: data.wallet.transactions || []
        })
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat saldo...</p>
        </div>
      </div>
    )
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin'
      case 'MENTOR': return 'Mentor'
      case 'AFFILIATE': return 'Affiliate'
      case 'MEMBER_PREMIUM': return 'Member Premium'
      case 'MEMBER_FREE': return 'Member Free'
      default: return 'User'
    }
  }

  return (
    <ResponsivePageWrapper>
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Saldo Wallet</p>
              <h1 className="text-5xl font-bold mb-2">
                Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {getRoleName(session?.user?.role || '')}
                </span>
                <span className="text-orange-100 text-sm">{session?.user?.name}</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-400/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-100" />
                </div>
                <span className="text-xs text-orange-100 font-medium">Total Penghasilan</span>
              </div>
              <p className="text-2xl font-bold">
                Rp {wallet?.totalEarnings.toLocaleString('id-ID') || '0'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-400/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-100" />
                </div>
                <span className="text-xs text-orange-100 font-medium">Total Penarikan</span>
              </div>
              <p className="text-2xl font-bold">
                Rp {wallet?.totalPayouts.toLocaleString('id-ID') || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white p-6 rounded-xl shadow-sm border-2 border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Ajukan Penarikan</p>
              <p className="text-xs text-gray-500">Cairkan saldo Anda</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Lihat Laporan</p>
              <p className="text-xs text-gray-500">Detail penghasilan</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-xl shadow-sm border-2 border-green-100 hover:border-green-300 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Export Data</p>
              <p className="text-xs text-gray-500">Download transaksi</p>
            </div>
          </div>
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-white border-b-2 border-orange-100">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h2>
          <p className="text-sm text-gray-600 mt-1">
            {wallet?.transactions?.length || 0} transaksi ditemukan
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {!wallet?.transactions || wallet.transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Belum ada transaksi</p>
              <p className="text-sm text-gray-400 mt-1">Transaksi Anda akan muncul di sini</p>
            </div>
          ) : (
            wallet.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-6 hover:bg-orange-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTransaction(tx)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'COMMISSION' || tx.type === 'REFUND' 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      {tx.type === 'COMMISSION' || tx.type === 'REFUND' ? (
                        <ArrowDownRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          tx.type === 'COMMISSION' ? 'bg-green-100 text-green-700' :
                          tx.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-700' :
                          tx.type === 'REFUND' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-xl font-bold ${
                      tx.type === 'COMMISSION' || tx.type === 'REFUND' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'COMMISSION' || tx.type === 'REFUND' ? '+' : '-'}
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detail Transaksi</h3>
                  <p className="text-orange-100 text-sm mt-1">ID: {selectedTransaction.id.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Tipe Transaksi</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 text-sm font-bold rounded-full inline-block ${
                    selectedTransaction.type === 'COMMISSION' ? 'bg-green-100 text-green-700' :
                    selectedTransaction.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-700' :
                    selectedTransaction.type === 'REFUND' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedTransaction.type}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Jumlah</label>
                <p className={`text-3xl font-bold mt-1 ${
                  selectedTransaction.type === 'COMMISSION' || selectedTransaction.type === 'REFUND' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'COMMISSION' || selectedTransaction.type === 'REFUND' ? '+' : '-'}
                  Rp {selectedTransaction.amount.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Deskripsi</label>
                <p className="text-gray-900 mt-1">{selectedTransaction.description}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Tanggal & Waktu</label>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedTransaction.createdAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>

              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Informasi Tambahan</label>
                  <div className="mt-1 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
