'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, RefreshCw, ArrowLeft, Phone } from 'lucide-react'

function CheckoutFailedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('Pembayaran gagal diproses')

  useEffect(() => {
    const txnId = searchParams.get('txn') || searchParams.get('transaction_id')
    const error = searchParams.get('error')
    
    setTransactionId(txnId)
    if (error) {
      setErrorMessage(decodeURIComponent(error))
    }
  }, [searchParams])

  const handleRetry = () => {
    if (transactionId) {
      // Redirect back to checkout with transaction info to retry
      router.push(`/transactions/${transactionId}`)
    } else {
      // Go back to membership selection
      router.push('/membership')
    }
  }

  const handleGoHome = () => {
    router.push(session?.user ? '/dashboard' : '/')
  }

  const handleContactSupport = () => {
    const message = `Halo, saya mengalami masalah dengan pembayaran. Transaction ID: ${transactionId || 'N/A'}`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/6281234567890?text=${encodedMessage}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card className="border-red-200 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">
              Pembayaran Gagal
            </CardTitle>
            <p className="text-red-600 mt-2">
              {errorMessage}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {transactionId && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">ID Transaksi:</span> {transactionId}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
              
              <Button 
                onClick={handleContactSupport}
                variant="outline" 
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                size="lg"
              >
                <Phone className="mr-2 h-4 w-4" />
                Hubungi Support
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="ghost" 
                className="w-full text-gray-600 hover:bg-gray-100"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Jika masalah berlanjut, silakan hubungi customer support kami</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <CheckoutFailedContent />
    </Suspense>
  )
}