'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, AlertCircle, Clock, User, Mail, Phone, FileText, Timer, CheckCircle, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface ManualPaymentDetails {
  transactionId: string
  invoiceNumber: string
  amount: number
  originalAmount: number
  discountAmount: number
  status: string
  type: string
  itemName: string
  description: string
  
  // Unique Code
  uniqueCode: number
  uniqueCodeType: 'add' | 'subtract'
  originalAmountBeforeUniqueCode: number
  
  // Customer Details
  customerName: string
  customerEmail: string
  customerWhatsapp: string
  
  // Time Details
  createdAt: string
  expiredAt: string
  paymentExpiryHours: number
  
  // Coupon Details
  coupon: {
    code: string
    discountType: string
    discountValue: number
  } | null
  
  // Bank Details for Manual Transfer
  bankAccounts: {
    id: string
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
    logoUrl?: string
    customLogoUrl?: string
  }[]
  
  selectedBankCode?: string
  
  // Contact Info for confirmation
  contactInfo?: {
    name: string
    whatsapp: string | null
    email: string | null
    phone: string | null
  }
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export default function ManualPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [details, setDetails] = useState<ManualPaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
  const [selectedBank, setSelectedBank] = useState<string>('')

  // Calculate time remaining
  const calculateTimeLeft = useCallback((expiredAt: string): TimeLeft => {
    const now = new Date().getTime()
    const expiry = new Date(expiredAt).getTime()
    const difference = expiry - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: difference
    }
  }, [])

  // Fetch transaction details
  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payment/manual/${params.transactionId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load payment details')
        return
      }

      // If should redirect to Xendit
      if (data.shouldRedirectToXendit && data.xenditUrl) {
        window.location.href = data.xenditUrl
        return
      }

      setDetails(data)
      if (data.selectedBankCode) {
        setSelectedBank(data.selectedBankCode)
      } else if (data.bankAccounts?.length > 0) {
        setSelectedBank(data.bankAccounts[0].bankCode)
      }

      // Calculate initial time left
      if (data.expiredAt) {
        setTimeLeft(calculateTimeLeft(data.expiredAt))
      }
    } catch (err) {
      console.error('Error fetching payment details:', err)
      setError('Gagal memuat detail pembayaran')
    } finally {
      setLoading(false)
    }
  }, [params.transactionId, calculateTimeLeft])

  // Countdown timer
  useEffect(() => {
    if (!details?.expiredAt) return

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(details.expiredAt)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [details?.expiredAt, calculateTimeLeft])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Berhasil disalin!')
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast.error('Gagal menyalin')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatTimeUnit = (value: number) => {
    return value.toString().padStart(2, '0')
  }

  // Get selected bank details
  const selectedBankDetails = details?.bankAccounts?.find(b => b.bankCode === selectedBank)

  // Calculate discount percentage
  const hasDiscount = details && details.originalAmount > details.originalAmountBeforeUniqueCode
  const discountAmount = hasDiscount ? details.originalAmount - details.originalAmountBeforeUniqueCode : 0
  const discountPercentage = hasDiscount && details.originalAmount > 0 
    ? Math.round((discountAmount / details.originalAmount) * 100) 
    : 0

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    if (!details || !selectedBankDetails) return ''
    return encodeURIComponent(
      `Halo, saya sudah transfer untuk:\n\n` +
      `Invoice: ${details.invoiceNumber}\n` +
      `Produk: ${details.itemName}\n` +
      `Nominal: ${formatCurrency(details.amount)}\n` +
      `Bank: ${selectedBankDetails.bankName}\n\n` +
      `Mohon diverifikasi. Terima kasih!`
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat detail pembayaran...</p>
        </div>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-slate-600 mb-6">{error || 'Data pembayaran tidak ditemukan'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-semibold"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  // Payment Success
  if (details.status === 'PAID' || details.status === 'SUCCESS') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pembayaran Berhasil!</h2>
          <p className="text-slate-600 mb-6">Terima kasih, pembayaran Anda sudah dikonfirmasi.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold"
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Expired
  if (timeLeft.total <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <Clock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pembayaran Kadaluarsa</h2>
          <p className="text-slate-600 mb-6">Waktu pembayaran sudah habis. Silakan buat transaksi baru.</p>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-semibold"
          >
            Buat Transaksi Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center py-10 px-4">
      <main className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Timer Header */}
          <div className="bg-orange-50 border-b border-orange-100 py-3 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/20">
              <div className="h-full bg-orange-500 w-3/4 rounded-r-full"></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-orange-600 font-medium text-sm pt-1">
              <Timer className="w-4 h-4" />
              <span>
                Selesaikan dalam: <span className="font-bold tabular-nums">
                  {timeLeft.days}d {formatTimeUnit(timeLeft.hours)}:{formatTimeUnit(timeLeft.minutes)}:{formatTimeUnit(timeLeft.seconds)}
                </span>
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Header */}
            <div className="text-center space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Menunggu Pembayaran</h1>
                <p className="text-slate-500 text-sm mt-1">Transfer sesuai nominal di bawah ini</p>
              </div>

              {/* Total Transfer Box */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 inline-block w-full">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Transfer</p>
                <div className="flex flex-col items-center">
                  
                  {/* Show discount if exists */}
                  {hasDiscount && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-medium text-slate-400 line-through">
                        {formatCurrency(details.originalAmount)}
                      </span>
                      <span className="text-xl font-extrabold text-red-500">
                        (diskon {discountPercentage}%)
                      </span>
                    </div>
                  )}
                  
                  {/* Final Amount */}
                  <div className="text-4xl font-bold text-green-600 mb-1 tracking-tight">
                    {formatCurrency(details.amount)}
                  </div>
                  
                  {/* Unique Code */}
                  {details.uniqueCode > 0 && (
                    <div className="text-xs text-slate-400 mb-4">
                      {details.uniqueCodeType === 'add' ? '+ ' : '- '}kode unik: {details.uniqueCode}
                    </div>
                  )}
                  
                  {/* Copy Button */}
                  <button 
                    onClick={() => copyToClipboard(details.amount.toString(), 'amount')}
                    className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-600 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    {copiedField === 'amount' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>Salin Nominal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Account Card */}
            {selectedBankDetails && (
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  
                  {/* Bank Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Bank Transfer</p>
                        <p className="font-bold text-slate-900">{selectedBankDetails.bankName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                        Pengecekan Manual
                      </span>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Nomor Rekening</p>
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(selectedBankDetails.accountNumber, 'account')}>
                        <span className="text-xl font-mono font-semibold text-slate-800">
                          {selectedBankDetails.accountNumber}
                        </span>
                        {copiedField === 'account' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-700 mt-1">
                        a.n {selectedBankDetails.accountName}
                      </p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(selectedBankDetails.accountNumber, 'account')}
                      className="text-orange-600 text-sm font-semibold hover:underline decoration-2 underline-offset-4"
                    >
                      Salin
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              
              {/* Order Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                  <FileText className="w-4 h-4" />
                  Detail Pesanan
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex justify-between border-b border-slate-100 pb-2 border-dashed">
                    <span>Invoice</span>
                    <span className="font-medium text-slate-900">{details.invoiceNumber}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Produk</span>
                    <span className="font-medium text-slate-900">{details.itemName}</span>
                  </li>
                </ul>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                  <User className="w-4 h-4" />
                  Data Pembeli
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900 truncate">{details.customerName}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{details.customerEmail}</span>
                  </li>
                  {details.customerWhatsapp && (
                    <li className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{details.customerWhatsapp}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Payment Guide */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Panduan Pembayaran</h3>
              <ol className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="font-bold text-orange-500">1.</span>
                  <span>Transfer ke rekening {selectedBankDetails?.bankName || 'bank'} di atas.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-orange-500">2.</span>
                  <span>Pastikan nominal <span className="font-bold text-slate-800">tepat sampai 3 digit terakhir</span>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-orange-500">3.</span>
                  <span>Konfirmasi bukti transfer lewat WhatsApp.</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {details.contactInfo?.whatsapp ? (
                <a
                  href={`https://wa.me/${details.contactInfo.whatsapp}?text=${generateWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5 gap-2 group"
                >
                  <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Konfirmasi via WhatsApp
                </a>
              ) : (
                <p className="text-center text-slate-500 text-sm py-3 bg-slate-50 rounded-xl">
                  Kontak pembayaran belum dikonfigurasi
                </p>
              )}
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3.5 px-4 rounded-xl transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>

            {/* Help Link */}
            {details.contactInfo?.whatsapp && (
              <p className="text-center text-xs text-slate-400">
                Butuh bantuan?{' '}
                <a 
                  href={`https://wa.me/${details.contactInfo.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-600"
                >
                  Hubungi CS kami
                </a>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
