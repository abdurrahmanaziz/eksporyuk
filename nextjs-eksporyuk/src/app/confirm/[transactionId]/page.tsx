'use client'

import { useEffect, useState, useCallback } from 'react'
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

  useEffect(() => {
    if (transactionId) {
      fetchDetails()
    }
  }, [transactionId, fetchDetails])

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

      // Submit confirmation
      const res = await fetch(`/api/payment/confirm/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProofUrl: proofUrl })
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
            <p className="text-sm text-slate-500 mb-4">
              Upload screenshot atau foto bukti transfer Anda untuk mempercepat proses verifikasi.
            </p>

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
