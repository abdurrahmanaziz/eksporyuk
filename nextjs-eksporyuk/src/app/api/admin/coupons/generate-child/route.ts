import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// POST /api/admin/coupons/generate-child - Generate child coupons for affiliates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      parentCouponId,
      affiliateId,
      count = 1,
      codePrefix = '',
      customCode = null,
    } = body

    // Validate parent coupon
    const parentCoupon = await prisma.coupon.findUnique({
      where: { id: parentCouponId },
    })

    if (!parentCoupon) {
      return NextResponse.json(
        { error: 'Parent coupon not found' },
        { status: 404 }
      )
    }

    if (!parentCoupon.isAffiliateEnabled) {
      return NextResponse.json(
        { error: 'Parent coupon tidak mengizinkan generate affiliate coupon' },
        { status: 400 }
      )
    }

    // Check max generate limit per affiliate
    if (parentCoupon.maxGeneratePerAffiliate && affiliateId) {
      const whereQuery: Prisma.CouponWhereInput = {
        basedOnCouponId: parentCouponId,
        affiliateId: affiliateId,
      }
      
      const existingCount = await prisma.coupon.count({
        where: whereQuery
      })

      if (existingCount >= parentCoupon.maxGeneratePerAffiliate) {
        return NextResponse.json(
          { error: `Affiliate sudah mencapai limit generate (${parentCoupon.maxGeneratePerAffiliate} kupon)` },
          { status: 400 }
        )
      }
    }

    const generatedCoupons = []

    for (let i = 0; i < count; i++) {
      let code = customCode

      if (!code) {
        // Generate random code
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
        code = codePrefix ? `${codePrefix}-${randomSuffix}` : `${parentCoupon.code}-${randomSuffix}`
      }

      // Check if code already exists
      const whereUnique: Prisma.CouponWhereUniqueInput = { code }
      const existing = await prisma.coupon.findUnique({
        where: whereUnique,
      })

      if (existing) {
        continue // Skip duplicate codes
      }

      // Create child coupon with same properties as parent
      const createData: Prisma.CouponCreateInput = {
        code: code.toUpperCase(),
        description: parentCoupon.description,
        discountType: parentCoupon.discountType,
        discountValue: parentCoupon.discountValue,
        usageLimit: parentCoupon.maxUsagePerCoupon || parentCoupon.usageLimit,
        usageCount: 0,
        validUntil: parentCoupon.validUntil,
        isActive: true,
        minPurchase: parentCoupon.minPurchase,
        productIds: parentCoupon.productIds as Prisma.InputJsonValue,
        membershipIds: parentCoupon.membershipIds as Prisma.InputJsonValue,
        courseIds: parentCoupon.courseIds as Prisma.InputJsonValue,
        isAffiliateEnabled: false, // Child coupons cannot generate more children
        isForRenewal: parentCoupon.isForRenewal,
        affiliateId: affiliateId,
        generatedBy: session.user.id,
        createdBy: session.user.id,
        parentCoupon: {
          connect: { id: parentCouponId }
        }
      }
      
      const childCoupon = await prisma.coupon.create({
        data: createData,
      })

      generatedCoupons.push(childCoupon)

      // If custom code, only generate one
      if (customCode) break
    }

    if (generatedCoupons.length === 0) {
      return NextResponse.json(
        { error: 'Gagal generate kupon (kode sudah ada atau limit tercapai)' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      coupons: generatedCoupons,
      count: generatedCoupons.length,
      message: `Berhasil generate ${generatedCoupons.length} kupon`
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error generating child coupons:', error)
    return NextResponse.json(
      { error: 'Failed to generate child coupons', details: error.message },
      { status: 500 }
    )
  }
}
