import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.settings.findUnique({ where: { id: 1 } })
    
    if (!settings) {
      // Create default settings with platform features
      settings = await prisma.settings.create({
        data: {
          id: 1,
          ...defaultPlatformSettings
        }
      })
    }

    // Extract only platform-related settings
    const platformSettings = {
      // Global Features
      featureGroupEnabled: settings.featureGroupEnabled,
      featureFeedEnabled: settings.featureFeedEnabled,
      featureCommentEnabled: settings.featureCommentEnabled,
      featureLikeEnabled: settings.featureLikeEnabled,
      featureShareEnabled: settings.featureShareEnabled,
      featureChatEnabled: settings.featureChatEnabled,
      featureNotificationEnabled: settings.featureNotificationEnabled,
      
      // Affiliate Features
      featureAffiliateEnabled: settings.featureAffiliateEnabled,
      featureAffiliateShortLink: settings.featureAffiliateShortLink,
      featureAffiliateLeaderboard: settings.featureAffiliateLeaderboard,
      featureAffiliateChallenge: settings.featureAffiliateChallenge,
      featureAffiliateTraining: settings.featureAffiliateTraining,
      featureAffiliateReward: settings.featureAffiliateReward,
      featureAffiliateWithdraw: settings.featureAffiliateWithdraw,
      featureAffiliateStatistics: settings.featureAffiliateStatistics,
      featureAffiliateMarketingKit: settings.featureAffiliateMarketingKit,
      
      // Course Features
      featureCourseEnabled: settings.featureCourseEnabled,
      featureCourseEnrollment: settings.featureCourseEnrollment,
      featureCourseCertificate: settings.featureCourseCertificate,
      featureCourseProgress: settings.featureCourseProgress,
      featureCourseQuiz: settings.featureCourseQuiz,
      
      // Supplier Features
      featureSupplierEnabled: settings.featureSupplierEnabled,
      featureSupplierCatalog: settings.featureSupplierCatalog,
      featureSupplierSampleRequest: settings.featureSupplierSampleRequest,
      featureSupplierDirectOrder: settings.featureSupplierDirectOrder,
      
      // Transaction Features
      featureCheckoutEnabled: settings.featureCheckoutEnabled,
      featureCouponEnabled: settings.featureCouponEnabled,
      featureFlashSaleEnabled: settings.featureFlashSaleEnabled,
      
      // Member Premium Features
      featureMemberPremiumClass: settings.featureMemberPremiumClass,
      featureMemberPremiumGroup: settings.featureMemberPremiumGroup,
      featureMemberPremiumSupplier: settings.featureMemberPremiumSupplier,
      featureMemberPremiumDownload: settings.featureMemberPremiumDownload,
      featureMemberPremiumCertificate: settings.featureMemberPremiumCertificate,
      
      // Member Free Features
      featureMemberFreeClass: settings.featureMemberFreeClass,
      featureMemberFreeGroup: settings.featureMemberFreeGroup,
      featureMemberFreeCatalog: settings.featureMemberFreeCatalog,
      
      // Mentor Features
      featureMentorCreateCourse: settings.featureMentorCreateCourse,
      featureMentorCreateMaterial: settings.featureMentorCreateMaterial,
      featureMentorCreateGroup: settings.featureMentorCreateGroup,
      featureMentorEditCourse: settings.featureMentorEditCourse,
      featureMentorAnalytics: settings.featureMentorAnalytics,
      featureMentorManageStudents: settings.featureMentorManageStudents,
      
      // Notification Channels
      notificationEmailEnabled: settings.notificationEmailEnabled,
      notificationWhatsappEnabled: settings.notificationWhatsappEnabled,
      notificationPushEnabled: settings.notificationPushEnabled,
      notificationInAppEnabled: settings.notificationInAppEnabled,
    }

    return NextResponse.json({ success: true, settings: platformSettings })
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input - only allow boolean values for feature flags
    const allowedFields = Object.keys(defaultPlatformSettings)
    const updateData: Record<string, boolean> = {}
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && typeof value === 'boolean') {
        updateData[key] = value
      }
    }

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...defaultPlatformSettings,
        ...updateData
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Pengaturan platform berhasil disimpan',
      settings: updateData 
    })
  } catch (error) {
    console.error('Error updating platform settings:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
