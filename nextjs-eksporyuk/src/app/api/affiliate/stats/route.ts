import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create affiliate profile
    let affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json(
        {
          totalEarnings: 0,
          totalClicks: 0,
          totalConversions: 0,
          conversionRate: 0,
          pendingEarnings: 0,
          availableBalance: 0,
        },
        { status: 200 }
      )
    }

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    // Get pending conversions
    const pendingConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        paidOut: false,
      },
    })

    const pendingEarnings = pendingConversions.reduce(
      (sum, conv) => sum + Number(conv.commissionAmount),
      0
    )

    const conversionRate =
      affiliateProfile.totalClicks > 0
        ? (affiliateProfile.totalConversions / affiliateProfile.totalClicks) * 100
        : 0

    return NextResponse.json({
      totalEarnings: Number(affiliateProfile.totalEarnings),
      totalClicks: affiliateProfile.totalClicks,
      totalConversions: affiliateProfile.totalConversions,
      conversionRate,
      pendingEarnings,
      availableBalance: Number(wallet?.balance || 0),
    })
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
