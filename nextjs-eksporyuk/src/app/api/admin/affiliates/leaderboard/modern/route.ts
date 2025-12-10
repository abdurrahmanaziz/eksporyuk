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
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const weekStart = getWeekStart()
    const monthStart = getMonthStart()

    // Get all time leaderboard - REALTIME from AffiliateProfile
    const allTimeAffiliates = await prisma.affiliateProfile.findMany({
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
      },
      take: 10
    })

    // Get weekly conversions
    const weeklyConversions = await prisma.affiliateConversion.groupBy({
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
      },
      take: 10
    })

    // Get monthly conversions
    const monthlyConversions = await prisma.affiliateConversion.groupBy({
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
      },
      take: 10
    })

    // Get user details for weekly affiliates
    const weeklyAffiliateIds = weeklyConversions.map(w => w.affiliateId)
    const weeklyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: { in: weeklyAffiliateIds }
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

    // Get user details for monthly affiliates
    const monthlyAffiliateIds = monthlyConversions.map(m => m.affiliateId)
    const monthlyAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        id: { in: monthlyAffiliateIds }
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

    // Format all time data
    const allTime = allTimeAffiliates.map((aff, index) => ({
      rank: index + 1,
      userId: aff.userId,
      name: aff.user?.name || 'Unknown',
      avatar: aff.user?.avatar,
      points: Number(aff.totalEarnings),
      conversions: aff.totalConversions
    }))

    // Format weekly data
    const weekly = weeklyConversions.map((conv, index) => {
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

    // Format monthly data
    const monthly = monthlyConversions.map((conv, index) => {
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

    return NextResponse.json({
      allTime,
      weekly,
      monthly
    })

  } catch (error) {
    console.error('Error fetching modern leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
