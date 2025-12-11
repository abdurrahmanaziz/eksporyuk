import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/leaderboard/simple - Get simple leaderboard data (All Time, Monthly, Weekly)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const now = new Date()
    
    // Get current month name in Indonesian
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const currentMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    
    // Calculate date ranges
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)

    // Fetch all affiliate profiles with user data for All Time
    const allAffiliates = await prisma.affiliateProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        totalEarnings: 'desc',
      },
    })

    // All Time Leaderboard - Top 10 by total earnings
    const allTime = allAffiliates.slice(0, 10).map((aff, index) => ({
      rank: index + 1,
      oduserId: aff.userId,
      name: aff.user?.name || 'Unknown',
      avatar: aff.user?.avatar || '',
      totalEarnings: Number(aff.totalEarnings),
    }))

    // For period-specific leaderboards, we need to aggregate from conversions
    // This Month - Get earnings from conversions this month
    const monthlyConversions = await prisma.affiliateConversion.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        affiliateId: true,
        commissionAmount: true,
      },
    })

    // Aggregate monthly earnings by affiliate
    const monthlyEarningsMap = new Map<string, number>()
    monthlyConversions.forEach(conv => {
      const current = monthlyEarningsMap.get(conv.affiliateId) || 0
      monthlyEarningsMap.set(conv.affiliateId, current + Number(conv.commissionAmount))
    })

    // Sort and get top 10 for monthly
    const monthlyAffiliateIds = Array.from(monthlyEarningsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    // Get affiliate details for monthly leaderboard
    const monthlyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: {
          in: monthlyAffiliateIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    const thisMonth = monthlyAffiliateIds.map((affId, index) => {
      const affiliate = monthlyAffiliates.find(a => a.id === affId)
      return {
        rank: index + 1,
        oduserId: affiliate?.userId || '',
        name: affiliate?.user?.name || 'Unknown',
        avatar: affiliate?.user?.avatar || '',
        totalEarnings: monthlyEarningsMap.get(affId) || 0,
      }
    })

    // This Week - Get earnings from conversions this week
    const weeklyConversions = await prisma.affiliateConversion.findMany({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
      select: {
        affiliateId: true,
        commissionAmount: true,
      },
    })

    // Aggregate weekly earnings by affiliate
    const weeklyEarningsMap = new Map<string, number>()
    weeklyConversions.forEach(conv => {
      const current = weeklyEarningsMap.get(conv.affiliateId) || 0
      weeklyEarningsMap.set(conv.affiliateId, current + Number(conv.commissionAmount))
    })

    // Sort and get top 10 for weekly
    const weeklyAffiliateIds = Array.from(weeklyEarningsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    // Get affiliate details for weekly leaderboard
    const weeklyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: {
          in: weeklyAffiliateIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    const thisWeek = weeklyAffiliateIds.map((affId, index) => {
      const affiliate = weeklyAffiliates.find(a => a.id === affId)
      return {
        rank: index + 1,
        userId: affiliate?.userId || '',
        name: affiliate?.user?.name || 'Unknown',
        avatar: affiliate?.user?.avatar || '',
        totalEarnings: weeklyEarningsMap.get(affId) || 0,
      }
    })

    // Get current user rank in all categories
    let currentUserRank = null
    if (session?.user?.id) {
      const userAffiliate = allAffiliates.find(a => a.userId === session.user.id)
      if (userAffiliate) {
        const allTimeRank = allAffiliates.findIndex(a => a.userId === session.user.id) + 1
        
        // Monthly rank
        const monthlyRankData = Array.from(monthlyEarningsMap.entries())
          .sort((a, b) => b[1] - a[1])
        const monthlyRank = monthlyRankData.findIndex(([id]) => {
          const aff = monthlyAffiliates.find(a => a.id === id)
          return aff?.userId === session.user.id
        }) + 1 || 0
        
        // Weekly rank
        const weeklyRankData = Array.from(weeklyEarningsMap.entries())
          .sort((a, b) => b[1] - a[1])
        const weeklyRank = weeklyRankData.findIndex(([id]) => {
          const aff = weeklyAffiliates.find(a => a.id === id)
          return aff?.userId === session.user.id
        }) + 1 || 0

        currentUserRank = {
          allTime: allTimeRank,
          monthly: monthlyRank,
          weekly: weeklyRank,
          name: userAffiliate.user?.name || 'Unknown',
          avatar: userAffiliate.user?.avatar || '',
          totalEarnings: Number(userAffiliate.totalEarnings),
        }
      }
    }

    return NextResponse.json({
      success: true,
      allTime,
      thisMonth,
      thisWeek,
      currentMonth,
      currentUserRank,
    })

  } catch (error) {
    console.error('Error fetching simple leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
