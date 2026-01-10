'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

interface ProfileCompletionData {
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
  user: {
    name: string
    email: string
    avatar: string | null
  }
}

interface ProfileCompletionContextType {
  data: ProfileCompletionData | null
  loading: boolean
  error: string | null
  isProfileComplete: boolean
  refetch: () => Promise<void>
}

const ProfileCompletionContext = createContext<ProfileCompletionContextType>({
  data: null,
  loading: true,
  error: null,
  isProfileComplete: false,
  refetch: async () => {},
})

export const useProfileCompletion = () => useContext(ProfileCompletionContext)

interface ProfileCompletionProviderProps {
  children: ReactNode
}

// Pages that don't require profile completion
const EXCLUDED_PATHS = [
  '/dashboard/complete-profile',
  '/auth',
  '/checkout',
  '/payment',
  '/admin',
  '/mentor',
  '/affiliate',
  '/supplier',
  '/profile',
  '/settings',
  '/api',
]

// Pages that require profile completion for access (member content)
const PROTECTED_MEMBER_PATHS = [
  '/dashboard/courses',
  '/dashboard/my-courses',
  '/dashboard/my-membership/courses',
  '/community/groups',
  '/learn',
]

export function ProfileCompletionProvider({ children }: ProfileCompletionProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [data, setData] = useState<ProfileCompletionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfileCompletion = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/member/onboarding')
      const result = await res.json()
      
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch profile data')
      }
    } catch (err) {
      console.error('Error fetching profile completion:', err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfileCompletion()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  // Check and redirect if profile incomplete
  useEffect(() => {
    if (loading || status !== 'authenticated' || !data) return

    // Skip check for excluded paths
    const isExcludedPath = EXCLUDED_PATHS.some(path => pathname?.startsWith(path))
    if (isExcludedPath) return

    // Check if current path is a protected member path
    const isProtectedPath = PROTECTED_MEMBER_PATHS.some(path => pathname?.startsWith(path))
    
    // If profile not complete and trying to access protected content
    if (!data.profileCompleted && isProtectedPath) {
      router.push('/dashboard/complete-profile')
    }
  }, [loading, status, data, pathname, router])

  const isProfileComplete = data?.profileCompleted ?? false

  return (
    <ProfileCompletionContext.Provider
      value={{
        data,
        loading,
        error,
        isProfileComplete,
        refetch: fetchProfileCompletion,
      }}
    >
      {children}
    </ProfileCompletionContext.Provider>
  )
}

/**
 * Hook to check if profile is complete and redirect if not
 * Use this in pages that require complete profile
 */
export function useRequireCompleteProfile() {
  const { isProfileComplete, loading } = useProfileCompletion()
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && !loading && !isProfileComplete) {
      router.push('/dashboard/complete-profile')
    }
  }, [status, loading, isProfileComplete, router])

  return { isProfileComplete, loading }
}

/**
 * Higher-order component to protect pages that require complete profile
 */
export function withProfileCompletion<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProfileProtectedComponent(props: P) {
    const { isProfileComplete, loading } = useRequireCompleteProfile()
    const { status } = useSession()

    if (status === 'loading' || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )
    }

    if (!isProfileComplete) {
      return null // Will be redirected
    }

    return <WrappedComponent {...props} />
  }
}
