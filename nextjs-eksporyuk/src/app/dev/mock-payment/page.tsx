'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Wallet,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'

function MockPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending')

  const invoiceId = searchParams.get('invoice')
  const amount = searchParams.get('amount')
  const externalId = searchParams.get('external_id')

  const simulatePayment = async (paymentStatus: 'PAID' | 'FAILED') => {
    setProcessing(true)
    
    try {
      // Call mock webhook to simulate payment callback
      const res = await fetch('/api/dev/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          externalId,
          amount: parseInt(amount || '0'),
          status: paymentStatus,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        if (paymentStatus === 'PAID') {
          setStatus('success')
          toast.success('Pembayaran berhasil! Kredit akan ditambahkan.')
          setTimeout(() => {
            router.push('/affiliate/credits?payment=success')
          }, 2000)
        } else {
          setStatus('failed')
          toast.error('Pembayaran dibatalkan')
          setTimeout(() => {
            router.push('/affiliate/credits?payment=failed')
          }, 2000)
        }
      } else {
        toast.error(data.error || 'Gagal memproses pembayaran')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Error simulating payment:', error)
      toast.error('Gagal memproses pembayaran')
      setProcessing(false)
    }
  }

  if (!invoiceId || !externalId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Payment Link</h2>
            <p className="text-gray-600">Link pembayaran tidak valid</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">
              DEV MODE
            </Badge>
          </div>
          <CardTitle className="text-2xl">Mock Payment Gateway</CardTitle>
          <CardDescription className="text-blue-100">
            Simulasi pembayaran untuk development
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {status === 'pending' && (
            <>
              {/* Invoice Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice ID</span>
                  <span className="font-mono text-sm">{invoiceId?.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">External ID</span>
                  <span className="font-mono text-sm">{externalId?.slice(0, 25)}...</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600 font-semibold">Total Bayar</span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rp {parseInt(amount || '0').toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Payment Methods (Mock) */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Pilih Metode Pembayaran:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center gap-1"
                    disabled={processing}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs">Virtual Account</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center gap-1"
                    disabled={processing}
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="text-xs">E-Wallet</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center gap-1"
                    disabled={processing}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Credit Card</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col items-center gap-1"
                    disabled={processing}
                  >
                    <span className="text-lg">🏪</span>
                    <span className="text-xs">Retail</span>
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t">
                <p className="text-xs text-center text-gray-500">
                  Simulasi hasil pembayaran:
                </p>
                <Button
                  onClick={() => simulatePayment('PAID')}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Simulasi Pembayaran Berhasil
                </Button>
                <Button
                  onClick={() => simulatePayment('FAILED')}
                  disabled={processing}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  Simulasi Pembayaran Gagal
                </Button>
              </div>
            </>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Pembayaran Berhasil!
              </h3>
              <p className="text-gray-600 mb-4">
                Kredit akan segera ditambahkan ke akun Anda
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Mengalihkan...</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-8">
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-red-600 mb-2">
                Pembayaran Dibatalkan
              </h3>
              <p className="text-gray-600 mb-4">
                Silakan coba lagi
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Mengalihkan...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  )
}
