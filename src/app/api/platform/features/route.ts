import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Default platform settings values
const defaultPlatformSettings = {
  // Global Features
  featureGroupEnabled: true,
  featureFeedEnabled: true,
  featureCommentEnabled: true,
  featureLikeEnabled: true,
  featureShareEnabled: true,
  featureChatEnabled: true,
  featureNotificationEnabled: true,
  
  // Affiliate Features
  featureAffiliateEnabled: true,
  featureAffiliateShortLink: true,
  featureAffiliateLeaderboard: true,
  featureAffiliateChallenge: true,
  featureAffiliateTraining: true,
  featureAffiliateReward: true,
  featureAffiliateWithdraw: true,
  featureAffiliateStatistics: true,
  featureAffiliateMarketingKit: true,
  
  // Course Features
  featureCourseEnabled: true,
  featureCourseEnrollment: true,
  featureCourseCertificate: true,
  featureCourseProgress: true,
  featureCourseQuiz: true,
  
  // Supplier Features
  featureSupplierEnabled: true,
  featureSupplierCatalog: true,
  featureSupplierSampleRequest: true,
  featureSupplierDirectOrder: true,
  
  // Transaction Features
  featureCheckoutEnabled: true,
  featureCouponEnabled: true,
  featureFlashSaleEnabled: true,
  
  // Member Premium Features
  featureMemberPremiumClass: true,
  featureMemberPremiumGroup: true,
  featureMemberPremiumSupplier: true,
  featureMemberPremiumDownload: true,
  featureMemberPremiumCertificate: true,
  
  // Member Free Features
  featureMemberFreeClass: true,
  featureMemberFreeGroup: true,
  featureMemberFreeCatalog: true,
  
  // Mentor Features
  featureMentorCreateCourse: true,
  featureMentorCreateMaterial: true,
  featureMentorCreateGroup: true,
  featureMentorEditCourse: true,
  featureMentorAnalytics: true,
  featureMentorManageStudents: true,
  
  // Notification Channels
  notificationEmailEnabled: true,
  notificationWhatsappEnabled: true,
  notificationPushEnabled: true,
  notificationInAppEnabled: true,
}


