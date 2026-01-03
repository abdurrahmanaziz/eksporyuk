'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Star, Sparkles, Shield, Clock, Users, Loader2, TrendingUp, CheckCircle2 } from 'lucide-react'

interface MembershipPackage {
  id: string
  name: string
  slug: string
  checkoutSlug?: string
  description: string | null
  price: number
  originalPrice?: number
  discountPrice?: number
  discount?: number
  duration: number
  durationType: string
  features: string[]
  benefits: string[]
  isBestSeller?: boolean
  isMostPopular?: boolean
  isPopular?: boolean
  isActive: boolean
}

// Icons based on duration
const getIconForDuration = (durationType: string, duration: number) => {
  if (durationType === 'LIFETIME') return Sparkles
  if (duration >= 12 || durationType === 'YEAR') return Sparkles
  if (duration >= 6) return Crown
  if (duration >= 3) return Zap
  return Star
}

// Gradient based on index/popularity
const getGradientClass = (index: number, isPopular: boolean) => {
  if (isPopular) return 'from-orange-500 to-pink-500'
  const gradients = [
    'from-gray-500 to-slate-600',
    'from-blue-500 to-indigo-600',
    'from-orange-500 to-pink-500',
    'from-purple-500 to-indigo-600',
  ]
  return gradients[index % gradients.length]
}

export default function PricingPage() {
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [currentMembership, setCurrentMembership] = useState<any>(null)

  useEffect(() => {
    fetchPackages()
    fetchCurrentMembership()
  }, [])

  const fetchCurrentMembership = async () => {
    try {
      const response = await fetch('/api/user/membership')
      if (response.ok) {
        const data = await response.json()
        if (data.membership) {
          setCurrentMembership(data.membership)
        }
      }
    } catch (err) {
      console.error('Error fetching current membership:', err)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/memberships/packages')
      if (!response.ok) throw new Error('Failed to fetch packages')
      
      const data = await response.json()
      const activePackages = (data.packages || []).filter((pkg: MembershipPackage) => pkg.isActive)
      
      // Sort by price
      activePackages.sort((a: MembershipPackage, b: MembershipPackage) => a.price - b.price)
      
      setPackages(activePackages)
      
      // Auto-select popular or 6-month package
      const popularPkg = activePackages.find((p: MembershipPackage) => p.isMostPopular || p.isBestSeller)
      if (popularPkg) {
        setSelectedPackage(popularPkg.id)
      } else if (activePackages.length > 0) {
        // Select middle package if no popular
        const middleIndex = Math.floor(activePackages.length / 2)
        setSelectedPackage(activePackages[middleIndex].id)
      }
    } catch (err) {
      console.error('Error fetching packages:', err)
      setError('Gagal memuat paket membership')
    } finally {
      setLoading(false)
    }
  }

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

  const formatDuration = (durationType: string, duration: number) => {
    if (durationType === 'LIFETIME') return 'Selamanya'
    if (durationType === 'YEAR') return duration + ' Tahun'
    if (durationType === 'MONTH') return duration + ' Bulan'
    return duration + ' Hari'
  }

  const getCheckoutUrl = (pkg: MembershipPackage) => {
    // Check if user has current membership - redirect to upgrade confirm
    if (currentMembership && currentMembership.membershipId !== pkg.id) {
      return `/dashboard/upgrade/confirm?package=${pkg.id}`
    }
    // Always use slug for checkout URL - realtime from database
    return `/checkout/${pkg.slug}`
  }

  const isCurrentPackage = (pkgId: string) => {
    return currentMembership && currentMembership.membershipId === pkgId
  }

  const canUpgrade = (pkg: MembershipPackage) => {
    if (!currentMembership) return false
    if (currentMembership.membershipId === pkg.id) return false
    if (currentMembership.membership?.durationType === 'LIFETIME') return false
    return true
  }

  const parseFeatures = (features: any): string[] => {
    if (Array.isArray(features)) return features
    if (typeof features === 'string') {
      try {
        return JSON.parse(features)
      } catch {
        return []
      }
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat paket membership...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPackages}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Paket Tersedia</h2>
          <p className="text-gray-600">Silakan hubungi admin untuk informasi lebih lanjut.</p>
        </div>
      </div>
    )
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

        {/* Pricing Cards - Dynamic Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${packages.length >= 4 ? 'lg:grid-cols-4' : packages.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 mb-12`}>
          {packages.map((pkg, index) => {
            const Icon = getIconForDuration(pkg.durationType, pkg.duration)
            const isSelected = selectedPackage === pkg.id
            const isPopular = pkg.isMostPopular || pkg.isBestSeller || pkg.isPopular
            const isCurrent = isCurrentPackage(pkg.id)
            const canUpgradeThis = canUpgrade(pkg)
            const gradientClass = getGradientClass(index, !!isPopular)
            
            // Calculate discount
            const originalPrice = pkg.originalPrice || pkg.price
            const currentPrice = pkg.discountPrice || pkg.price
            const discount = originalPrice > currentPrice 
              ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
              : pkg.discount || 0
            
            const features = parseFeatures(pkg.features || pkg.benefits)
            
            return (
              <Card 
                key={pkg.id}
                className={`relative transition-all duration-300 cursor-pointer bg-white
                  ${isCurrent
                    ? 'border-2 border-green-500 shadow-xl shadow-green-100 ring-2 ring-green-200'
                    : isPopular 
                      ? 'border-2 border-orange-400 shadow-xl shadow-orange-100 scale-[1.02] lg:scale-105' 
                      : 'border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:scale-[1.02]'
                  } 
                  ${isSelected && !isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                `}
                onClick={() => !isCurrent && handleSelectPackage(pkg.id)}
              >
                {/* Current Package Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 shadow-lg">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Paket Anda Saat Ini
                    </Badge>
                  </div>
                )}

                {/* Popular Badge */}
                {!isCurrent && isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 shadow-lg">
                      🔥 Paling Laris
                    </Badge>
                  </div>
                )}

                {/* Discount Badge */}
                {!isCurrent && discount > 0 && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 font-semibold">
                      -{discount}%
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                  <CardDescription className="text-gray-500">
                    {pkg.description || 'Membership Premium'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        Rp {formatPrice(currentPrice)}
                      </span>
                    </div>
                    {discount > 0 && originalPrice > currentPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          Rp {formatPrice(originalPrice)}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          Hemat Rp {formatPrice(originalPrice - currentPrice)}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {formatDuration(pkg.durationType, pkg.duration)}
                    </div>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-3">
                      {features.slice(0, 6).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {features.length > 6 && (
                        <li className="text-sm text-gray-500 pl-8">
                          +{features.length - 6} fitur lainnya
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>

                <CardFooter className="pt-4">
                  {isCurrent ? (
                    <Button 
                      disabled
                      className="w-full h-12 text-base font-semibold bg-green-100 text-green-700 cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Paket Aktif
                    </Button>
                  ) : canUpgradeThis ? (
                    <Link href={getCheckoutUrl(pkg)} className="w-full">
                      <Button 
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Sekarang
                      </Button>
                    </Link>
                  ) : (
                    <Link href={getCheckoutUrl(pkg)} className="w-full">
                      <Button 
                        className={`w-full h-12 text-base font-semibold transition-all ${
                          isPopular 
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg shadow-orange-200' 
                            : isSelected 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        {isSelected ? '✓ Dipilih' : 'Pilih Paket'}
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

      </div>
    </div>
  )
}
