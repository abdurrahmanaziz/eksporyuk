import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Get membership plan statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date ranges for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total members (all time)
    const totalMembers = await prisma.userMembership.count({
      where: { membershipId: id }
    })

    // Active members (not expired)
    const activeMembers = await prisma.userMembership.count({
      where: {
        membershipId: id,
        status: 'ACTIVE',
        endDate: {
          gte: now
        }
      }
    })

    // Get all transactions for this membership
    // First get UserMembership with their transactionIds for this membership
    const userMemberships = await prisma.userMembership.findMany({
      where: { membershipId: id },
      select: { id: true, transactionId: true }
    })
    
    // Get transaction IDs (filter out null values)
    const transactionIds = userMemberships
      .map(um => um.transactionId)
      .filter((id): id is string => id !== null)
    
    // Then get transactions by their IDs
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        type: 'MEMBERSHIP',
        status: 'SUCCESS'
      },
      select: {
        amount: true,
        createdAt: true
      }
    })

    // Total revenue (all time)
    const totalRevenue = transactions.reduce((sum, tx) => {
      return sum + (parseFloat(tx.amount?.toString() || '0'))
    }, 0)

    // This month revenue
    const thisMonthRevenue = transactions
      .filter(tx => tx.createdAt >= startOfMonth)
      .reduce((sum, tx) => sum + (parseFloat(tx.amount?.toString() || '0')), 0)

    // Last month revenue for comparison
    const lastMonthRevenue = transactions
      .filter(tx => tx.createdAt >= startOfLastMonth && tx.createdAt <= endOfLastMonth)
      .reduce((sum, tx) => sum + (parseFloat(tx.amount?.toString() || '0')), 0)

    // Average order value
    const averageOrderValue = transactions.length > 0 
      ? totalRevenue / transactions.length 
      : 0

    // Growth rate (compare this month vs last month)
    const growthRate = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    // Churn rate (expired members in last 30 days / total members)
    const expiredMembers = await prisma.userMembership.count({
      where: {
        membershipId: id,
        status: 'EXPIRED',
        endDate: {
          gte: thirtyDaysAgo,
          lt: now
        }
      }
    })
    const churnRate = totalMembers > 0 ? (expiredMembers / totalMembers) * 100 : 0

    // Conversion rate (successful purchases / total attempts)
    // Get all transaction IDs for this membership (including non-success)
    const allMembershipTransactionIds = userMemberships
      .map(um => um.transactionId)
      .filter((id): id is string => id !== null)
    
    const totalAttempts = await prisma.transaction.count({
      where: {
        id: { in: allMembershipTransactionIds },
        type: 'MEMBERSHIP'
      }
    })
    const successfulPurchases = transactions.length
    const conversionRate = totalAttempts > 0 
      ? (successfulPurchases / totalAttempts) * 100 
      : 0

    // Additional stats
    const membersByMonth = await prisma.userMembership.groupBy({
      by: ['createdAt'],
      where: {
        membershipId: id,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) // Last 12 months
        }
      },
      _count: true
    })

    // Format month data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
      
      const count = transactions.filter(tx => 
        tx.createdAt >= monthStart && tx.createdAt <= monthEnd
      ).length

      return {
        month: month.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        members: count
      }
    })

    const statistics = {
      totalMembers,
      activeMembers,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      averageOrderValue,
      conversionRate,
      churnRate,
      growthRate,
      expiredMembers,
      successfulPurchases,
      totalAttempts,
      monthlyData
    }

    return NextResponse.json({ 
      success: true,
      statistics 
    })

  } catch (error) {
    console.error('Error fetching membership statistics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
