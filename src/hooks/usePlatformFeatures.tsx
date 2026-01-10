'use client'

import { useState, useEffect, createContext, useContext } from 'react'

// Types untuk platform settings (sama dengan server-side)
export interface PlatformFeatures {
  // Global Features
  featureGroupEnabled: boolean
  featureFeedEnabled: boolean
  featureCommentEnabled: boolean
  featureLikeEnabled: boolean
  featureShareEnabled: boolean
  featureChatEnabled: boolean
  featureNotificationEnabled: boolean
  
  // Affiliate Features
  featureAffiliateEnabled: boolean
  featureAffiliateShortLink: boolean
  featureAffiliateLeaderboard: boolean
  featureAffiliateChallenge: boolean
  featureAffiliateTraining: boolean
  featureAffiliateReward: boolean
  featureAffiliateWithdraw: boolean
  featureAffiliateStatistics: boolean
  featureAffiliateMarketingKit: boolean
  
  // Course Features
  featureCourseEnabled: boolean
  featureCourseEnrollment: boolean
  featureCourseCertificate: boolean
  featureCourseProgress: boolean
  featureCourseQuiz: boolean
  
  // Supplier Features
  featureSupplierEnabled: boolean
  featureSupplierCatalog: boolean
  featureSupplierSampleRequest: boolean
  featureSupplierDirectOrder: boolean
  
  // Transaction Features
  featureCheckoutEnabled: boolean
  featureCouponEnabled: boolean
  featureFlashSaleEnabled: boolean
  
  // Member Premium Features
  featureMemberPremiumClass: boolean
  featureMemberPremiumGroup: boolean
  featureMemberPremiumSupplier: boolean
  featureMemberPremiumDownload: boolean
  featureMemberPremiumCertificate: boolean
  
  // Member Free Features
  featureMemberFreeClass: boolean
  featureMemberFreeGroup: boolean
  featureMemberFreeCatalog: boolean
  
  // Mentor Features
  featureMentorCreateCourse: boolean
  featureMentorCreateMaterial: boolean
  featureMentorCreateGroup: boolean
  featureMentorEditCourse: boolean
  featureMentorAnalytics: boolean
  featureMentorManageStudents: boolean
  
  // Notification Channels
  notificationEmailEnabled: boolean
  notificationWhatsappEnabled: boolean
  notificationPushEnabled: boolean
  notificationInAppEnabled: boolean
}

// Default values
const defaultFeatures: PlatformFeatures = {
  featureGroupEnabled: true,
  featureFeedEnabled: true,
  featureCommentEnabled: true,
  featureLikeEnabled: true,
  featureShareEnabled: true,
  featureChatEnabled: true,
  featureNotificationEnabled: true,
  featureAffiliateEnabled: true,
  featureAffiliateShortLink: true,
  featureAffiliateLeaderboard: true,
  featureAffiliateChallenge: true,
  featureAffiliateTraining: true,
  featureAffiliateReward: true,
  featureAffiliateWithdraw: true,
  featureAffiliateStatistics: true,
  featureAffiliateMarketingKit: true,
  featureCourseEnabled: true,
  featureCourseEnrollment: true,
  featureCourseCertificate: true,
  featureCourseProgress: true,
  featureCourseQuiz: true,
  featureSupplierEnabled: true,
  featureSupplierCatalog: true,
  featureSupplierSampleRequest: true,
  featureSupplierDirectOrder: true,
  featureCheckoutEnabled: true,
  featureCouponEnabled: true,
  featureFlashSaleEnabled: true,
  featureMemberPremiumClass: true,
  featureMemberPremiumGroup: true,
  featureMemberPremiumSupplier: true,
  featureMemberPremiumDownload: true,
  featureMemberPremiumCertificate: true,
  featureMemberFreeClass: true,
  featureMemberFreeGroup: true,
  featureMemberFreeCatalog: true,
  featureMentorCreateCourse: true,
  featureMentorCreateMaterial: true,
  featureMentorCreateGroup: true,
  featureMentorEditCourse: true,
  featureMentorAnalytics: true,
  featureMentorManageStudents: true,
  notificationEmailEnabled: true,
  notificationWhatsappEnabled: true,
  notificationPushEnabled: true,
  notificationInAppEnabled: true,
}

// Context
interface PlatformFeaturesContextType {
  features: PlatformFeatures
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PlatformFeaturesContext = createContext<PlatformFeaturesContextType>({
  features: defaultFeatures,
  loading: true,
  error: null,
  refetch: async () => {},
})

// Provider component
export function PlatformFeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<PlatformFeatures>(defaultFeatures)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use public API endpoint - no auth required
      const response = await fetch('/api/platform/features')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setFeatures({ ...defaultFeatures, ...data.settings })
        }
      } else {
        // If error, use defaults
        setFeatures(defaultFeatures)
      }
    } catch (err) {
      console.error('Error fetching platform features:', err)
      setError('Failed to load features')
      setFeatures(defaultFeatures)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [])

  return (
    <PlatformFeaturesContext.Provider value={{ features, loading, error, refetch: fetchFeatures }}>
      {children}
    </PlatformFeaturesContext.Provider>
  )
}

