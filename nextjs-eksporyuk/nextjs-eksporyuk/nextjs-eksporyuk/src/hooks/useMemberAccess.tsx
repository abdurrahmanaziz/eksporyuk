'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface Course {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  level: string
}

interface Group {
  id: string
  name: string
  slug: string
  avatar: string | null
  type: string
  description: string | null
}

interface Product {
  id: string
  name: string
  slug: string
  thumbnail: string | null
  price: number
}

interface MembershipInfo {
  id: string
  name: string
  slug: string
  duration: string
  startDate: string
  endDate: string
  isLifetime: boolean
  daysRemaining: number | null
}

interface LockedFeatures {
  courses: boolean
  groups: boolean
  products: boolean
  documents: boolean
  certificates: boolean
  mentoring: boolean
  advancedAnalytics: boolean
  prioritySupport: boolean
  whatsappGroup: boolean
}

interface MembershipComparison {
  id: string
  name: string
  slug: string
  duration: string
  price: number
  features: string[]
  coursesCount: number
  groupsCount: number
  productsCount: number
}

interface MemberAccessData {
  hasMembership: boolean
  membership: MembershipInfo | null
  access: {
    courses: Course[]
    groups: Group[]
    products: Product[]
    features: string[]
  }
  locked: LockedFeatures
  membershipComparison: MembershipComparison[]
  upgradeOptions: MembershipComparison[]
  upgradeUrl: string
}

interface MemberAccessContextType {
  data: MemberAccessData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  
  // Helper methods
  hasMembership: boolean
  hasAccessToCourse: (courseId: string) => boolean
  hasAccessToGroup: (groupId: string) => boolean
  hasAccessToProduct: (productId: string) => boolean
  hasFeature: (feature: string) => boolean
  isFeatureLocked: (feature: keyof LockedFeatures) => boolean
  getUpgradeUrl: () => string
}

const MemberAccessContext = createContext<MemberAccessContextType>({
  data: null,
  loading: true,
  error: null,
  refetch: async () => {},
  hasMembership: false,
  hasAccessToCourse: () => false,
  hasAccessToGroup: () => false,
  hasAccessToProduct: () => false,
  hasFeature: () => false,
  isFeatureLocked: () => true,
  getUpgradeUrl: () => '/checkout/pro',
})

export const useMemberAccess = () => useContext(MemberAccessContext)

interface MemberAccessProviderProps {
  children: ReactNode
}

export function MemberAccessProvider({ children }: MemberAccessProviderProps) {
  const { status } = useSession()
  const [data, setData] = useState<MemberAccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccess = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/member/access')
      const result = await res.json()
      
      if (result.success) {
        setData(result)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch access data')
      }
    } catch (err) {
      console.error('Error fetching member access:', err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAccess()
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setData(null)
    }
  }, [status])

  // Helper methods
  const hasMembership = data?.hasMembership ?? false

  const hasAccessToCourse = (courseId: string): boolean => {
    if (!data?.access?.courses) return false
    return data.access.courses.some(c => c.id === courseId)
  }

  const hasAccessToGroup = (groupId: string): boolean => {
    if (!data?.access?.groups) return false
    return data.access.groups.some(g => g.id === groupId)
  }

  const hasAccessToProduct = (productId: string): boolean => {
    if (!data?.access?.products) return false
    return data.access.products.some(p => p.id === productId)
  }

  const hasFeature = (feature: string): boolean => {
    if (!data?.access?.features) return false
    return data.access.features.some(f => 
      f.toLowerCase().includes(feature.toLowerCase())
    )
  }

  const isFeatureLocked = (feature: keyof LockedFeatures): boolean => {
    if (!data?.locked) return true
    return data.locked[feature] ?? true
  }

  const getUpgradeUrl = (): string => {
    return data?.upgradeUrl ?? '/checkout/pro'
  }

  return (
    <MemberAccessContext.Provider
      value={{
        data,
        loading,
        error,
        refetch: fetchAccess,
        hasMembership,
        hasAccessToCourse,
        hasAccessToGroup,
        hasAccessToProduct,
        hasFeature,
        isFeatureLocked,
        getUpgradeUrl,
      }}
    >
      {children}
    </MemberAccessContext.Provider>
  )
}
