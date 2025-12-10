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
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const weekStart = getWeekStart()

    // Get all time leaderboard - top 10
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

    // Get weekly earnings from conversions
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

    // Map weekly data with proper typing
    type AffiliateWithUser = typeof weeklyAffiliates[0]
    const weeklyAffiliateMap = new Map<string, AffiliateWithUser>(
      weeklyAffiliates.map(a => [a.id, a])
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

    return NextResponse.json({
      allTime,
      weekly
    })

  } catch (error) {
    console.error('Error fetching modern leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
