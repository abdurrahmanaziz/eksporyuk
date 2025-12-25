import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { PrismaClient } from '@prisma/client'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Fetch all affiliate profiles (no relations, use manual lookup)
    const rawAffiliates = await prisma.affiliateProfile.findMany({
      orderBy: {
        totalEarnings: 'desc',
      },
    })
    
    // Get users for affiliates manually
    const userIds = rawAffiliates.map(a => a.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Combine affiliates with user data
    const allAffiliates = rawAffiliates.map(aff => ({
      ...aff,
      user: userMap.get(aff.userId) || null
    }))

    // All Time Leaderboard - Top 10 by total earnings
    const allTime = allAffiliates.slice(0, 10).map((aff, index) => ({
      rank: index + 1,
      userId: aff.userId,
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

    // Aggregate monthly earnings by affiliate (affiliateId = userId in migration data)
    const monthlyEarningsMap = new Map<string, number>()
    monthlyConversions.forEach(conv => {
      // conv.affiliateId is actually the userId in migration data
      const current = monthlyEarningsMap.get(conv.affiliateId) || 0
      monthlyEarningsMap.set(conv.affiliateId, current + Number(conv.commissionAmount))
    })

    // Sort and get top 10 for monthly (by userId)
    const monthlyUserIds = Array.from(monthlyEarningsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    // Get user details for monthly leaderboard (affiliateId = userId)
    const monthlyUsers = await prisma.user.findMany({
      where: {
        id: {
          in: monthlyUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      }
    })
    const monthlyUserMap = new Map(monthlyUsers.map(u => [u.id, u]))

    const thisMonth = monthlyUserIds.map((userId, index) => {
      const user = monthlyUserMap.get(userId)
      return {
        rank: index + 1,
        userId: userId,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '',
        totalEarnings: monthlyEarningsMap.get(userId) || 0,
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

    // Aggregate weekly earnings by affiliate (affiliateId = userId in migration data)
    const weeklyEarningsMap = new Map<string, number>()
    weeklyConversions.forEach(conv => {
      const current = weeklyEarningsMap.get(conv.affiliateId) || 0
      weeklyEarningsMap.set(conv.affiliateId, current + Number(conv.commissionAmount))
    })

    // Sort and get top 10 for weekly (by userId)
    const weeklyUserIds = Array.from(weeklyEarningsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    // Get user details for weekly leaderboard (affiliateId = userId)
    const weeklyUsers = await prisma.user.findMany({
      where: {
        id: {
          in: weeklyUserIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      }
    })
    const weeklyUserMap = new Map(weeklyUsers.map(u => [u.id, u]))

    const thisWeek = weeklyUserIds.map((userId, index) => {
      const user = weeklyUserMap.get(userId)
      return {
        rank: index + 1,
        userId: userId,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '',
        totalEarnings: weeklyEarningsMap.get(userId) || 0,
      }
    })

    return NextResponse.json({
      allTime,
      thisMonth,
      thisWeek,
      currentMonth,
      currentWeek: 'Minggu Ini',
    })

  } catch (error) {
    console.error('Error fetching simple leaderboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
