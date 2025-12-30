'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, AlertCircle, Clock, CreditCard, User, Mail, Phone, FileText, Tag, Calendar, Timer, CheckCircle, Building2, Upload } from 'lucide-react'
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
  
  // Redirect details for Xendit
  redirecting?: boolean
  redirectMessage?: string
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
  const [uploadingProof, setUploadingProof] = useState(false)

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

      // Check if should redirect to Xendit
      if (data.shouldRedirectToXendit && data.xenditUrl) {
        console.log('🔄 Auto-redirecting to Xendit:', data.xenditUrl)
        // Show brief message then redirect
        setError('')
        setDetails(null)
        setTimeout(() => {
          window.location.href = data.xenditUrl
        }, 1500)
        
        // Show loading message
        setDetails({
          ...data,
          redirecting: true,
          redirectMessage: data.message || 'Redirecting to secure payment...'
        })
        return
      }

      setDetails(data)
      if (data.selectedBankCode) {
        setSelectedBank(data.selectedBankCode)
      } else if (data.bankAccounts?.length > 0) {
        setSelectedBank(data.bankAccounts[0].bankCode)
      }
      
      if (data.expiredAt) {
        setTimeLeft(calculateTimeLeft(data.expiredAt))
      }
    } catch (err) {
      console.error('Error fetching payment details:', err)
      setError('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }, [params.transactionId, calculateTimeLeft])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  // Countdown timer
  useEffect(() => {
    if (!details?.expiredAt) return

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(details.expiredAt)
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        fetchDetails()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [details?.expiredAt, calculateTimeLeft, fetchDetails])

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Get selected bank details
  const getSelectedBankDetails = () => {
    if (!details?.bankAccounts || !selectedBank) return null
    return details.bankAccounts.find(b => b.bankCode === selectedBank)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (details?.redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Redirecting to Payment</h1>
          <p className="text-gray-600 mb-4">{details.redirectMessage}</p>
          <p className="text-sm text-gray-500">You will be redirected to Xendit secure payment page...</p>
        </div>
      </div>
    )
  }

  if (details?.status === 'SUCCESS' || details?.status === 'PAID') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Confirmed!</h1>
          <p className="text-gray-600 mb-6">Your payment has been verified. Thank you!</p>
          <button
            onClick={() => router.push('/my-dashboard')}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const selectedBankDetails = getSelectedBankDetails()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Transfer Manual</h1>
          <p className="text-gray-600 mt-2">Silakan transfer ke rekening di bawah ini</p>
        </div>

        {/* Timer */}
        {timeLeft.total > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-orange-800">
              <Timer className="h-5 w-5" />
              <span className="font-medium">Bayar sebelum:</span>
              <span className="font-bold">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Amount Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Pembayaran</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              {formatCurrency(details?.amount || 0)}
            </p>
            {details?.discountAmount && details.discountAmount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                <span className="line-through">{formatCurrency(details.originalAmount)}</span>
                <span className="text-green-600 ml-2">-{formatCurrency(details.discountAmount)}</span>
              </p>
            )}
          </div>
          
          {/* Copy Amount Button */}
          <button
            onClick={() => copyToClipboard(String(details?.amount || 0), 'amount')}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition"
          >
            {copiedField === 'amount' ? (
              <><Check className="h-4 w-4 text-green-600" /> Copied!</>
            ) : (
              <><Copy className="h-4 w-4" /> Copy Nominal</>
            )}
          </button>
        </div>

        {/* Bank Selection */}
        {details?.bankAccounts && details.bankAccounts.length > 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Pilih Bank Tujuan</h3>
            <div className="grid grid-cols-2 gap-3">
              {details.bankAccounts.map((bank) => (
                <button
                  key={bank.bankCode}
                  onClick={() => setSelectedBank(bank.bankCode)}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedBank === bank.bankCode
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="font-medium text-sm">{bank.bankName}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bank Details */}
        {selectedBankDetails && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detail Rekening {selectedBankDetails.bankName}
            </h3>
            
            {/* Account Number */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Nomor Rekening</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-mono font-bold text-gray-900">
                  {selectedBankDetails.accountNumber}
                </p>
                <button
                  onClick={() => copyToClipboard(selectedBankDetails.accountNumber, 'accountNumber')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  {copiedField === 'accountNumber' ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Atas Nama</p>
              <p className="font-semibold text-gray-900">{selectedBankDetails.accountName}</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Pesanan
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice</span>
              <span className="font-medium">{details?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Produk</span>
              <span className="font-medium">{details?.itemName}</span>
            </div>
            {details?.coupon && (
              <div className="flex justify-between">
                <span className="text-gray-600">Kupon</span>
                <span className="font-medium text-green-600">{details.coupon.code}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Data Pembeli
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{details?.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{details?.customerEmail}</span>
            </div>
            {details?.customerWhatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{details.customerWhatsapp}</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Petunjuk Pembayaran</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Transfer sesuai nominal di atas ke rekening tujuan</li>
            <li>Pastikan nominal transfer <strong>SAMA PERSIS</strong></li>
            <li>Simpan bukti transfer</li>
            <li>Konfirmasi pembayaran via WhatsApp</li>
            <li>Pembayaran akan diverifikasi dalam 1x24 jam</li>
          </ol>
        </div>

        {/* Contact Info */}
        {details?.contactInfo && (details.contactInfo.whatsapp || details.contactInfo.email || details.contactInfo.phone) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Hubungi {details.contactInfo.name}</h4>
            <div className="space-y-2 text-sm">
              {details.contactInfo.whatsapp && (
                <a 
                  href={`https://wa.me/${details.contactInfo.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp: {details.contactInfo.whatsapp}
                </a>
              )}
              {details.contactInfo.email && (
                <a 
                  href={`mailto:${details.contactInfo.email}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4" />
                  {details.contactInfo.email}
                </a>
              )}
              {details.contactInfo.phone && (
                <a 
                  href={`tel:${details.contactInfo.phone}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
                >
                  <Phone className="h-4 w-4" />
                  {details.contactInfo.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {details?.contactInfo?.whatsapp ? (
            <a
              href={`https://wa.me/${details.contactInfo.whatsapp}?text=Halo,%20saya%20sudah%20transfer%20untuk%20invoice%20${details?.invoiceNumber}%20sebesar%20${formatCurrency(details?.amount || 0)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              <Phone className="h-5 w-5" />
              Konfirmasi via WhatsApp
            </a>
          ) : (
            <p className="text-center text-gray-500 text-sm py-3">
              Kontak pembayaran belum dikonfigurasi. Silakan hubungi admin.
            </p>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
          >
            Kembali ke Beranda
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Butuh bantuan? Hubungi CS kami di WhatsApp
        </p>
      </div>
    </div>
  )
}
