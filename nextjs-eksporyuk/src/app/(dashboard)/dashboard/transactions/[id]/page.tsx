'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Receipt,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone,
  Crown,
  Package,
  GraduationCap,
  ShoppingBag,
  Loader2,
  Download,
  Timer,
  Banknote,
  Building
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

interface TransactionDetail {
  id: string
  invoiceNumber: string | null
  type: 'MEMBERSHIP' | 'PRODUCT' | 'COURSE' | 'SUPPLIER' | 'OTHER'
  status: 'PENDING' | 'SUCCESS' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
  amount: number
  originalAmount: number | null
  discountAmount: number | null
  description: string | null
  paymentMethod: string | null
  paymentProvider: string | null
  paymentUrl: string | null
  externalId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerWhatsapp: string | null
  notes: string | null
  reference: string | null
  metadata: any
  createdAt: string
  paidAt: string | null
  expiredAt: string | null
  product?: {
    id: string
    name: string
    thumbnail: string | null
  } | null
  course?: {
    id: string
    title: string
    thumbnail: string | null
  } | null
  membership?: {
    id: string
    membershipId: string
    startDate: string | null
    endDate: string | null
    membership?: {
      name: string
      slug: string
    }
  } | null
  coupon?: {
    code: string
    discountType: string
    discountValue: number
  } | null
}

