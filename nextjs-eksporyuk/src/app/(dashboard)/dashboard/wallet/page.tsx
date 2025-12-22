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
      {/* Header Card - Blue Theme */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 md:p-8 transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 opacity-20 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-blue-100 font-medium text-sm md:text-base mb-1">Saldo Wallet</h2>
              <div className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide border border-white/10 text-white shadow-sm">
                  {getRoleName(session?.user?.role || '').toUpperCase()}
                </span>
                <span className="text-blue-100 text-sm font-medium">{session?.user?.name}</span>
              </div>
            </div>
            <div className="hidden sm:block p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              <Wallet className="w-7 h-7" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <div className="p-1.5 bg-green-400/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-300 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-medium">Total Penghasilan</span>
              </div>
              <span className="text-xl md:text-2xl font-bold">
                Rp {wallet?.totalEarnings.toLocaleString('id-ID') || '0'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <div className="p-1.5 bg-red-400/20 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-red-300 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-medium">Total Penarikan</span>
              </div>
              <span className="text-xl md:text-2xl font-bold">
                Rp {wallet?.totalPayouts.toLocaleString('id-ID') || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer flex flex-row md:flex-col items-center md:items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">Ajukan Penarikan</h3>
            <p className="text-xs text-gray-500">Cairkan saldo Anda</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-300 md:hidden" />
        </div>

        <div className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer flex flex-row md:flex-col items-center md:items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
            <Eye className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">Lihat Laporan</h3>
            <p className="text-xs text-gray-500">Detail penghasilan</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-300 md:hidden" />
        </div>

        <div className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer flex flex-row md:flex-col items-center md:items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center transition-transform group-hover:scale-110">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">Export Data</h3>
            <p className="text-xs text-gray-500">Download transaksi</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-300 md:hidden" />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 min-h-[300px] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Riwayat Transaksi</h3>
            <p className="text-sm text-gray-500 mt-1">
              {wallet?.transactions?.length || 0} transaksi ditemukan
            </p>
          </div>
          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          {!wallet?.transactions || wallet.transactions.length === 0 ? (
            <>
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Wallet className="w-10 h-10 text-gray-300" />
              </div>
              <h4 className="text-gray-800 font-semibold mb-2">Belum ada transaksi</h4>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Transaksi Anda akan muncul di sini setelah Anda melakukan aktivitas.
              </p>
            </>
          ) : (
            <div className="w-full divide-y divide-gray-100">
              {wallet.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Detail Transaksi</h3>
                  <p className="text-blue-100 text-sm mt-1">ID: {selectedTransaction.id.slice(0, 8)}...</p>
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
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
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
