import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/utils'
import { calculateProfitSharing } from '@/lib/utils'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/dashboard/stats
export async function GET(request: NextRequest) {
  try {
    console.log('[DASHBOARD_STATS] Starting...')
    const user = await requireRole(['ADMIN', 'FOUNDER', 'CO_FOUNDER', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE'])
    console.log('[DASHBOARD_STATS] User role:', user.role)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year

    let startDate = new Date()
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // Base stats for all roles
    const stats: any = {}

    // Admin/Founder stats
    if (['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(user.role)) {
      const [
        totalUsers,
        totalRevenue,
        totalTransactions,
        pendingPayouts,
        activeMembers,
        totalGroups,
        totalProducts,
        totalMemberships,
        successfulTransactions,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.payout.count({
          where: { status: 'PENDING' },
        }),
        prisma.user.count({
          where: {
            role: { in: ['MEMBER_PREMIUM', 'MENTOR', 'AFFILIATE'] },
            isActive: true,
          },
        }),
        prisma.group.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.membership.count({ where: { isActive: true } }),
        prisma.transaction.count({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startDate },
          },
        }),
      ])

      // Get revenue breakdown
      const revenueByType = await prisma.transaction.groupBy({
        by: ['type'],
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      })

      // Get commission stats - first get affiliate user IDs, then sum their wallets
      const affiliateUsers = await prisma.user.findMany({
        where: { role: 'AFFILIATE' },
        select: { id: true }
      })
      const affiliateUserIds = affiliateUsers.map(u => u.id)
      
      const totalCommissions = affiliateUserIds.length > 0 
        ? await prisma.wallet.aggregate({
            where: {
              userId: { in: affiliateUserIds },
            },
            _sum: { totalEarnings: true },
          })
        : { _sum: { totalEarnings: null } }

      // Get recent transactions - query without user include since Transaction model has no relation
      const recentTransactionsRaw = await prisma.transaction.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
      
      // Enrich with user data manually
      const userIds = [...new Set(recentTransactionsRaw.map(t => t.userId).filter(Boolean))]
      const users = userIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, email: true }
      }) : []
      const userMap = new Map(users.map(u => [u.id, u]))
      
      const recentTransactions = recentTransactionsRaw.map(t => ({
        ...t,
        user: t.userId ? userMap.get(t.userId) || null : null
      }))

      // Get conversion rate
      const totalClicks = await prisma.affiliateClick.count({
        where: {
          createdAt: { gte: startDate },
        },
      })
      
      const conversionRate = totalClicks > 0 
        ? ((successfulTransactions / totalClicks) * 100).toFixed(2)
        : 0

      // Get user wallet info
      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      })

      // Get previous period data for comparison
      const prevStartDate = new Date(startDate)
      switch (period) {
        case 'day':
          prevStartDate.setDate(prevStartDate.getDate() - 1)
          break
        case 'week':
          prevStartDate.setDate(prevStartDate.getDate() - 7)
          break
        case 'month':
          prevStartDate.setMonth(prevStartDate.getMonth() - 1)
          break
        case 'year':
          prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
          break
      }

      const prevRevenue = await prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { 
            gte: prevStartDate,
            lt: startDate,
          },
        },
        _sum: { amount: true },
      })

      const prevTransactions = await prisma.transaction.count({
        where: {
          createdAt: { 
            gte: prevStartDate,
            lt: startDate,
          },
        },
      })

      const prevUsers = totalUsers // Approximation
      
      // Calculate changes
      const revenueChange = prevRevenue._sum.amount 
        ? (((Number(totalRevenue._sum.amount) - Number(prevRevenue._sum.amount)) / Number(prevRevenue._sum.amount)) * 100).toFixed(1)
        : '+100'
      
      const transactionChange = prevTransactions > 0
        ? (((totalTransactions - prevTransactions) / prevTransactions) * 100).toFixed(1)
        : '+100'

      stats.admin = {
        totalUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalTransactions,
        successfulTransactions,
        pendingPayouts,
        activeMembers,
        totalGroups,
        totalProducts,
        totalMemberships,
        revenueByType,
        totalCommissions: totalCommissions._sum.totalEarnings || 0,
        conversionRate,
        recentTransactions,
        wallet,
        changes: {
          revenue: revenueChange,
          transactions: transactionChange,
          users: '+0', // Placeholder
        },
      }
    }

    // Mentor stats
    if (user.role === 'MENTOR' || ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(user.role)) {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: user.id },
      })

      if (mentorProfile) {
        // Get mentor revenue - Transaction model doesn't have product relation
        // Use simple count and sum for mentor data
        const mentorRevenue = 0 // TODO: Implement when Transaction has proper relations

        stats.mentor = {
          ...mentorProfile,
          revenue: mentorRevenue,
        }
      }
    }

    // Affiliate stats
    if (user.role === 'AFFILIATE' || ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(user.role)) {
      const affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: user.id },
      })

      if (affiliateProfile) {
        const recentClicks = await prisma.affiliateClick.count({
          where: {
            affiliateId: affiliateProfile.id,
            createdAt: { gte: startDate },
          },
        })

        const recentConversions = await prisma.affiliateConversion.count({
          where: {
            affiliateId: affiliateProfile.id,
            createdAt: { gte: startDate },
          },
        })

        const recentEarnings = await prisma.affiliateConversion.aggregate({
          where: {
            affiliateId: affiliateProfile.id,
            createdAt: { gte: startDate },
          },
          _sum: { commissionAmount: true },
        })

        stats.affiliate = {
          ...affiliateProfile,
          recentClicks,
          recentConversions,
          recentEarnings: recentEarnings._sum.commissionAmount || 0,
        }
      }
    }

    // Recent activities
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    stats.recentActivities = recentActivities

    console.log('[DASHBOARD_STATS] Success')
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('[DASHBOARD_STATS] Error:', error.message, error.stack)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
