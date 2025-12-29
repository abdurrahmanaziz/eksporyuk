'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface OnboardingStatus {
  profileCompleted: boolean
  bankInfoCompleted: boolean
  trainingCompleted: boolean
  onboardingCompleted: boolean
  totalProgress: number
  needsOnboarding: boolean
}

/**
 * AffiliateOnboardingGuard
 * 
 * This component wraps affiliate pages and ensures users complete
 * the mandatory onboarding process before accessing other features.
 * 
 * Allowed paths during onboarding:
 * - /affiliate/onboarding - The main onboarding flow
 * - /affiliate/welcome - Welcome page for newly approved affiliates
 * - /affiliate/profile - Profile settings (can be accessed anytime)
 */
export default function AffiliateOnboardingGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const checkedRef = useRef(false)

  // Pages that are allowed during onboarding
  const allowedDuringOnboarding = [
    '/affiliate/onboarding',
    '/affiliate/welcome',
    '/affiliate/profile',
    '/affiliate/training', // Allow training as part of onboarding
  ]

  const isAllowedPath = allowedDuringOnboarding.some(path => 
    pathname === path || pathname?.startsWith(path + '/')
  )

  const checkOnboardingStatus = useCallback(async () => {
    if (!session?.user?.id) return null

    try {
      const response = await fetch('/api/affiliate/onboarding', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        console.error('[OnboardingGuard] Failed to fetch onboarding status')
        return null
      }

      const data = await response.json()
      
      if (data.success) {
        // Determine if user needs onboarding
        // User needs onboarding if:
        // 1. Profile is not completed
        // Note: Bank info is optional - can be added later during withdrawal
        const needsOnboarding = !data.data.profileCompleted
        
        return {
          ...data.data,
          needsOnboarding,
        }
      }

      return null
    } catch (error) {
      console.error('[OnboardingGuard] Error checking onboarding status:', error)
      return null
    }
  }, [session?.user?.id])

  useEffect(() => {
    // Don't check if session is still loading
    if (sessionStatus === 'loading') return

    // Don't check if not authenticated
    if (sessionStatus === 'unauthenticated') {
      setLoading(false)
      return
    }

    // Don't check if user is not affiliate role (but has access via affiliateMenuEnabled)
    // Admin users should bypass onboarding check
    if (session?.user?.role === 'ADMIN') {
      setLoading(false)
      return
    }

    // If on allowed path, don't block - but still check status for reference
    const doCheck = async () => {
      // Prevent multiple checks
      if (checkedRef.current && onboardingStatus) {
        setLoading(false)
        return
      }
      
      checkedRef.current = true
      const status = await checkOnboardingStatus()
      setOnboardingStatus(status)
      setLoading(false)

      // If user needs onboarding and is not on allowed path, redirect
      if (status?.needsOnboarding && !isAllowedPath) {
        console.log('[OnboardingGuard] User needs onboarding, redirecting...')
        router.replace('/affiliate/onboarding')
      }
    }

    doCheck()
  }, [
    sessionStatus, 
    session?.user?.role, 
    checkOnboardingStatus, 
    isAllowedPath, 
    router, 
    onboardingStatus
  ])

  // Reset check when pathname changes
  useEffect(() => {
    // Re-check when navigating to non-allowed paths
    if (!isAllowedPath && onboardingStatus?.needsOnboarding) {
      router.replace('/affiliate/onboarding')
    }
  }, [pathname, isAllowedPath, onboardingStatus?.needsOnboarding, router])

  // Show loading spinner while checking
  if (loading && sessionStatus !== 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Memeriksa status onboarding...</p>
        </div>
      </div>
    )
  }

  // If user needs onboarding but we're on an allowed path, show children
  // The redirect will happen through the useEffect above for non-allowed paths
  return <>{children}</>
}
