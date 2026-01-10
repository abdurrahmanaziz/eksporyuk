'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import FeatureLock from '@/components/affiliate/FeatureLock'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  CreditCard,
  History,
  Package,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface CreditData {
  balance: number
  totalTopUp: number
  totalUsed: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  referenceType: string | null
  status: string
  createdAt: string
}

// Payment method interfaces - same as membership
interface PaymentMethod {
  code: string
  name: string
  type: string
  isActive: boolean
  fee?: number
}

interface AvailablePaymentMethods {
  xenditChannels: PaymentMethod[]
  enableXendit: boolean
}

const CREDIT_PACKAGES = [
  {
    name: 'Starter',
    credits: 70,
    price: 50000,
    perEmail: 714,
    popular: false,
  },
  {
    name: 'Basic',
    credits: 150,
    price: 100000,
    perEmail: 667,
    popular: true,
  },
  {
    name: 'Professional',
    credits: 400,
    price: 250000,
    perEmail: 625,
    popular: false,
  },
  {
    name: 'Business',
    credits: 900,
    price: 500000,
    perEmail: 556,
    popular: false,
  },
  {
    name: 'Enterprise',
    credits: 2000,
    price: 1000000,
    perEmail: 500,
    popular: false,
  },
]

export default function AffiliateCreditsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [credit, setCredit] = useState<CreditData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [topUpLoading, setTopUpLoading] = useState(false)
  
  // Payment method selection states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[0] | null>(null)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethods>({
    xenditChannels: [],
    enableXendit: false
  })
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentChannel, setPaymentChannel] = useState<string>('')
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCreditData()
      fetchPaymentMethods()
    }
  }, [status])

  const fetchPaymentMethods = async () => {
    try {
      setPaymentMethodLoading(true)
      const res = await fetch('/api/payment-methods')
      const data = await res.json()
      
      if (data.success) {
        setAvailablePaymentMethods({
          xenditChannels: data.data.xendit.channels || [],
          enableXendit: data.data.xendit.enabled
        })
        
        // Auto-select first available payment method
        if (data.data.xendit.enabled && data.data.xendit.channels.length > 0) {
          const firstBank = data.data.xendit.channels.find((ch: PaymentMethod) => 
            ch.type === 'bank_transfer' && ch.isActive
          )
          if (firstBank) {
            setPaymentMethod('bank_transfer')
            setPaymentChannel(firstBank.code)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setPaymentMethodLoading(false)
    }
  }

  const fetchCreditData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/affiliate/credits')
      const data = await res.json()

      if (res.ok) {
        setCredit(data.credit)
        setTransactions(data.transactions)
      } else {
        toast.error(data.error || 'Failed to load credit data')
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
      toast.error('Failed to load credit data')
    } finally {
      setLoading(false)
    }
  }

  const handleTopUp = async (packageData: typeof CREDIT_PACKAGES[0]) => {
    // Show payment method selection dialog
    setSelectedPackage(packageData)
    setShowPaymentDialog(true)
  }

  const handlePaymentConfirm = async () => {
    if (!selectedPackage || !paymentChannel) {
      toast.error('Silakan pilih metode pembayaran')
      return
    }

    try {
      setTopUpLoading(true)
      
      toast.info('Membuat invoice pembayaran...')
      
      // Create checkout with payment method selection
      const res = await fetch('/api/affiliate/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.name,
          credits: selectedPackage.credits,
          price: selectedPackage.price,
          paymentChannel,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (res.ok && data.paymentUrl) {
        toast.success('Redirect ke halaman pembayaran...')
        
        // Close dialog first
        setShowPaymentDialog(false)
        
        // Redirect to payment page (VA page or Xendit invoice)
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.error || 'Gagal membuat invoice pembayaran')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast.error('Gagal memproses checkout')
    } finally {
      setTopUpLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'TOPUP':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'DEDUCT':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'REFUND':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />
      default:
        return <History className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <FeatureLock feature="credits">
    <ResponsivePageWrapper>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Coins className="w-8 h-8 text-blue-600" />
            Kredit Broadcast Email
          </h1>
          <p className="text-gray-600">
            Kelola kredit untuk broadcast email ke leads Anda
          </p>
        </div>

        {/* Credit Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Saldo Kredit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-600">
                  {credit?.balance || 0}
                </span>
                <span className="text-gray-500">kredit</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                = {credit?.balance || 0} email dapat dikirim
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Top Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-green-600">
                  {credit?.totalTopUp || 0}
                </span>
                <span className="text-gray-500">kredit</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total pembelian kredit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Kredit Terpakai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-orange-600">
                  {credit?.totalUsed || 0}
                </span>
                <span className="text-gray-500">kredit</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total email terkirim
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Credit Packages */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Paket Kredit
            </CardTitle>
            <CardDescription>
              Pilih paket kredit sesuai kebutuhan broadcast Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`border rounded-lg p-4 relative ${
                    pkg.popular ? 'border-blue-500 shadow-md' : 'border-gray-200'
                  }`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-500">
                      Populer
                    </Badge>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {pkg.credits}
                    </p>
                    <p className="text-sm text-gray-500">kredit</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xl font-bold">
                      Rp {pkg.price.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">
                      ~Rp {Math.round(pkg.perEmail).toLocaleString('id-ID')}/email
                    </p>
                  </div>

                  <Button
                    onClick={() => handleTopUp(pkg)}
                    disabled={topUpLoading}
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    {topUpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Beli Sekarang
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">
                    Cara Kerja Kredit
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 1 kredit = 1 email yang dapat dikirim</li>
                    <li>• Kredit otomatis terpotong saat broadcast dikirim</li>
                    <li>• Kredit tidak memiliki masa kadaluarsa</li>
                    <li>• Broadcast terjadwal akan memotong kredit saat pengiriman</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Riwayat Transaksi
            </CardTitle>
            <CardDescription>
              Semua aktivitas kredit Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(tx.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{tx.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">
                            {new Date(tx.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          {tx.referenceType && (
                            <Badge variant="outline" className="text-xs">
                              {tx.referenceType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p
                        className={`text-lg font-semibold ${
                          tx.type === 'TOPUP' || tx.type === 'REFUND'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'TOPUP' || tx.type === 'REFUND' ? '+' : '-'}
                        {tx.amount}
                      </p>
                      <Badge className={`text-xs ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Selection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pilih Metode Pembayaran
            </DialogTitle>
            <DialogDescription>
              {selectedPackage && (
                <>
                  Paket: {selectedPackage.name} - {selectedPackage.credits} kredit 
                  (Rp {selectedPackage.price.toLocaleString('id-ID')})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymentMethodLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Memuat metode pembayaran...</span>
              </div>
            ) : (
              <>
                {/* Bank Transfer Options */}
                {availablePaymentMethods.enableXendit && availablePaymentMethods.xenditChannels.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Transfer Bank</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePaymentMethods.xenditChannels
                        .filter(method => method.type === 'bank_transfer' && method.isActive)
                        .map((method) => (
                          <Button
                            key={method.code}
                            variant={paymentChannel === method.code ? "default" : "outline"}
                            onClick={() => {
                              setPaymentMethod('bank_transfer')
                              setPaymentChannel(method.code)
                            }}
                            className="h-12 text-sm"
                          >
                            {method.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {/* General Payment Option */}
                {availablePaymentMethods.enableXendit && (
                  <div>
                    <h4 className="font-medium mb-3">Metode Lainnya</h4>
                    <Button
                      variant={!paymentChannel ? "default" : "outline"}
                      onClick={() => {
                        setPaymentMethod('invoice')
                        setPaymentChannel('')
                      }}
                      className="w-full h-12"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Kartu Kredit / E-Wallet / QRIS
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentDialog(false)}
              disabled={topUpLoading}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button 
              onClick={handlePaymentConfirm}
              disabled={topUpLoading || (!paymentChannel && paymentMethod !== 'invoice')}
              className="flex-1"
            >
              {topUpLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Lanjutkan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </ResponsivePageWrapper>
    </FeatureLock>
  )
}