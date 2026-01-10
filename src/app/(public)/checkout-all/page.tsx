'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronDown, ChevronUp, CreditCard, Wallet, Building } from 'lucide-react'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface MembershipPackage {
  id: string
  name: string
  duration: string
  price: number
  originalPrice?: number
  features: string[]
  isPopular?: boolean
  checkoutSlug?: string
}

const DURATION_LABELS: Record<string, string> = {
  'ONE_MONTH': '1 Bulan',
  'THREE_MONTHS': '3 Bulan',
  'SIX_MONTHS': '6 Bulan',
  'TWELVE_MONTHS': '12 Bulan',
  'LIFETIME': 'Lifetime'
}

export default function CheckoutAllInOnePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [expandedPackageId, setExpandedPackageId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentChannel, setPaymentChannel] = useState('BCA')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isCouponApplied, setIsCouponApplied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        whatsapp: '',
      })
    }
  }, [session])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/memberships/packages')
      const data = await response.json()
      
      if (data.success && data.packages) {
        setPackages(data.packages)
        if (data.packages.length > 0) {
          setSelectedPackageId(data.packages[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId)
    setExpandedPackageId(packageId === expandedPackageId ? '' : packageId)
    setCouponCode('')
    setCouponDiscount(0)
    setIsCouponApplied(false)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      const selectedPkg = packages.find(p => p.id === selectedPackageId)
      if (!selectedPkg) return

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          itemType: 'membership',
          itemId: selectedPackageId,
          amount: selectedPkg.price,
        }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setCouponDiscount(data.discountAmount)
        setIsCouponApplied(true)
      } else {
        alert(data.error || 'Kupon tidak valid')
      }
    } catch (error) {
      alert('Gagal memvalidasi kupon')
    }
  }

  const handleCheckout = async () => {
    if (!session) {
      signIn()
      return
    }

    if (!formData.name || !formData.email || !formData.whatsapp) {
      alert('Mohon lengkapi semua data')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'membership',
          itemId: selectedPackageId,
          paymentMethod,
          paymentChannel,
          customerName: formData.name,
          customerEmail: formData.email,
          customerWhatsapp: formData.whatsapp,
          couponCode: isCouponApplied ? couponCode : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Gagal memproses checkout')
      }
    } catch (error) {
      alert('Terjadi kesalahan saat memproses checkout')
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedPackage = packages.find(p => p.id === selectedPackageId)
  const finalPrice = selectedPackage ? selectedPackage.price - couponDiscount : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat paket membership...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pilih Paket Membership Anda</h1>
          <p className="text-gray-600">Klik pada harga untuk melihat benefit dan checkout</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPackageId === pkg.id
                  ? 'ring-2 ring-blue-500 shadow-xl'
                  : 'hover:shadow-md'
              } ${pkg.isPopular ? 'border-orange-400' : ''}`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              <CardHeader>
                {pkg.isPopular && (
                  <div className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full w-fit mb-2">
                    ⭐ Paling Laris
                  </div>
                )}
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <p className="text-sm text-gray-600">{DURATION_LABELS[pkg.duration] || pkg.duration}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    Rp {pkg.price.toLocaleString()}
                  </div>
                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <div className="text-sm text-gray-500 line-through">
                      Rp {pkg.originalPrice.toLocaleString()}
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  variant={selectedPackageId === pkg.id ? 'default' : 'outline'}
                >
                  {selectedPackageId === pkg.id ? 'Terpilih' : 'Pilih Paket'}
                  {expandedPackageId === pkg.id ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>

                {expandedPackageId === pkg.id && pkg.features && pkg.features.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Benefit:</p>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPackage && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="md:col-span-2 space-y-6">
              {!session ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Login untuk Melanjutkan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => signIn()} className="w-full" size="lg">
                      Login / Daftar
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Informasi Pembeli</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Nama Lengkap *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label>WhatsApp *</Label>
                        <Input
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="08123456789"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Metode Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            checked={paymentMethod === 'bank_transfer'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <Building className="w-5 h-5" />
                          <span className="font-medium">Transfer Bank</span>
                        </label>

                        {paymentMethod === 'bank_transfer' && (
                          <div className="ml-12 space-y-2">
                            {['BCA', 'BNI', 'BRI', 'MANDIRI'].map((bank) => (
                              <label key={bank} className="flex items-center gap-2 p-2">
                                <input
                                  type="radio"
                                  value={bank}
                                  checked={paymentChannel === bank}
                                  onChange={(e) => setPaymentChannel(e.target.value)}
                                />
                                {bank}
                              </label>
                            ))}
                          </div>
                        )}

                        <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="ewallet"
                            checked={paymentMethod === 'ewallet'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <Wallet className="w-5 h-5" />
                          <span className="font-medium">E-Wallet</span>
                        </label>

                        <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="qris"
                            checked={paymentMethod === 'qris'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <CreditCard className="w-5 h-5" />
                          <span className="font-medium">QRIS</span>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Summary Section */}
            <div className="md:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Ringkasan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Paket Terpilih:</p>
                    <p className="font-semibold">{selectedPackage.name}</p>
                    <p className="text-sm text-gray-600">{DURATION_LABELS[selectedPackage.duration]}</p>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Harga</span>
                      <span>Rp {selectedPackage.price.toLocaleString()}</span>
                    </div>
                    {isCouponApplied && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon</span>
                        <span>-Rp {couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">Rp {finalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Kode Kupon</Label>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Kode"
                        disabled={isCouponApplied}
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={isCouponApplied}
                        variant={isCouponApplied ? 'secondary' : 'default'}
                      >
                        {isCouponApplied ? '✓' : 'Pakai'}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || !session}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? 'Memproses...' : session ? 'Bayar Sekarang' : 'Login Dulu'}
                  </Button>

                  {/* Affiliate Partner Badge */}
                  <AffiliatePartnerBadge className="mt-4" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
