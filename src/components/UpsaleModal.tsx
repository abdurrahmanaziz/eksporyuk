'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Check, X, Sparkles, TrendingUp, Star, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpsaleModalProps {
  open: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    enableUpsale: boolean
    upsaleTargetMemberships: string[]
    upsaleDiscount?: number
    upsaleMessage?: string
  }
  memberships: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    duration: string
    features: any[]
  }[]
}

export function UpsaleModal({ open, onClose, product, memberships }: UpsaleModalProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Filter memberships yang ada di upsaleTargetMemberships
  const upsaleMemberships = memberships.filter(m => 
    product.upsaleTargetMemberships.includes(m.id)
  )

  if (!product.enableUpsale || upsaleMemberships.length === 0) {
    return null
  }

  const discount = product.upsaleDiscount || 0

  const handleUpgrade = (membershipSlug: string) => {
    router.push(`/checkout/${membershipSlug}?ref=upsale&product=${product.id}`)
  }

  const formatDuration = (duration: string) => {
    const durations: Record<string, string> = {
      'ONE_MONTH': '1 Bulan',
      'THREE_MONTHS': '3 Bulan',
      'SIX_MONTHS': '6 Bulan',
      'TWELVE_MONTHS': '12 Bulan',
      'LIFETIME': 'Seumur Hidup'
    }
    return durations[duration] || duration
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <DialogTitle className="text-2xl">Penawaran Spesial Untuk Anda!</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {product.upsaleMessage || 
              `Tingkatkan pengalaman Anda dengan membership premium dan dapatkan diskon khusus ${discount}%!`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Special Offer Badge */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-lg font-bold">DISKON EKSKLUSIF {discount}%</span>
            </div>
            <p className="text-sm opacity-90">
              Penawaran terbatas! Upgrade sekarang dan hemat lebih banyak
            </p>
          </div>

          {/* Membership Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upsaleMemberships.map((membership) => {
              const originalPrice = Number(membership.price)
              const discountedPrice = Math.round(originalPrice * (1 - discount / 100))
              const savings = originalPrice - discountedPrice

              // Parse features
              let features: string[] = []
              if (Array.isArray(membership.features)) {
                const firstFeature = membership.features[0]
                if (firstFeature && typeof firstFeature === 'object' && 'benefits' in firstFeature) {
                  features = (firstFeature as any).benefits || []
                } else if (typeof firstFeature === 'string') {
                  features = membership.features as string[]
                }
              }

              return (
                <Card 
                  key={membership.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                    selectedPlan === membership.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPlan(membership.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{membership.name}</h3>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {formatDuration(membership.duration)}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{membership.description}</p>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-orange-600">
                          Rp {discountedPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500 line-through">
                          Rp {originalPrice.toLocaleString('id-ID')}
                        </span>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          Hemat Rp {savings.toLocaleString('id-ID')}
                        </Badge>
                      </div>
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold text-gray-700">Benefit:</p>
                        <ul className="space-y-2">
                          {features.slice(0, 5).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {features.length > 5 && (
                            <li className="text-sm text-gray-500">
                              +{features.length - 5} benefit lainnya
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <Button 
                      className="w-full mt-4" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpgrade(membership.slug)
                      }}
                    >
                      Upgrade Sekarang
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Why Upgrade Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Mengapa Upgrade ke Membership?
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Akses ke semua kelas dan materi pembelajaran</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Bergabung dengan komunitas eksportir profesional</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Mendapat mentoring dan konsultasi langsung</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Database buyer internasional dan template dokumen</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Mungkin Nanti
            </Button>
            <p className="text-xs text-gray-500">
              Penawaran ini hanya berlaku untuk pembelian hari ini
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
