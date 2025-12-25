import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/coupons/templates - Get available coupon templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active coupons that are affiliate-enabled and created by admin
    const templates = await prisma.coupon.findMany({
      where: {
        isActive: true,
        isAffiliateEnabled: true,
        createdBy: null, // Admin coupons only
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        isActive: true,
        maxGeneratePerAffiliate: true,
        maxUsagePerCoupon: true,
        validUntil: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching coupon templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupon templates' },
      { status: 500 }
    )
  }
}
