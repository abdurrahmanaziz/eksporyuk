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
    
    // Allow both ADMIN and AFFILIATE roles
    const isAdmin = session.user.role === 'ADMIN'
    const isAffiliate = session.user.role === 'AFFILIATE'
    
    if (!isAdmin && !isAffiliate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // For AFFILIATE users, only show their own data
    const currentUserId = isAffiliate ? session.user.id : null

    const startTime = Date.now()
    console.log('🔄 Fetching leaderboard with REAL period-based data...')

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
      
      // For AFFILIATE role users, only fetch their conversions
      if (isAffiliate && currentUserId) {
        whereClause.affiliateId = currentUserId
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
      const affiliateUserIds = [...new Set(validConversions.map(c => c.affiliateId))]
      const users = await prisma.user.findMany({
        where: { id: { in: affiliateUserIds } },
        select: { id: true, name: true, avatar: true }
      })
      const userMap = new Map(users.map(u => [u.id, u]))
      
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
        const userId = conv.affiliateId
        const user = userMap.get(userId)
        if (!user) continue
        
        const existing = aggregateMap.get(userId)
        const commission = Number(conv.commissionAmount)
        
        if (existing) {
          existing.totalCommission += commission
          existing.conversions += 1
        } else {
          aggregateMap.set(userId, {
            affiliateId: userId,
            userId: userId,
            name: user?.name || 'Unknown',
            avatar: user?.avatar || null,
            totalCommission: commission,
            conversions: 1
          })
        }
      }
      
      // Sort and format
      return Array.from(aggregateMap.values())
        .sort((a, b) => b.totalCommission - a.totalCommission)
        .slice(0, isAffiliate ? 1 : 10) // AFFILIATE users only see themselves
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          affiliateId: entry.affiliateId,
          name: entry.name,
          avatar: entry.avatar,
          points: entry.totalCommission,
          conversions: entry.conversions
        }))
    }

    // Fetch all three periods in parallel
    const [allTime, weekly, monthly] = await Promise.all([
      getLeaderboardForPeriod(), // No date filter = all time
      getLeaderboardForPeriod(weekStart),
      getLeaderboardForPeriod(monthStart)
    ])

    const endTime = Date.now()
    console.log(`✅ Fetched in ${endTime - startTime}ms`)
    console.log(`📊 All-Time Top: ${allTime[0]?.name} - Rp ${allTime[0]?.points.toLocaleString('id-ID')}`)
    console.log(`📊 Weekly Top: ${weekly[0]?.name} - Rp ${weekly[0]?.points.toLocaleString('id-ID')}`)
    console.log(`📊 Monthly Top: ${monthly[0]?.name} - Rp ${monthly[0]?.points.toLocaleString('id-ID')}`)

    // Return REAL period-based data
    return NextResponse.json(
      {
        allTime,
        weekly,
        monthly,
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
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
