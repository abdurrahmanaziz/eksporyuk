import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user first (no relations - schema doesn't have them)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get affiliate profile separately (manual lookup)
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id },
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
    });

    // Check if user is affiliate (has profile or has AFFILIATE role)
    const isAffiliate = user.role === 'AFFILIATE' || !!affiliateProfile;
    
    // Get application status from profile
    const applicationStatus = affiliateProfile?.applicationStatus || null;

    // Determine if affiliate menu should be enabled
    // Show menu if: has AFFILIATE role OR has affiliate profile with APPROVED status
    const affiliateMenuEnabled = user.role === 'AFFILIATE' || 
      (affiliateProfile && affiliateProfile.applicationStatus === 'APPROVED');

    return NextResponse.json({
      isAffiliate,
      applicationStatus,
      affiliateMenuEnabled,
      hasAffiliateProfile: !!affiliateProfile,
      affiliateProfile: affiliateProfile ? {
        id: affiliateProfile.id,
        affiliateCode: affiliateProfile.affiliateCode,
        tier: affiliateProfile.tier,
        status: affiliateProfile.applicationStatus,
        stats: {
          commissionBalance: affiliateProfile.totalEarnings,
          totalEarnings: affiliateProfile.totalEarnings,
          clickCount: affiliateProfile.totalClicks,
          conversionCount: affiliateProfile.totalConversions,
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
