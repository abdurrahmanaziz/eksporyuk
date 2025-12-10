import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Get start of current week (Monday 00:00 WIB)
function getWeekStart() {
  const now = new Date()
  // Adjust for WIB (UTC+7)
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)
  
  const day = wibNow.getUTCDay()
  const diff = day === 0 ? 6 : day - 1 // Adjust to Monday
  
  const weekStart = new Date(wibNow)
  weekStart.setUTCDate(wibNow.getUTCDate() - diff)
  weekStart.setUTCHours(0, 0, 0, 0)
  
  // Convert back to UTC
  return new Date(weekStart.getTime() - wibOffset)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weekStart = getWeekStart()
    const currentUserId = session.user.id

    // Get current user's affiliate profile
    const currentUserAffiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: currentUserId }
    })

    // Get weekly earnings from conversions - ALL affiliates for ranking
    const allWeeklyConversions = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      where: {
        createdAt: { gte: weekStart }
      },
      _sum: {
        commissionAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          commissionAmount: 'desc'
        }
      }
    })

    // Get user details for top 10 weekly affiliates
    const top10WeeklyIds = allWeeklyConversions.slice(0, 10).map(w => w.affiliateId)
    const weeklyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: { in: top10WeeklyIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Map weekly data with proper typing
    type AffiliateWithUser = typeof weeklyAffiliates[0]
    const weeklyAffiliateMap = new Map<string, AffiliateWithUser>(
      weeklyAffiliates.map(a => [a.id, a])
    )

    // Format weekly data (top 10)
    const weekly = allWeeklyConversions.slice(0, 10).map((conv, index) => {
      const aff = weeklyAffiliateMap.get(conv.affiliateId)
      return {
        rank: index + 1,
        userId: aff?.userId || '',
        name: aff?.user?.name || 'Unknown',
        avatar: aff?.user?.avatar || null,
        points: Number(conv._sum.commissionAmount || 0),
        conversions: conv._count.id
      }
    }).filter(w => w.userId)

    // Calculate current user's weekly rank
    let weeklyRank: number | undefined
    if (currentUserAffiliate) {
      const userWeeklyIndex = allWeeklyConversions.findIndex(
        w => w.affiliateId === currentUserAffiliate.id
      )
      if (userWeeklyIndex >= 0) {
        weeklyRank = userWeeklyIndex + 1
      }
    }

    // Count total affiliates with weekly earnings
    const totalWeeklyAffiliates = allWeeklyConversions.length

    return NextResponse.json({
      allTime: [], // Not shown to affiliates
      weekly,
      currentUserRank: {
        weekly: weeklyRank
      },
      totalAffiliates: totalWeeklyAffiliates
    })

  } catch (error) {
    console.error('Error fetching affiliate leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
