import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    // Calculate date range
    let startDate: Date
    let endDate = new Date()
    let previousStartDate: Date
    let previousEndDate: Date

    switch (period) {
      case '7d':
        startDate = subDays(endDate, 7)
        previousStartDate = subDays(startDate, 7)
        previousEndDate = subDays(endDate, 7)
        break
      case '30d':
        startDate = subDays(endDate, 30)
        previousStartDate = subDays(startDate, 30)
        previousEndDate = subDays(endDate, 30)
        break
      case '90d':
        startDate = subDays(endDate, 90)
        previousStartDate = subDays(startDate, 90)
        previousEndDate = subDays(endDate, 90)
        break
      case '1y':
        startDate = subMonths(endDate, 12)
        previousStartDate = subMonths(startDate, 12)
        previousEndDate = subMonths(endDate, 12)
        break
      default:
        startDate = subDays(endDate, 7)
        previousStartDate = subDays(startDate, 7)
        previousEndDate = subDays(endDate, 7)
    }

    // Get current period stats
    const [
      totalUsers,
      newUsersToday,
      newUsersPeriod,
      previousPeriodUsers,
      totalTransactions,
      previousTransactions,
      activeMemberships,
      previousMemberships,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lte: previousEndDate,
          },
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'SUCCESS',
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lte: previousEndDate,
          },
          status: 'SUCCESS',
        },
      }),
      prisma.userMembership.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      prisma.userMembership.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            lte: previousEndDate,
          },
        },
      }),
    ])

    // Get revenue
    const revenueData = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    })

    const previousRevenueData = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    })

    const totalRevenue = Number(revenueData._sum.amount) || 0
    const previousRevenue = Number(previousRevenueData._sum.amount) || 0

    // Calculate growth percentages
    const userGrowth = previousPeriodUsers > 0 
      ? ((newUsersPeriod - previousPeriodUsers) / previousPeriodUsers) * 100 
      : 0
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    const transactionGrowth = previousTransactions > 0 
      ? ((totalTransactions - previousTransactions) / previousTransactions) * 100 
      : 0
    const membershipGrowth = previousMemberships > 0 
      ? ((activeMemberships - previousMemberships) / previousMemberships) * 100 
      : 0

    // Get top products
    const topProducts = await prisma.transaction.groupBy({
      by: ['productId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SUCCESS',
        productId: { not: null },
      },
      _count: true,
      _sum: {
        amount: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 5,
    })

    const productIds = topProducts.map(p => p.productId).filter(Boolean) as string[]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })

    const topProductsWithNames = topProducts.map(p => ({
      id: p.productId,
      name: products.find(prod => prod.id === p.productId)?.name || 'Unknown',
      sales: p._count,
      revenue: Number(p._sum.amount) || 0,
    }))

    // Get top courses
    const topCourses = await prisma.courseEnrollment.groupBy({
      by: ['courseId'],
      _count: true,
      orderBy: {
        _count: {
          courseId: 'desc',
        },
      },
      take: 5,
    })

    const courseIds = topCourses.map(c => c.courseId)
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    })

    const topCoursesWithNames = topCourses.map(c => ({
      id: c.courseId,
      title: courses.find(course => course.id === c.courseId)?.title || 'Unknown',
      enrollments: c._count,
      completion: 0, // Calculate if needed
    }))

    // Get recent activity
    const recentActivity = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
        membership: { select: { membership: { select: { name: true } } } },
      },
    })

    const activityLog = recentActivity.map(transaction => ({
      type: transaction.productId ? 'PRODUCT' : 'MEMBERSHIP',
      description: `${transaction.user?.name} membeli ${transaction.product?.name || transaction.membership?.membership?.name || 'item'}`,
      timestamp: transaction.createdAt.toISOString(),
    }))

    const response = NextResponse.json({
      overview: {
        totalUsers,
        newUsersToday,
        userGrowth,
        totalRevenue: Number(totalRevenue),
        revenueGrowth,
        totalTransactions,
        transactionGrowth,
        activeMemberships,
        membershipGrowth,
      },
      charts: {
        userGrowth: [],
        revenueChart: [],
        transactionChart: [],
      },
      topProducts: topProductsWithNames,
      topCourses: topCoursesWithNames,
      recentActivity: activityLog,
    })
    
    // Cache response for 30 seconds (stale-while-revalidate for 60s)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
