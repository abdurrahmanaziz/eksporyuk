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
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      
      // Sort and format
      return Array.from(aggregateMap.values())
        .sort((a, b) => b.totalCommission - a.totalCommission)
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