const statusConfig = {
  PENDING: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  SUCCESS: { label: 'Pembayaran Berhasil', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  PAID: { label: 'Pembayaran Berhasil', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  FAILED: { label: 'Pembayaran Gagal', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  EXPIRED: { label: 'Kadaluarsa', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertCircle },
  REFUNDED: { label: 'Dikembalikan', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: RefreshCw },
}

const typeConfig = {
  MEMBERSHIP: { label: 'Membership', icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  PRODUCT: { label: 'Produk Digital', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  COURSE: { label: 'Kursus', icon: GraduationCap, color: 'text-green-600', bgColor: 'bg-green-100' },
  SUPPLIER: { label: 'Database Supplier', icon: ShoppingBag, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  OTHER: { label: 'Lainnya', icon: CreditCard, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

// Countdown Timer Component
function CountdownTimer({ expiredAt, onExpired }: { expiredAt: string, onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiredAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        onExpired?.()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [expiredAt, onExpired])

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 text-red-600 py-4">
        <AlertCircle className="h-6 w-6" />
        <span className="font-semibold text-lg">Waktu pembayaran telah habis</span>
      </div>
    )
  }

  const TimeBox = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-orange-500 text-white w-14 h-14 rounded-lg flex items-center justify-center shadow-md">
        <span className="text-2xl font-bold font-mono">{String(value).padStart(2, '0')}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  )

  return (
    <div className="flex items-center justify-center gap-2">
      {timeLeft.days > 0 && (
        <>
          <TimeBox value={timeLeft.days} label="Hari" />
          <span className="text-2xl font-bold text-gray-300 mb-5">:</span>
        </>
      )}
      <TimeBox value={timeLeft.hours} label="Jam" />
      <span className="text-2xl font-bold text-gray-300 mb-5">:</span>
      <TimeBox value={timeLeft.minutes} label="Menit" />
      <span className="text-2xl font-bold text-gray-300 mb-5">:</span>
      <TimeBox value={timeLeft.seconds} label="Detik" />
    </div>
  )
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params?.id as string
  
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (transactionId) {
      fetchTransaction()
    }
  }, [transactionId])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/transactions/${transactionId}`)
      const data = await response.json()
      
      if (data.success) {
        setTransaction(data.transaction)
      } else {
        toast.error('Transaksi tidak ditemukan')
        router.push('/dashboard/transactions')
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      toast.error('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Disalin ke clipboard')
  }

  const getTransactionTitle = () => {
    if (!transaction) return ''
    if (transaction.type === 'MEMBERSHIP' && transaction.membership?.membership?.name) {
      return `Membership ${transaction.membership.membership.name}`
    }
    if (transaction.type === 'PRODUCT' && transaction.product?.name) {
      return transaction.product.name
    }
    if (transaction.type === 'COURSE' && transaction.course?.title) {
      return transaction.course.title
    }
    return transaction.description || 'Transaksi'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="text-center py-20">
          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Transaksi Tidak Ditemukan</h3>
          <Button className="mt-4" onClick={() => router.push('/dashboard/transactions')}>
            Kembali ke Daftar Transaksi
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[transaction.status]
  const typeInfo = typeConfig[transaction.type]
  const StatusIcon = statusInfo.icon
  const TypeIcon = typeInfo.icon

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.push('/dashboard/transactions')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      {/* Header Card */}
      <Card className="mb-6 border shadow-sm overflow-hidden">
        <div className={`${typeInfo.bgColor} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-white rounded-xl shadow-sm ${typeInfo.color}`}>
                <TypeIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{getTransactionTitle()}</h1>
                <p className="text-gray-600">{typeInfo.label}</p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} text-sm py-1 px-3`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Invoice Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Informasi Invoice</h3>
              <div className="space-y-3">
                {transaction.invoiceNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">No. Invoice</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{transaction.invoiceNumber}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(transaction.invoiceNumber!)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tanggal Transaksi</span>
                  <span className="font-medium">
                    {format(new Date(transaction.createdAt), 'd MMMM yyyy, HH:mm', { locale: localeId })}
                  </span>
                </div>
                {transaction.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tanggal Pembayaran</span>
                    <span className="font-medium text-green-600">
                      {format(new Date(transaction.paidAt), 'd MMMM yyyy, HH:mm', { locale: localeId })}
                    </span>
                  </div>
                )}
                {transaction.expiredAt && transaction.status === 'PENDING' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Batas Pembayaran</span>
                    <span className="font-medium text-red-600">
                      {format(new Date(transaction.expiredAt), 'd MMMM yyyy, HH:mm', { locale: localeId })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Metode Pembayaran</h3>
              <div className="space-y-3">
                {transaction.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Metode</span>
                    <span className="font-medium">{transaction.paymentMethod}</span>
                  </div>
                )}
                {transaction.paymentProvider && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Provider</span>
                    <span className="font-medium">{transaction.paymentProvider}</span>
                  </div>
                )}
                {transaction.externalId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID Eksternal</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{transaction.externalId}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(transaction.externalId!)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Card - Show for PENDING transactions */}
      {transaction.status === 'PENDING' && (transaction.expiredAt || transaction.metadata?.xenditVANumber || transaction.metadata?.vaNumber || transaction.paymentUrl) && (
        <Card className="mb-6 border-2 border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5 text-orange-600" />
                Informasi Pembayaran
              </CardTitle>
              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                Menunggu Pembayaran
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Countdown Timer */}
            {transaction.expiredAt && (
            <div className="bg-white rounded-xl p-5 border border-orange-200">
              <p className="text-sm text-gray-600 mb-4 text-center">Selesaikan pembayaran dalam:</p>
              <CountdownTimer 
                expiredAt={transaction.expiredAt} 
                onExpired={() => {
                  toast.error('Waktu pembayaran telah habis')
                  fetchTransaction()
                }}
              />
            </div>
            )}

            {/* VA Number / Payment Details */}
            {(transaction.metadata?.xenditVANumber || transaction.metadata?.vaNumber) && 
             !(transaction.metadata?.xenditVANumber?.startsWith('http')) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Bank Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-white">
                      <p className="text-sm opacity-90">Transfer ke Virtual Account</p>
                      <p className="font-bold text-lg">{transaction.metadata?.xenditBankCode || transaction.paymentMethod?.replace('VA_', '') || 'Bank'}</p>
                    </div>
                  </div>
                </div>
                
                {/* VA Number */}
                <div className="p-5 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl font-bold font-mono tracking-widest text-gray-900">
                      {transaction.metadata?.xenditVANumber || transaction.metadata?.vaNumber}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        copyToClipboard(transaction.metadata?.xenditVANumber || transaction.metadata?.vaNumber)
                        toast.success('Nomor VA disalin!')
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Salin
                    </Button>
                  </div>
                </div>

                {/* Amount */}
                <div className="p-5 bg-orange-50">
                  <p className="text-sm text-gray-500 mb-2">Jumlah yang harus dibayar</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="shrink-0"
                      onClick={() => copyToClipboard(String(transaction.amount))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Salin
                    </Button>
                  </div>
                  <p className="text-xs text-orange-700 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Transfer sesuai nominal untuk verifikasi otomatis
                  </p>
                </div>
              </div>
            )}

            {/* If no VA number but has payment URL (Invoice fallback) */}
            {((!transaction.metadata?.xenditVANumber && !transaction.metadata?.vaNumber) || 
              transaction.metadata?.xenditVANumber?.startsWith('http')) && 
             transaction.paymentUrl && (
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3 text-center">Lanjutkan pembayaran melalui link berikut:</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href={transaction.paymentUrl} target="_blank">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bayar Sekarang
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                Cara Pembayaran
              </h4>
              <ol className="text-sm text-gray-600 space-y-3">
                <li className="flex gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Buka aplikasi mobile banking atau kunjungi ATM bank Anda</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Pilih menu <strong>Transfer ke Virtual Account</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Masukkan nomor Virtual Account yang tertera di atas</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span>Masukkan nominal <strong>sesuai tagihan</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">5</span>
                  <span>Konfirmasi dan selesaikan pembayaran</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                  <span>Pembayaran akan diverifikasi otomatis dalam <strong>1-5 menit</strong></span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card className="mb-6 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Rincian Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transaction.originalAmount && transaction.originalAmount !== transaction.amount && (
              <div className="flex items-center justify-between text-gray-600">
                <span>Harga Asli</span>
                <span className="line-through">{formatCurrency(Number(transaction.originalAmount))}</span>
              </div>
            )}
            
            {transaction.discountAmount && Number(transaction.discountAmount) > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Diskon {transaction.coupon?.code && `(${transaction.coupon.code})`}</span>
                <span>-{formatCurrency(Number(transaction.discountAmount))}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Pembayaran</span>
              <span className="text-blue-600">{formatCurrency(Number(transaction.amount))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      {(transaction.customerName || transaction.customerEmail || transaction.customerPhone) && (
        <Card className="mb-6 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Data Pembeli</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {transaction.customerName && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p className="font-medium">{transaction.customerName}</p>
                  </div>
                </div>
              )}
              {transaction.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{transaction.customerEmail}</p>
                  </div>
                </div>
              )}
              {(transaction.customerPhone || transaction.customerWhatsapp) && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p className="font-medium">{transaction.customerWhatsapp || transaction.customerPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Period (if applicable) */}
      {transaction.membership && transaction.membership.startDate && (
        <Card className="mb-6 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Periode Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-500">Mulai</p>
                <p className="font-medium">
                  {format(new Date(transaction.membership.startDate), 'd MMMM yyyy', { locale: localeId })}
                </p>
              </div>
              <div className="text-gray-300">→</div>
              <div>
                <p className="text-sm text-gray-500">Berakhir</p>
                <p className="font-medium">
                  {transaction.membership.endDate 
                    ? format(new Date(transaction.membership.endDate), 'd MMMM yyyy', { locale: localeId })
                    : 'Selamanya'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {transaction.status === 'PENDING' && transaction.paymentUrl && (
          <Button asChild>
            <Link href={transaction.paymentUrl} target="_blank">
              <CreditCard className="h-4 w-4 mr-2" />
              Bayar Sekarang
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
        
        {transaction.status === 'PAID' && (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Unduh Invoice
          </Button>
        )}
      </div>
    </div>
  )
}
