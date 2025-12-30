'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, AlertCircle, Clock, CreditCard, User, Mail, Phone, FileText, Tag, Calendar, Timer, CheckCircle } from 'lucide-react'

interface VADetails {
  // VA Details
  vaNumber: string
  bankCode: string
  bankName: string
  
  // Amount Details
  amount: number
  originalAmount: number
  discountAmount: number
  
  // Invoice Details
  invoiceNumber: string
  transactionId: string
  type: string
  itemName: string
  membershipDuration: number
  description: string
  status: string
  
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
  
  // Payment Method
  paymentMethod: string
  paymentChannelName: string
  
  // Flags
  isFallback: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export default function VirtualAccountPage() {
  const params = useParams()
  const router = useRouter()
  const [vaDetails, setVaDetails] = useState<VADetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })

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

  // Countdown timer
  useEffect(() => {
    if (!vaDetails?.expiredAt) return

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(vaDetails.expiredAt)
      setTimeLeft(newTimeLeft)
      
      // If expired, refresh to check status
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        fetchVADetails()
      }
    }, 1000)

    // Initial calculation
    setTimeLeft(calculateTimeLeft(vaDetails.expiredAt))

    return () => clearInterval(timer)
  }, [vaDetails?.expiredAt, calculateTimeLeft])

  useEffect(() => {
    fetchVADetails()
    
    // Set up polling interval for payment status check (every 5 seconds)
    const pollInterval = setInterval(() => {
      if (vaDetails?.status === 'PENDING') {
        fetchVADetails()
      }
    }, 5000) // Check every 5 seconds for faster detection
    
    return () => clearInterval(pollInterval)
  }, [params.transactionId])

  const fetchVADetails = async () => {
    try {
      const response = await fetch(`/api/payment/va/${params.transactionId}`)
      const data = await response.json()

      // Handle redirect response (fallback to Xendit checkout)
      if (data.redirect && data.redirectUrl) {
        console.log('[VA Page] Redirecting to Xendit checkout:', data.redirectUrl)
        window.location.href = data.redirectUrl
        return
      }

      if (!response.ok) {
        setError(data.error || 'Gagal memuat detail pembayaran')
        setLoading(false)
        return
      }

      // ✅ AUTO-REDIRECT: If payment SUCCESS, redirect to dashboard immediately
      if (data.status === 'SUCCESS' || data.status === 'PAID') {
        console.log('[VA Page] Payment successful! Redirecting to dashboard...')
        // Small delay for UX
        setTimeout(() => {
          router.push('/dashboard?payment=success')
        }, 1500)
      }

      setVaDetails(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching VA details:', err)
      setError('Gagal memuat detail pembayaran')
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    })
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getBankLogo = (bankCode: string) => {
    if (!bankCode) return '/images/payment-logos/default.svg'
    const logos: Record<string, string> = {
      BCA: '/images/payment-logos/bca.svg',
      MANDIRI: '/images/payment-logos/mandiri.svg',
      BNI: '/images/payment-logos/bni.svg',
      BRI: '/images/payment-logos/bri.svg',
      PERMATA: '/images/payment-logos/permata.svg',
      BSI: '/images/payment-logos/bsi.svg',
      CIMB: '/images/payment-logos/cimb.svg',
      SAHABAT_SAMPOERNA: '/images/payment-logos/sahabat-sampoerna.svg',
      BJB: '/images/payment-logos/bjb.svg',
    }
    return logos[bankCode] || `/images/payment-logos/${bankCode.toLowerCase()}.svg`
  }

  const getBankColor = (bankCode: string) => {
    if (!bankCode) return 'from-blue-600 to-purple-600'
    const colors: Record<string, string> = {
      BCA: 'from-blue-600 to-blue-800',
      MANDIRI: 'from-blue-700 to-blue-900',
      BNI: 'from-orange-500 to-orange-700',
      BRI: 'from-blue-600 to-blue-900',
      PERMATA: 'from-green-600 to-green-800',
      BSI: 'from-green-500 to-teal-600',
      CIMB: 'from-red-600 to-red-800',
      SAHABAT_SAMPOERNA: 'from-red-500 to-red-700',
      BJB: 'from-blue-500 to-blue-700',
    }
    return colors[bankCode] || 'from-blue-600 to-purple-600'
  }

  const getTypeLabel = (type: string, duration?: number) => {
    if (type === 'MEMBERSHIP' && duration) {
      // Format durasi membership
      if (duration === 999) return 'Membership Lifetime'
      if (duration === 1) return 'Membership 1 Bulan'
      if (duration === 3) return 'Membership 3 Bulan'
      if (duration === 6) return 'Membership 6 Bulan'
      if (duration === 12) return 'Membership 1 Tahun'
      if (duration === 24) return 'Membership 2 Tahun'
      return `Membership ${duration} Bulan`
    }
    
    const labels: Record<string, string> = {
      MEMBERSHIP: 'Membership',
      PRODUCT: 'Produk Digital',
      COURSE: 'Kursus Online',
      CREDIT_TOPUP: 'Top Up Kredit',
      SUPPLIER_REGISTRATION: 'Pendaftaran Supplier',
    }
    return labels[type] || type
  }

  // Helper untuk format akses waktu
  const getAccessTimeLabel = (duration: number) => {
    if (duration === 999) return 'Selamanya'
    if (duration === 12) return '1 Tahun'
    if (duration === 24) return '2 Tahun'
    return `${duration} Bulan`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail pembayaran...</p>
        </div>
      </div>
    )
  }

  if (error || !vaDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">{error || 'Data pembayaran tidak ditemukan'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  // Check if payment is completed - AUTO REDIRECT
  if (vaDetails.status === 'PAID' || vaDetails.status === 'SUCCESS') {
    // Auto redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard?payment=success')
    }, 2000)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
          <p className="text-gray-600 mb-2">Transaksi Anda telah dikonfirmasi</p>
          <p className="text-sm text-gray-500 mb-4">No. Invoice: {vaDetails.invoiceNumber}</p>
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Mengalihkan ke dashboard...</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold"
          >
            Lihat Dashboard Sekarang
          </button>
        </div>
      </div>
    )
  }

  // Check if expired
  if (timeLeft.total <= 0 && vaDetails.status === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waktu Pembayaran Habis</h2>
          <p className="text-gray-600 mb-6">Silakan buat transaksi baru untuk melanjutkan pembayaran</p>
          <button
            onClick={() => router.push('/checkout/pro')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Buat Transaksi Baru
          </button>
        </div>
      </div>
    )
  }

  const hasDiscount = vaDetails.originalAmount > vaDetails.amount
  
  // Calculate discount amount and percentage correctly
  const calculatedDiscountAmount = vaDetails.discountAmount > 0 
    ? vaDetails.discountAmount 
    : vaDetails.originalAmount - vaDetails.amount
  const discountPercentage = vaDetails.originalAmount > 0 
    ? Math.round((calculatedDiscountAmount / vaDetails.originalAmount) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Transfer Virtual Account</h1>
          <p className="text-gray-600">Selesaikan pembayaran Anda</p>
        </div>

        {/* VA Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Bank Header */}
          <div className={`bg-gradient-to-r ${getBankColor(vaDetails.bankCode)} p-5`}>
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-sm opacity-90 mb-1">Virtual Account</p>
                <h2 className="text-xl font-bold">{vaDetails.bankName || vaDetails.bankCode}</h2>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-md">
                <img 
                  src={getBankLogo(vaDetails.bankCode)} 
                  alt={vaDetails.bankCode || 'Bank'}
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* VA Number */}
          <div className="p-5 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Nomor Virtual Account
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900 tracking-wider font-mono">
                  {vaDetails.vaNumber}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(vaDetails.vaNumber, 'va')}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                title="Salin nomor VA"
              >
                {copiedField === 'va' ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
            {copiedField === 'va' && (
              <p className="text-sm text-green-600 mt-2">✓ Nomor VA berhasil disalin</p>
            )}
          </div>

          {/* Amount with Discount - IMPROVED */}
          <div className="p-5 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Total Pembayaran
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 rounded-xl p-4">
                {hasDiscount ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-400 line-through">
                        {formatCurrency(vaDetails.originalAmount)}
                      </p>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                        HEMAT {discountPercentage}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(vaDetails.amount)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(vaDetails.amount)}
                  </p>
                )}
              </div>
              <button
                onClick={() => copyToClipboard(vaDetails.amount.toString(), 'amount')}
                className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                title="Salin nominal"
              >
                {copiedField === 'amount' ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
            {copiedField === 'amount' && (
              <p className="text-sm text-green-600 mt-2">✓ Nominal berhasil disalin</p>
            )}
          </div>

          {/* Customer Name */}
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Atas Nama
            </label>
            <p className="text-lg font-semibold text-gray-900">{vaDetails.customerName}</p>
          </div>
        </div>

        {/* COUNTDOWN TIMER - Di tengah, sebagai section terpisah yang menonjol */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-5 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Timer className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">Selesaikan Pembayaran Dalam</span>
            </div>
            
            {/* Countdown Display - Centered */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 min-w-[60px]">
                  <span className="text-2xl font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-white/80 mt-1 block">Hari</span>
              </div>
              <span className="text-white text-2xl font-bold">:</span>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 min-w-[60px]">
                  <span className="text-2xl font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-white/80 mt-1 block">Jam</span>
              </div>
              <span className="text-white text-2xl font-bold">:</span>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 min-w-[60px]">
                  <span className="text-2xl font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-white/80 mt-1 block">Menit</span>
              </div>
              <span className="text-white text-2xl font-bold">:</span>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 min-w-[60px]">
                  <span className="text-2xl font-bold text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-white/80 mt-1 block">Detik</span>
              </div>
            </div>
            
            {/* Expiry Date */}
            <p className="text-xs text-white/90">
              <Calendar className="w-3 h-3 inline mr-1" />
              Bayar sebelum: <strong>{formatDate(vaDetails.expiredAt)}</strong>
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Detail Invoice
          </h3>
          
          <div className="space-y-3">
            {/* Invoice Number */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">No. Invoice</span>
              <span className="font-semibold text-gray-900 font-mono">{vaDetails.invoiceNumber}</span>
            </div>
            
            {/* Type */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">Tipe Transaksi</span>
              <span className="font-semibold text-gray-900">{getTypeLabel(vaDetails.type, vaDetails.membershipDuration)}</span>
            </div>
            
            {/* Item */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">Produk</span>
              <span className="font-semibold text-gray-900 text-right max-w-[200px]">{vaDetails.itemName || vaDetails.description}</span>
            </div>
            
            {/* Akses Waktu (for Membership) */}
            {vaDetails.type === 'MEMBERSHIP' && vaDetails.membershipDuration > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Akses Waktu</span>
                <span className="font-semibold text-blue-600">
                  {getAccessTimeLabel(vaDetails.membershipDuration)}
                </span>
              </div>
            )}
            
            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {/* Original Price */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Harga Normal</span>
                {hasDiscount ? (
                  <span className="text-gray-400 line-through">{formatCurrency(vaDetails.originalAmount)}</span>
                ) : (
                  <span className="font-semibold text-gray-900">{formatCurrency(vaDetails.originalAmount)}</span>
                )}
              </div>
              
              {/* Discount */}
              {hasDiscount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm flex items-center gap-1">
                    <Tag className="w-4 h-4 text-green-600" />
                    Diskon
                    {vaDetails.coupon && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {vaDetails.coupon.code}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-green-600">-{formatCurrency(calculatedDiscountAmount)}</span>
                </div>
              )}
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>
              
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Bayar</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(vaDetails.amount)}</span>
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">Metode Pembayaran</span>
              <span className="font-semibold text-gray-900">{vaDetails.paymentChannelName}</span>
            </div>
            
            {/* Created Date */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 text-sm">Tanggal Transaksi</span>
              <span className="text-gray-900 text-sm">{formatShortDate(vaDetails.createdAt)}</span>
            </div>
            
            {/* Status */}
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 text-sm">Status</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                Menunggu Pembayaran
              </span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Data Pembeli
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-gray-100">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Nama</p>
                <p className="font-semibold text-gray-900">{vaDetails.customerName}</p>
              </div>
            </div>
            
            {vaDetails.customerEmail && (
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{vaDetails.customerEmail}</p>
                </div>
              </div>
            )}
            
            {vaDetails.customerWhatsapp && (
              <div className="flex items-center gap-3 py-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="font-semibold text-gray-900">{vaDetails.customerWhatsapp}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Cara Pembayaran
          </h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Buka aplikasi mobile banking atau ATM <strong>{vaDetails.bankName || vaDetails.bankCode}</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Pilih menu <strong>Transfer</strong> atau <strong>Bayar/Beli</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Pilih <strong>Virtual Account</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Masukkan nomor VA: <strong className="text-blue-600 font-mono">{vaDetails.vaNumber}</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <span>Masukkan nominal: <strong className="text-blue-600">{formatCurrency(vaDetails.amount)}</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
              <span>Konfirmasi dan selesaikan pembayaran</span>
            </li>
          </ol>
        </div>

        {/* Status Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center mb-6">
          <p className="text-sm text-blue-900">
            ⏳ Status pembayaran akan diperbarui secara otomatis setelah konfirmasi dari bank (1-5 menit)
          </p>
        </div>

        {/* Back Button */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard/transactions')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Lihat Riwayat Transaksi
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Butuh bantuan? Hubungi customer service kami melalui WhatsApp
        </p>
      </div>
    </div>
  )
}
