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
    const period = searchParams.get('period') || 'weekly' // weekly, monthly, all-time, or YYYY-MM for specific month
    const limit = parseInt(searchParams.get('limit') || '10')

    // Calculate date range
    let startDate: Date | undefined
    let endDate: Date | undefined
    const now = new Date()
    
    // Check if period is a specific month (YYYY-MM format)
    const monthMatch = period.match(/^(\d{4})-(\d{2})$/)
    
    if (monthMatch) {
      // Specific month: e.g., "2025-10" for October 2025
      const year = parseInt(monthMatch[1])
      const month = parseInt(monthMatch[2]) - 1 // 0-indexed
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 1) // First day of next month
    } else if (period === 'weekly') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'monthly') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    } else if (period === 'all-time') {
      startDate = undefined // No date filter for all-time
    } else {
      // default to weekly
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
    }

    // Build where clause for conversions (no relations available)
    const convWhereClause: any = {}
    
    // Add date filters
    if (startDate || endDate) {
      convWhereClause.createdAt = {}
      if (startDate) {
        convWhereClause.createdAt.gte = startDate
      }
      if (endDate) {
        convWhereClause.createdAt.lt = endDate
      }
    }
    
    // Get all conversions (no relations in schema, use manual lookup)
    const conversions = await prisma.affiliateConversion.findMany({
      where: convWhereClause
    })
    
    // Get transaction IDs and fetch transactions separately
    const txIds = conversions.map(c => c.transactionId).filter(Boolean)
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: txIds },
        status: 'SUCCESS'
      },
      select: {
        id: true,
        amount: true
      }
    })
    const txMap = new Map(transactions.map(t => [t.id, t]))
    
    // Get affiliate IDs and fetch affiliates separately
    const affiliateIds = [...new Set(conversions.map(c => c.affiliateId))]
    const affiliates = await prisma.affiliateProfile.findMany({
      where: { id: { in: affiliateIds } }
    })
    const affMap = new Map(affiliates.map(a => [a.id, a]))
    
    // Get user IDs and fetch users separately
    const userIds = affiliates.map(a => a.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        username: true
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // Aggregate by affiliateId using manual lookup
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
      const affiliate = affMap.get(conv.affiliateId)
      if (!affiliate) continue
      
      const tx = txMap.get(conv.transactionId)
      if (!tx) continue // Only count if transaction is SUCCESS
      
      const user = userMap.get(affiliate.userId)
      if (!user) continue
      
      const existing = aggregationMap.get(conv.affiliateId)
      const saleAmount = Number(tx.amount || 0)
      const commission = Number(conv.commissionAmount || 0)
      
      if (existing) {
        existing.totalSales += saleAmount
        existing.totalConversions += 1
        existing.totalCommission += commission
      } else {
        aggregationMap.set(conv.affiliateId, {
          affiliateId: conv.affiliateId,
          userId: affiliate.userId,
          name: user.name || 'Unknown',
          email: user.email,
          avatar: user.avatar,
          username: user.username,
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
