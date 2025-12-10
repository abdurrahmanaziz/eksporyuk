import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Get start of current week (Monday 00:00 WIB)
function getWeekStart() {
  const now = new Date()
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)
  
  const day = wibNow.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  
  const weekStart = new Date(wibNow)
  weekStart.setUTCDate(wibNow.getUTCDate() - diff)
  weekStart.setUTCHours(0, 0, 0, 0)
  
  return new Date(weekStart.getTime() - wibOffset)
}

// Get start of current month
function getMonthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.log('🔄 Affiliate leaderboard: Fetching fresh data from database...')

    const weekStart = getWeekStart()
    const monthStart = getMonthStart()
    const currentUserId = session.user.id

    // Get current user's affiliate profile
    const currentUserAffiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: currentUserId }
    })

    // Get weekly conversions - ALL affiliates for ranking
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

    // Get monthly conversions - ALL affiliates for ranking
    const allMonthlyConversions = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      where: {
        createdAt: { gte: monthStart }
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

    // Get user details for top 10 monthly affiliates
    const top10MonthlyIds = allMonthlyConversions.slice(0, 10).map(m => m.affiliateId)
    const monthlyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: { in: top10MonthlyIds }
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

    // Map data with proper typing
    type AffiliateWithUser = typeof weeklyAffiliates[0]
    const weeklyAffiliateMap = new Map<string, AffiliateWithUser>(
      weeklyAffiliates.map(a => [a.id, a])
    )
    const monthlyAffiliateMap = new Map<string, AffiliateWithUser>(
      monthlyAffiliates.map(a => [a.id, a])
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

    // Format monthly data (top 10)
    const monthly = allMonthlyConversions.slice(0, 10).map((conv, index) => {
      const aff = monthlyAffiliateMap.get(conv.affiliateId)
      return {
        rank: index + 1,
        userId: aff?.userId || '',
        name: aff?.user?.name || 'Unknown',
        avatar: aff?.user?.avatar || null,
        points: Number(conv._sum.commissionAmount || 0),
        conversions: conv._count.id
      }
    }).filter(m => m.userId)

    // Calculate current user's ranks
    let weeklyRank: number | undefined
    let monthlyRank: number | undefined
    
    if (currentUserAffiliate) {
      const userWeeklyIndex = allWeeklyConversions.findIndex(
        w => w.affiliateId === currentUserAffiliate.id
      )
      if (userWeeklyIndex >= 0) {
        weeklyRank = userWeeklyIndex + 1
      }

      const userMonthlyIndex = allMonthlyConversions.findIndex(
        m => m.affiliateId === currentUserAffiliate.id
      )
      if (userMonthlyIndex >= 0) {
        monthlyRank = userMonthlyIndex + 1
      }
    }

    // Count total affiliates
    const totalWeeklyAffiliates = allWeeklyConversions.length
    const totalMonthlyAffiliates = allMonthlyConversions.length

    const endTime = Date.now()
    console.log(`✅ Affiliate leaderboard fetched in ${endTime - startTime}ms`)
    console.log(`📊 Weekly: ${weekly.length}, Monthly: ${monthly.length}, User rank: W${weeklyRank || 'N/A'} M${monthlyRank || 'N/A'}`)

    return NextResponse.json(
      {
        allTime: [], // Not shown to affiliates
        weekly,
        monthly,
        currentUserRank: {
          weekly: weeklyRank,
          monthly: monthlyRank
        },
        totalAffiliates: {
          weekly: totalWeeklyAffiliates,
          monthly: totalMonthlyAffiliates
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
