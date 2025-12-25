import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { apiCache, CACHE_KEYS, CACHE_TTL } from '@/lib/api-cache'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first
    const cached = apiCache.get(CACHE_KEYS.ADMIN_STATS)
    if (cached) {
      const response = NextResponse.json(cached)
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalMemberships,
      activeMemberships,
      totalRevenue,
      revenueThisMonth,
      totalTransactions,
      pendingTransactions,
      totalCourses,
      totalProducts,
      totalGroups,
      activeGroups,
      totalPosts,
      postsThisWeek,
      totalAffiliates,
      activeAffiliates,
      totalAffiliateRevenue,
      oneSignalSubscribers,
      pendingReports,
      onlineUsers,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      
      // Memberships
      prisma.userMembership.count(),
      prisma.userMembership.count({ 
        where: { 
          status: 'ACTIVE',
          endDate: { gt: now }
        } 
      }),
      
      // Revenue
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'SUCCESS',
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Transactions
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      
      // Content
      prisma.course.count(),
      prisma.product.count(),
      prisma.group.count(),
      prisma.group.count({ where: { isActive: true } }),
      
      // Posts
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      
      // Affiliates
      prisma.affiliateProfile.count(),
      prisma.affiliateProfile.count({ where: { applicationStatus: 'APPROVED' } }),
      prisma.affiliateProfile.aggregate({
        _sum: { totalEarnings: true }
      }),
      
      // OneSignal
      prisma.user.count({ where: { oneSignalPlayerId: { not: null } } }),
      
      // Reports
      prisma.report.count({ where: { status: 'PENDING' } }),
      
      // Online users (last 5 minutes)
      prisma.user.count({
        where: {
          lastSeenAt: { gte: new Date(now.getTime() - 5 * 60 * 1000) }
        }
      })
    ])

    // Calculate growth percentages (simplified)
    const userGrowth = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : '0'
    const revenueGrowth = totalRevenue._sum.amount 
      ? ((Number(revenueThisMonth._sum.amount || 0) / Number(totalRevenue._sum.amount)) * 100).toFixed(1)
      : '0'

    const data = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new30Days: newUsersThisMonth,
        growth: userGrowth,
        online: onlineUsers
      },
      memberships: {
        total: totalMemberships,
        active: activeMemberships
      },
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
        thisMonth: Number(revenueThisMonth._sum.amount || 0),
        growth: revenueGrowth
      },
      transactions: {
        total: totalTransactions,
        pending: pendingTransactions
      },
      content: {
        courses: totalCourses,
        products: totalProducts,
        groups: totalGroups,
        activeGroups: activeGroups,
        posts: totalPosts,
        postsThisWeek: postsThisWeek
      },
      affiliates: {
        total: totalAffiliates,
        active: activeAffiliates,
        totalEarnings: Number(totalAffiliateRevenue._sum.totalEarnings || 0)
      },
      notifications: {
        oneSignalSubscribers: oneSignalSubscribers,
        subscriptionRate: totalUsers > 0 ? ((oneSignalSubscribers / totalUsers) * 100).toFixed(1) : '0'
      },
      moderation: {
        pendingReports: pendingReports
      }
    }
    
    // Cache for 30 seconds (will be served instantly from cache)
    apiCache.set(CACHE_KEYS.ADMIN_STATS, data, CACHE_TTL.SHORT)
    
    const response = NextResponse.json(data)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error('[Admin Dashboard] Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
