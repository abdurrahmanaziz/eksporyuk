import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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
    
    // Current week (Monday to today)
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    
    // Current month (1st of current month to today)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    // Function to aggregate conversions by period (no relations, use manual lookup)
    async function getLeaderboardForPeriod(startDate?: Date) {
      const whereClause: any = {}
      
      if (startDate) {
        whereClause.createdAt = { gte: startDate }
      }
      
      // Get conversions without relations
      const conversions = await prisma.affiliateConversion.findMany({
        where: whereClause
      })
      
      // Get transaction IDs and check which are SUCCESS
      const txIds = conversions.map(c => c.transactionId).filter(Boolean)
      const successTx = await prisma.transaction.findMany({
        where: {
          id: { in: txIds },
          status: 'SUCCESS'
        },
        select: { id: true }
      })
      const successTxIds = new Set(successTx.map(t => t.id))
      
      // Filter conversions to only those with SUCCESS transactions
      const validConversions = conversions.filter(c => successTxIds.has(c.transactionId))
      
      // NOTE: In migration data, affiliateId = userId (not affiliateProfile.id)
      // Get users directly using affiliateId as userId
      const affiliateUserIds = [...new Set(validConversions.map(c => c.affiliateId))]
      const users = await prisma.user.findMany({
        where: { id: { in: affiliateUserIds } },
        select: { id: true, name: true, avatar: true }
      })
      const userMap = new Map(users.map(u => [u.id, u]))
      
      // Get affiliate profiles by userId
      const affiliates = await prisma.affiliateProfile.findMany({
        where: { userId: { in: affiliateUserIds } }
      })
      const affMapByUserId = new Map(affiliates.map(a => [a.userId, a]))
      
      // Aggregate by affiliateId (which is userId in migration data)
      const aggregateMap = new Map<string, {
        affiliateId: string
        userId: string
        name: string
        avatar: string | null
        totalCommission: number
        conversions: number
      }>()
      
      for (const conv of validConversions) {
        // In migration data, affiliateId = userId
        const userId = conv.affiliateId
        const user = userMap.get(userId)
        if (!user) continue
        
        const affiliate = affMapByUserId.get(userId)
        const existing = aggregateMap.get(userId)
        const commission = Number(conv.commissionAmount)
        
        if (existing) {
          existing.totalCommission += commission
          existing.conversions += 1
        } else {
          aggregateMap.set(userId, {
            affiliateId: affiliate?.id || userId,
            userId: userId,
            name: user?.name || 'Unknown',
            avatar: user?.avatar || null,
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
      getLeaderboardForPeriod(weekStart),
      getLeaderboardForPeriod(monthStart)
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
