'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Check,
  Package,
  Loader2,
  AlertCircle,
  Tag,
  ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import AffiliatePartnerBadge from '@/components/checkout/AffiliatePartnerBadge'

interface SupplierPackage {
  id: string
  name: string
  slug: string
  type: string
  duration: string
  price: number
  originalPrice?: number
  features: any
  description?: string
}

export default function CheckoutSupplierPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const slug = params?.slug as string

  const [pkg, setPkg] = useState<SupplierPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        // First set from session as fallback
        setName(session.user.name || '')
        setEmail(session.user.email || '')
        setPhone((session.user as any).whatsapp || '')
        
        // Then fetch latest data from API profile
        try {
          const profileRes = await fetch('/api/user/profile')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            // API returns { user: {...} } without success field
            if (profileData.user) {
              console.log('[Checkout Supplier] Profile data loaded:', profileData.user.whatsapp)
              setName(profileData.user.name || session.user.name || '')
              setPhone(profileData.user.whatsapp || profileData.user.phone || '')
            }
          }
        } catch (error) {
          console.error('[Checkout Supplier] Error fetching profile:', error)
        }
      }
    }
    
    loadUserData()
  }, [session])

  useEffect(() => {
    fetchPackage()
  }, [slug])

  const fetchPackage = async () => {
    try {
      const response = await fetch(`/api/supplier/packages`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.packages) {
          const foundPkg = data.packages.find((p: SupplierPackage) => p.slug === slug)
          if (foundPkg) {
            setPkg(foundPkg)
          } else {
            toast.error('Paket tidak ditemukan')
            router.push('/register-supplier')
          }
        }
      } else {
        toast.error('Gagal memuat paket')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat paket')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode || !pkg) return

    try {
      const response = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      })

      if (response.ok) {
        const data = await response.json()
        const coupon = data.coupon

        if (coupon) {
          let discountAmount = 0
          if (coupon.type === 'PERCENTAGE') {
            discountAmount = pkg.price * (coupon.value / 100)
          } else {
            discountAmount = coupon.value
          }

          setDiscount(discountAmount)
          setCouponApplied(true)
          toast.success(`Kupon ${couponCode} berhasil diterapkan!`)
        }
      } else {
        toast.error('Kupon tidak valid atau sudah kadaluarsa')
      }
    } catch (error) {
      toast.error('Gagal validasi kupon')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pkg) return

    // Validation
    if (!name || !email || !phone) {
      toast.error('Harap lengkapi semua field')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/checkout/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          name,
          email,
          phone,
          whatsapp: whatsapp || phone,
          couponCode: couponApplied ? couponCode : undefined
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect to payment
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          toast.error('Payment URL tidak tersedia')
        }
      } else {
        if (data.requireLogin) {
          toast.error(data.error)
          setTimeout(() => {
            router.push(`/auth/signin?callbackUrl=/checkout/supplier/${slug}`)
          }, 2000)
        } else {
          toast.error(data.error || 'Gagal membuat checkout')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Paket Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-4">Paket yang Anda cari tidak tersedia.</p>
            <Link href="/register-supplier">
              <Button>Kembali ke Registrasi</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const finalAmount = pkg.price - discount
  const features = pkg.features as any

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout Supplier Membership</h1>
          <p className="text-gray-600">Selesaikan pembayaran untuk mengaktifkan paket Anda</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pembeli</CardTitle>
                <CardDescription>Data Anda untuk keperluan invoice dan komunikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Nomor HP *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08123456789"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp (Opsional)</Label>
                      <Input
                        id="whatsapp"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="08123456789"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Coupon Code */}
                  <div>
                    <Label htmlFor="coupon">Kode Kupon (Opsional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="MASUKKAN KODE"
                        disabled={couponApplied}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={!couponCode || couponApplied}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        Terapkan
                      </Button>
                    </div>
                    {couponApplied && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Kupon berhasil diterapkan!
                      </p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Bayar Sekarang - Rp {finalAmount.toLocaleString('id-ID')}
                      </>
                    )}
                  </Button>

                  {!session && (
                    <p className="text-sm text-center text-gray-600">
                      Sudah punya akun?{' '}
                      <Link href={`/auth/signin?callbackUrl=/checkout/supplier/${slug}`} className="text-blue-600 hover:underline">
                        Login di sini
                      </Link>
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Package Info */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <Badge variant={pkg.type === 'FREE' ? 'secondary' : 'default'}>
                        {pkg.type}
                      </Badge>
                    </div>
                    {pkg.type === 'PREMIUM' && (
                      <ShieldCheck className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-600">{pkg.description}</p>
                  )}
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <p className="font-medium mb-3 text-sm">Fitur yang Didapat:</p>
                  <ul className="space-y-2">
                    {features?.maxProducts && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {features.maxProducts === 999 ? 'Unlimited' : features.maxProducts} Produk
                        </span>
                      </li>
                    )}
                    {features?.chatEnabled && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Chat dengan Member</span>
                      </li>
                    )}
                    {features?.verifiedBadge && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Verified Badge</span>
                      </li>
                    )}
                    {features?.customURL && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Custom URL Profil</span>
                      </li>
                    )}
                    {features?.statistics && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Statistik Detail</span>
                      </li>
                    )}
                    {features?.ranking && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Ranking Supplier</span>
                      </li>
                    )}
                  </ul>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harga Paket</span>
                    <span>Rp {pkg.price.toLocaleString('id-ID')}</span>
                  </div>

                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon Paket</span>
                      <span className="text-green-600">
                        -Rp {(pkg.originalPrice - pkg.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon Kupon</span>
                      <span className="text-green-600">-Rp {discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">Rp {finalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Pembayaran Aman</p>
                      <p>Powered by Xendit. Data Anda dilindungi dengan enkripsi SSL.</p>
                    </div>
                  </div>
                </div>

                {/* Affiliate Partner Badge */}
                <AffiliatePartnerBadge className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
