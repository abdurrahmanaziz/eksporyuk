import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Get ALL affiliates ordered by totalEarnings (same as /admin/affiliates)
    const allAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        totalEarnings: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        totalEarnings: 'desc'
      }
    })

    // Find current user's rank
    const currentUserAffiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: currentUserId }
    })

    let currentUserRank = undefined
    if (currentUserAffiliate) {
      const userIndex = allAffiliates.findIndex(a => a.id === currentUserAffiliate.id)
      if (userIndex >= 0) {
        currentUserRank = userIndex + 1
      }
    }

    // Format top 10 data
    const leaderboardData = allAffiliates.slice(0, 10).map((aff, index) => ({
      rank: index + 1,
      userId: aff.userId,
      affiliateId: aff.id,
      name: aff.user?.name || 'Unknown',
      avatar: aff.user?.avatar,
      points: Number(aff.totalEarnings),
      conversions: aff.totalConversions
    }))

    // Return SAME data for all tabs
    return NextResponse.json(
      {
        allTime: [],
        weekly: leaderboardData,
        monthly: leaderboardData,
        currentUserRank: {
          weekly: currentUserRank,
          monthly: currentUserRank,
          allTime: currentUserRank
        },
        totalAffiliates: {
          weekly: allAffiliates.length,
          monthly: allAffiliates.length
        },
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error) {
    console.error('Error fetching affiliate leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
