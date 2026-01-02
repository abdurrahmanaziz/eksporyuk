'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, CheckCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePendingTransactions } from '@/hooks/usePendingTransactions'

export default function WaitingConfirmationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { transactions, hasAwaitingConfirmation, loading } = usePendingTransactions()
  
  const [timeAgo, setTimeAgo] = useState('')
  const invoice = searchParams?.get('invoice')

  // Get the most recent pending confirmation transaction
  const pendingTransaction = transactions.find(t => t.status === 'PENDING_CONFIRMATION')

  useEffect(() => {
    if (pendingTransaction) {
      const updateTime = () => {
        const now = new Date()
        const created = new Date(pendingTransaction.createdAt)
        const diffMs = now.getTime() - created.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        
        if (diffHours > 0) {
          setTimeAgo(`${diffHours} jam ${diffMins} menit yang lalu`)
        } else {
          setTimeAgo(`${diffMins} menit yang lalu`)
        }
      }
      
      updateTime()
      const interval = setInterval(updateTime, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [pendingTransaction])

  // Redirect to dashboard if no awaiting confirmation
  useEffect(() => {
    if (!loading && !hasAwaitingConfirmation) {
      router.push('/dashboard')
    }
  }, [loading, hasAwaitingConfirmation, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  if (!hasAwaitingConfirmation) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Menunggu Konfirmasi Pembayaran</h1>
              <p className="text-sm text-gray-600">Status pembayaran Anda sedang diverifikasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Status Banner */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-blue-900 mb-3">
                    Bukti Pembayaran Sedang Diverifikasi
                  </h2>
                  <p className="text-blue-700 mb-4 leading-relaxed">
                    Terima kasih! Bukti pembayaran Anda telah berhasil dikirim dan sedang dalam proses verifikasi oleh tim admin kami. 
                    Proses verifikasi biasanya memakan waktu maksimal <strong>1x24 jam</strong>.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-blue-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Status: Menunggu verifikasi admin</span>
                    </div>
                    {timeAgo && (
                      <span className="text-blue-500">• Dikirim {timeAgo}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          {pendingTransaction && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Transaksi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Invoice Number</label>
                      <p className="font-mono text-gray-900">{pendingTransaction.invoiceNumber || `INV${pendingTransaction.id.slice(0, 8).toUpperCase()}`}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Jumlah</label>
                      <p className="text-xl font-bold text-gray-900">Rp {Number(pendingTransaction.amount).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipe</label>
                      <p className="text-gray-900 capitalize">{pendingTransaction.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tanggal</label>
                      <p className="text-gray-900">
                        {new Date(pendingTransaction.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* What Happens Next */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apa yang Terjadi Selanjutnya?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Verifikasi Admin</h4>
                    <p className="text-gray-600 text-sm">Tim admin akan memverifikasi bukti pembayaran Anda dalam waktu 1x24 jam.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Aktivasi Otomatis</h4>
                    <p className="text-gray-600 text-sm">Setelah pembayaran dikonfirmasi, akses membership/produk akan langsung aktif dan Anda akan menerima notifikasi.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Butuh Bantuan?</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Jika ada pertanyaan atau kendala, jangan ragu untuk menghubungi customer service kami.
                  </p>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <a
                      href="https://wa.me/6281234567890?text=Halo, saya butuh bantuan terkait pembayaran"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Hubungi CS via WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}