import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/leaderboard - Get affiliate leaderboard with sales data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'weekly' // weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '10')

    // Calculate date range
    let startDate: Date
    const now = new Date()
    
    if (period === 'weekly') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
    } else {
      // monthly
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    }

    // Get affiliate conversions with transaction data
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        createdAt: { gte: startDate },
        transaction: {
          status: 'SUCCESS'
        }
      },
      select: {
        affiliateId: true,
        commissionAmount: true,
        transaction: {
          select: {
            amount: true
          }
        },
        affiliate: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                username: true
              }
            }
          }
        }
      }
    })

    // Aggregate by affiliateId
    const aggregationMap = new Map<string, {
      affiliateId: string
      userId: string
      name: string
      email: string
      avatar: string | null
      username: string | null
      totalSales: number
      totalConversions: number
      totalCommission: number
    }>()

    for (const conv of conversions) {
      if (!conv.affiliate) continue
      
      const existing = aggregationMap.get(conv.affiliateId)
      const saleAmount = Number(conv.transaction?.amount || 0)
      const commission = Number(conv.commissionAmount || 0)
      
      if (existing) {
        existing.totalSales += saleAmount
        existing.totalConversions += 1
        existing.totalCommission += commission
      } else {
        aggregationMap.set(conv.affiliateId, {
          affiliateId: conv.affiliateId,
          userId: conv.affiliate.userId,
          name: conv.affiliate.user.name || 'Unknown',
          email: conv.affiliate.user.email,
          avatar: conv.affiliate.user.avatar,
          username: conv.affiliate.user.username,
          totalSales: saleAmount,
          totalConversions: 1,
          totalCommission: commission
        })
      }
    }

    // Convert to array and sort by totalSales
    let leaderboard = Array.from(aggregationMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }))

    // Get current user rank if logged in
    let currentUserRank = null
    if (session?.user?.id) {
      const userEntry = Array.from(aggregationMap.values())
        .sort((a, b) => b.totalSales - a.totalSales)
        .findIndex(entry => entry.userId === session.user.id)
      
      if (userEntry !== -1) {
        const userStats = Array.from(aggregationMap.values())
          .sort((a, b) => b.totalSales - a.totalSales)[userEntry]
        currentUserRank = {
          rank: userEntry + 1,
          ...userStats
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      currentUserRank,
      period,
      limit
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
