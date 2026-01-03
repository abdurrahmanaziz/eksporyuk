'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Calendar, CheckCircle2, Crown, Info, Loader2, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface UpgradeCalculation {
  canUpgrade: boolean
  isNewPurchase: boolean
  isLifetimeUpgrade: boolean
  currentPackage?: {
    id: string
    name: string
    price: number
    durationType: string
    duration: number
    endDate: string
    remainingDays: number
  }
  targetPackage: {
    id: string
    name: string
    price: number
    durationType: string
    duration: number
  }
  upgradePrice: number
  discount: number
  remainingValue: number
  remainingDays?: number
  message: string
  error?: string
}

export default function UpgradeConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const packageId = searchParams.get('package')
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [calculation, setCalculation] = useState<UpgradeCalculation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (packageId) {
      calculateUpgrade()
    } else {
      setError('Package ID tidak ditemukan')
      setLoading(false)
    }
  }, [packageId])

  const calculateUpgrade = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/membership/calculate-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPackageId: packageId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Gagal menghitung harga upgrade')
        return
      }

      if (!data.canUpgrade) {
        setError(data.error || 'Tidak dapat melakukan upgrade')
        return
      }

      setCalculation(data)
    } catch (err) {
      console.error('[Calculate Upgrade Error]:', err)
      setError('Terjadi kesalahan saat menghitung harga upgrade')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!packageId) return

    try {
      setProcessing(true)
      const response = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPackageId: packageId })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Gagal memproses upgrade')
        return
      }

      // Redirect to checkout
      router.push(data.checkoutUrl)
    } catch (err) {
      console.error('[Process Upgrade Error]:', err)
      toast.error('Terjadi kesalahan saat memproses upgrade')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDuration = (durationType: string, duration: number) => {
    if (durationType === 'LIFETIME') return 'Selamanya'
    if (durationType === 'YEAR') return `${duration} Tahun`
    if (durationType === 'MONTH') return `${duration} Bulan`
    return `${duration} Hari`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Menghitung harga upgrade...</p>
        </div>
      </div>
    )
  }

  if (error || !calculation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Gagal Memuat Data</CardTitle>
            <CardDescription>{error || 'Terjadi kesalahan'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/pricing')} className="w-full">
              Kembali ke Pricing
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 md:space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm md:text-base">
                1
              </div>
              <span className="ml-2 text-xs md:text-sm font-medium text-blue-600">Pilih Paket</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm md:text-base">
                2
              </div>
              <span className="ml-2 text-xs md:text-sm font-medium text-blue-600">Konfirmasi</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold text-sm md:text-base">
                3
              </div>
              <span className="ml-2 text-xs md:text-sm font-medium text-gray-400">Pembayaran</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold text-sm md:text-base">
                4
              </div>
              <span className="ml-2 text-xs md:text-sm font-medium text-gray-400">Selesai</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <TrendingUp className="w-3 h-3 mr-1" />
            Konfirmasi Upgrade
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {calculation.isNewPurchase ? 'Konfirmasi Pembelian' : 'Konfirmasi Upgrade Membership'}
          </h1>
          <p className="text-gray-600">
            {calculation.isNewPurchase 
              ? 'Periksa detail paket Anda sebelum melanjutkan ke pembayaran'
              : 'Periksa detail upgrade Anda sebelum melanjutkan ke pembayaran'
            }
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          
          {/* Current Package (if exists) */}
          {!calculation.isNewPurchase && calculation.currentPackage && (
            <Card className="border-gray-200">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Paket Saat Ini</CardTitle>
                  <Badge variant="outline" className="bg-white">Aktif</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nama Paket</p>
                  <p className="font-semibold text-lg">{calculation.currentPackage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Harga Dibayar</p>
                  <p className="font-semibold">{formatCurrency(calculation.currentPackage.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Durasi</p>
                  <p className="font-semibold">{formatDuration(calculation.currentPackage.durationType, calculation.currentPackage.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Berakhir</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold">{new Date(calculation.currentPackage.endDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sisa Masa Aktif</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {calculation.currentPackage.remainingDays} hari
                    </Badge>
                  </div>
                  {!calculation.isLifetimeUpgrade && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Nilai Sisa</span>
                      <span className="font-semibold text-green-600">{formatCurrency(calculation.remainingValue)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Package */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {calculation.isNewPurchase ? 'Paket yang Dipilih' : 'Paket Baru'}
                </CardTitle>
                {calculation.isLifetimeUpgrade && (
                  <Badge className="bg-white text-purple-600">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Lifetime
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nama Paket</p>
                <p className="font-bold text-xl text-blue-600">{calculation.targetPackage.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Harga Normal</p>
                <p className="font-semibold text-lg">{formatCurrency(calculation.targetPackage.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Durasi</p>
                <div className="flex items-center gap-2">
                  {calculation.isLifetimeUpgrade && <Crown className="w-5 h-5 text-yellow-500" />}
                  <p className="font-semibold">{formatDuration(calculation.targetPackage.durationType, calculation.targetPackage.duration)}</p>
                </div>
              </div>
              {!calculation.isNewPurchase && !calculation.isLifetimeUpgrade && calculation.discount > 0 && (
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Diskon Prorata</span>
                    <span className="font-semibold text-green-600">- {formatCurrency(calculation.discount)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lifetime Warning */}
        {calculation.isLifetimeUpgrade && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Info className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Penting:</strong> {calculation.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Discount Info */}
        {!calculation.isNewPurchase && !calculation.isLifetimeUpgrade && calculation.discount > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Hemat!</strong> {calculation.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Price Summary */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-xl">Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span className="text-gray-600">Harga Paket {calculation.targetPackage.name}</span>
                <span className="font-semibold">{formatCurrency(calculation.targetPackage.price)}</span>
              </div>
              {!calculation.isNewPurchase && !calculation.isLifetimeUpgrade && calculation.discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Diskon Prorata ({calculation.remainingDays} hari)</span>
                  <span className="font-semibold">- {formatCurrency(calculation.discount)}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-200 pt-3 mt-3">
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>Total Bayar</span>
                  <span className="text-blue-600">{formatCurrency(calculation.upgradePrice)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/pricing')}
            className="flex-1"
            disabled={processing}
          >
            Kembali
          </Button>
          <Button 
            onClick={handleConfirmUpgrade}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-lg font-semibold"
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Lanjut ke Pembayaran
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
