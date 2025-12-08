'use client'

import Link from 'next/link'
import { Lock, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMemberAccess } from '@/hooks/useMemberAccess'

interface FeatureLockProps {
  /** The feature key to check */
  feature: 'courses' | 'groups' | 'products' | 'documents' | 'certificates' | 'mentoring' | 'advancedAnalytics' | 'prioritySupport' | 'whatsappGroup'
  
  /** Title to show when locked */
  title?: string
  
  /** Description to show when locked */
  description?: string
  
  /** Children to render if user has access */
  children: React.ReactNode
  
  /** Custom upgrade URL */
  upgradeUrl?: string
  
  /** Custom upgrade button text */
  upgradeText?: string
  
  /** Variant style */
  variant?: 'card' | 'inline' | 'overlay' | 'banner'
  
  /** Show teaser content behind overlay */
  showTeaser?: boolean
}

/**
 * Component that locks content based on membership access
 * Shows upgrade prompt if feature is locked
 */
export default function FeatureLock({
  feature,
  title,
  description,
  children,
  upgradeUrl,
  upgradeText = 'Upgrade Sekarang',
  variant = 'card',
  showTeaser = false,
}: FeatureLockProps) {
  const { isFeatureLocked, getUpgradeUrl, loading, hasMembership } = useMemberAccess()
  
  // While loading, show children (optimistic)
  if (loading) {
    return <>{children}</>
  }

  const isLocked = isFeatureLocked(feature)
  const finalUpgradeUrl = upgradeUrl || getUpgradeUrl()

  // Not locked - render children normally
  if (!isLocked) {
    return <>{children}</>
  }

  // Feature names for display
  const featureNames: Record<string, string> = {
    courses: 'Kursus Eksklusif',
    groups: 'Grup Komunitas',
    products: 'Produk Bonus',
    documents: 'Dokumen Premium',
    certificates: 'Sertifikat',
    mentoring: 'Live Mentoring',
    advancedAnalytics: 'Analitik Lanjutan',
    prioritySupport: 'Dukungan Prioritas',
    whatsappGroup: 'Grup WhatsApp',
  }

  const featureTitle = title || `Akses ${featureNames[feature] || feature}`
  const featureDescription = description || 
    (hasMembership 
      ? `Upgrade membership Anda untuk mengakses ${featureNames[feature] || feature}.`
      : `Bergabung sebagai member untuk mengakses ${featureNames[feature] || feature}.`)

  // Card variant - replaces content with lock card
  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{featureTitle}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{featureDescription}</p>
        <Link href={finalUpgradeUrl}>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Crown className="w-4 h-4 mr-2" />
            {upgradeText}
          </Button>
        </Link>
      </div>
    )
  }

  // Banner variant - horizontal banner
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold">{featureTitle}</h4>
              <p className="text-sm text-orange-100">{featureDescription}</p>
            </div>
          </div>
          <Link href={finalUpgradeUrl}>
            <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-orange-50">
              {upgradeText}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Inline variant - small inline lock
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-gray-500 p-2 bg-gray-50 rounded-lg">
        <Lock className="w-4 h-4 text-orange-500" />
        <span className="text-sm">{featureTitle}</span>
        <Link href={finalUpgradeUrl} className="text-sm text-orange-500 hover:underline ml-auto">
          {upgradeText}
        </Link>
      </div>
    )
  }

  // Overlay variant - shows content with overlay
  if (variant === 'overlay') {
    return (
      <div className="relative">
        {/* Teaser content */}
        {showTeaser && (
          <div className="opacity-30 blur-sm pointer-events-none">
            {children}
          </div>
        )}
        
        {/* Overlay */}
        <div className={`${showTeaser ? 'absolute inset-0' : ''} bg-gradient-to-br from-gray-900/80 to-gray-900/90 rounded-xl flex items-center justify-center p-8`}>
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{featureTitle}</h3>
            <p className="text-gray-300 mb-6 max-w-md">{featureDescription}</p>
            <Link href={finalUpgradeUrl}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Sparkles className="w-4 h-4 mr-2" />
                {upgradeText}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
      <div className="flex items-center gap-2 text-orange-700">
        <Lock className="w-5 h-5" />
        <span className="font-medium">{featureTitle}</span>
      </div>
      <p className="text-sm text-orange-600 mt-1">{featureDescription}</p>
      <Link href={finalUpgradeUrl}>
        <Button size="sm" className="mt-3 bg-orange-500 hover:bg-orange-600">
          {upgradeText}
        </Button>
      </Link>
    </div>
  )
}

/**
 * Simple component to check if user has access to specific content
 */
interface AccessCheckProps {
  type: 'course' | 'group' | 'product'
  id: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AccessCheck({ type, id, children, fallback }: AccessCheckProps) {
  const { hasAccessToCourse, hasAccessToGroup, hasAccessToProduct, loading, getUpgradeUrl } = useMemberAccess()
  
  if (loading) {
    return <>{children}</>
  }

  let hasAccess = false
  switch (type) {
    case 'course':
      hasAccess = hasAccessToCourse(id)
      break
    case 'group':
      hasAccess = hasAccessToGroup(id)
      break
    case 'product':
      hasAccess = hasAccessToProduct(id)
      break
  }

  if (hasAccess) {
    return <>{children}</>
  }

  // Default fallback
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Konten ini membutuhkan membership aktif</p>
      <Link href={getUpgradeUrl()}>
        <Button size="sm" variant="outline" className="mt-2">
          Upgrade
        </Button>
      </Link>
    </div>
  )
}
