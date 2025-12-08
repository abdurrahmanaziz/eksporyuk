import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/utils'
import { calculateProfitSharing } from '@/lib/utils'

// GET /api/dashboard/stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'FOUNDER', 'CO_FOUNDER', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE'])

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

      // Get commission stats
      const totalCommissions = await prisma.wallet.aggregate({
        where: {
          user: {
            role: 'AFFILIATE',
          },
        },
        _sum: { totalEarnings: true },
      })

      // Get recent transactions
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

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
        include: {
          courses: {
            include: {
              _count: {
                select: { enrollments: true },
              },
            },
          },
        },
      })

      if (mentorProfile) {
        const mentorRevenue = await prisma.transaction.aggregate({
          where: {
            status: 'SUCCESS',
            createdAt: { gte: startDate },
            product: {
              creatorId: user.id,
            },
          },
          _sum: { mentorShare: true },
        })

        stats.mentor = {
          ...mentorProfile,
          revenue: mentorRevenue._sum.mentorShare || 0,
        }
      }
    }

    // Affiliate stats
    if (user.role === 'AFFILIATE' || ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(user.role)) {
      const affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: user.id },
        include: {
          links: true,
          _count: {
            select: {
              clicks: true,
              conversions: true,
            },
          },
        },
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

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
