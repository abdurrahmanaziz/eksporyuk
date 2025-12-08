import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with affiliate profile - use explicit select to avoid type issues
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        affiliateProfile: {
          select: {
            id: true,
            affiliateCode: true,
            tier: true,
            applicationStatus: true,
            totalEarnings: true,
            totalClicks: true,
            totalConversions: true,
            welcomeShown: true,
            onboardingCompleted: true,
            trainingCompleted: true,
            firstLinkCreated: true,
            profileCompleted: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is affiliate (has profile or has AFFILIATE role)
    const isAffiliate = user.role === 'AFFILIATE' || !!user.affiliateProfile;
    
    // Get application status from profile
    const affiliateProfile = user.affiliateProfile;
    const applicationStatus = affiliateProfile?.applicationStatus || null;

    // Determine if affiliate menu should be enabled
    // Show menu if: has AFFILIATE role OR has affiliate profile with APPROVED status
    const affiliateMenuEnabled = user.role === 'AFFILIATE' || 
      (affiliateProfile && affiliateProfile.applicationStatus === 'APPROVED');

    return NextResponse.json({
      isAffiliate,
      applicationStatus,
      affiliateMenuEnabled,
      affiliateProfile: affiliateProfile ? {
        id: affiliateProfile.id,
        affiliateCode: affiliateProfile.affiliateCode,
        tier: affiliateProfile.tier,
        status: affiliateProfile.applicationStatus,
        rejectionReason: affiliateProfile.rejectionReason,
        stats: {
          commissionBalance: affiliateProfile.commissionBalance,
          totalEarnings: affiliateProfile.totalEarnings,
          clickCount: affiliateProfile.clickCount,
          conversionCount: affiliateProfile.conversionCount,
        },
        onboarding: {
          welcomeShown: affiliateProfile.welcomeShown,
          onboardingCompleted: affiliateProfile.onboardingCompleted,
          trainingCompleted: affiliateProfile.trainingCompleted,
          firstLinkCreated: affiliateProfile.firstLinkCreated,
          profileCompleted: affiliateProfile.profileCompleted,
        }
      } : null,
    });
  } catch (error) {
    console.error('Error fetching affiliate status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate status' },
      { status: 500 }
    );
  }
}
