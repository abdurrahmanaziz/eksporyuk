import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/sales/stats
 * Get comprehensive sales statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, isFounder: true, isCoFounder: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admin, founder, co-founder can view stats
    const isAuthorized = user.role === 'ADMIN' || user.isFounder || user.isCoFounder

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get date ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Parallel queries for performance
    const [
      todayStats,
      weekStats,
      monthStats,
      yearStats,
      allTimeStats,
      recentSales,
      topProducts,
      topCourses,
      membershipStats
    ] = await Promise.all([
      // Today
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfToday }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // This week
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfWeek }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // This month
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // This year
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfYear }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // All time
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS'
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // Recent 10 sales
      prisma.transaction.findMany({
        where: { status: 'SUCCESS' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          product: {
            select: { name: true }
          },
          course: {
            select: { title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // Top selling products
      prisma.transaction.groupBy({
        by: ['productId'],
        where: {
          status: 'SUCCESS',
          productId: { not: null }
        },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      }),
      // Top selling courses
      prisma.transaction.groupBy({
        by: ['courseId'],
        where: {
          status: 'SUCCESS',
          courseId: { not: null }
        },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 5
      }),
      // Membership statistics
      prisma.userMembership.groupBy({
        by: ['membershipId'],
        where: {
          status: 'ACTIVE'
        },
        _count: { id: true }
      })
    ])

    // Get product names for top products
    const productIds = topProducts.map(p => p.productId).filter(Boolean) as string[]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })

    // Get course titles for top courses
    const courseIds = topCourses.map(c => c.courseId).filter(Boolean) as string[]
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true }
    })

    // Get membership names
    const membershipIds = membershipStats.map(m => m.membershipId)
    const memberships = await prisma.membership.findMany({
      where: { id: { in: membershipIds } },
      select: { id: true, name: true }
    })

    return NextResponse.json({
      success: true,
      stats: {
        today: {
          revenue: Number(todayStats._sum.amount || 0),
          sales: todayStats._count.id
        },
        week: {
          revenue: Number(weekStats._sum.amount || 0),
          sales: weekStats._count.id
        },
        month: {
          revenue: Number(monthStats._sum.amount || 0),
          sales: monthStats._count.id
        },
        year: {
          revenue: Number(yearStats._sum.amount || 0),
          sales: yearStats._count.id
        },
        allTime: {
          revenue: Number(allTimeStats._sum.amount || 0),
          sales: allTimeStats._count.id
        }
      },
      recentSales: recentSales.map(sale => ({
        id: sale.id,
        type: sale.type,
        amount: Number(sale.amount),
        customer: sale.user.name || sale.user.email,
        item: sale.product?.name || sale.course?.title || 'Membership',
        date: sale.createdAt
      })),
      topProducts: topProducts.map(item => {
        const product = products.find(p => p.id === item.productId)
        return {
          id: item.productId,
          name: product?.name || 'Unknown',
          revenue: Number(item._sum.amount || 0),
          sales: item._count.id
        }
      }),
      topCourses: topCourses.map(item => {
        const course = courses.find(c => c.id === item.courseId)
        return {
          id: item.courseId,
          name: course?.title || 'Unknown',
          revenue: Number(item._sum.amount || 0),
          sales: item._count.id
        }
      }),
      memberships: membershipStats.map(item => {
        const membership = memberships.find(m => m.id === item.membershipId)
        return {
          id: item.membershipId,
          name: membership?.name || 'Unknown',
          activeMembers: item._count.id
        }
      })
    })

  } catch (error: any) {
    console.error('Sales stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
