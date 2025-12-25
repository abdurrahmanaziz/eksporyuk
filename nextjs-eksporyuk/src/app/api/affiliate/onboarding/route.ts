import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/onboarding
 * 
 * Get onboarding progress for current affiliate
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get affiliate profile with related data
    // @ts-ignore - new fields may not be in cached types
    const affiliate: any = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            email: true,
            emailVerified: true,
            whatsapp: true,
            phone: true,
            profileCompleted: true,
          }
        },
        links: {
          take: 1,
        },
        conversions: {
          take: 1,
        },
      }
    })

    if (!affiliate) {
      // User doesn't have affiliate profile yet - return empty state
      return NextResponse.json({
        success: true,
        data: {
          needsWelcome: false,
          isProfileComplete: false,
          hasAffiliateCode: false,
          hasShortLink: false,
          hasConversion: false,
          hasBankInfo: false,
          isEmailVerified: !!session.user.emailVerified,
          applicationStatus: null,
          completedSteps: 0,
          totalSteps: 6,
          completionPercentage: 0,
        }
      })
    }

    // Check bank info from wallet/payout records (where we store bank data)
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    let hasBankInfo = false
    if (wallet) {
      const bankPayout = await prisma.payout.findFirst({
        where: {
          walletId: wallet.id,
          bankName: { not: null },
          accountName: { not: null },
          accountNumber: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      })
      hasBankInfo = !!bankPayout
    }

    // Check if needs to see welcome page (approved but not shown yet)
    const needsWelcome = affiliate.applicationStatus === 'APPROVED' && !affiliate.welcomeShown

    // Email verification check
    const emailVerified = !!affiliate.user?.emailVerified

    // Calculate completion status
    const profileCompleted = affiliate.user?.profileCompleted || affiliate.profileCompleted || (
      !!affiliate.user?.name && 
      (!!affiliate.user?.phone || !!affiliate.user?.whatsapp)
    )

    const trainingCompleted = affiliate.trainingCompleted || false
    const firstLinkCreated = affiliate.firstLinkCreated || (affiliate.links?.length || 0) > 0
    const bankInfoCompleted = hasBankInfo || !!(
      affiliate.bankName && 
      affiliate.bankAccountName && 
      affiliate.bankAccountNumber
    )
    const hasFirstConversion = (affiliate.conversions?.length || 0) > 0

    // Calculate total progress (each step is 20%)
    const completedSteps = [
      profileCompleted,
      trainingCompleted,
      firstLinkCreated,
      bankInfoCompleted,
      hasFirstConversion,
    ].filter(Boolean).length

    const totalProgress = Math.round((completedSteps / 5) * 100)

    // Check if onboarding is completed (all steps done)
    const onboardingCompleted = affiliate.onboardingCompleted || (
      profileCompleted && 
      trainingCompleted && 
      firstLinkCreated && 
      bankInfoCompleted && 
      hasFirstConversion
    )

    // Update profile if onboarding is newly completed
    if (onboardingCompleted && !affiliate.onboardingCompleted) {
      // @ts-ignore - new fields may not be in cached types
      await (prisma.affiliateProfile.update as any)({
        where: { id: affiliate.id },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        }
      })
    }

    // Auto-update firstLinkCreated if links exist
    if (firstLinkCreated && !affiliate.firstLinkCreated) {
      // @ts-ignore - new fields may not be in cached types
      await (prisma.affiliateProfile.update as any)({
        where: { id: affiliate.id },
        data: {
          firstLinkCreated: true,
          firstLinkCreatedAt: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        needsWelcome,
        onboardingCompleted,
        emailVerified,
        profileCompleted,
        trainingCompleted,
        firstLinkCreated,
        bankInfoCompleted,
        hasFirstConversion,
        totalProgress,
        // Additional data for detailed progress
        details: {
          hasName: !!affiliate.user?.name,
          hasImage: !!affiliate.user?.avatar,
          hasWhatsapp: !!(affiliate.whatsapp || affiliate.user?.whatsapp),
          hasBank: !!affiliate.bankName,
          linksCount: affiliate.links?.length || 0,
          conversionsCount: affiliate.conversions?.length || 0,
          email: affiliate.user?.email,
        }
      }
    })

  } catch (error) {
    console.error('[API Error] /api/affiliate/onboarding GET:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/affiliate/onboarding
 * 
 * Update onboarding step completion
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { step, completed, markWelcomeShown } = body

    // Handle mark welcome as shown
    if (markWelcomeShown) {
      // @ts-ignore - new fields may not be in cached types
      await (prisma.affiliateProfile.update as any)({
        where: { userId: session.user.id },
        data: { welcomeShown: true }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Welcome marked as shown',
      })
    }

    if (!step || typeof completed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Affiliate profile not found' },
        { status: 404 }
      )
    }

    // Update specific step
    const updateData: Record<string, boolean | Date | null> = {}

    switch (step) {
      case 'profile':
        updateData.profileCompleted = completed
        if (completed) updateData.profileCompletedAt = new Date()
        break
      case 'training':
        updateData.trainingCompleted = completed
        if (completed) updateData.trainingCompletedAt = new Date()
        break
      case 'link':
        updateData.firstLinkCreated = completed
        if (completed) updateData.firstLinkCreatedAt = new Date()
        break
      case 'welcome':
        updateData.welcomeShown = completed
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid step' },
          { status: 400 }
        )
    }

    // @ts-ignore - new fields may not be in cached types
    await (prisma.affiliateProfile.update as any)({
      where: { id: affiliate.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: `Step '${step}' updated successfully`,
    })

  } catch (error) {
    console.error('[API Error] /api/affiliate/onboarding POST:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
