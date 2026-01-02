'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Upload, 
  Check, 
  AlertCircle, 
  Clock, 
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface TransactionDetails {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  type: string
  itemName: string
  customerName: string
  customerEmail: string
  createdAt: string
  paymentMethod: string | null
  paymentProofUrl: string | null
  paymentProofSubmittedAt: string | null
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}

interface PaymentSettings {
  csWhatsApp?: string
  manualBanks: Array<{
    id: string
    bankName: string
    bankCode: string
  }>
}

export default function ConfirmPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const transactionId = params.transactionId as string

  const [details, setDetails] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [senderName, setSenderName] = useState('')
  const [senderBank, setSenderBank] = useState('')
  const [csWhatsApp, setCSWhatsApp] = useState('')
  const [manualBanks, setManualBanks] = useState<Array<{id: string, bankName: string, bankCode: string}>>([])  
  const hasAutoFilledRef = useRef(false)

  // Fetch transaction details
  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/payment/confirm/${transactionId}`)
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Transaksi tidak ditemukan')
      }

      const data = await res.json()
      setDetails(data.transaction)
      
      // If already has proof, show it
      if (data.transaction.paymentProofUrl) {
        setPreviewUrl(data.transaction.paymentProofUrl)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  // Fetch payment settings (CS WhatsApp and manual banks)
  const fetchPaymentSettings = useCallback(async () => {
    try {
      console.log('Fetching payment settings...');
      
      // Fetch CS WhatsApp from settings
      const settingsResponse = await fetch('/api/admin/settings/payment');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('Settings data:', settingsData);
        
        // Extract CS WhatsApp
        if (settingsData.success && settingsData.data) {
          const settings = settingsData.data;
          setCSWhatsApp(settings.customerServiceWhatsApp || '');
        }
      }
      
      // Fetch manual banks
      const banksResponse = await fetch('/api/manual-banks');
      if (banksResponse.ok) {
        const banksData = await banksResponse.json();
        console.log('Manual banks data:', banksData);
        
        if (banksData.success && banksData.data) {
          setManualBanks(banksData.data.map((bank: any) => ({
            id: bank.id,
            bankName: bank.bankName,
            bankCode: bank.bankCode
          })));
        }
      } else {
        // Fallback to common banks and e-wallets if API fails
        const fallbackBanks = [
          // Traditional Banks
          { id: 'bca', bankName: 'Bank Central Asia (BCA)', bankCode: 'BCA' },
          { id: 'bri', bankName: 'Bank Rakyat Indonesia (BRI)', bankCode: 'BRI' },
          { id: 'bni', bankName: 'Bank Negara Indonesia (BNI)', bankCode: 'BNI' },
          { id: 'btn', bankName: 'Bank Tabungan Negara (BTN)', bankCode: 'BTN' },
          { id: 'mandiri', bankName: 'Bank Mandiri', bankCode: 'MANDIRI' },
          { id: 'cimb', bankName: 'CIMB Niaga', bankCode: 'CIMB' },
          { id: 'danamon', bankName: 'Bank Danamon', bankCode: 'DANAMON' },
          { id: 'permata', bankName: 'Bank Permata', bankCode: 'PERMATA' },
          // E-Wallets
          { id: 'gopay', bankName: 'GoPay', bankCode: 'GOPAY' },
          { id: 'ovo', bankName: 'OVO', bankCode: 'OVO' },
          { id: 'dana', bankName: 'DANA', bankCode: 'DANA' },
          { id: 'linkaja', bankName: 'LinkAja', bankCode: 'LINKAJA' },
          { id: 'shopeepay', bankName: 'ShopeePay', bankCode: 'SHOPEEPAY' },
          { id: 'jenius', bankName: 'Jenius', bankCode: 'JENIUS' },
          { id: 'sakuku', bankName: 'Sakuku', bankCode: 'SAKUKU' },
          { id: 'tcash', bankName: 'T-Cash', bankCode: 'TCASH' },
        ];
        setManualBanks(fallbackBanks);
      }
      
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      
      // Fallback banks and e-wallets on error
      const fallbackBanks = [
        // Traditional Banks
        { id: 'bca', bankName: 'Bank Central Asia (BCA)', bankCode: 'BCA' },
        { id: 'bri', bankName: 'Bank Rakyat Indonesia (BRI)', bankCode: 'BRI' },
        { id: 'bni', bankName: 'Bank Negara Indonesia (BNI)', bankCode: 'BNI' },
        { id: 'btn', bankName: 'Bank Tabungan Negara (BTN)', bankCode: 'BTN' },
        { id: 'mandiri', bankName: 'Bank Mandiri', bankCode: 'MANDIRI' },
        { id: 'cimb', bankName: 'CIMB Niaga', bankCode: 'CIMB' },
        { id: 'danamon', bankName: 'Bank Danamon', bankCode: 'DANAMON' },
        { id: 'permata', bankName: 'Bank Permata', bankCode: 'PERMATA' },
        // E-Wallets
        { id: 'gopay', bankName: 'GoPay', bankCode: 'GOPAY' },
        { id: 'ovo', bankName: 'OVO', bankCode: 'OVO' },
        { id: 'dana', bankName: 'DANA', bankCode: 'DANA' },
        { id: 'linkaja', bankName: 'LinkAja', bankCode: 'LINKAJA' },
        { id: 'shopeepay', bankName: 'ShopeePay', bankCode: 'SHOPEEPAY' },
        { id: 'jenius', bankName: 'Jenius', bankCode: 'JENIUS' },
        { id: 'sakuku', bankName: 'Sakuku', bankCode: 'SAKUKU' },
        { id: 'tcash', bankName: 'T-Cash', bankCode: 'TCASH' },
      ];
      setManualBanks(fallbackBanks);
    }
  // Handle sender name input change
  const handleSenderNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSenderName(e.target.value)
  }, [])
    if (transactionId) {
      fetchDetails()
      fetchPaymentSettings()
    }
  }, [transactionId, fetchDetails, fetchPaymentSettings])

  // Set default sender name only once when details first load
  useEffect(() => {
    if (details?.customerName && !hasAutoFilledRef.current && senderName === '') {
      setSenderName(details.customerName)
      hasAutoFilledRef.current = true
    }
  }, [details?.customerName])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file harus JPG, PNG, atau WebP')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload and submit proof
  const handleSubmit = async () => {
    if (!selectedFile && !details?.paymentProofUrl) {
      toast.error('Pilih file bukti pembayaran terlebih dahulu')
      return
    }

    if (!senderName.trim()) {
      toast.error('Nama pengirim harus diisi')
      return
    }

    if (!senderBank.trim()) {
      toast.error('Pilih bank pengirim')
      return
    }

    try {
      setSubmitting(true)

      let proofUrl = details?.paymentProofUrl

      // Upload file if new file selected
      if (selectedFile) {
        setUploading(true)
        
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('transactionId', transactionId)

        const uploadRes = await fetch('/api/upload/payment-proof', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json()
          throw new Error(data.error || 'Gagal upload bukti pembayaran')
        }

        const uploadData = await uploadRes.json()
        proofUrl = uploadData.url
        setUploading(false)
      }

      // Submit confirmation with additional data
      const res = await fetch(`/api/payment/confirm/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentProofUrl: proofUrl,
          senderName: senderName.trim(),
          senderBank: senderBank.trim(),
          transferAmount: details?.amount
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengirim konfirmasi')
      }

      toast.success('Bukti pembayaran berhasil dikirim! Admin akan memverifikasi dalam 1x24 jam.')
      
      // Refresh details
      fetchDetails()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Disalin!')
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Menunggu Pembayaran
          </span>
        )
      case 'PENDING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menunggu Verifikasi
          </span>
        )
      case 'PAID':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Pembayaran Berhasil
          </span>
        )
      case 'FAILED':
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            {status === 'EXPIRED' ? 'Kedaluwarsa' : 'Gagal'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-600">Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Transaksi Tidak Ditemukan</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  if (!details) return null

  const isPending = details.status === 'PENDING'
  const isPendingConfirmation = details.status === 'PENDING_CONFIRMATION'
  const isCompleted = details.status === 'PAID' || details.status === 'COMPLETED'
  const canUpload = isPending || isPendingConfirmation

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900">Konfirmasi Pembayaran</h1>
            <p className="text-sm text-slate-500">{details.invoiceNumber}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Status Transaksi</h2>
            {getStatusBadge(details.status)}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Produk</span>
              <span className="font-medium text-slate-900">{details.itemName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Bayar</span>
              <span className="font-bold text-orange-600 text-lg">{formatCurrency(details.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tanggal Order</span>
              <span className="text-slate-700">{formatDate(details.createdAt)}</span>
            </div>
            {details.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nama</span>
                <span className="text-slate-700">{details.customerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Account Info (if available) */}
        {details.bankAccount && isPending && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Transfer ke Rekening</h2>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bank</p>
                <p className="font-semibold text-slate-900">{details.bankAccount.bankName}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 mb-1">Nomor Rekening</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-lg text-slate-900">{details.bankAccount.accountNumber}</p>
                  <button
                    onClick={() => copyToClipboard(details.bankAccount!.accountNumber, 'accountNumber')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'accountNumber' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 mb-1">Atas Nama</p>
                <p className="font-medium text-slate-900">{details.bankAccount.accountName}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Total Transfer</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-xl text-orange-600">{formatCurrency(details.amount)}</p>
                  <button
                    onClick={() => copyToClipboard(details.amount.toString(), 'amount')}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedField === 'amount' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Proof Section */}
        {canUpload && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-2">Upload Bukti Pembayaran</h2>
            <p className="text-sm text-slate-500 mb-6">
              Upload screenshot atau foto bukti transfer Anda untuk mempercepat proses verifikasi.
            </p>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Invoice Number - Read Only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nomor Invoice
                </label>
                <input
                  type="text"
                  value={details.invoiceNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* Transfer Amount - Read Only */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jumlah Transfer
                </label>
                <input
                  type="text"
                  value={formatCurrency(details.amount)}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed font-mono"
                />
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Pengirim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={handleSenderNameChange}
                  placeholder="Masukkan nama pengirim sesuai rekening"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  disabled={submitting}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nama harus sesuai dengan nama pemilik rekening pengirim
                </p>
              </div>

              {/* Sender Bank */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bank/E-Wallet Pengirim <span className="text-red-500">*</span>
                </label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  disabled={submitting}
                >
                  <option value="">Pilih bank/e-wallet pengirim</option>
                  {manualBanks.map((bank) => (
                    <option key={bank.id} value={bank.bankName}>
                      {bank.bankName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload Area */}
            <div className="relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={submitting}
              />
              
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={previewUrl}
                      alt="Bukti pembayaran"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm font-medium">
                      {selectedFile ? selectedFile.name : 'Bukti sudah diupload'}
                    </p>
                    <p className="text-white/70 text-xs">Klik untuk ganti gambar</p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-700 mb-1">Klik untuk upload bukti</p>
                  <p className="text-sm text-slate-500">JPG, PNG, atau WebP (max 5MB)</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || (!selectedFile && !details.paymentProofUrl)}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? 'Mengupload...' : 'Mengirim...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Kirim Bukti Pembayaran
                </>
              )}
            </button>

            {isPendingConfirmation && (
              <p className="text-center text-sm text-blue-600 mt-3">
                ✓ Bukti pembayaran sudah dikirim. Menunggu verifikasi admin.
              </p>
            )}
          </div>
        )}

        {/* CS Contact */}
        {csWhatsApp && (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
            <h3 className="font-semibold text-green-900 mb-2">Butuh bantuan?</h3>
            <p className="text-green-700 text-sm mb-4">
              Hubungi customer service kami jika ada kendala atau pertanyaan
            </p>
            <a
              href={`https://wa.me/${csWhatsApp.replace(/\D/g, '')}?text=Halo, saya butuh bantuan terkait pembayaran untuk invoice ${details?.invoiceNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Hubungi CS Kami
            </a>
          </div>
        )}

        {/* Completed Message */}
        {isCompleted && (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-bold text-green-900 text-lg mb-2">Pembayaran Berhasil!</h2>
            <p className="text-green-700 text-sm">
              Terima kasih, pembayaran Anda telah dikonfirmasi.
            </p>
            {details.paymentProofUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-green-200 max-w-xs mx-auto">
                <Image
                  src={details.paymentProofUrl}
                  alt="Bukti pembayaran"
                  width={300}
                  height={200}
                  className="object-contain w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-600">
            Butuh bantuan?{' '}
            <a 
              href="https://wa.me/6281234567890" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 font-medium hover:underline"
            >
              Hubungi CS kami
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
