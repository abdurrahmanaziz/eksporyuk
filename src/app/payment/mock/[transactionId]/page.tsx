'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function MockPaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const transactionId = params.transactionId as string
  const amount = searchParams.get('amount')
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    
    if (status === 'success' && countdown === 0) {
      window.location.href = `/checkout/success?transaction_id=${transactionId}`
    }
  }, [status, countdown, transactionId])

  const handleSuccess = () => {
    setStatus('success')
  }

  const handleFailed = () => {
    setStatus('failed')
    setTimeout(() => {
      window.location.href = `/checkout/failed?transaction_id=${transactionId}`
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🧪</span>
          </div>
          <CardTitle className="text-2xl">Mock Payment - Development Mode</CardTitle>
          <CardDescription>
            This is a simulated payment page for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Transaction ID:</span>
              <span className="text-sm font-mono">{transactionId.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-bold">
                Rp {amount ? parseInt(amount).toLocaleString('id-ID') : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={status === 'success' ? 'default' : status === 'failed' ? 'destructive' : 'outline'}>
                {status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Status Display */}
          {status === 'pending' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>In production, this would redirect to Xendit payment page.</p>
                <p className="mt-2">Choose an action to simulate payment result:</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleSuccess}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Simulate Success
                </Button>
                <Button 
                  onClick={handleFailed}
                  variant="destructive"
                  className="w-full"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Simulate Failed
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Redirecting in {countdown} seconds...
                </p>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-600">Payment Failed</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Redirecting to failed page...
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Development Mode:</strong> This mock payment page only appears when{' '}
              <code className="bg-yellow-100 px-1 rounded">NODE_ENV=development</code> and Xendit
              returns IP blocked error (403). In production, users will be redirected to the actual
              Xendit payment page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
