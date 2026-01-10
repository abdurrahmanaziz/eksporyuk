'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, TrendingUp, Crown, Loader2, Shield, Star, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface SupplierPackage {
  id: string
  name: string
  slug: string
  type: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  duration: 'MONTHLY' | 'YEARLY' | 'LIFETIME'
  price: number
  originalPrice?: number
  description?: string
  isActive: boolean
  features: {
    maxProducts: number
    chatEnabled: boolean
    verifiedBadge: boolean
    customURL: boolean
    statistics: boolean
    ranking: boolean
    priority: boolean
    catalogDownload: boolean
    multiLanguage: boolean
  }
}

interface CurrentMembership {
  id: string
  packageId: string
  packageName: string
  packageType: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  startDate: string
  endDate: string | null
  isActive: boolean
  daysRemaining: number | null
}

export default function SupplierPricingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [packages, setPackages] = useState<SupplierPackage[]>([])
  const [currentMembership, setCurrentMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/pricing/supplier')
      return
    }

    if (status === 'authenticated') {
      loadData()
    }
  }, [status, router])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load packages
      const packagesRes = await fetch('/api/supplier/packages')
      if (packagesRes.ok) {
        const data = await packagesRes.json()
        setPackages(data.packages || [])
      }

      // Load current membership
      const membershipRes = await fetch('/api/supplier/membership/current')
      if (membershipRes.ok) {
        const data = await membershipRes.json()
        setCurrentMembership(data.membership)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Gagal memuat data harga')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (packageId: string) => {
    if (!session?.user) {
      toast.error('Silakan login terlebih dahulu')
      router.push('/login')
      return
    }

    setUpgrading(packageId)
    try {
      const response = await fetch('/api/supplier/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.paymentUrl) {
          toast.success('Mengalihkan ke pembayaran...')
          setTimeout(() => {
            window.location.href = data.paymentUrl
          }, 500)
        } else {
          toast.success('Membership berhasil diupgrade!')
          router.push('/supplier/dashboard')
        }
      } else {
        toast.error(data.error || 'Gagal upgrade membership')
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      toast.error('Terjadi kesalahan saat upgrade')
    } finally {
      setUpgrading(null)
    }
  }

  const getPackageBadge = (pkg: SupplierPackage) => {
    if (pkg.type === 'PREMIUM' && pkg.duration === 'YEARLY') {
      return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Nilai Terbaik</Badge>
    }
    if (pkg.type === 'PREMIUM' && pkg.duration === 'MONTHLY') {
      return <Badge className="bg-blue-500">Populer</Badge>
    }
    if (pkg.type === 'FREE') {
      return <Badge variant="secondary">Gratis Selamanya</Badge>
    }
    return null
  }

  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'FREE':
        return <Shield className="w-6 h-6" />
      case 'PREMIUM':
        return <Star className="w-6 h-6" />
      case 'ENTERPRISE':
        return <Crown className="w-6 h-6" />
      default:
        return <Zap className="w-6 h-6" />
    }
  }

  const isCurrentPackage = (pkg: SupplierPackage) => {
    return currentMembership?.packageId === pkg.id
  }

  const canUpgrade = (pkg: SupplierPackage) => {
    if (!currentMembership) return pkg.type !== 'FREE'
    if (currentMembership.packageType === 'FREE') return pkg.type !== 'FREE'
    if (currentMembership.packageType === 'PREMIUM') return pkg.type === 'ENTERPRISE'
    return false
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upgrade Bisnis Anda
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih paket yang tepat untuk mengembangkan bisnis supplier Anda bersama Eksporyuk
          </p>
        </div>

        {/* Current Membership Banner */}
        {currentMembership && (
          <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-lg text-white">
                    {getPackageIcon(currentMembership.packageType)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paket Anda Saat Ini</p>
                    <h3 className="text-xl font-bold">{currentMembership.packageName}</h3>
                    {currentMembership.daysRemaining !== null && (
                      <p className="text-sm text-gray-600">
                        {currentMembership.daysRemaining > 0 
                          ? `${currentMembership.daysRemaining} hari tersisa`
                          : 'Kadaluarsa'}
                      </p>
                    )}
                  </div>
                </div>
                {currentMembership.packageType !== 'ENTERPRISE' && (
                  <Badge className="bg-gradient-to-r from-green-500 to-teal-500">
                    Upgrade Tersedia
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isCurrent = isCurrentPackage(pkg)
            const canUpgradeThis = canUpgrade(pkg)
            const isPremium = pkg.type === 'PREMIUM'

            return (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all ${
                  isPremium
                    ? 'border-2 border-purple-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isCurrent ? 'bg-gradient-to-br from-blue-50 to-purple-50' : ''}`}
              >
                {isPremium && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-xs font-bold">
                      RECOMMENDED
                    </div>
                  </div>
                )}

                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        pkg.type === 'FREE' ? 'bg-gray-100' :
                        pkg.type === 'PREMIUM' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                        'bg-gradient-to-br from-yellow-500 to-orange-500'
                      } ${pkg.type !== 'FREE' ? 'text-white' : ''}`}>
                        {getPackageIcon(pkg.type)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <p className="text-sm text-gray-600 capitalize">{pkg.duration.toLowerCase()}</p>
                      </div>
                    </div>
                    {getPackageBadge(pkg)}
                  </div>

                  {pkg.description && (
                    <CardDescription>{pkg.description}</CardDescription>
                  )}

                  <div className="pt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        Rp {(pkg.price / 1000).toFixed(0)}k
                      </span>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <span className="text-lg text-gray-400 line-through">
                          Rp {(pkg.originalPrice / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {pkg.duration === 'MONTHLY' && 'per month'}
                      {pkg.duration === 'YEARLY' && 'per year'}
                      {pkg.duration === 'LIFETIME' && 'one-time payment'}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <p className="font-semibold text-sm text-gray-700">Fitur:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {pkg.features.maxProducts === -1
                            ? 'Produk Unlimited'
                            : `Maksimal ${pkg.features.maxProducts} produk`}
                        </span>
                      </li>
                      {pkg.features.verifiedBadge && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Badge terverifikasi</span>
                        </li>
                      )}
                      {pkg.features.customURL && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">URL khusus</span>
                        </li>
                      )}
                      {pkg.features.statistics && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Analitik lanjutan</span>
                        </li>
                      )}
                      {pkg.features.ranking && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Peringkat prioritas</span>
                        </li>
                      )}
                      {pkg.features.priority && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Dukungan prioritas</span>
                        </li>
                      )}
                      {pkg.features.catalogDownload && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Unduh katalog</span>
                        </li>
                      )}
                      {pkg.features.multiLanguage && (
                        <li className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Dukungan multi-bahasa</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="secondary">
                      Paket Saat Ini
                    </Button>
                  ) : canUpgradeThis ? (
                    <Button
                      onClick={() => handleUpgrade(pkg.id)}
                      disabled={upgrading === pkg.id}
                      className={`w-full ${
                        isPremium
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                          : ''
                      }`}
                    >
                      {upgrading === pkg.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Upgrade Sekarang
                        </>
                      )}
                    </Button>
                  ) : !currentMembership && pkg.type === 'FREE' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/register-supplier">Mulai Sekarang</Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      Tidak Tersedia
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">Tingkatkan Visibilitas</h3>
                <p className="text-sm text-gray-600">
                  Tampil di hasil pencarian dan jangkau lebih banyak pembeli
                </p>
              </div>
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">Boost Penjualan</h3>
                <p className="text-sm text-gray-600">
                  Fitur premium membantu Anda closing lebih banyak deal
                </p>
              </div>
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">Bangun Kepercayaan</h3>
                <p className="text-sm text-gray-600">
                  Badge terverifikasi menunjukkan Anda supplier terpercaya
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Pertanyaan yang Sering Diajukan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Bisakah saya upgrade kapan saja?</h4>
              <p className="text-sm text-gray-600">
                Ya! Anda dapat upgrade paket kapan saja. Sisa hari membership Anda akan dihitung secara proporsional.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Metode pembayaran apa yang diterima?</h4>
              <p className="text-sm text-gray-600">
                Kami menerima semua metode pembayaran utama melalui Xendit, termasuk transfer bank, kartu kredit/debit, e-wallet, dan lainnya.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bisakah saya membatalkan langganan?</h4>
              <p className="text-sm text-gray-600">
                Ya, Anda dapat membatalkan kapan saja. Benefit Anda akan tetap aktif hingga akhir periode yang sudah dibayar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Butuh bantuan memilih paket yang tepat?</p>
          <Button variant="outline" asChild>
            <Link href="/contact">Hubungi Dukungan</Link>
          </Button>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
