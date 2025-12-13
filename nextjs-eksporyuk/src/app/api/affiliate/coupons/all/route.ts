import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/coupons/all - Get affiliate's own coupons + admin coupons for link generation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate's own generated coupons
    const affiliateCoupons = await prisma.coupon.findMany({
      where: {
        createdBy: session.user.id,
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get admin coupons that are enabled for affiliates
    const adminCoupons = await prisma.coupon.findMany({
      where: {
        createdBy: null, // Admin coupons
        isAffiliateEnabled: true,
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Combine both arrays
    const allCoupons = [
      ...affiliateCoupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt,
        isOwnCoupon: true,
        source: 'affiliate' as const,
        // Include target IDs for filtering
        membershipIds: coupon.membershipIds || [],
        productIds: coupon.productIds || [],
        courseIds: coupon.courseIds || [],
      })),
      ...adminCoupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt,
        isOwnCoupon: false,
        source: 'admin' as const,
        // Include target IDs for filtering
        membershipIds: coupon.membershipIds || [],
        productIds: coupon.productIds || [],
        courseIds: coupon.courseIds || [],
      }))
    ]

    return NextResponse.json({
      coupons: allCoupons,
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}
