'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Lock, 
  GraduationCap, 
  AlertTriangle, 
  ArrowRight, 
  Loader2,
  Mail,
  UserCircle,
  CheckCircle2,
  Shield
} from 'lucide-react'

// Feature types - expanded
type FeatureType = 
  | 'links' 
  | 'short-links' 
  | 'reports' 
  | 'challenges' 
  | 'wallet'
  | 'earnings'
  | 'conversions'
  | 'statistics'
  | 'performance'
  | 'leads'
  | 'materials'
  | 'templates'
  | 'broadcast'
  | 'automation'
  | 'bio'
  | 'optin-forms'
  | 'credits'
  | 'payouts'
  | 'coupons'

interface FeatureLockProps {
  children: React.ReactNode
  feature: FeatureType
  fallbackTitle?: string
  fallbackDescription?: string
}

interface OnboardingStatus {
  emailVerified: boolean
  profileCompleted: boolean
  trainingCompleted: boolean
  firstLinkCreated: boolean
  onboardingCompleted: boolean
  bankInfoCompleted: boolean
}

// Requirement keys
type RequirementKey = 'emailVerified' | 'profileCompleted' | 'trainingCompleted' | 'firstLinkCreated'

// Feature requirements mapping - COMPREHENSIVE
// Note: emailVerified removed - now optional, only profileCompleted is mandatory
const FEATURE_REQUIREMENTS: Record<FeatureType, { 
  requires: RequirementKey[];
  title: string;
  description: string;
}> = {
  // Core features - only require profile completion
  links: {
    requires: ['profileCompleted'],
    title: 'Fitur Belum Tersedia',
    description: 'Lengkapi profil untuk membuat link affiliate.',
  },
  'short-links': {
    requires: ['profileCompleted', 'firstLinkCreated'],
    title: 'Fitur Belum Tersedia',
    description: 'Lengkapi profil dan buat link pertama untuk menggunakan short link.',
  },
  
  // Stats & Reports - only require profile
  earnings: {
    requires: ['profileCompleted'],
    title: 'Laporan Pendapatan Terkunci',
    description: 'Lengkapi profil untuk melihat laporan pendapatan.',
  },
  conversions: {
    requires: ['profileCompleted'],
    title: 'Data Konversi Terkunci',
    description: 'Lengkapi profil untuk melihat data konversi.',
  },
  statistics: {
    requires: ['profileCompleted'],
    title: 'Statistik Terkunci',
    description: 'Lengkapi profil untuk melihat statistik lengkap.',
  },
  performance: {
    requires: ['profileCompleted'],
    title: 'Laporan Performa Terkunci',
    description: 'Lengkapi profil untuk melihat performa Anda.',
  },
  reports: {
    requires: ['profileCompleted'],
    title: 'Laporan Terkunci',
    description: 'Lengkapi profil untuk melihat semua laporan.',
  },
  
  // Marketing Tools - only require profile
  leads: {
    requires: ['profileCompleted'],
    title: 'Leads Terkunci',
    description: 'Lengkapi profil untuk mengelola leads.',
  },
  materials: {
    requires: ['profileCompleted'],
    title: 'Materi Promosi Terkunci',
    description: 'Lengkapi profil untuk akses materi promosi.',
  },
  templates: {
    requires: ['profileCompleted'],
    title: 'Template Terkunci',
    description: 'Lengkapi profil untuk menggunakan template.',
  },
  broadcast: {
    requires: ['profileCompleted'],
    title: 'Broadcast Terkunci',
    description: 'Lengkapi profil untuk mengirim broadcast.',
  },
  automation: {
    requires: ['profileCompleted'],
    title: 'Automation Terkunci',
    description: 'Lengkapi profil untuk menggunakan automation.',
  },
  bio: {
    requires: ['profileCompleted'],
    title: 'Bio Link Terkunci',
    description: 'Lengkapi profil untuk membuat bio link.',
  },
  'optin-forms': {
    requires: ['profileCompleted'],
    title: 'Opt-in Forms Terkunci',
    description: 'Lengkapi profil untuk membuat opt-in forms.',
  },
  
  // Challenges
  challenges: {
    requires: ['profileCompleted'],
    title: 'Tantangan Terkunci',
    description: 'Lengkapi profil untuk ikut tantangan.',
  },
  
  // Financial - always accessible for viewing
  wallet: {
    requires: [],
    title: 'Fitur Tersedia',
    description: '',
  },
  credits: {
    requires: ['profileCompleted'],
    title: 'Credits Terkunci',
    description: 'Lengkapi profil untuk menggunakan credits.',
  },
  payouts: {
    requires: ['profileCompleted'],
    title: 'Payout Terkunci',
    description: 'Lengkapi profil untuk request payout.',
  },
  coupons: {
    requires: ['profileCompleted'],
    title: 'Kupon Terkunci',
    description: 'Lengkapi profil untuk membuat kupon diskon.',
  },
}

