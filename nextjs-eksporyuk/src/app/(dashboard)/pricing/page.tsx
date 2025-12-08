'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Star, Sparkles, Shield, Clock, Users } from 'lucide-react'

const membershipPackages = [
  {
    id: '1-month',
    name: '1 Bulan',
    duration: 'ONE_MONTH',
    price: 99000,
    originalPrice: 149000,
    discount: 33,
    features: [
      'Akses semua kursus premium',
      'Akses grup VIP eksklusif',
      'Sertifikat kelulusan',
      'Event & webinar gratis',
      'Konsultasi mentor',
    ],
    popular: false,
    icon: Star,
    color: 'gray',
    gradient: 'from-gray-500 to-slate-600'
  },
  {
    id: '3-month',
    name: '3 Bulan',
    duration: 'THREE_MONTHS',
    price: 249000,
    originalPrice: 447000,
    discount: 44,
    features: [
      'Semua benefit 1 Bulan',
      'Prioritas support 24/7',
      'Akses early bird kursus baru',
      'Bonus materi eksklusif',
      'Sesi Q&A bulanan',
    ],
    popular: false,
    icon: Zap,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: '6-month',
    name: '6 Bulan',
    duration: 'SIX_MONTHS',
    price: 449000,
    originalPrice: 894000,
    discount: 50,
    features: [
      'Semua benefit 3 Bulan',
      'Personal mentoring 1-on-1',
      'Akses lifetime resources',
      'Networking premium events',
      'Job board eksklusif',
      'Portfolio review gratis',
    ],
    popular: true,
    icon: Crown,
    color: 'orange',
    gradient: 'from-orange-500 to-pink-500'
  },
  {
    id: '12-month',
    name: '12 Bulan',
    duration: 'TWELVE_MONTHS',
    price: 799000,
    originalPrice: 1788000,
    discount: 55,
    features: [
      'Semua benefit 6 Bulan',
      'Unlimited mentoring sessions',
      'Certified expert badge',
      'Speaking opportunity di event',
      'Affiliate commission 35%',
      'Akses selamanya semua update',
    ],
    popular: false,
    icon: Sparkles,
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-600'
  },
]

export default function PricingPage() {
  const [selectedPackage, setSelectedPackage] = useState('6-month')

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId)
    localStorage.setItem('selectedPackage', packageId)
    
    const urlParams = new URLSearchParams(window.location.search)
    const affiliateCode = urlParams.get('ref') || document.cookie
      .split('; ')
      .find(row => row.startsWith('affiliate_ref='))
      ?.split('=')[1]
    
    if (affiliateCode) {
      localStorage.setItem('affiliateRef', affiliateCode)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Sparkles className="w-3 h-3 mr-1" />
            Special Pricing
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upgrade Membership Anda
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Investasi terbaik untuk pengembangan bisnis ekspor Anda. 
            Hemat hingga 55% dengan paket tahunan!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {membershipPackages.map((pkg) => {
            const Icon = pkg.icon
            const isSelected = selectedPackage === pkg.id
            
            return (
              <Card 
                key={pkg.id}
                className={`relative transition-all duration-300 cursor-pointer bg-white
                  ${pkg.popular 
                    ? 'border-2 border-orange-400 shadow-xl shadow-orange-100 scale-[1.02] lg:scale-105' 
                    : 'border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:scale-[1.02]'
                  } 
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                `}
                onClick={() => handleSelectPackage(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 shadow-lg">
                      🔥 Paling Laris
                    </Badge>
                  </div>
                )}

                {/* Discount Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 font-semibold">
                    -{pkg.discount}%
                  </Badge>
                </div>

                <CardHeader className="pb-4 pt-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                  <CardDescription className="text-gray-500">Membership Premium</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        Rp {formatPrice(pkg.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 line-through">
                        Rp {formatPrice(pkg.originalPrice)}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        Hemat Rp {formatPrice(pkg.originalPrice - pkg.price)}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <Link href={`/checkout-unified?package=${pkg.id}`} className="w-full">
                    <Button 
                      className={`w-full h-12 text-base font-semibold transition-all ${
                        pkg.popular 
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg shadow-orange-200' 
                          : isSelected 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {isSelected ? '✓ Dipilih' : 'Pilih Paket'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Trust Badges */}
        <Card className="border-0 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-50 to-indigo-50 mb-10">
          <CardContent className="py-8">
            <h3 className="text-center text-lg font-bold text-gray-900 mb-8">
              Dipercaya oleh 10,000+ Member Aktif
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                  <Crown className="w-7 h-7 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Kursus Premium</div>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                  <Users className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">50+</div>
                <div className="text-sm text-gray-600">Mentor Expert</div>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-purple-100 rounded-2xl flex items-center justify-center mb-3">
                  <Star className="w-7 h-7 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600">4.9/5</div>
                <div className="text-sm text-gray-600">Rating Member</div>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
                  <Shield className="w-7 h-7 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-gray-600">Garansi Uang Kembali</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="border-0 shadow-lg shadow-gray-100/50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Pertanyaan Yang Sering Ditanyakan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-3xl mx-auto">
            <details className="bg-gray-50 rounded-xl p-5 cursor-pointer group">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Apa yang terjadi setelah periode membership berakhir?
                <Clock className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Anda tetap bisa akses materi yang sudah Anda download, tapi tidak bisa akses kursus baru 
                dan grup VIP. Anda bisa renew kapan saja dengan harga special member.
              </p>
            </details>
            
            <details className="bg-gray-50 rounded-xl p-5 cursor-pointer group">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Apakah ada garansi uang kembali?
                <Shield className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Ya! Kami memberikan garansi 100% uang kembali dalam 7 hari pertama jika Anda tidak puas 
                dengan platform kami. No questions asked.
              </p>
            </details>
            
            <details className="bg-gray-50 rounded-xl p-5 cursor-pointer group">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Bagaimana cara mendapatkan komisi affiliate?
                <Zap className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Setelah jadi member, Anda bisa apply jadi affiliate di dashboard. Dapatkan link referral 
                unik dan komisi 30% flat untuk setiap penjualan yang berhasil!
              </p>
            </details>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
