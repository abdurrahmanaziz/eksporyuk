'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { X, Clock, Crown, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TrialReminderBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    // Check if user is FREE and has trial info
    if (session?.user?.role !== 'MEMBER_FREE') {
      return
    }

    const trialEndsAt = (session as any).trialEndsAt
    if (!trialEndsAt) return

    // Calculate time remaining
    const calculateTimeLeft = () => {
      const now = new Date()
      const end = new Date(trialEndsAt)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [session])

  // Don't show if not FREE user or dismissed
  if (session?.user?.role !== 'MEMBER_FREE' || dismissed || !timeLeft) {
    return null
  }

  // Don't show if trial expired
  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Store in localStorage to persist dismissal
    localStorage.setItem('trialBannerDismissed', 'true')
  }

  return (
    <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Message */}
          <div className="flex items-center gap-4 flex-1">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Reminder: Upgrade ke Premium Sekarang!
              </h3>
              <p className="text-sm sm:text-base opacity-90">
                Dapatkan akses unlimited ke semua fitur - Database, Kursus, Komunitas & lebih banyak lagi!
              </p>
            </div>
          </div>

          {/* Center: Countdown */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-center">
              <div className="text-3xl font-bold">{timeLeft.days}</div>
              <div className="text-xs opacity-75">Hari</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg px-3 py-2">
              <div className="text-2xl sm:text-3xl font-bold">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-xs opacity-75">Jam</div>
            </div>
            <div className="text-center bg-white/10 rounded-lg px-3 py-2">
              <div className="text-2xl sm:text-3xl font-bold">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs opacity-75">Menit</div>
            </div>
            <div className="hidden sm:block text-center bg-white/10 rounded-lg px-3 py-2">
              <div className="text-2xl sm:text-3xl font-bold">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs opacity-75">Detik</div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard/upgrade">
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Sekarang
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom: Benefits */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="text-yellow-300">✓</span>
              <span>Database Unlimited</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-300">✓</span>
              <span>Semua Kursus</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-300">✓</span>
              <span>Grup Eksklusif</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-300">✓</span>
              <span>Support Prioritas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
