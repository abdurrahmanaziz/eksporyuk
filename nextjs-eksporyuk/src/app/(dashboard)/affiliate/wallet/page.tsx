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

type PendingWithdrawal = {
  amount: number
  accountName: string
  accountNumber: string
  bankName: string
  notes: string
  withdrawalType: 'manual' | 'instant'
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
    notes: '',
    withdrawalType: 'manual' as 'manual' | 'instant'
  })
  
  // PIN states
  const [hasPIN, setHasPIN] = useState(false)
  const [pinRequired, setPinRequired] = useState(true)
  const [showSetPINModal, setShowSetPINModal] = useState(false)
  const [showVerifyPINModal, setShowVerifyPINModal] = useState(false)
  const [showForgotPINModal, setShowForgotPINModal] = useState(false)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<PendingWithdrawal | null>(null)
  const [withdrawalSettings, setWithdrawalSettings] = useState<any>(null)
  const [xenditEnabled, setXenditEnabled] = useState(false)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [nameCheckResult, setNameCheckResult] = useState<string | null>(null)
  const [savedAccounts, setSavedAccounts] = useState<any[]>([])
  const [showSavedAccounts, setShowSavedAccounts] = useState(false)

  // Helper function to check if selected option is e-wallet
  const isEWallet = (bankName: string) => {
    const ewallets = ['OVO', 'GoPay', 'DANA', 'LinkAja', 'ShopeePay']
    return ewallets.includes(bankName)
  }

  // Function to check e-wallet account name
  const checkEWalletName = async (phoneNumber: string, ewalletType: string, forceRefresh: boolean = false) => {
    // Clean and normalize phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Nomor HP tidak valid. Minimal 10 digit.')
      return
    }
    
    setIsCheckingName(true)
    setNameCheckResult(null)
    
    try {
      // Try Xendit API first, then fallback to mock
      const response = await fetch('/api/ewallet/check-name-xendit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: ewalletType,
          phoneNumber: cleanPhone
        })
      })
      
      const data = await response.json()
      console.log('E-wallet check response:', data)
      
      if (response.ok && data.success && data.accountName) {
        const sourceInfo = data.source === 'xendit' ? ' (Xendit)' : ' (Dev Mode)'
        const cacheInfo = data.cached ? ' (cached)' : ''
        setNameCheckResult(data.accountName + sourceInfo + cacheInfo)
        
        // Auto-fill the name if found
        setWithdrawForm(prev => ({
          ...prev,
          accountName: data.accountName
        }))
        
        // Show success message with source info
        if (data.source === 'xendit') {
          toast.success(`✅ Akun terverifikasi via Xendit: ${data.accountName}`)
        } else {
          toast.success(`✅ Akun ditemukan: ${data.accountName} (Development Mode)`)
        }
      } else {
        // Handle different types of response errors more gracefully
        if (response.status >= 500) {
          // Only show "server error" for actual server errors (5xx)
          setNameCheckResult('Error server - coba lagi')
          toast.error('Server error. Silakan coba lagi.')
        } else if (response.status === 422) {
          // Handle validation errors (expected when account not found)
          const errorMsg = data.message || `Akun ${ewalletType} tidak ditemukan`
          setNameCheckResult(errorMsg)
          toast.warning(errorMsg)
        } else if (response.status === 401) {
          // Handle auth errors
          setNameCheckResult('Session expired')
          toast.error('Session expired. Please login again.')
        } else {
          // Handle other client errors
          setNameCheckResult(`Akun ${ewalletType} tidak ditemukan`)
          toast.warning(data.message || `Akun ${ewalletType} dengan nomor ${cleanPhone} tidak ditemukan. Pastikan nomor benar dan aktif.`)
        }
      }
    } catch (error) {
      console.error('Error checking e-wallet name:', error)
      setNameCheckResult('Koneksi bermasalah')
      toast.error('Masalah koneksi. Periksa internet Anda.')
    } finally {
      setIsCheckingName(false)
    }
  }

  // Function to load saved e-wallet accounts
  const loadSavedAccounts = async () => {
    try {
      const response = await fetch('/api/ewallet/accounts')
      const data = await response.json()
      
      if (data.success) {
        setSavedAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error loading saved accounts:', error)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status, session])

  useEffect(() => {
    fetchWallet()
    checkPINStatus()
    fetchWithdrawalSettings()
    loadSavedAccounts()
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
      const response = await fetch('/api/settings/withdrawal?t=' + Date.now(), {
        cache: 'no-store'
      })
      const data = await response.json()
      console.log('Withdrawal settings response:', data)
      if (data.settings) {
        setWithdrawalSettings(data.settings)
        setPinRequired(data.settings.withdrawalPinRequired ?? true)
        setXenditEnabled(data.settings.xenditEnabled ?? false)
        console.log('Xendit enabled set to:', data.settings.xenditEnabled)
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

    // Validate account name input
    if (!withdrawForm.accountName.trim()) {
      // For e-wallets, account name should be auto-filled from verification
      // If it's empty, it means verification wasn't done properly
      if (isEWallet(withdrawForm.bankName)) {
        toast.error('Nama pemilik akun harus diisi terlebih dahulu. Klik "Cek Nama Akun" untuk mendapatkannya secara otomatis.')
        return
      } else {
        // For banks, manual entry is required
        toast.error('Nama pemilik akun harus diisi')
        return
      }
    }

    // For e-wallet, ensure account name is verified
    if (isEWallet(withdrawForm.bankName)) {
      // Check if phone number is filled
      if (!withdrawForm.accountNumber.trim()) {
        toast.error('Nomor HP e-wallet harus diisi')
        return
      }

      // Check if name verification was done successfully
      const isVerified = nameCheckResult && 
                        !nameCheckResult.includes('tidak ditemukan') && 
                        !nameCheckResult.includes('Gagal') && 
                        !nameCheckResult.includes('Error') && 
                        !nameCheckResult.includes('bermasalah') &&
                        !nameCheckResult.includes('Koneksi') &&
                        !nameCheckResult.includes('Unable')

      if (!isVerified) {
        toast.error(`Silakan verifikasi nama akun ${withdrawForm.bankName} terlebih dahulu dengan klik tombol "Cek Nama Akun"`)
        return
      }

      // Ensure the verified name matches the input name

      const verifiedName = nameCheckResult?.replace(/ \(cached\)| \(live\)| \(saved\)/g, '') || ''
      if (verifiedName && withdrawForm.accountName !== verifiedName) {
        toast.warning(`Nama yang diinput (${withdrawForm.accountName}) tidak sama dengan nama terverifikasi (${verifiedName}). Menggunakan nama terverifikasi.`)
        setWithdrawForm(prev => ({
          ...prev,
          accountName: verifiedName
        }))
      }
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
        notes: withdrawForm.notes,
        withdrawalType: withdrawForm.withdrawalType
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
        notes: withdrawForm.notes,
        withdrawalType: withdrawForm.withdrawalType
      }

      // Choose endpoint based on withdrawal type and bank
      let endpoint: string
      let isEWalletWithdrawal = isEWallet(withdrawalData.bankName)
      
      if (withdrawalData.withdrawalType === 'instant') {
        if (isEWalletWithdrawal) {
          // Use new Xendit e-wallet endpoint
          endpoint = '/api/wallet/withdraw-ewallet'
        } else {
          // Use existing Xendit bank endpoint
          endpoint = '/api/affiliate/payouts/xendit'
        }
      } else {
        // Manual processing
        endpoint = '/api/affiliate/payouts'
      }

      // Prepare request payload based on endpoint
      let requestPayload: any
      
      if (isEWalletWithdrawal && withdrawalData.withdrawalType === 'instant') {
        // New e-wallet Xendit endpoint format
        requestPayload = {
          provider: withdrawalData.bankName,
          phoneNumber: withdrawalData.accountNumber,
          accountName: withdrawalData.accountName,
          amount: withdrawalData.amount,
          pin: pin
        }
      } else {
        // Existing format for bank transfers and manual processing
        requestPayload = {
          ...withdrawalData,
          pin: pin
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      })

      const data = await response.json()

      if (response.ok) {
        if (withdrawalData.withdrawalType === 'instant') {
          toast.success('🚀 Penarikan instant berhasil diproses! Dana akan dikirim dalam 5-10 menit.')
        } else {
          toast.success('Permintaan penarikan berhasil diajukan!')
        }
        
        setShowWithdrawModal(false)
        setShowVerifyPINModal(false)
        setWithdrawForm({ 
          amount: '', 
          accountName: '', 
          accountNumber: '', 
          bankName: '', 
          notes: '',
          withdrawalType: 'manual'
        })
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto my-8 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 text-white flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Ajukan Penarikan</h3>
                  <p className="text-blue-100 text-sm mt-1">Cairkan saldo ke rekening bank Anda</p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleWithdraw} className="p-4 sm:p-6 space-y-4">
                {/* Available Balance */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Saldo Tersedia</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
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

              {/* Withdrawal Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Metode Penarikan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      withdrawForm.withdrawalType === 'manual' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setWithdrawForm({ ...withdrawForm, withdrawalType: 'manual' })}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        withdrawForm.withdrawalType === 'manual' 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {withdrawForm.withdrawalType === 'manual' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-medium">Manual</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Diproses admin 1-3 hari kerja
                    </p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      !xenditEnabled 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        : withdrawForm.withdrawalType === 'instant' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => xenditEnabled && setWithdrawForm({ ...withdrawForm, withdrawalType: 'instant' })}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        !xenditEnabled
                          ? 'border-gray-300'
                          : withdrawForm.withdrawalType === 'instant' 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                      }`}>
                        {withdrawForm.withdrawalType === 'instant' && xenditEnabled && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className={`font-medium ${xenditEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                        Instant {!xenditEnabled && '(Belum Tersedia)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {xenditEnabled 
                        ? 'Otomatis via Xendit' 
                        : 'Memerlukan konfigurasi Xendit'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank/E-Wallet Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank/E-Wallet <span className="text-red-500">*</span>
                </label>
                <select
                  value={withdrawForm.bankName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                >
                  <option value="">Pilih Bank/E-Wallet</option>
                  
                  {/* E-Wallets */}
                  <optgroup label="E-Wallet">
                    <option value="OVO">OVO</option>
                    <option value="GoPay">GoPay</option>
                    <option value="DANA">DANA</option>
                    <option value="LinkAja">LinkAja</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </optgroup>
                  
                  {/* Major Banks */}
                  <optgroup label="Bank Utama">
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Permata">Permata</option>
                    <option value="Danamon">Danamon</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  </optgroup>
                  
                  {/* Digital Banks */}
                  <optgroup label="Bank Digital">
                    <option value="Jenius">Jenius</option>
                    <option value="LINE Bank">LINE Bank</option>
                    <option value="SeaBank">SeaBank</option>
                    <option value="Jago">Bank Jago</option>
                    <option value="Neo Commerce">Neo Commerce</option>
                    <option value="Blu BCA">Blu by BCA Digital</option>
                  </optgroup>
                  
                  {/* Other Banks */}
                  <optgroup label="Bank Lainnya">
                    <option value="BTN">BTN</option>
                    <option value="Maybank">Maybank</option>
                    <option value="OCBC NISP">OCBC NISP</option>
                    <option value="Panin">Panin</option>
                    <option value="BTPN">BTPN</option>
                    <option value="Bukopin">Bukopin</option>
                    <option value="Mega">Bank Mega</option>
                  </optgroup>
                </select>
              </div>

              {/* Account Name - Hidden for E-wallet */}
              {!isEWallet(withdrawForm.bankName) && (
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
                    placeholder="Nama sesuai rekening bank"
                  />
                </div>
              )}
              
              {/* E-wallet name auto-lookup info */}
              {isEWallet(withdrawForm.bankName) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Nama pemilik akan otomatis terdeteksi</strong> setelah Anda memasukkan nomor HP yang valid
                  </p>
                </div>
              )}

              {/* Account Number/Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isEWallet(withdrawForm.bankName) ? 'Nomor HP E-Wallet' : 'Nomor Rekening'} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={withdrawForm.accountNumber}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        
                        // For e-wallet, handle phone number format
                        if (isEWallet(withdrawForm.bankName)) {
                          console.log('Input phone number:', value) // Debug log
                          
                          // Remove country code if present
                          if (value.startsWith('62')) {
                            value = value.substring(2)
                          }
                          
                          // Clear existing name when number changes
                          if (withdrawForm.accountName) {
                            setWithdrawForm(prev => ({ ...prev, accountName: '' }));
                          }
                        }
                        
                        setWithdrawForm({ ...withdrawForm, accountNumber: value })
                      }}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono text-lg"
                      placeholder={
                        isEWallet(withdrawForm.bankName) 
                          ? 'Contoh: 08123456789 atau 8123456789' 
                          : 'Nomor rekening bank'
                      }
                    />
                  </div>
                  
                  {/* Manual Check Button for E-Wallet */}
                  {isEWallet(withdrawForm.bankName) && withdrawForm.accountNumber.length >= 10 && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Send phone number as-is, let backend handle normalization
                            checkEWalletName(withdrawForm.accountNumber, withdrawForm.bankName, false);
                          }}
                          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          disabled={isCheckingName}
                        >
                          {isCheckingName ? '🔄 Mengecek...' : '🔍 Cek Nama Akun'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            // Send phone number as-is, let backend handle normalization
                            checkEWalletName(withdrawForm.accountNumber, withdrawForm.bankName, true);
                          }}
                          className="bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          disabled={isCheckingName}
                          title="Force refresh - bypass cache"
                        >
                          🔄
                        </button>
                      </div>

                      {/* Saved Accounts Dropdown */}
                      {savedAccounts.length > 0 && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowSavedAccounts(!showSavedAccounts)}
                            className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            📱 {savedAccounts.length} akun tersimpan - klik untuk pilih
                          </button>
                          
                          {showSavedAccounts && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                              {savedAccounts
                                .filter(acc => acc.provider === withdrawForm.bankName)
                                .map(account => (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() => {
                                    setWithdrawForm(prev => ({
                                      ...prev,
                                      accountNumber: account.phoneNumber.startsWith('62') ? 
                                        '0' + account.phoneNumber.substring(2) : account.phoneNumber,
                                      accountName: account.accountName
                                    }));
                                    setNameCheckResult(account.accountName + ' (saved)');
                                    setShowSavedAccounts(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium">{account.accountName}</div>
                                  <div className="text-gray-500">{account.phoneNumber}</div>
                                </button>
                              ))}
                              {savedAccounts.filter(acc => acc.provider === withdrawForm.bankName).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Belum ada akun {withdrawForm.bankName} tersimpan
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Name Check Result */}
                      {nameCheckResult && (
                        <div className={`p-3 rounded-lg text-sm border ${
                          nameCheckResult.includes('tidak ditemukan') || nameCheckResult.includes('Gagal') || nameCheckResult.includes('Error') || nameCheckResult.includes('bermasalah') || nameCheckResult.includes('Koneksi')
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : nameCheckResult.includes('Akun') && nameCheckResult.includes('tidak ditemukan')
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {nameCheckResult.includes('tidak ditemukan') || nameCheckResult.includes('Gagal') || nameCheckResult.includes('Error') || nameCheckResult.includes('bermasalah') || nameCheckResult.includes('Koneksi') ? (
                            <div className="flex items-center gap-2">
                              <span className="text-red-500">❌</span>
                              <span>{nameCheckResult}</span>
                            </div>
                          ) : nameCheckResult.includes('Akun') && nameCheckResult.includes('tidak ditemukan') ? (
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-500">⚠️</span>
                              <span>{nameCheckResult}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              <span className="font-medium">{nameCheckResult}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {isEWallet(withdrawForm.bankName) && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>Format fleksibel:</strong> Bisa pakai 08xxx atau 8xxx. Klik tombol "Cek Nama" untuk memastikan akun valid.
                  </p>
                )}
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
                  className={`flex-1 py-3 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 ${
                    withdrawForm.withdrawalType === 'instant'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {withdrawing 
                    ? 'Memproses...' 
                    : withdrawForm.withdrawalType === 'instant'
                    ? '🚀 Tarik Dana Instant'
                    : '⏳ Ajukan Penarikan Manual'
                  }
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
        </div>
      )}      {/* PIN Modals */}
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
