import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/coupons/active - Fetch active coupons for affiliate selection
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only fetch active, non-expired coupons that are enabled for affiliates
    const now = new Date()
    
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validUntil: { gte: now },
        // Only show coupons that admin has enabled for affiliates
        // This will be checked via JSON field or separate table
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        usageLimit: true,
        usageCount: true,
        validUntil: true,
        productIds: true,
        membershipIds: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter out coupons that reached usage limit
    // For now, we'll return all since isAffiliateEnabled is stored in JSON
    // In production, you'd want to add isAffiliateEnabled as a separate field in schema
    const availableCoupons = coupons.filter(coupon => 
      !coupon.usageLimit || coupon.usageCount < coupon.usageLimit
    )

    return NextResponse.json({ coupons: availableCoupons })
  } catch (error) {
    console.error('Error fetching active coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}
