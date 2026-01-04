'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { redirect } from 'next/navigation'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Eye, X, Download, Shield } from 'lucide-react'
import SetPINModal from '@/components/modals/SetPINModal'
import VerifyPINModal from '@/components/modals/VerifyPINModal'
import ForgotPINModal from '@/components/modals/ForgotPINModal'
import { toast } from 'sonner'

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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    notes: ''
  })
  
  // PIN states
  const [hasPIN, setHasPIN] = useState(false)
  const [pinRequired, setPinRequired] = useState(true)
  const [showSetPINModal, setShowSetPINModal] = useState(false)
  const [showVerifyPINModal, setShowVerifyPINModal] = useState(false)
  const [showForgotPINModal, setShowForgotPINModal] = useState(false)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<any>(null)
  const [withdrawalSettings, setWithdrawalSettings] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status, session])

  useEffect(() => {
    fetchWallet()
    checkPINStatus()
    fetchWithdrawalSettings()
  }, [])

  const checkPINStatus = async () => {
    try {
      const response = await fetch('/api/user/withdrawal-pin')
      const data = await response.json()
      setHasPIN(data.hasPin)
    } catch (error) {
      console.error('Error checking PIN status:', error)
    }
  }

  const fetchWithdrawalSettings = async () => {
    try {
      const response = await fetch('/api/settings/withdrawal')
      const data = await response.json()
      if (data.settings) {
        setWithdrawalSettings(data.settings)
        setPinRequired(data.settings.withdrawalPinRequired ?? true)
      }
    } catch (error) {
      console.error('Error fetching withdrawal settings:', error)
    }
  }

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat saldo...</p>
        </div>
      </div>
    )
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate amount
    const amount = parseFloat(withdrawForm.amount)
    const minAmount = withdrawalSettings?.withdrawalMinAmount || 50000
    
    if (amount < minAmount) {
      toast.error(`Minimal penarikan Rp ${minAmount.toLocaleString('id-ID')}`)
      return
    }

    if (amount > (wallet?.balance || 0)) {
      toast.error('Saldo tidak mencukupi')
      return
    }

    // Check if PIN is required
    if (pinRequired) {
      if (!hasPIN) {
        toast.error('Anda harus mengatur PIN terlebih dahulu')
        setShowWithdrawModal(false)
        setShowSetPINModal(true)
        return
      }

      // Store withdrawal data and show PIN verification
      setPendingWithdrawal({
        amount,
        accountName: withdrawForm.accountName,
        accountNumber: withdrawForm.accountNumber,
        bankName: withdrawForm.bankName,
        notes: withdrawForm.notes
      })
      setShowWithdrawModal(false)
      setShowVerifyPINModal(true)
    } else {
      // Process without PIN
      await submitWithdrawal(null)
    }
  }

  const submitWithdrawal = async (pin: string | null) => {
    setWithdrawing(true)

    try {
      const withdrawalData = pendingWithdrawal || {
        amount: parseFloat(withdrawForm.amount),
        accountName: withdrawForm.accountName,
        accountNumber: withdrawForm.accountNumber,
        bankName: withdrawForm.bankName,
        notes: withdrawForm.notes
      }

      const response = await fetch('/api/affiliate/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...withdrawalData,
          pin: pin
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Permintaan penarikan berhasil diajukan!')
        setShowWithdrawModal(false)
        setShowVerifyPINModal(false)
        setWithdrawForm({ amount: '', accountName: '', accountNumber: '', bankName: '', notes: '' })
        setPendingWithdrawal(null)
        fetchWallet()
      } else {
        toast.error(data.error || 'Gagal mengajukan penarikan')
        setShowVerifyPINModal(false)
        setShowWithdrawModal(true)
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
      setShowVerifyPINModal(false)
      setShowWithdrawModal(true)
    } finally {
      setWithdrawing(false)
    }
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
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Saldo Wallet</p>
              <h1 className="text-5xl font-bold mb-2 text-white">
                Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                  {getRoleName(session?.user?.role || '')}
                </span>
                <span className="text-blue-100 text-sm">{session?.user?.name}</span>
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
                <span className="text-xs text-blue-100 font-medium">Total Penghasilan</span>
              </div>
              <p className="text-2xl font-bold text-white">
                Rp {wallet?.totalEarnings.toLocaleString('id-ID') || '0'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-400/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-100" />
                </div>
                <span className="text-xs text-blue-100 font-medium">Total Penarikan</span>
              </div>
              <p className="text-2xl font-bold text-white">
                Rp {wallet?.totalPayouts.toLocaleString('id-ID') || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
          onClick={() => setShowWithdrawModal(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Ajukan Penarikan</p>
              <p className="text-xs text-gray-500">Cairkan saldo Anda</p>
            </div>
          </div>
        </button>

        <button 
          className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all group ${
            hasPIN ? 'border-green-100 hover:border-green-300' : 'border-purple-100 hover:border-purple-300'
          } hover:shadow-md`}
          onClick={() => setShowSetPINModal(true)}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              hasPIN ? 'from-green-400 to-green-500' : 'from-purple-400 to-purple-500'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">
                {hasPIN ? 'Ubah PIN' : 'Atur PIN'}
              </p>
              <p className="text-xs text-gray-500">
                {hasPIN ? 'PIN sudah aktif' : 'Keamanan penarikan'}
              </p>
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
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b-2 border-blue-100">
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
            ))
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

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Ajukan Penarikan</h3>
                  <p className="text-blue-100 text-sm mt-1">Cairkan saldo ke rekening bank Anda</p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="p-6 space-y-4">
              {/* Available Balance */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Saldo Tersedia</p>
                <p className="text-3xl font-bold text-blue-600">
                  Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Penarikan <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  min={withdrawalSettings?.withdrawalMinAmount || 50000}
                  max={wallet?.balance || 0}
                  step="1000"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder={`Minimal Rp ${(withdrawalSettings?.withdrawalMinAmount || 50000).toLocaleString('id-ID')}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimal penarikan: Rp {(withdrawalSettings?.withdrawalMinAmount || 50000).toLocaleString('id-ID')} • 
                  Biaya admin: Rp {(withdrawalSettings?.withdrawalAdminFee || 5000).toLocaleString('id-ID')} • 
                  Maksimal: Rp {wallet?.balance.toLocaleString('id-ID') || '0'}
                </p>
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={withdrawForm.bankName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                >
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Permata</option>
                  <option value="Danamon">Danamon</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="BTN">BTN</option>
                  <option value="Maybank">Maybank</option>
                  <option value="OCBC NISP">OCBC NISP</option>
                  <option value="Panin">Panin</option>
                  <option value="Jenius">Jenius</option>
                  <option value="LINE Bank">LINE Bank</option>
                  <option value="SeaBank">SeaBank</option>
                  <option value="Jago">Bank Jago</option>
                  <option value="Neo Commerce">Neo Commerce</option>
                </select>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={withdrawForm.accountName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Sesuai dengan rekening bank"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Nomor rekening bank"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={withdrawForm.notes}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                  placeholder="Catatan tambahan untuk admin (opsional)"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {withdrawing ? 'Mengirim...' : 'Ajukan Penarikan'}
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mt-4">
                <p className="text-xs text-yellow-700 leading-relaxed">
                  ⚠️ <strong>Penting:</strong> Pastikan data rekening bank Anda benar. 
                  Proses penarikan akan diverifikasi oleh admin dan membutuhkan waktu 1-3 hari kerja.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Modals */}
      <SetPINModal
        open={showSetPINModal}
        onClose={() => setShowSetPINModal(false)}
        onSuccess={() => {
          checkPINStatus()
          toast.success('PIN berhasil disimpan!')
        }}
        hasExistingPin={hasPIN}
      />

      <VerifyPINModal
        open={showVerifyPINModal}
        onClose={() => {
          setShowVerifyPINModal(false)
          setShowWithdrawModal(true)
        }}
        onSuccess={(pin) => submitWithdrawal(pin)}
        amount={pendingWithdrawal?.amount || 0}
        onForgotPin={() => {
          setShowVerifyPINModal(false)
          setShowForgotPINModal(true)
        }}
      />

      <ForgotPINModal
        open={showForgotPINModal}
        onClose={() => {
          setShowForgotPINModal(false)
          setShowWithdrawModal(true)
        }}
        onSuccess={() => {
          checkPINStatus()
          setShowWithdrawModal(true)
        }}
      />
    </div>
    </ResponsivePageWrapper>
  )
}