// Hook to use platform features
export function usePlatformFeatures() {
  const context = useContext(PlatformFeaturesContext)
  if (!context) {
    throw new Error('usePlatformFeatures must be used within a PlatformFeaturesProvider')
  }
  return context
}

// Hook to check if specific feature is enabled
export function useFeature(featureKey: keyof PlatformFeatures): boolean {
  const { features, loading } = usePlatformFeatures()
  // Return true while loading to prevent flash of disabled content
  if (loading) return true
  return features[featureKey] ?? true
}

// Hook to check multiple features
export function useFeatures(featureKeys: (keyof PlatformFeatures)[]): Record<string, boolean> {
  const { features, loading } = usePlatformFeatures()
  const result: Record<string, boolean> = {}
  
  for (const key of featureKeys) {
    // Return true while loading to prevent flash of disabled content
    result[key] = loading ? true : (features[key] ?? true)
  }
  
  return result
}

// Hook for Affiliate-specific features
export function useAffiliateFeatures() {
  const { features, loading } = usePlatformFeatures()
  
  if (loading) {
    return {
      shortLink: true,
      leaderboard: true,
      challenge: true,
      training: true,
      reward: true,
      withdraw: true,
      statistics: true,
      marketingKit: true,
      isLoading: true,
    }
  }
  
  return {
    shortLink: features.featureAffiliateEnabled && features.featureAffiliateShortLink,
    leaderboard: features.featureAffiliateEnabled && features.featureAffiliateLeaderboard,
    challenge: features.featureAffiliateEnabled && features.featureAffiliateChallenge,
    training: features.featureAffiliateEnabled && features.featureAffiliateTraining,
    reward: features.featureAffiliateEnabled && features.featureAffiliateReward,
    withdraw: features.featureAffiliateEnabled && features.featureAffiliateWithdraw,
    statistics: features.featureAffiliateEnabled && features.featureAffiliateStatistics,
    marketingKit: features.featureAffiliateEnabled && features.featureAffiliateMarketingKit,
    isLoading: false,
  }
}

// Hook for Mentor-specific features
export function useMentorFeatures() {
  const { features, loading } = usePlatformFeatures()
  
  if (loading) {
    return {
      createCourse: true,
      createMaterial: true,
      createGroup: true,
      editCourse: true,
      analytics: true,
      manageStudents: true,
      isLoading: true,
    }
  }
  
  return {
    createCourse: features.featureMentorCreateCourse,
    createMaterial: features.featureMentorCreateMaterial,
    createGroup: features.featureMentorCreateGroup,
    editCourse: features.featureMentorEditCourse,
    analytics: features.featureMentorAnalytics,
    manageStudents: features.featureMentorManageStudents,
    isLoading: false,
  }
}

// Hook for Member Premium-specific features
export function useMemberPremiumFeatures() {
  const { features, loading } = usePlatformFeatures()
  
  if (loading) {
    return {
      class: true,
      group: true,
      supplier: true,
      download: true,
      certificate: true,
      isLoading: true,
    }
  }
  
  return {
    class: features.featureMemberPremiumClass,
    group: features.featureMemberPremiumGroup,
    supplier: features.featureMemberPremiumSupplier,
    download: features.featureMemberPremiumDownload,
    certificate: features.featureMemberPremiumCertificate,
    isLoading: false,
  }
}

// Hook for Member Free-specific features
export function useMemberFreeFeatures() {
  const { features, loading } = usePlatformFeatures()
  
  if (loading) {
    return {
      class: true,
      group: true,
      catalog: true,
      isLoading: true,
    }
  }
  
  return {
    class: features.featureMemberFreeClass,
    group: features.featureMemberFreeGroup,
    catalog: features.featureMemberFreeCatalog,
    isLoading: false,
  }
}

// Hook for notification channels
export function useNotificationChannels() {
  const { features, loading } = usePlatformFeatures()
  
  if (loading) {
    return {
      email: true,
      whatsapp: true,
      push: true,
      inApp: true,
      isLoading: true,
    }
  }
  
  return {
    email: features.notificationEmailEnabled,
    whatsapp: features.notificationWhatsappEnabled,
    push: features.notificationPushEnabled,
    inApp: features.notificationInAppEnabled,
    isLoading: false,
  }
}