export const dynamic = 'force-dynamic';
// Public API - no auth required, returns platform features for client-side usage
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    
    if (!settings) {
      return NextResponse.json({ 
        success: true, 
        settings: defaultPlatformSettings 
      })
    }

    // Extract only platform-related settings (safe for public access)
    const platformSettings = {
      // Global Features
      featureGroupEnabled: settings.featureGroupEnabled ?? defaultPlatformSettings.featureGroupEnabled,
      featureFeedEnabled: settings.featureFeedEnabled ?? defaultPlatformSettings.featureFeedEnabled,
      featureCommentEnabled: settings.featureCommentEnabled ?? defaultPlatformSettings.featureCommentEnabled,
      featureLikeEnabled: settings.featureLikeEnabled ?? defaultPlatformSettings.featureLikeEnabled,
      featureShareEnabled: settings.featureShareEnabled ?? defaultPlatformSettings.featureShareEnabled,
      featureChatEnabled: settings.featureChatEnabled ?? defaultPlatformSettings.featureChatEnabled,
      featureNotificationEnabled: settings.featureNotificationEnabled ?? defaultPlatformSettings.featureNotificationEnabled,
      
      // Affiliate Features
      featureAffiliateEnabled: settings.featureAffiliateEnabled ?? defaultPlatformSettings.featureAffiliateEnabled,
      featureAffiliateShortLink: settings.featureAffiliateShortLink ?? defaultPlatformSettings.featureAffiliateShortLink,
      featureAffiliateLeaderboard: settings.featureAffiliateLeaderboard ?? defaultPlatformSettings.featureAffiliateLeaderboard,
      featureAffiliateChallenge: settings.featureAffiliateChallenge ?? defaultPlatformSettings.featureAffiliateChallenge,
      featureAffiliateTraining: settings.featureAffiliateTraining ?? defaultPlatformSettings.featureAffiliateTraining,
      featureAffiliateReward: settings.featureAffiliateReward ?? defaultPlatformSettings.featureAffiliateReward,
      featureAffiliateWithdraw: settings.featureAffiliateWithdraw ?? defaultPlatformSettings.featureAffiliateWithdraw,
      featureAffiliateStatistics: settings.featureAffiliateStatistics ?? defaultPlatformSettings.featureAffiliateStatistics,
      featureAffiliateMarketingKit: settings.featureAffiliateMarketingKit ?? defaultPlatformSettings.featureAffiliateMarketingKit,
      
      // Course Features
      featureCourseEnabled: settings.featureCourseEnabled ?? defaultPlatformSettings.featureCourseEnabled,
      featureCourseEnrollment: settings.featureCourseEnrollment ?? defaultPlatformSettings.featureCourseEnrollment,
      featureCourseCertificate: settings.featureCourseCertificate ?? defaultPlatformSettings.featureCourseCertificate,
      featureCourseProgress: settings.featureCourseProgress ?? defaultPlatformSettings.featureCourseProgress,
      featureCourseQuiz: settings.featureCourseQuiz ?? defaultPlatformSettings.featureCourseQuiz,
      
      // Supplier Features
      featureSupplierEnabled: settings.featureSupplierEnabled ?? defaultPlatformSettings.featureSupplierEnabled,
      featureSupplierCatalog: settings.featureSupplierCatalog ?? defaultPlatformSettings.featureSupplierCatalog,
      featureSupplierSampleRequest: settings.featureSupplierSampleRequest ?? defaultPlatformSettings.featureSupplierSampleRequest,
      featureSupplierDirectOrder: settings.featureSupplierDirectOrder ?? defaultPlatformSettings.featureSupplierDirectOrder,
      
      // Transaction Features
      featureCheckoutEnabled: settings.featureCheckoutEnabled ?? defaultPlatformSettings.featureCheckoutEnabled,
      featureCouponEnabled: settings.featureCouponEnabled ?? defaultPlatformSettings.featureCouponEnabled,
      featureFlashSaleEnabled: settings.featureFlashSaleEnabled ?? defaultPlatformSettings.featureFlashSaleEnabled,
      
      // Member Premium Features
      featureMemberPremiumClass: settings.featureMemberPremiumClass ?? defaultPlatformSettings.featureMemberPremiumClass,
      featureMemberPremiumGroup: settings.featureMemberPremiumGroup ?? defaultPlatformSettings.featureMemberPremiumGroup,
      featureMemberPremiumSupplier: settings.featureMemberPremiumSupplier ?? defaultPlatformSettings.featureMemberPremiumSupplier,
      featureMemberPremiumDownload: settings.featureMemberPremiumDownload ?? defaultPlatformSettings.featureMemberPremiumDownload,
      featureMemberPremiumCertificate: settings.featureMemberPremiumCertificate ?? defaultPlatformSettings.featureMemberPremiumCertificate,
      
      // Member Free Features
      featureMemberFreeClass: settings.featureMemberFreeClass ?? defaultPlatformSettings.featureMemberFreeClass,
      featureMemberFreeGroup: settings.featureMemberFreeGroup ?? defaultPlatformSettings.featureMemberFreeGroup,
      featureMemberFreeCatalog: settings.featureMemberFreeCatalog ?? defaultPlatformSettings.featureMemberFreeCatalog,
      
      // Mentor Features
      featureMentorCreateCourse: settings.featureMentorCreateCourse ?? defaultPlatformSettings.featureMentorCreateCourse,
      featureMentorCreateMaterial: settings.featureMentorCreateMaterial ?? defaultPlatformSettings.featureMentorCreateMaterial,
      featureMentorCreateGroup: settings.featureMentorCreateGroup ?? defaultPlatformSettings.featureMentorCreateGroup,
      featureMentorEditCourse: settings.featureMentorEditCourse ?? defaultPlatformSettings.featureMentorEditCourse,
      featureMentorAnalytics: settings.featureMentorAnalytics ?? defaultPlatformSettings.featureMentorAnalytics,
      featureMentorManageStudents: settings.featureMentorManageStudents ?? defaultPlatformSettings.featureMentorManageStudents,
      
      // Notification Channels
      notificationEmailEnabled: settings.notificationEmailEnabled ?? defaultPlatformSettings.notificationEmailEnabled,
      notificationWhatsappEnabled: settings.notificationWhatsappEnabled ?? defaultPlatformSettings.notificationWhatsappEnabled,
      notificationPushEnabled: settings.notificationPushEnabled ?? defaultPlatformSettings.notificationPushEnabled,
      notificationInAppEnabled: settings.notificationInAppEnabled ?? defaultPlatformSettings.notificationInAppEnabled,
    }

    return NextResponse.json({ success: true, settings: platformSettings })
  } catch (error) {
    console.error('Error fetching platform features:', error)
    // Return defaults on error
    return NextResponse.json({ 
      success: true, 
      settings: defaultPlatformSettings 
    })
  }
}
