'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  Link2,
  Wallet,
  Trophy,
  Sparkles,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react'

interface OnboardingData {
  onboardingCompleted: boolean
  profileCompleted: boolean
  trainingCompleted: boolean
  firstLinkCreated: boolean
  bankInfoCompleted: boolean
  hasFirstConversion: boolean
  totalProgress: number
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  isCompleted: boolean
  isLocked?: boolean
  lockReason?: string
  action?: string
}

interface OnboardingChecklistProps {
  onDismiss?: () => void
  variant?: 'full' | 'compact'
}

export default function OnboardingChecklist({ 
  onDismiss,
  variant = 'full' 
}: OnboardingChecklistProps) {
  const [data, setData] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetchOnboardingData()
    
    // Refresh data when window gains focus (user returns from training)
    const handleFocus = () => {
      fetchOnboardingData()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch('/api/affiliate/onboarding')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        // Auto-collapse if more than 3 items completed
        if (result.data.totalProgress >= 60) {
          setExpanded(false)
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || dismissed) return null

  // Don't show if onboarding is completed
  if (data.onboardingCompleted) return null

  const checklistItems: ChecklistItem[] = [
    {
      id: 'onboarding',
      title: 'Setup Akun Affiliate',
      description: 'Lengkapi profil dan informasi rekening bank',
      icon: <User className="w-5 h-5" />,
      href: '/affiliate/onboarding',
      isCompleted: data.profileCompleted && data.bankInfoCompleted,
      action: 'Setup Akun',
    },
    {
      id: 'training',
      title: 'Selesaikan Training',
      description: 'Pelajari cara menjadi Rich Affiliate sukses',
      icon: <GraduationCap className="w-5 h-5" />,
      href: '/affiliate/training',
      isCompleted: data.trainingCompleted,
      action: 'Mulai Training',
    },
    {
      id: 'link',
      title: 'Buat Link Pertama',
      description: 'Buat link affiliate untuk mulai promosi',
      icon: <Link2 className="w-5 h-5" />,
      href: '/affiliate/links',
      isCompleted: data.firstLinkCreated,
      isLocked: !data.trainingCompleted,
      lockReason: 'Selesaikan training terlebih dahulu',
      action: 'Buat Link',
    },
    {
      id: 'conversion',
      title: 'Dapatkan Konversi Pertama',
      description: 'Raih penjualan pertama kamu!',
      icon: <Trophy className="w-5 h-5" />,
      href: '/affiliate/reports',
      isCompleted: data.hasFirstConversion,
      isLocked: !data.firstLinkCreated,
      lockReason: 'Buat link terlebih dahulu',
      action: 'Lihat Progress',
    },
  ]

  const completedCount = checklistItems.filter(item => item.isCompleted).length
  const totalCount = checklistItems.length

  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Setup Affiliate</p>
              <p className="text-sm text-orange-100">{completedCount}/{totalCount} selesai</p>
            </div>
          </div>
          <Link 
            href="/affiliate/onboarding"
            className="px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            Lanjutkan
          </Link>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${data.totalProgress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">🚀 Selamat Datang, Affiliate!</h3>
              <p className="text-orange-100 text-sm">Selesaikan setup untuk mulai menghasilkan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold">{data.totalProgress}%</p>
              <p className="text-xs text-orange-100">{completedCount}/{totalCount} selesai</p>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-white/70" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/70" />
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${data.totalProgress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {expanded && (
        <div className="p-4 space-y-2">
          {checklistItems.map((item, index) => (
            <div
              key={item.id}
              className={`relative rounded-xl border transition-all ${
                item.isCompleted 
                  ? 'bg-green-50 border-green-200'
                  : item.isLocked
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Step number / Check icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.isCompleted 
                    ? 'bg-green-500 text-white'
                    : item.isLocked
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-orange-100 text-orange-600'
                }`}>
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : item.isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    item.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${
                      item.isCompleted ? 'text-green-700' : item.isLocked ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h4>
                    {item.isCompleted && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                        Selesai
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${
                    item.isLocked ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {item.isLocked ? item.lockReason : item.description}
                  </p>
                </div>

                {/* Action Button */}
                {!item.isCompleted && !item.isLocked && (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
                  >
                    {item.action}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                {item.isCompleted && (
                  <Link
                    href={item.href}
                    className="text-green-600 text-sm hover:underline flex items-center gap-1"
                  >
                    Lihat <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Dismiss option when progress >= 60% */}
          {data.totalProgress >= 60 && (
            <div className="pt-3 border-t border-gray-100 mt-4">
              <button
                onClick={handleDismiss}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Sembunyikan checklist ini
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed summary */}
      {!expanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {checklistItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                  title={item.title}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {totalCount - completedCount} langkah tersisa
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
