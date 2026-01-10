'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Crown,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  Gift,
  Star,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useMemberAccess } from '@/hooks/useMemberAccess'

interface UpgradeBannerProps {
  variant?: 'full' | 'compact' | 'minimal' | 'floating'
  title?: string
  description?: string
  showDismiss?: boolean
  onDismiss?: () => void
  className?: string
}

/**
 * Banner component to encourage users to upgrade their membership
 * Shows different variants based on context
 */
export default function UpgradeBanner({
  variant = 'full',
  title,
  description,
  showDismiss = false,
  onDismiss,
  className = '',
}: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const { data, loading, hasMembership, getUpgradeUrl } = useMemberAccess()

  // Don't show if user already has membership or data is loading
  if (loading || hasMembership || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const defaultTitle = 'Upgrade ke Membership Premium'
  const defaultDescription = 'Dapatkan akses ke semua kursus, grup komunitas eksklusif, dan berbagai fitur premium lainnya.'

  // Minimal variant - just a text link
  if (variant === 'minimal') {
    return (
      <div className={`text-center ${className}`}>
        <Link href={getUpgradeUrl()} className="text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          {title || 'Upgrade Sekarang'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // Compact variant - small inline banner
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{title || 'Belum Berlangganan'}</p>
              <p className="text-xs text-gray-600">Upgrade untuk akses penuh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={getUpgradeUrl()}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                Upgrade
              </Button>
            </Link>
            {showDismiss && (
              <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Floating variant - fixed position bottom banner
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 ${className}`}>
        <Card className="border-orange-200 shadow-lg bg-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm">{title || defaultTitle}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description || 'Upgrade untuk akses fitur premium'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Link href={getUpgradeUrl()}>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs h-7">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Upgrade
                    </Button>
                  </Link>
                  {showDismiss && (
                    <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-7">
                      Nanti
                    </Button>
                  )}
                </div>
              </div>
              {showDismiss && (
                <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full variant - large promotional banner
  return (
    <Card className={`overflow-hidden border-0 ${className}`}>
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400">
        <CardContent className="py-8 px-6">
          {showDismiss && (
            <button 
              onClick={handleDismiss} 
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Left - Icon & Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  ))}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {title || defaultTitle}
              </h3>
              <p className="text-white/90 mb-4">
                {description || defaultDescription}
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>Kursus Eksklusif</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Users className="w-4 h-4" />
                  <span>Grup Komunitas</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Gift className="w-4 h-4" />
                  <span>Bonus Produk</span>
                </div>
              </div>

              <Link href={getUpgradeUrl()}>
                <Button className="bg-white text-orange-600 hover:bg-gray-100 font-semibold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Lihat Paket Membership
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Right - Pricing Preview */}
            {data?.upgradeOptions && data.upgradeOptions.length > 0 && (
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white/80 text-sm mb-3">Mulai dari:</p>
                <p className="text-3xl font-bold text-white">
                  Rp {Math.min(...data.upgradeOptions.map(o => o.price)).toLocaleString('id-ID')}
                </p>
                <p className="text-white/70 text-sm">per bulan</p>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-white/80 text-xs">
                    ✓ {data.upgradeOptions.reduce((max, o) => Math.max(max, o.coursesCount), 0)}+ kursus
                  </p>
                  <p className="text-white/80 text-xs">
                    ✓ {data.upgradeOptions.reduce((max, o) => Math.max(max, o.groupsCount), 0)}+ grup
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
