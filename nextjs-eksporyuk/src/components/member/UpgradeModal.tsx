'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMemberAccess } from '@/hooks/useMemberAccess'
import {
  Crown,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  Gift,
  Star,
  Check,
  X,
  Zap,
  Shield,
  MessageCircle,
  FileText,
  Award,
  Rocket,
} from 'lucide-react'

interface UpgradeModalProps {
  /** Only show after profile is complete */
  showAfterProfileComplete?: boolean
  /** Force show modal */
  forceOpen?: boolean
  /** Callback when modal is dismissed */
  onDismiss?: () => void
  /** Callback when user clicks upgrade */
  onUpgrade?: () => void
}

interface MembershipOption {
  id: string
  name: string
  slug: string
  price: number
  duration: string
  features: string[]
  coursesCount: number
  groupsCount: number
  productsCount: number
  isPopular?: boolean
}

export default function UpgradeModal({
  showAfterProfileComplete = true,
  forceOpen = false,
  onDismiss,
  onUpgrade,
}: UpgradeModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { hasMembership, loading: accessLoading, data: accessData } = useMemberAccess()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [memberships, setMemberships] = useState<MembershipOption[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (session?.user?.id && !accessLoading) {
      checkShouldShow()
    }
  }, [session?.user?.id, accessLoading, hasMembership])

  const checkShouldShow = async () => {
    try {
      // Don't show if user already has membership
      if (hasMembership) {
        setLoading(false)
        return
      }

      // Check if already dismissed today
      const dismissedDate = localStorage.getItem('upgradeModalDismissed')
      if (dismissedDate) {
        const dismissedAt = new Date(dismissedDate)
        const now = new Date()
        // If dismissed within last 24 hours, don't show
        if (now.getTime() - dismissedAt.getTime() < 24 * 60 * 60 * 1000) {
          setLoading(false)
          return
        }
      }

      // Check if profile is complete (required before showing upgrade)
      if (showAfterProfileComplete) {
        const profileCompleted = localStorage.getItem('profileCompleted')
        if (profileCompleted !== 'true') {
          setLoading(false)
          return
        }
      }

      // Fetch membership options
      await fetchMemberships()
      
      // Show modal
      setOpen(true)
    } catch (error) {
      console.error('Error checking upgrade modal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberships = async () => {
    try {
      const res = await fetch('/api/memberships?active=true&limit=3')
      const data = await res.json()
      
      if (data.success && data.memberships) {
        // Sort by price and take top 3
        const sorted = data.memberships
          .sort((a: any, b: any) => a.price - b.price)
          .slice(0, 3)
          .map((m: any, idx: number) => ({
            ...m,
            isPopular: idx === 1, // Middle one is popular
          }))
        setMemberships(sorted)
      }
    } catch (error) {
      console.error('Error fetching memberships:', error)
    }
  }

  const handleDismiss = () => {
    // Store dismiss date
    localStorage.setItem('upgradeModalDismissed', new Date().toISOString())
    setDismissed(true)
    setOpen(false)
    onDismiss?.()
  }

  const handleUpgrade = (slug: string) => {
    onUpgrade?.()
    router.push(`/checkout/${slug}`)
  }

  const handleViewAll = () => {
    router.push('/membership')
  }

  // Don't render if loading, has membership, or dismissed
  if (loading || hasMembership || dismissed) {
    return null
  }

  // Force open if prop is set
  const isOpen = forceOpen || open

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && handleDismiss()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400 px-6 py-8 text-center">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Upgrade ke Premium
            </h2>
            <p className="text-white/90 max-w-md mx-auto">
              Dapatkan akses penuh ke semua kursus, grup komunitas eksklusif, dan fitur premium lainnya
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-600">Kursus Eksklusif</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-600">Grup Komunitas</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Gift className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-600">Produk Bonus</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-600">Sertifikat</span>
            </div>
          </div>
        </div>

        {/* Membership Options */}
        <div className="p-6">
          {memberships.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                    membership.isPopular
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  {membership.isPopular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500">
                      <Star className="w-3 h-3 mr-1" />
                      Populer
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4 pt-2">
                    <h3 className="font-semibold text-gray-900">{membership.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        Rp {membership.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{membership.duration === 'LIFETIME' ? 'sekali bayar' : 
                          membership.duration === 'ONE_MONTH' ? 'bulan' :
                          membership.duration === 'THREE_MONTHS' ? '3 bulan' :
                          membership.duration === 'SIX_MONTHS' ? '6 bulan' :
                          membership.duration === 'TWELVE_MONTHS' ? 'tahun' : membership.duration}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4 text-sm">
                    {membership.coursesCount > 0 && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {membership.coursesCount} Kursus
                      </li>
                    )}
                    {membership.groupsCount > 0 && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {membership.groupsCount} Grup
                      </li>
                    )}
                    {membership.productsCount > 0 && (
                      <li className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {membership.productsCount} Produk
                      </li>
                    )}
                  </ul>

                  <Button
                    className={`w-full ${
                      membership.isPopular
                        ? 'bg-orange-500 hover:bg-orange-600'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    onClick={() => handleUpgrade(membership.slug)}
                  >
                    Pilih Paket
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Lihat Semua Paket</h3>
              <p className="text-gray-600 mb-4">
                Temukan paket membership yang sesuai dengan kebutuhan Anda
              </p>
              <Button onClick={handleViewAll} className="bg-orange-500 hover:bg-orange-600">
                <Rocket className="w-4 h-4 mr-2" />
                Lihat Paket Membership
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Nanti saja
          </button>
          <Link href="/membership" className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1">
            Lihat semua paket
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