// Step info for each requirement
const STEP_INFO: Record<RequirementKey, { 
  label: string; 
  href: string; 
  action: string;
  icon: React.ElementType;
  description: string;
}> = {
  emailVerified: {
    label: 'Verifikasi Email',
    href: '/affiliate/profile',
    action: 'Verifikasi',
    icon: Mail,
    description: 'Verifikasi email Anda untuk keamanan akun',
  },
  profileCompleted: {
    label: 'Lengkapi Profil',
    href: '/affiliate/profile',
    action: 'Lengkapi',
    icon: UserCircle,
    description: 'Lengkapi nama, foto, dan WhatsApp',
  },
  trainingCompleted: {
    label: 'Selesaikan Training',
    href: '/affiliate/training',
    action: 'Mulai Training',
    icon: GraduationCap,
    description: 'Pelajari cara menjadi Rich Affiliate sukses',
  },
  firstLinkCreated: {
    label: 'Buat Link Pertama',
    href: '/affiliate/links',
    action: 'Buat Link',
    icon: Lock,
    description: 'Buat link affiliate pertama Anda',
  },
}

export default function FeatureLock({ 
  children, 
  feature,
  fallbackTitle,
  fallbackDescription
}: FeatureLockProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchOnboardingStatus()
  }, [])

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/affiliate/onboarding')
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.data)
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Error fetching onboarding status:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Error state - allow access
  if (error || !status) {
    return <>{children}</>
  }

  // Get requirements for this feature
  const requirements = FEATURE_REQUIREMENTS[feature]
  
  if (!requirements || requirements.requires.length === 0) {
    return <>{children}</>
  }

  // Check if all requirements are met
  const unmetRequirements = requirements.requires.filter(req => !status[req])
  
  // All requirements met - render children
  if (unmetRequirements.length === 0) {
    return <>{children}</>
  }

  // Get step info for unmet requirements
  const stepsToShow = unmetRequirements.map(req => ({
    ...STEP_INFO[req],
    completed: status[req],
    key: req,
  }))

  // Calculate progress
  const totalSteps = requirements.requires.length
  const completedSteps = requirements.requires.filter(req => status[req]).length
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 md:p-8 text-white text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-10 -top-10 w-40 h-40 border-8 border-white rounded-full" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 border-8 border-white rounded-full" />
            </div>
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                {fallbackTitle || requirements.title}
              </h1>
              <p className="text-orange-100 text-sm md:text-base">
                {fallbackDescription || requirements.description}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress Onboarding</span>
              <span className="font-semibold text-orange-600">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Langkah yang Perlu Diselesaikan
            </h3>
            
            <div className="space-y-3">
              {/* Show completed steps first */}
              {requirements.requires.filter(req => status[req]).map((req) => {
                const step = STEP_INFO[req]
                return (
                  <div
                    key={req}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-green-700 font-medium">{step.label}</span>
                      <p className="text-xs text-green-600">{step.description}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Selesai</span>
                  </div>
                )
              })}

              {/* Show incomplete steps */}
              {stepsToShow.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-800 font-medium">{step.label}</span>
                      <p className="text-xs text-gray-500 truncate">{step.description}</p>
                    </div>
                    <Link
                      href={step.href}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      {step.action}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">Mengapa perlu verifikasi?</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Proses onboarding ini memastikan Anda siap untuk menjadi Rich Affiliate yang sukses. 
                    Training akan membantu Anda memahami cara kerja sistem dan strategi promosi terbaik.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/affiliate/dashboard"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href={stepsToShow[0]?.href || '/affiliate/training'}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Lanjutkan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
