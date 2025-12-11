import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/admin/coupons - Get all coupons
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'admin' or 'affiliate'

    let coupons

    if (type === 'affiliate') {
      // Get affiliate coupons with user info
      coupons = await prisma.coupon.findMany({
        where: {
          createdBy: { not: null }, // Has creator (affiliate)
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          basedOnCoupon: {
            select: {
              code: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Get admin coupons (no creator)
      coupons = await prisma.coupon.findMany({
        where: {
          createdBy: null,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ coupons })
  } catch (error: any) {
    console.error('Error fetching coupons:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/admin/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      code, description, discountType, discountValue, usageLimit, validUntil, 
      minPurchase, isActive, productIds, membershipIds, courseIds, 
      isAffiliateEnabled, isForRenewal, maxGeneratePerAffiliate, maxUsagePerCoupon
    } = body

    // Check if coupon code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Kode kupon sudah digunakan' },
        { status: 400 }
      )
    }

    // Build data object - use undefined for empty arrays (Prisma JSON field requirement)
    const couponData: any = {
      code: code.toUpperCase(),
      description: description || null,
      discountType: discountType,
      discountValue: Number(discountValue),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usageCount: 0,
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive: isActive !== undefined ? isActive : true,
      minPurchase: minPurchase ? Number(minPurchase) : null,
      isAffiliateEnabled: isAffiliateEnabled || false,
      isForRenewal: isForRenewal || false,
      maxGeneratePerAffiliate: maxGeneratePerAffiliate ? Number(maxGeneratePerAffiliate) : null,
      maxUsagePerCoupon: maxUsagePerCoupon ? Number(maxUsagePerCoupon) : null,
    }

    // Only set JSON fields if they have values (Prisma doesn't accept null for JSON)
    if (productIds && productIds.length > 0) {
      couponData.productIds = productIds
    }
    if (membershipIds && membershipIds.length > 0) {
      couponData.membershipIds = membershipIds
    }
    if (courseIds && courseIds.length > 0) {
      couponData.courseIds = courseIds
    }

    const coupon = await prisma.coupon.create({
      data: couponData,
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    )
  }
}
