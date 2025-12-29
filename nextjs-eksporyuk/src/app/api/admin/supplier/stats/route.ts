import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Top provinces - fetch all profiles with province and aggregate in JS
    const profilesWithProvince = await prisma.supplierProfile.findMany({
      where: {
        province: {
          not: ''
        }
      },
      select: {
        province: true
      }
    })
    
    // Group by province in JavaScript
    const provinceMap = new Map<string, number>()
    profilesWithProvince.forEach(p => {
      if (p.province) {
        provinceMap.set(p.province, (provinceMap.get(p.province) || 0) + 1)
      }
    })
    
    const topProvinces = Array.from(provinceMap.entries())
      .map(([province, _count]) => ({ province, _count }))
      .sort((a, b) => b._count - a._count)
      .slice(0, 5)

    // Product stats - skip if model doesn't exist
    let totalProducts = 0
    let activeProducts = 0
    let pendingProducts = 0
    // SupplierProduct model may not exist in current schema

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

    // Growth trend (monthly for last 6 months) - Get raw data and process in JS
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const suppliersInPeriod = await prisma.supplierProfile.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      }
    })

    // Group by month in JavaScript
    const monthlyGrowthMap = new Map<string, number>()
    suppliersInPeriod.forEach(s => {
      const monthKey = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyGrowthMap.set(monthKey, (monthlyGrowthMap.get(monthKey) || 0) + 1)
    })
    
    const monthlyGrowth = Array.from(monthlyGrowthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

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
