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

    const startTime = Date.now()
    console.log('🔄 Fetching affiliate leaderboard with REAL period-based data...')

    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)

    // Function to aggregate conversions by period
    async function getLeaderboardForPeriod(startDate?: Date) {
      const whereClause: any = {
        transaction: { status: 'SUCCESS' }
      }
      
      if (startDate) {
        whereClause.createdAt = { gte: startDate }
      }
      
      const conversions = await prisma.affiliateConversion.findMany({
        where: whereClause,
        select: {
          affiliateId: true,
          commissionAmount: true,
          affiliate: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      })
      
      // Aggregate by affiliate
      const aggregateMap = new Map<string, {
        affiliateId: string
        userId: string
        name: string
        avatar: string | null
        totalCommission: number
        conversions: number
      }>()
      
      for (const conv of conversions) {
        if (!conv.affiliate) continue
        
        const existing = aggregateMap.get(conv.affiliateId)
        const commission = Number(conv.commissionAmount)
        
        if (existing) {
          existing.totalCommission += commission
          existing.conversions += 1
        } else {
          aggregateMap.set(conv.affiliateId, {
            affiliateId: conv.affiliateId,
            userId: conv.affiliate.userId,
            name: conv.affiliate.user?.name || 'Unknown',
            avatar: conv.affiliate.user?.avatar || null,
            totalCommission: commission,
            conversions: 1
          })
        }
      }
      
      // Sort and format - top 10
      const sorted = Array.from(aggregateMap.values())
        .sort((a, b) => b.totalCommission - a.totalCommission)
      
      const leaderboard = sorted
        .slice(0, 10)
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          affiliateId: entry.affiliateId,
          name: entry.name,
          avatar: entry.avatar,
          points: entry.totalCommission,
          conversions: entry.conversions
        }))
      
      // Find current user rank
      let currentUserRank: number | undefined
      if (session?.user?.id) {
        const userIndex = sorted.findIndex(e => e.userId === session.user.id)
        if (userIndex !== -1) {
          currentUserRank = userIndex + 1
        }
      }
      
      return { leaderboard, currentUserRank }
    }

    // Fetch all three periods in parallel
    const [allTimeData, weeklyData, monthlyData] = await Promise.all([
      getLeaderboardForPeriod(), // No date filter = all time
      getLeaderboardForPeriod(weekAgo),
      getLeaderboardForPeriod(monthAgo)
    ])

    const endTime = Date.now()
    console.log(`✅ Fetched in ${endTime - startTime}ms`)
    console.log(`📊 All-Time Top: ${allTimeData.leaderboard[0]?.name} - Rp ${allTimeData.leaderboard[0]?.points.toLocaleString('id-ID')}`)
    console.log(`📊 Weekly Top: ${weeklyData.leaderboard[0]?.name} - Rp ${weeklyData.leaderboard[0]?.points.toLocaleString('id-ID')}`)

    // Return REAL period-based data with current user ranks
    return NextResponse.json(
      {
        allTime: allTimeData.leaderboard,
        weekly: weeklyData.leaderboard,
        monthly: monthlyData.leaderboard,
        currentUserRank: {
          allTime: allTimeData.currentUserRank,
          weekly: weeklyData.currentUserRank,
          monthly: monthlyData.currentUserRank
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
