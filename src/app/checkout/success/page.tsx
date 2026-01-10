'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  ArrowRight,
  Home,
  Download,
  MessageCircle,
  Star,
  Gift,
  Users,
  BookOpen,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { UpsaleModal } from '@/components/UpsaleModal'

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpsale, setShowUpsale] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [memberships, setMemberships] = useState<any[]>([])
  const [countdown, setCountdown] = useState(10) // Auto-redirect countdown
  const [autoRedirect, setAutoRedirect] = useState(true)
  const [csWhatsapp, setCsWhatsapp] = useState<string>('')

  // Fetch CS WhatsApp from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/payment')
        if (response.ok) {
          const data = await response.json()
          setCsWhatsapp(data.data?.customerServiceWhatsApp || '')
        }
      } catch (error) {
        console.error('Failed to fetch CS WhatsApp:', error)
      }
    }
    fetchSettings()
  }, [])

  // Auto-redirect to dashboard after countdown
  useEffect(() => {
    if (!loading && autoRedirect && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    
    if (countdown === 0 && autoRedirect) {
      // Redirect based on user role and transaction type
      const dashboardUrl = getDashboardUrl()
      router.push(dashboardUrl)
    }
  }, [countdown, loading, autoRedirect, router])

  // Determine dashboard URL based on session/transaction
  const getDashboardUrl = () => {
    if (transaction?.type === 'PRODUCT') {
      return '/my-products'
    }
    if (transaction?.type === 'COURSE') {
      return '/my-courses'
    }
    // Default: membership dashboard
    return '/my-dashboard'
  }

  useEffect(() => {
    const fetchTransactionData = async () => {
      const transactionId = searchParams.get('transaction_id')
      
      if (!transactionId) {
        setLoading(false)
        return
      }

      try {
        // Fetch transaction details
        const txRes = await fetch(`/api/transactions/${transactionId}`)
        if (txRes.ok) {
          const txData = await txRes.json()
          setTransaction(txData.transaction)

          // If transaction is for a product with upsale enabled
          if (txData.transaction?.type === 'PRODUCT' && txData.transaction?.productId) {
            const productRes = await fetch(`/api/products/${txData.transaction.productId}`)
            if (productRes.ok) {
              const productData = await productRes.json()
              const prod = productData.product

              if (prod.enableUpsale && Array.isArray(prod.upsaleTargetMemberships) && prod.upsaleTargetMemberships.length > 0) {
                setProduct(prod)

                // Fetch memberships for upsale
                const membershipRes = await fetch('/api/membership-plans/packages')
                if (membershipRes.ok) {
                  const membershipData = await membershipRes.json()
                  setMemberships(membershipData.packages || [])
                  
                  // Show upsale modal after 2 seconds
                  setTimeout(() => {
                    setShowUpsale(true)
                  }, 2000)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactionData()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memproses pembayaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
          
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pembayaran Berhasil
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Selamat! Pembayaran Berhasil
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Terima kasih telah bergabung dengan komunitas Ekspor Yuk! 
            <br />
            Akses Anda telah diaktifkan dan siap digunakan.
          </p>
          
          {transaction && (
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
              <span className="text-sm text-gray-500">Transaction ID:</span>
              <span className="font-mono font-bold text-orange-500">{transaction.id}</span>
            </div>
          )}
          
          {/* Auto-redirect countdown */}
          {autoRedirect && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <p className="text-orange-700">
                  Mengarahkan ke dashboard dalam <span className="font-bold">{countdown}</span> detik...
                </p>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2 text-orange-600"
                onClick={() => setAutoRedirect(false)}
              >
                Batalkan auto-redirect
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pembelian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipe:</span>
                    <Badge variant="outline">
                      {transaction.type === 'MEMBERSHIP' ? 'Membership' : 'Produk'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paket:</span>
                    <span className="font-semibold">
                      {transaction.membership?.type === 'LIFETIME' ? 'Lifetime' : '6 Bulan'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bayar:</span>
                    <span className="text-xl font-bold text-orange-500">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-700">
                      Aktif
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Langkah Selanjutnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">Bergabung ke Group WhatsApp</p>
                    <p className="text-sm text-gray-600">Link akan dikirim ke email Anda</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Login ke Portal Member</p>
                    <p className="text-sm text-gray-600">Akses materi pembelajaran lengkap</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Ikuti Live Mentoring</p>
                    <p className="text-sm text-gray-600">Setiap Sabtu jam 19:00 WIB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Reminder */}
        {transaction?.membership && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-orange-500" />
                Yang Akan Anda Dapatkan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transaction.membership.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          {/* Show Download Button for Digital Products */}
          {transaction?.type === 'PRODUCT' && (
            <Button
              onClick={() => router.push('/my-products')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Produk
            </Button>
          )}
          
          <Button
            onClick={() => {
              const waNumber = csWhatsapp.replace(/\D/g, '')
              window.open(`https://wa.me/${waNumber}?text=Halo, saya sudah berhasil melakukan pembayaran dan ingin bergabung ke group WhatsApp.`, '_blank')
            }}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Bergabung Group WhatsApp
          </Button>
          
          <Button
            onClick={() => router.push(getDashboardUrl())}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Akses Dashboard Sekarang
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Testimonial Preview */}
        <Card className="mt-8 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg italic text-gray-700 mb-4">
                "Berkat program Ekspor Yuk, ekspor saya meningkat 300% dalam 6 bulan! 
                Materi lengkap, mentor responsif, dan komunitas yang sangat supportif."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  D
                </div>
                <div className="text-left">
                  <p className="font-semibold">Deni Sutandi</p>
                  <p className="text-sm text-gray-600">Eksportir Furniture</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Komunitas Aktif</h3>
              <p className="text-sm text-gray-600">
                2000+ eksportir sukses siap membantu Anda
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Materi Lengkap</h3>
              <p className="text-sm text-gray-600">
                50+ video tutorial dan panduan praktis
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageCircle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Support 24/7</h3>
              <p className="text-sm text-gray-600">
                Tim support siap membantu kapan saja
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600 mb-4">
            Punya pertanyaan atau butuh bantuan? Tim kami siap membantu!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('mailto:support@eksporyuk.com', '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Hubungi Support
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="mb-4">© 2025 CV. Ekspor Yuk Indonesia. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            Selamat datang di keluarga besar eksportir Indonesia! 🎉
          </p>
        </div>
      </footer>

      {/* Upsale Modal */}
      {product && memberships.length > 0 && (
        <UpsaleModal
          open={showUpsale}
          onClose={() => setShowUpsale(false)}
          product={product}
          memberships={memberships}
        />
      )}
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>}>
      <SuccessPageContent />
    </Suspense>
  )
}
