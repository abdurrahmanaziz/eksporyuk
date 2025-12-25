import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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

    // Fetch all affiliate profiles (no relations in schema, use manual lookup)
    const allAffiliates = await prisma.affiliateProfile.findMany({
      orderBy: {
        totalEarnings: 'desc',
      },
    })
    
    // Get all user IDs and fetch users separately
    const userIds = allAffiliates.map(a => a.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // All Time Leaderboard - Top 10 by total earnings
    const allTime = allAffiliates.slice(0, 10).map((aff, index) => {
      const user = userMap.get(aff.userId)
      return {
        rank: index + 1,
        oduserId: aff.userId,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '',
        totalEarnings: Number(aff.totalEarnings),
      }
    })

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

    // Get affiliate details for monthly leaderboard (manual lookup)
    const monthlyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: {
          in: monthlyAffiliateIds,
        },
      },
    })
    
    // Get users for monthly affiliates
    const monthlyUserIds = monthlyAffiliates.map(a => a.userId)
    const monthlyUsers = await prisma.user.findMany({
      where: { id: { in: monthlyUserIds } },
      select: { id: true, name: true, avatar: true }
    })
    const monthlyUserMap = new Map(monthlyUsers.map(u => [u.id, u]))

    const thisMonth = monthlyAffiliateIds.map((affId, index) => {
      const affiliate = monthlyAffiliates.find(a => a.id === affId)
      const user = affiliate ? monthlyUserMap.get(affiliate.userId) : null
      return {
        rank: index + 1,
        oduserId: affiliate?.userId || '',
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '',
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

    // Get affiliate details for weekly leaderboard (manual lookup)
    const weeklyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: {
          in: weeklyAffiliateIds,
        },
      },
    })
    
    // Get users for weekly affiliates
    const weeklyUserIds = weeklyAffiliates.map(a => a.userId)
    const weeklyUsers = await prisma.user.findMany({
      where: { id: { in: weeklyUserIds } },
      select: { id: true, name: true, avatar: true }
    })
    const weeklyUserMap = new Map(weeklyUsers.map(u => [u.id, u]))

    const thisWeek = weeklyAffiliateIds.map((affId, index) => {
      const affiliate = weeklyAffiliates.find(a => a.id === affId)
      const user = affiliate ? weeklyUserMap.get(affiliate.userId) : null
      return {
        rank: index + 1,
        userId: affiliate?.userId || '',
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '',
        totalEarnings: weeklyEarningsMap.get(affId) || 0,
      }
    })

    // Get current user rank in all categories
    let currentUserRank = null
    if (session?.user?.id) {
      const userAffiliate = allAffiliates.find(a => a.userId === session.user.id)
      if (userAffiliate) {
        const allTimeRank = allAffiliates.findIndex(a => a.userId === session.user.id) + 1
        const user = userMap.get(session.user.id)
        
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
          name: user?.name || 'Unknown',
          avatar: user?.avatar || '',
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
