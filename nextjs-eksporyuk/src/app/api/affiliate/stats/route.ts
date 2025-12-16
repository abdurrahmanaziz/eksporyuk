import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Get wallet balance (source of truth for realtime earnings)
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    // Calculate actual total earnings from all conversions (realtime data)
    const totalConversionsData = await prisma.affiliateConversion.aggregate({
      where: {
        affiliateId: affiliateProfile.id,
      },
      _sum: { commissionAmount: true },
      _count: true,
    })

    // Get pending conversions (not yet paid out)
    const pendingConversionsData = await prisma.affiliateConversion.aggregate({
      where: {
        affiliateId: affiliateProfile.id,
        paidOut: false,
      },
      _sum: { commissionAmount: true },
    })

    // Get actual clicks from AffiliateClick table (realtime)
    const actualClicks = await prisma.affiliateClick.count({
      where: {
        affiliateId: affiliateProfile.id,
      },
    })

    // Use wallet.totalEarnings as primary source (updated by commission-helper)
    // Fallback to sum of conversions if wallet doesn't exist
    const totalEarnings = Number(wallet?.totalEarnings || 0) || 
                         Number(totalConversionsData._sum.commissionAmount || 0)
    
    const totalClicks = actualClicks || affiliateProfile.totalClicks
    const totalConversions = totalConversionsData._count || affiliateProfile.totalConversions
    const pendingEarnings = Number(pendingConversionsData._sum.commissionAmount || 0)

    const conversionRate = totalClicks > 0
      ? (totalConversions / totalClicks) * 100
      : 0

    return NextResponse.json({
      totalEarnings,
      totalClicks,
      totalConversions,
      conversionRate,
      pendingEarnings,
      availableBalance: Number(wallet?.balance || 0),
    })
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
