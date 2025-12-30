import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

    // Get all active coupons that are affiliate-enabled and have basedOnCoupon === null (they are templates)
    const templates = await prisma.coupon.findMany({
      where: {
        isActive: true,
        isAffiliateEnabled: true,
        basedOnCouponId: null, // These are templates, not generated coupons
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

    // Convert Decimal to string for JSON response
    const templatesWithStrings = templates.map(t => ({
      ...t,
      discountValue: t.discountValue.toString()
    }))

    return NextResponse.json({ templates: templatesWithStrings })
  } catch (error) {
    console.error('Error fetching coupon templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupon templates' },
      { status: 500 }
    )
  }
}
