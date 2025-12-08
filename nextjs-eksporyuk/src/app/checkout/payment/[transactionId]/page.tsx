'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Clock,
  CreditCard,
  Copy,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ExternalLink,
  Wallet,
  Building,
  User,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface TransactionMetadata {
  expiryHours?: number
  xenditVANumber?: string
  xenditInvoiceUrl?: string
  xenditBankCode?: string
  xenditPaymentMethod?: string
  xenditFallback?: boolean | string
  paymentMethod?: string
  paymentMethodType?: string
  paymentChannel?: string
  paymentChannelName?: string
  originalAmount?: number
  discountAmount?: number
  membershipType?: string
  membershipDuration?: string
}

interface Transaction {
  id: string
  invoiceNumber?: string
  amount: number
  originalAmount?: number
  discountAmount?: number
  status: string
  type: string
  customerName: string
  customerEmail: string
  createdAt: string
  paymentUrl?: string | null
  metadata?: TransactionMetadata
  membership?: {
    type: string
    status: string
  }
}

function PaymentPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = params.transactionId as string
  const redirectUrl = searchParams.get('redirect_url') || '/'

  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60) // 24 hours in seconds

  useEffect(() => {
    fetchTransaction()
  }, [transactionId])

  // Countdown Timer
  useEffect(() => {
    if (!transaction) return
    
    // Get expiry hours from transaction metadata or default 24 hours
    const expiryHours = transaction?.metadata?.expiryHours || 24
    
    // Calculate time remaining from transaction creation
    const createdAt = new Date(transaction.createdAt).getTime()
    const expiryTime = createdAt + (expiryHours * 60 * 60 * 1000)
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000))
    
    setTimeRemaining(remaining)

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [transaction])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    // Auto-detect payment method from transaction metadata
    if (transaction?.metadata?.xenditVANumber) {
      // Has VA Number - set to virtual_account and show immediately
      setSelectedMethod('virtual_account')
      generatePaymentInstructions()
    } 
    else if (transaction?.metadata?.xenditInvoiceUrl) {
      // Has invoice URL - redirect to Xendit
      setSelectedMethod('xendit_invoice')
      toast.info('Mengalihkan ke halaman pembayaran Xendit...')
      
      const url = transaction.metadata.xenditInvoiceUrl
      setTimeout(() => {
        window.location.href = url
      }, 1000)
    } 
    else if (transaction) {
      // Fallback to manual payment
      setSelectedMethod('bank_transfer')
      generatePaymentInstructions()
    }
  }, [transaction])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/checkout?transactionId=${transactionId}`)
      const result = await response.json()

      if (result.success) {
        setTransaction(result.transaction)
        
        // Auto-detect payment method
        if (result.transaction.metadata?.xenditVANumber) {
          setSelectedMethod('virtual_account')
        } else if (result.transaction.metadata?.xenditInvoiceUrl) {
          setSelectedMethod('xendit_invoice')
        } else {
          setSelectedMethod('bank_transfer')
        }
      } else {
        throw new Error(result.error || 'Transaction not found')
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      toast.error('Gagal memuat data transaksi')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const generatePaymentInstructions = () => {
    if (!transaction) return

    const instructions = {
      xendit_invoice: {
        title: 'Pembayaran Online',
        description: 'Bayar menggunakan berbagai metode pembayaran:',
        methods: [
          'Virtual Account (BCA, BNI, BRI, Mandiri)',
          'E-Wallet (OVO, DANA, GoPay, LinkAja)',
          'QRIS (Semua aplikasi pembayaran)',
          'Kartu Kredit/Debit'
        ],
        instructions: [
          'Klik tombol "Bayar Sekarang" di bawah',
          'Pilih metode pembayaran yang diinginkan',
          'Ikuti instruksi pembayaran',
          'Pembayaran akan otomatis terkonfirmasi'
        ]
      },
      bank_transfer: {
        title: 'Transfer Bank',
        description: 'Transfer ke rekening berikut:',
        accounts: [
          {
            bank: 'Bank BCA',
            accountNumber: '1234567890',
            accountName: 'CV. Ekspor Yuk Indonesia'
          },
          {
            bank: 'Bank Mandiri',
            accountNumber: '0987654321',
            accountName: 'CV. Ekspor Yuk Indonesia'
          }
        ],
        instructions: [
          'Transfer sesuai nominal yang tertera',
          'Simpan bukti transfer',
          'Kirim bukti transfer ke WhatsApp kami',
          'Tunggu konfirmasi dalam 1x24 jam'
        ]
      },
      virtual_account: {
        title: 'Virtual Account',
        description: 'Bayar melalui Virtual Account:',
        note: 'Nomor VA akan digenerate otomatis setelah klik tombol di bawah',
        instructions: [
          'Klik "Generate Virtual Account"',
          'Pilih bank yang diinginkan',
          'Catat nomor Virtual Account',
          'Bayar melalui ATM/Mobile Banking',
          'Pembayaran otomatis terkonfirmasi'
        ]
      },
      ewallet: {
        title: 'E-Wallet',
        description: 'Bayar menggunakan e-wallet favorit Anda:',
        methods: ['OVO', 'DANA', 'GoPay', 'LinkAja'],
        instructions: [
          'Pilih e-wallet yang diinginkan',
          'Masukkan nomor HP yang terdaftar',
          'Klik "Bayar Sekarang"',
          'Ikuti instruksi di aplikasi e-wallet',
          'Pembayaran otomatis terkonfirmasi'
        ]
      }
    }

    setPaymentInstructions(instructions[selectedMethod as keyof typeof instructions])
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} berhasil disalin!`)
  }

  const sendWhatsApp = () => {
    const message = `Halo, saya sudah melakukan pembayaran untuk:

📄 Invoice: ${transaction?.id}
💰 Amount: Rp ${transaction?.amount.toLocaleString('id-ID')}
👤 Nama: ${transaction?.customerName}
📧 Email: ${transaction?.customerEmail}

Mohon dicek dan dikonfirmasi. Terima kasih!`

    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-6">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Transaksi Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-4">
              Maaf, transaksi yang Anda cari tidak ditemukan atau sudah kadaluarsa.
            </p>
            <Button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-600">
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="/logo-ekspor-yuk.png" 
              alt="Ekspor Yuk" 
              className="h-8"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
              }}
            />
            <span className="font-bold text-orange-500">Ekspor Yuk</span>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="border-orange-200 text-orange-600">
              <Clock className="w-3 h-3 mr-1" />
              Menunggu Pembayaran
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Details */}
          <div className="space-y-6">
            {/* Countdown Timer */}
            {timeRemaining > 0 && (
              <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Selesaikan Pembayaran Dalam</p>
                    <div className="text-4xl font-bold text-orange-600 font-mono mb-2">
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-xs text-gray-500">Transaksi akan otomatis dibatalkan jika tidak dibayar</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Detail Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">No. Invoice</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-orange-600">{transaction.invoiceNumber || transaction.id.slice(0, 8).toUpperCase()}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(transaction.invoiceNumber || transaction.id, 'Invoice')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Tanggal</p>
                    <p className="font-semibold text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      pukul {new Date(transaction.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tipe</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {transaction.type === 'MEMBERSHIP' ? 'Membership' : 'Produk'}
                      </Badge>
                      {transaction.metadata?.membershipType && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                          {transaction.metadata.membershipType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Badge variant="outline" className="border-yellow-200 text-yellow-600">
                      Pending
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-gray-500 text-sm">Pembeli</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{transaction.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{transaction.customerEmail}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Metode Pembayaran yang Dipilih */}
                {transaction?.metadata?.paymentChannel && (
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Metode Pembayaran</p>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        {['BCA', 'BRI', 'BNI', 'MANDIRI', 'PERMATA', 'CIMB', 'BSI', 'BJB', 'SAHABAT_SAMPOERNA'].includes(String(transaction.metadata.paymentChannel)) && (
                          <Building className="w-5 h-5 text-blue-600" />
                        )}
                        {['OVO', 'DANA', 'GOPAY', 'LINKAJA', 'SHOPEEPAY'].includes(String(transaction.metadata.paymentChannel)) && (
                          <Wallet className="w-5 h-5 text-purple-600" />
                        )}
                        {['QRIS'].includes(String(transaction.metadata.paymentChannel)) && (
                          <span className="text-lg">📱</span>
                        )}
                        {['ALFAMART', 'INDOMARET'].includes(String(transaction.metadata.paymentChannel)) && (
                          <CreditCard className="w-5 h-5 text-red-600" />
                        )}
                        {['KREDIVO', 'AKULAKU'].includes(String(transaction.metadata.paymentChannel)) && (
                          <Clock className="w-5 h-5 text-orange-600" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {transaction.metadata.paymentChannelName || transaction.metadata.paymentChannel}
                          </p>
                          <p className="text-xs text-gray-500">
                            {['BCA', 'BRI', 'BNI', 'MANDIRI', 'PERMATA', 'CIMB', 'BSI', 'BJB', 'SAHABAT_SAMPOERNA'].includes(String(transaction.metadata.paymentChannel)) && 'Virtual Account'}
                            {['OVO', 'DANA', 'GOPAY', 'LINKAJA', 'SHOPEEPAY'].includes(String(transaction.metadata.paymentChannel)) && 'E-Wallet'}
                            {['QRIS'].includes(String(transaction.metadata.paymentChannel)) && 'Scan QRIS'}
                            {['ALFAMART', 'INDOMARET'].includes(String(transaction.metadata.paymentChannel)) && 'Retail Outlet'}
                            {['KREDIVO', 'AKULAKU'].includes(String(transaction.metadata.paymentChannel)) && 'Cicilan PayLater'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Harga dengan Diskon */}
                <div className="space-y-2">
                  {/* Show original amount if it's greater than final amount (meaning there was a discount) */}
                  {((transaction?.originalAmount && transaction.originalAmount > transaction.amount) || 
                    (transaction?.metadata?.originalAmount && transaction.metadata.originalAmount > transaction.amount)) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Harga Normal</span>
                      <span className="text-gray-400 line-through">
                        Rp {(transaction.originalAmount || transaction.metadata?.originalAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {/* Show discount amount if exists */}
                  {((transaction?.discountAmount && transaction.discountAmount > 0) || 
                    (transaction?.metadata?.discountAmount && transaction.metadata.discountAmount > 0)) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Diskon</span>
                      <span className="text-green-600 font-semibold">
                        - Rp {(transaction.discountAmount || transaction.metadata?.discountAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {/* Show separator if discount was applied */}
                  {((transaction?.originalAmount && transaction.originalAmount > transaction.amount) || 
                    (transaction?.metadata?.originalAmount && transaction.metadata.originalAmount > transaction.amount)) && 
                    <Separator />
                  }
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Total Pembayaran</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        Rp {transaction.amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Butuh Bantuan?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    Hubungi admin kami untuk bantuan pembayaran atau konfirmasi manual
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={sendWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp Admin - 081234567890
                    </Button>
                    <Button
                      onClick={() => window.location.href = 'mailto:support@eksporyuk.com'}
                      variant="outline"
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Manual Payment Confirmation */}
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900 mb-1">
                        Konfirmasi Pembayaran Manual
                      </p>
                      <p className="text-sm text-orange-700">
                        Jika sudah transfer, kirim bukti pembayaran untuk konfirmasi cepat (1-2 jam)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={sendWhatsApp}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Kirim Bukti Pembayaran
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Check if we have VA number (custom UI) or should redirect to Xendit */}
                {transaction?.metadata?.xenditVANumber && 
                 !transaction.metadata.xenditVANumber.startsWith('http') && 
                 transaction?.metadata?.xenditBankCode ? (
                  // VIRTUAL ACCOUNT - Langsung tampilkan VA dan panduan (Custom UI)
                  <div className="space-y-4">
                    {/* Show warning if this is a fallback */}
                    {transaction.metadata.xenditFallback && transaction.metadata.xenditPaymentMethod === 'MANUAL' && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-yellow-900 mb-1">
                              Mode Manual
                            </p>
                            <p className="text-sm text-yellow-800">
                              Sistem sedang dalam mode testing. Gunakan nomor VA di bawah untuk simulasi pembayaran. 
                              Status akan diupdate secara manual oleh admin.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VA Number Display */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-5 h-5 text-orange-600" />
                        <h4 className="font-bold text-orange-800">
                          Virtual Account {transaction.metadata.xenditBankCode}
                        </h4>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-orange-200 mb-3">
                        <p className="text-sm text-gray-600 mb-2">Nomor Virtual Account</p>
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-mono font-bold text-2xl text-gray-900 tracking-wider">
                            {transaction.metadata.xenditVANumber}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => transaction?.metadata?.xenditVANumber && copyToClipboard(
                              transaction.metadata.xenditVANumber,
                              'Nomor Virtual Account'
                            )}
                            className="shrink-0"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-gray-600 mb-2">Total Transfer</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-orange-600">
                            Rp {transaction.amount.toLocaleString('id-ID')}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(
                              transaction.amount.toString(),
                              'Jumlah pembayaran'
                            )}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Instructions Xendit Style */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">Langkah Pembayaran</h4>
                      </div>

                      {/* ATM BERSAMA */}
                      <div className="border-b border-gray-200">
                        <button
                          onClick={(e) => {
                            const content = e.currentTarget.nextElementSibling as HTMLElement
                            if (content) {
                              content.style.display = content.style.display === 'none' ? 'block' : 'none'
                            }
                          }}
                          className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>ATM BERSAMA</span>
                          <span className="text-xs">▼</span>
                        </button>
                        <div className="px-4 pb-4" style={{ display: 'none' }}>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            <li>Insert Your ATM Card</li>
                            <li>Choose "Transaksi Lainnya" or "Other"</li>
                            <li>Choose "Transfer"</li>
                            <li>Choose "Transfer ke Bank Lain" or "Transfer to Other Banks"</li>
                            <li>Input Bank Code <strong>(013)</strong> + Virtual Account Number: <strong className="font-mono">{transaction.metadata.xenditVANumber}</strong></li>
                            <li>Input amount: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                            <li>Review and confirm payment details</li>
                            <li>Complete payment and keep the receipt</li>
                            <li>Payment will be confirmed automatically within 5 minutes</li>
                          </ol>
                        </div>
                      </div>

                      {/* ATM PRIMA */}
                      <div className="border-b border-gray-200">
                        <button
                          onClick={(e) => {
                            const content = e.currentTarget.nextElementSibling as HTMLElement
                            if (content) {
                              content.style.display = content.style.display === 'none' ? 'block' : 'none'
                            }
                          }}
                          className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>ATM PRIMA</span>
                          <span className="text-xs">▼</span>
                        </button>
                        <div className="px-4 pb-4" style={{ display: 'none' }}>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            <li>Insert Your ATM Card</li>
                            <li>Choose "Transaksi Lainnya" or "Other"</li>
                            <li>Choose "Transfer ke rekening bank lain"</li>
                            <li>Input Bank Code <strong>(013)</strong> + VA Number: <strong className="font-mono">{transaction.metadata.xenditVANumber}</strong></li>
                            <li>Input amount: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                            <li>Review and confirm payment details</li>
                            <li>Complete payment and keep the receipt</li>
                          </ol>
                        </div>
                      </div>

                      {/* IBANKING */}
                      <div className="border-b border-gray-200">
                        <button
                          onClick={(e) => {
                            const content = e.currentTarget.nextElementSibling as HTMLElement
                            if (content) {
                              content.style.display = content.style.display === 'none' ? 'block' : 'none'
                            }
                          }}
                          className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>IBANKING</span>
                          <span className="text-xs">▼</span>
                        </button>
                        <div className="px-4 pb-4" style={{ display: 'none' }}>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            <li>Login to your Internet Banking account</li>
                            <li>Choose "Transfer" menu</li>
                            <li>Select "Transfer to Other Bank"</li>
                            <li>Select bank: <strong>{transaction.metadata.xenditBankCode}</strong></li>
                            <li>Input VA Number: <strong className="font-mono">{transaction.metadata.xenditVANumber}</strong></li>
                            <li>Input amount: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                            <li>Review details and confirm transaction</li>
                            <li>Payment will be automatically confirmed within 5 minutes</li>
                          </ol>
                        </div>
                      </div>

                      {/* MBANKING */}
                      <div>
                        <button
                          onClick={(e) => {
                            const content = e.currentTarget.nextElementSibling as HTMLElement
                            if (content) {
                              content.style.display = content.style.display === 'none' ? 'block' : 'none'
                            }
                          }}
                          className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>MBANKING</span>
                          <span className="text-xs">▼</span>
                        </button>
                        <div className="px-4 pb-4" style={{ display: 'none' }}>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            <li>Open your mobile banking app</li>
                            <li>Select "Transfer" menu</li>
                            <li>Choose "Transfer to Other Bank" or "Virtual Account"</li>
                            <li>Select bank: <strong>{transaction.metadata.xenditBankCode}</strong></li>
                            <li>Input VA Number: <strong className="font-mono">{transaction.metadata.xenditVANumber}</strong></li>
                            <li>Input amount: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                            <li>Confirm and complete payment</li>
                            <li>Save your transaction receipt</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900 mb-1">
                            Menunggu Pembayaran
                          </p>
                          <p className="text-sm text-yellow-800">
                            Akses membership/produk akan otomatis diaktifkan setelah pembayaran berhasil. 
                            Anda akan menerima email konfirmasi.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (transaction?.metadata?.xenditVANumber && transaction.metadata.xenditVANumber.startsWith('http')) || transaction?.paymentUrl ? (
                  // XENDIT CHECKOUT LINK - Redirect to Xendit (Fallback dari PaymentRequest ke Invoice)
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">
                            Pembayaran Melalui Xendit
                          </p>
                          <p className="text-sm text-blue-800">
                            Klik tombol di bawah untuk melanjutkan ke halaman pembayaran Xendit. 
                            Anda dapat memilih berbagai metode pembayaran di sana.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-700 mb-2">Metode Pembayaran Tersedia:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Virtual Account (Semua Bank)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>E-Wallet (OVO, DANA, GoPay)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>QRIS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Kartu Kredit/Debit</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        const checkoutUrl = transaction.paymentUrl || 
                                          (transaction.metadata?.xenditVANumber?.startsWith('http') ? transaction.metadata.xenditVANumber : null);
                        if (checkoutUrl) window.open(checkoutUrl, '_blank');
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Lanjutkan ke Pembayaran - Rp {transaction.amount.toLocaleString('id-ID')}
                    </Button>

                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800 text-center">
                        💡 Setelah pembayaran berhasil, kembali ke halaman ini untuk mengaktifkan akses
                      </p>
                    </div>
                  </div>
                ) : transaction?.metadata?.xenditInvoiceUrl ? (
                  // XENDIT INVOICE - Multi payment methods (Legacy)
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-700 mb-2">Metode Pembayaran Tersedia:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Virtual Account (Semua Bank)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>E-Wallet (OVO, DANA, GoPay)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>QRIS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Kartu Kredit/Debit</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => transaction?.metadata?.xenditInvoiceUrl && window.open(transaction.metadata.xenditInvoiceUrl, '_blank')}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Bayar Sekarang - Rp {transaction.amount.toLocaleString('id-ID')}
                    </Button>
                  </div>
                ) : (
                  // MANUAL PAYMENT - User must select payment method first
                  <div className="space-y-4">
                    {!selectedMethod ? (
                      // PAYMENT METHOD SELECTOR
                      <div className="space-y-4">
                        <div className="bg-orange-50 border-2 border-orange-300 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-orange-900 mb-1">
                                Pilih Metode Pembayaran
                              </p>
                              <p className="text-sm text-orange-700">
                                Pilih salah satu metode pembayaran di bawah ini untuk melihat panduan transfer
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b">
                            <h4 className="font-semibold text-gray-900">Metode Pembayaran</h4>
                          </div>
                          
                          <div className="p-2 space-y-2">
                            {/* BCA */}
                            <button
                              onClick={() => setSelectedMethod('BCA')}
                              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Building className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">Bank BCA</p>
                                    <p className="text-sm text-gray-600">Transfer Bank</p>
                                  </div>
                                </div>
                                <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-sm font-semibold">Pilih →</span>
                                </div>
                              </div>
                            </button>

                            {/* Mandiri */}
                            <button
                              onClick={() => setSelectedMethod('MANDIRI')}
                              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                    <Building className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">Bank Mandiri</p>
                                    <p className="text-sm text-gray-600">Transfer Bank</p>
                                  </div>
                                </div>
                                <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-sm font-semibold">Pilih →</span>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // SHOW PAYMENT INSTRUCTIONS BASED ON SELECTED METHOD
                      <div className="space-y-4">
                        {/* Selected Method Display */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Building className="w-5 h-5 text-orange-600" />
                              <div>
                                <h4 className="font-bold text-orange-800">
                                  {selectedMethod === 'BCA' ? 'Bank BCA' : 'Bank Mandiri'}
                                </h4>
                                <p className="text-xs text-orange-600">Transfer Manual</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMethod('')}
                              className="border-orange-300"
                            >
                              Ganti Metode
                            </Button>
                          </div>

                          {/* Bank Account Details */}
                          <div className="bg-white p-4 rounded-lg border border-orange-200 mb-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-orange-600">
                                  {selectedMethod === 'BCA' ? 'Bank BCA' : 'Bank Mandiri'}
                                </p>
                                <p className="text-sm text-gray-600">CV. Ekspor Yuk Indonesia</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(
                                  selectedMethod === 'BCA' ? '1234567890' : '0987654321',
                                  'Nomor rekening'
                                )}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <p className="font-mono font-bold text-2xl text-gray-900">
                              {selectedMethod === 'BCA' ? '1234567890' : '0987654321'}
                            </p>
                          </div>

                          {/* Total Amount to Transfer */}
                          <div className="bg-white p-4 rounded-lg border border-orange-200">
                            <p className="text-sm text-gray-600 mb-2">Total Transfer</p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-orange-600">
                                Rp {transaction.amount.toLocaleString('id-ID')}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(
                                  transaction.amount.toString(),
                                  'Jumlah pembayaran'
                                )}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="font-semibold text-gray-900">Cara Pembayaran</h4>
                          </div>

                          {/* ATM */}
                          <div className="border-b border-gray-200">
                            <button
                              onClick={(e) => {
                                const content = e.currentTarget.nextElementSibling as HTMLElement
                                if (content) {
                                  content.style.display = content.style.display === 'none' ? 'block' : 'none'
                                }
                              }}
                              className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>Transfer via ATM</span>
                              <span className="text-xs">▼</span>
                            </button>
                            <div className="px-4 pb-4" style={{ display: 'none' }}>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                <li>Masukkan kartu ATM dan PIN</li>
                                <li>Pilih menu <strong>Transfer</strong></li>
                                <li>Pilih <strong>Transfer ke Bank {selectedMethod === 'BCA' ? 'BCA' : 'Mandiri'}</strong></li>
                                <li>Masukkan nomor rekening: <strong className="font-mono">{selectedMethod === 'BCA' ? '1234567890' : '0987654321'}</strong></li>
                                <li>Masukkan jumlah transfer: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                                <li>Periksa detail transaksi dan konfirmasi</li>
                                <li>Simpan struk sebagai bukti transfer</li>
                              </ol>
                            </div>
                          </div>

                          {/* Internet Banking */}
                          <div className="border-b border-gray-200">
                            <button
                              onClick={(e) => {
                                const content = e.currentTarget.nextElementSibling as HTMLElement
                                if (content) {
                                  content.style.display = content.style.display === 'none' ? 'block' : 'none'
                                }
                              }}
                              className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>Internet Banking</span>
                              <span className="text-xs">▼</span>
                            </button>
                            <div className="px-4 pb-4" style={{ display: 'none' }}>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                <li>Login ke Internet Banking Anda</li>
                                <li>Pilih menu <strong>Transfer</strong></li>
                                <li>Pilih <strong>Transfer ke Rekening {selectedMethod === 'BCA' ? 'BCA' : 'Mandiri'}</strong></li>
                                <li>Masukkan nomor rekening: <strong className="font-mono">{selectedMethod === 'BCA' ? '1234567890' : '0987654321'}</strong></li>
                                <li>Masukkan jumlah: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                                <li>Konfirmasi transaksi</li>
                                <li>Simpan bukti transfer</li>
                              </ol>
                            </div>
                          </div>

                          {/* Mobile Banking */}
                          <div>
                            <button
                              onClick={(e) => {
                                const content = e.currentTarget.nextElementSibling as HTMLElement
                                if (content) {
                                  content.style.display = content.style.display === 'none' ? 'block' : 'none'
                                }
                              }}
                              className="w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>Mobile Banking</span>
                              <span className="text-xs">▼</span>
                            </button>
                            <div className="px-4 pb-4" style={{ display: 'none' }}>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                <li>Buka aplikasi Mobile Banking</li>
                                <li>Pilih menu <strong>Transfer</strong></li>
                                <li>Pilih <strong>Transfer Antar Bank</strong> atau <strong>Transfer ke {selectedMethod === 'BCA' ? 'BCA' : 'Mandiri'}</strong></li>
                                <li>Masukkan nomor rekening: <strong className="font-mono">{selectedMethod === 'BCA' ? '1234567890' : '0987654321'}</strong></li>
                                <li>Masukkan nominal: <strong>Rp {transaction.amount.toLocaleString('id-ID')}</strong></li>
                                <li>Konfirmasi dan selesaikan transaksi</li>
                                <li>Screenshot bukti transfer</li>
                              </ol>
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Reminder */}
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-orange-700 mb-1">
                                Konfirmasi Pembayaran
                              </p>
                              <p className="text-sm text-orange-600 mb-3">
                                Setelah transfer, kirim bukti pembayaran ke WhatsApp kami untuk konfirmasi cepat (1-2 jam).
                              </p>
                              <Button
                                onClick={sendWhatsApp}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                size="sm"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Kirim Bukti Bayar
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Status Info */}
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-yellow-900 mb-1">
                                Menunggu Pembayaran
                              </p>
                              <p className="text-sm text-yellow-800">
                                Akses membership akan otomatis diaktifkan setelah pembayaran dikonfirmasi. 
                                Konfirmasi manual: 1x24 jam. Konfirmasi via WhatsApp: 1-2 jam.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="mb-4">© 2025 CV. Ekspor Yuk Indonesia. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            Pembayaran aman dan terpercaya
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>}>
      <PaymentPageContent />
    </Suspense>
  )
}