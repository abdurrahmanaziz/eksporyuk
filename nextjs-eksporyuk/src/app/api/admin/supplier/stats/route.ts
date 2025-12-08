import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Total suppliers
    const totalSuppliers = await prisma.supplierProfile.count()
    const verifiedSuppliers = await prisma.supplierProfile.count({
      where: { isVerified: true }
    })
    const suspendedSuppliers = await prisma.supplierProfile.count({
      where: { isSuspended: true }
    })

    // Membership stats
    const membershipStats = await prisma.supplierMembership.groupBy({
      by: ['packageId'],
      where: {
        isActive: true
      },
      _count: true
    })

    // Get package names
    const packageIds = membershipStats.map(stat => stat.packageId)
    const packages = await prisma.supplierPackage.findMany({
      where: {
        id: {
          in: packageIds
        }
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    })

    const membershipBreakdown = membershipStats.map(stat => {
      const pkg = packages.find(p => p.id === stat.packageId)
      return {
        packageName: pkg?.name || 'Unknown',
        tier: pkg?.type || 'FREE',
        count: stat._count
      }
    })

    // Revenue from supplier memberships (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    // Top provinces
    const topProvinces = await prisma.supplierProfile.groupBy({
      by: ['province'],
      where: {
        province: {
          not: null
        }
      },
      _count: true,
      orderBy: {
        _count: {
          province: 'desc'
        }
      },
      take: 5
    })

    // Product stats
    const totalProducts = await prisma.supplierProduct.count()
    const activeProducts = await prisma.supplierProduct.count({
      where: { status: 'ACTIVE' }
    })
    const pendingProducts = await prisma.supplierProduct.count({
      where: { status: 'PENDING_REVIEW' }
    })

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRegistrations = await prisma.supplierProfile.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Growth trend (monthly for last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "SupplierProfile"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `

    return NextResponse.json({
      success: true,
      data: {
        suppliers: {
          total: totalSuppliers,
          verified: verifiedSuppliers,
          suspended: suspendedSuppliers,
          recentRegistrations
        },
        memberships: {
          breakdown: membershipBreakdown,
          totalActive: membershipStats.reduce((sum, stat) => sum + stat._count, 0)
        },
        revenue: {
          last30Days: recentRevenue._sum.amount || 0,
          transactionCount: recentRevenue._count
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          pending: pendingProducts
        },
        topProvinces: topProvinces.map(p => ({
          province: p.province,
          count: p._count
        })),
        growth: monthlyGrowth
      }
    })
  } catch (error) {
    console.error('Error fetching admin supplier stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
