'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  BookOpen,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface OnboardingData {
  profileCompleted: boolean
  onboardingCompleted: boolean
  profile: {
    isComplete: boolean
    missingFields: string[]
    completedCount: number
    totalRequired: number
    progress: number
  }
  steps: {
    profileCompleted: boolean
    hasMembership: boolean
    hasJoinedGroup: boolean
    hasEnrolledCourse: boolean
  }
  totalProgress: number
  membership: {
    id: string
    name: string
    slug: string
  } | null
  pendingTransaction?: {
    id: string
    invoiceNumber: string
    amount: number
    paymentUrl: string | null
    expiredAt: string
    createdAt: string
    membershipName: string
  } | null
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
  priority: 'required' | 'recommended' | 'optional'
}

interface MemberOnboardingChecklistProps {
  onDismiss?: () => void
  variant?: 'full' | 'compact' | 'alert'
}

export default function MemberOnboardingChecklist({ 
  onDismiss,
  variant = 'full' 
}: MemberOnboardingChecklistProps) {
  const [data, setData] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetchOnboardingData()
  }, [])

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch('/api/member/onboarding')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        // Auto-collapse if profile is complete
        if (result.data.profileCompleted) {
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || dismissed) return null

  // Skip for admin/mentor/staff - they don't need onboarding
  if ((data as any).skipOnboarding) return null

  // If profile is already complete and all done, show success or hide
  if (data.profileCompleted && data.totalProgress >= 85) {
    if (variant === 'full') {
      return null // Don't show checklist if everything is done
    }
  }

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      title: 'Lengkapi Profil',
      description: data.profileCompleted 
        ? 'Profil sudah lengkap' 
        : `${data.profile.missingFields.length} field perlu dilengkapi`,
      icon: <User className="w-5 h-5" />,
      href: '/dashboard/complete-profile',
      isCompleted: data.profileCompleted,
      action: 'Lengkapi',
      priority: 'required',
    },
    {
      id: 'membership',
      title: data.pendingTransaction 
        ? 'Bayar Tagihan' 
        : 'Aktifkan Membership',
      description: data.steps.hasMembership 
        ? `Member ${data.membership?.name || 'aktif'}` 
        : data.pendingTransaction 
          ? `Menunggu pembayaran ${data.pendingTransaction.membershipName}`
          : 'Pilih paket membership',
      icon: <Award className="w-5 h-5" />,
      href: data.pendingTransaction 
        ? '/dashboard/billing' 
        : '/pricing',
      isCompleted: data.steps.hasMembership,
      action: data.pendingTransaction ? 'Lihat Tagihan' : 'Pilih Paket',
      priority: 'required',
    },
    {
      id: 'course',
      title: 'Mulai Belajar',
      description: data.steps.hasEnrolledCourse 
        ? 'Sudah enroll di kelas' 
        : 'Akses kelas sesuai membership',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/dashboard/my-membership/courses',
      isCompleted: data.steps.hasEnrolledCourse,
      isLocked: !data.profileCompleted,
      lockReason: 'Lengkapi profil terlebih dahulu',
      action: 'Lihat Kelas',
      priority: 'recommended',
    },
    {
      id: 'group',
      title: 'Gabung Komunitas',
      description: data.steps.hasJoinedGroup 
        ? 'Sudah bergabung di grup' 
        : 'Bergabung ke grup member',
      icon: <Users className="w-5 h-5" />,
      href: '/community/groups',
      isCompleted: data.steps.hasJoinedGroup,
      isLocked: !data.profileCompleted,
      lockReason: 'Lengkapi profil terlebih dahulu',
      action: 'Lihat Grup',
      priority: 'recommended',
    },
  ]

  const requiredItems = checklistItems.filter(item => item.priority === 'required')
  const completedRequired = requiredItems.filter(item => item.isCompleted).length
  const completedCount = checklistItems.filter(item => item.isCompleted).length
  const totalCount = checklistItems.length

  // Alert variant - show only if profile not complete
  if (variant === 'alert' && !data.profileCompleted) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Profil Belum Lengkap</h3>
            <p className="text-sm text-orange-700 mt-1">
              Lengkapi profil Anda untuk mengakses materi kelas, grup komunitas, dan fitur lainnya.
            </p>
            <Link href="/dashboard/complete-profile">
              <Button size="sm" className="mt-3 bg-orange-500 hover:bg-orange-600">
                Lengkapi Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`rounded-xl p-4 text-white ${
        data.profileCompleted 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
          : 'bg-gradient-to-r from-orange-500 to-amber-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {data.profileCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {data.profileCompleted ? 'Profil Lengkap!' : 'Setup Member'}
              </p>
              <p className="text-sm opacity-90">{completedCount}/{totalCount} selesai</p>
            </div>
          </div>
          {!data.profileCompleted && (
            <Link 
              href="/dashboard/complete-profile"
              className="px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              Lanjutkan
            </Link>
          )}
        </div>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${data.totalProgress}%` }}
          />
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div 
        className={`p-5 cursor-pointer ${
          data.profileCompleted 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
            : 'bg-gradient-to-r from-orange-500 to-amber-500'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {data.profileCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {data.profileCompleted 
                  ? '✅ Selamat! Profil Lengkap' 
                  : '🚀 Selamat Datang, Member!'}
              </h3>
              <p className="text-white/80 text-sm">
                {data.profileCompleted 
                  ? 'Anda sudah bisa mengakses semua fitur' 
                  : 'Lengkapi profil untuk akses penuh'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold">{data.totalProgress}%</p>
              <p className="text-xs text-white/80">{completedCount}/{totalCount} selesai</p>
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
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`relative rounded-xl border transition-all ${
                item.isCompleted 
                  ? 'bg-green-50 border-green-200'
                  : item.isLocked
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : item.priority === 'required'
                  ? 'bg-orange-50 border-orange-200 hover:border-orange-300 hover:shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.isCompleted 
                    ? 'bg-green-500 text-white'
                    : item.isLocked
                    ? 'bg-gray-300 text-gray-500'
                    : item.priority === 'required'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600'
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
                    {item.priority === 'required' && !item.isCompleted && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                        Wajib
                      </span>
                    )}
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
                  item.href.startsWith('http') ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        className={
                          item.priority === 'required'
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }
                      >
                        {item.action}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={item.href}>
                      <Button
                        size="sm"
                        className={
                          item.priority === 'required'
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }
                      >
                        {item.action}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )
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

          {/* Note about required fields */}
          {!data.profileCompleted && (
            <div className="pt-3 border-t border-gray-100 mt-4">
              <p className="text-center text-sm text-gray-500">
                ⚠️ Anda harus melengkapi profil untuk mengakses materi kelas dan grup
              </p>
            </div>
          )}

          {/* Dismiss option when profile is complete */}
          {data.profileCompleted && (
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
              {checklistItems.map((item) => (
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
