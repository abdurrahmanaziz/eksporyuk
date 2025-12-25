import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/affiliates/[id]/stats - Get affiliate statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate links stats
    const links = await prisma.affiliateLink.findMany({
      where: { userId },
      select: {
        id: true,
        code: true,
        clicks: true,
        createdAt: true,
      }
    })

    const totalLinks = links.length
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)

    // Get affiliate coupons
    const coupons = await prisma.coupon.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        code: true,
        usageCount: true,
        isActive: true,
        createdAt: true,
      }
    })

    const totalCoupons = coupons.length
    const activeCoupons = coupons.filter(c => c.isActive).length
    const totalCouponUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0)

    // Get conversions (transactions with affiliate)
    const conversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: userId },
      include: {
        transaction: {
          select: {
            amount: true,
            createdAt: true,
            status: true,
          }
        }
      }
    })

    const totalConversions = conversions.length
    const paidConversions = conversions.filter(c => c.paidOut).length
    const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
    const paidRevenue = conversions.filter(c => c.paidOut).reduce((sum, c) => sum + Number(c.commissionAmount), 0)
    const pendingRevenue = totalRevenue - paidRevenue

    // Recent activity (last 10)
    const recentCoupons = coupons.slice(0, 10).map(c => ({
      code: c.code,
      usageCount: c.usageCount,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }))

    const recentLinks = links.slice(0, 10).map(l => ({
      code: l.code,
      clicks: l.clicks,
      createdAt: l.createdAt,
    }))

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        joinedAt: user.createdAt,
      },
      stats: {
        links: {
          total: totalLinks,
          totalClicks,
        },
        coupons: {
          total: totalCoupons,
          active: activeCoupons,
          totalUsage: totalCouponUsage,
        },
        conversions: {
          total: totalConversions,
          paid: paidConversions,
          pending: totalConversions - paidConversions,
        },
        revenue: {
          total: totalRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
        }
      },
      recent: {
        coupons: recentCoupons,
        links: recentLinks,
      }
    })
  } catch (error: any) {
    console.error('Error fetching affiliate stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate stats', details: error.message },
      { status: 500 }
    )
  }
}
