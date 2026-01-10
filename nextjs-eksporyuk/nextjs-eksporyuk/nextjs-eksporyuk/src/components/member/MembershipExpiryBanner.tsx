'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Clock, AlertTriangle, Crown, ArrowRight, X, 
  Calendar, Zap, Shield, RefreshCw
} from 'lucide-react'

interface MembershipData {
  id: string
  name: string
  endDate: string
  daysRemaining: number
  isExpiringSoon: boolean // <= 7 days
  isExpired: boolean
}

export default function MembershipExpiryBanner() {
  const { data: session } = useSession()
  const [membership, setMembership] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Fetch membership data
  useEffect(() => {
    const fetchMembership = async () => {
      if (!session?.user?.id) return
      
      // Skip for free users - they don't have memberships
      if (session.user.role === 'MEMBER_FREE') {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/user/membership-status')
        if (res.ok) {
          const data = await res.json()
          if (data.membership) {
            setMembership(data.membership)
          }
        }
      } catch (error) {
        console.error('Error fetching membership:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembership()
  }, [session])

  // Real-time countdown
  useEffect(() => {
    if (!membership?.endDate) return

    const updateCountdown = () => {
      const now = new Date()
      const end = new Date(membership.endDate)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [membership])

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissedKey = `membership-expiry-dismissed-${membership?.id}`
    const dismissedUntil = localStorage.getItem(dismissedKey)
    
    if (dismissedUntil) {
      const until = new Date(dismissedUntil)
      if (until > new Date()) {
        setDismissed(true)
      } else {
        localStorage.removeItem(dismissedKey)
      }
    }
  }, [membership])

  const handleDismiss = () => {
    if (!membership) return
    
    // Dismiss for 24 hours
    const dismissUntil = new Date()
    dismissUntil.setHours(dismissUntil.getHours() + 24)
    localStorage.setItem(
      `membership-expiry-dismissed-${membership.id}`,
      dismissUntil.toISOString()
    )
    setDismissed(true)
  }

  // Don't show if loading, no membership, dismissed, or not expiring soon
  if (loading || !membership || dismissed) return null
  
  // Only show if expiring within 30 days or already expired
  if (membership.daysRemaining > 30 && !membership.isExpired) return null

  // Determine banner style based on urgency
  const isUrgent = membership.daysRemaining <= 3
  const isWarning = membership.daysRemaining <= 7 && membership.daysRemaining > 3
  const isExpired = membership.isExpired

  const getBannerStyle = () => {
    if (isExpired) {
      return {
        bg: 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500',
        icon: AlertTriangle,
        title: '⚠️ Membership Anda Sudah Berakhir!',
        subtitle: 'Perpanjang sekarang untuk tetap akses semua fitur premium'
      }
    }
    if (isUrgent) {
      return {
        bg: 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500',
        icon: AlertTriangle,
        title: '🔥 Membership Berakhir Segera!',
        subtitle: 'Perpanjang sekarang sebelum akses Anda terkunci'
      }
    }
    if (isWarning) {
      return {
        bg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500',
        icon: Clock,
        title: '⏰ Membership Akan Segera Berakhir',
        subtitle: 'Perpanjang sekarang untuk hindari gangguan akses'
      }
    }
    return {
      bg: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500',
      icon: Calendar,
      title: '📅 Reminder: Membership Akan Berakhir',
      subtitle: 'Perpanjang membership Anda untuk tetap menikmati semua fitur'
    }
  }

  const style = getBannerStyle()
  const Icon = style.icon

  return (
    <div className={`${style.bg} text-white relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-yellow-300 rounded-full blur-3xl transform -translate-x-20 translate-y-20"></div>
      </div>

      <div className="relative px-4 py-4 md:py-5">
        <div className="max-w-6xl mx-auto">
          {/* Main content */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Icon & Text */}
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="hidden md:flex w-12 h-12 bg-white/20 rounded-xl items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center md:justify-start">
                  <Icon className="w-5 h-5 md:hidden" />
                  {style.title}
                </h3>
                <p className="text-white/90 text-sm">
                  {style.subtitle}
                </p>
                <p className="text-white/80 text-xs mt-1">
                  Paket: <span className="font-semibold">{membership.name}</span>
                </p>
              </div>
            </div>

            {/* Center: Countdown */}
            <div className="flex items-center gap-2 md:gap-3">
              {isExpired ? (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                  <span className="text-lg font-bold">EXPIRED</span>
                </div>
              ) : (
                <>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] text-center">
                    <div className="text-xl md:text-2xl font-bold">{countdown.days}</div>
                    <div className="text-[10px] text-white/80 uppercase">Hari</div>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] text-center">
                    <div className="text-xl md:text-2xl font-bold">{countdown.hours.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] text-white/80 uppercase">Jam</div>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] text-center">
                    <div className="text-xl md:text-2xl font-bold">{countdown.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] text-white/80 uppercase">Menit</div>
                  </div>
                  {isUrgent && (
                    <>
                      <span className="text-xl font-bold">:</span>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] text-center animate-pulse">
                        <div className="text-xl md:text-2xl font-bold">{countdown.seconds.toString().padStart(2, '0')}</div>
                        <div className="text-[10px] text-white/80 uppercase">Detik</div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Right: CTA */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard/my-membership">
                <button className="group bg-white hover:bg-gray-50 text-gray-900 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Perpanjang</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              
              {/* Dismiss button - only show if not expired and not urgent */}
              {!isExpired && !isUrgent && (
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Sembunyikan untuk 24 jam"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Benefits reminder for expired */}
          {isExpired && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-white/90 text-center">
                <Shield className="w-4 h-4 inline mr-1" />
                Data Anda tetap aman! Perpanjang membership untuk mengakses kembali semua fitur premium.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
