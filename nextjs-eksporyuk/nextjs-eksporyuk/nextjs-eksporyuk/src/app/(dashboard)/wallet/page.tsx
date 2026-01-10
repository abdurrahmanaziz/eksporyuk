'use client'

import { useState, useEffect } from 'react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react'

interface WalletData {
  balance: number
  totalEarnings: number
  totalPayout: number
  transactions: any[]
  payouts: any[]
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('bank')
  const [accountDetails, setAccountDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  })

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet')
      const data = await response.json()
      setWallet(data.wallet)
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      alert('Masukkan jumlah payout yang valid')
      return
    }

    if (!wallet || Number(payoutAmount) > wallet.balance) {
      alert('Saldo tidak mencukupi')
      return
    }

    try {
      const response = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payoutAmount),
          method: payoutMethod,
          accountDetails
        })
      })

      if (response.ok) {
        alert('Permintaan payout berhasil! Menunggu approval admin.')
        setPayoutAmount('')
        setAccountDetails({ bankName: '', accountNumber: '', accountName: '' })
        fetchWallet()
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal request payout')
      }
    } catch (error) {
      console.error('Payout error:', error)
      alert('Gagal request payout')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-orange-600" />
            Wallet Saya
          </h1>
          <p className="text-gray-600 mt-2">Kelola saldo dan komisi Anda</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Saldo Tersedia</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Penghasilan</p>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Rp {wallet?.totalEarnings.toLocaleString('id-ID') || '0'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Penarikan</p>
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Rp {wallet?.totalPayout.toLocaleString('id-ID') || '0'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payout Request */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Payout</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="100000"
                  min="0"
                  max={wallet?.balance || 0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal: Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="bank">Transfer Bank</option>
                  <option value="gopay">GoPay</option>
                  <option value="ovo">OVO</option>
                  <option value="dana">DANA</option>
                </select>
              </div>

              {payoutMethod === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      value={accountDetails.bankName}
                      onChange={(e) => setAccountDetails({...accountDetails, bankName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="BCA, Mandiri, BNI, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={accountDetails.accountNumber}
                      onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      value={accountDetails.accountName}
                      onChange={(e) => setAccountDetails({...accountDetails, accountName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="John Doe"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleRequestPayout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Request Payout
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Transaksi Terakhir</h2>
            
            <div className="space-y-3">
              {wallet?.transactions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada transaksi</p>
              ) : (
                wallet?.transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className={`text-right ${Number(tx.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <p className="text-sm font-bold">
                        {Number(tx.amount) > 0 ? '+' : ''}Rp {Math.abs(Number(tx.amount)).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs">{tx.type}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Payout History */}
        {wallet && wallet.payouts.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Riwayat Payout</h2>
            
            <div className="space-y-3">
              {wallet.payouts.map((payout: any) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {payout.status === 'COMPLETED' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : payout.status === 'REJECTED' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Rp {Number(payout.amount).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500">{payout.method} • {new Date(payout.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    payout.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {payout.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
