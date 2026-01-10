import { prisma } from '@/lib/prisma'

// Types untuk platform settings
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

// Cache untuk mengurangi database queries
let cachedFeatures: PlatformFeatures | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60 * 1000 // 1 menit cache

/**
 * Get platform features dari database dengan caching
 * @returns PlatformFeatures object
 */
export async function getPlatformFeatures(): Promise<PlatformFeatures> {
  const now = Date.now()
  
  // Return cached if valid
  if (cachedFeatures && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedFeatures
  }
  
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
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
    })
    
    if (!settings) {
      cachedFeatures = defaultFeatures
      cacheTimestamp = now
      return defaultFeatures
    }
    
    // Merge with defaults (in case some fields are null)
    const features: PlatformFeatures = {
      ...defaultFeatures,
      ...Object.fromEntries(
        Object.entries(settings).filter(([, value]) => value !== null)
      )
    } as PlatformFeatures
    
    cachedFeatures = features
    cacheTimestamp = now
    return features
  } catch (error) {
    console.error('Error fetching platform features:', error)
    return defaultFeatures
  }
}

/**
 * Clear feature cache - call this after updating settings
 */
export function clearFeatureCache(): void {
  cachedFeatures = null
  cacheTimestamp = 0
}

/**
 * Check if a specific feature is enabled
 * @param featureKey - The feature key to check
 * @returns Promise<boolean>
 */
export async function isFeatureEnabled(featureKey: keyof PlatformFeatures): Promise<boolean> {
  const features = await getPlatformFeatures()
  return features[featureKey] ?? true
}

/**
 * Check multiple features at once
 * @param featureKeys - Array of feature keys to check
 * @returns Promise<Record<string, boolean>>
 */
export async function checkFeatures(featureKeys: (keyof PlatformFeatures)[]): Promise<Record<string, boolean>> {
  const features = await getPlatformFeatures()
  const result: Record<string, boolean> = {}
  
  for (const key of featureKeys) {
    result[key] = features[key] ?? true
  }
  
  return result
}

// ========================
// Role-specific Helpers
// ========================

/**
 * Get features available for Affiliate role
 */
export async function getAffiliateFeatures() {
  const features = await getPlatformFeatures()
  return {
    shortLink: features.featureAffiliateEnabled && features.featureAffiliateShortLink,
    leaderboard: features.featureAffiliateEnabled && features.featureAffiliateLeaderboard,
    challenge: features.featureAffiliateEnabled && features.featureAffiliateChallenge,
    training: features.featureAffiliateEnabled && features.featureAffiliateTraining,
    reward: features.featureAffiliateEnabled && features.featureAffiliateReward,
    withdraw: features.featureAffiliateEnabled && features.featureAffiliateWithdraw,
    statistics: features.featureAffiliateEnabled && features.featureAffiliateStatistics,
    marketingKit: features.featureAffiliateEnabled && features.featureAffiliateMarketingKit,
  }
}

/**
 * Get features available for Mentor role
 */
export async function getMentorFeatures() {
  const features = await getPlatformFeatures()
  return {
    createCourse: features.featureMentorCreateCourse,
    createMaterial: features.featureMentorCreateMaterial,
    createGroup: features.featureMentorCreateGroup,
    editCourse: features.featureMentorEditCourse,
    analytics: features.featureMentorAnalytics,
    manageStudents: features.featureMentorManageStudents,
  }
}

/**
 * Get features available for Member Premium role
 */
export async function getMemberPremiumFeatures() {
  const features = await getPlatformFeatures()
  return {
    class: features.featureMemberPremiumClass,
    group: features.featureMemberPremiumGroup,
    supplier: features.featureMemberPremiumSupplier,
    download: features.featureMemberPremiumDownload,
    certificate: features.featureMemberPremiumCertificate,
  }
}

/**
 * Get features available for Member Free role
 */
export async function getMemberFreeFeatures() {
  const features = await getPlatformFeatures()
  return {
    class: features.featureMemberFreeClass,
    group: features.featureMemberFreeGroup,
    catalog: features.featureMemberFreeCatalog,
  }
}

/**
 * Get notification channel settings
 */
export async function getNotificationChannels() {
  const features = await getPlatformFeatures()
  return {
    email: features.notificationEmailEnabled,
    whatsapp: features.notificationWhatsappEnabled,
    push: features.notificationPushEnabled,
    inApp: features.notificationInAppEnabled,
  }
}
