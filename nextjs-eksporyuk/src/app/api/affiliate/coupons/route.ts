import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/affiliate/coupons - Get affiliate's own coupons
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        createdBy: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ coupons })
  } catch (error: any) {
    console.error('Error fetching affiliate coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/affiliate/coupons - Create new affiliate coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, adminCouponId, description, discountType, discountValue, usageLimit, validUntil, targetType, source } = body

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

    // Check if user exists in database, create if not
    let userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    // If user doesn't exist, create placeholder
    if (!userExists && session.user.email) {
      try {
        userExists = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || session.user.email.split('@')[0],
            role: session.user.role || 'AFFILIATE',
            password: '', // Will be set when user actually registers
          }
        })
        console.log('✅ Created user:', userExists.id)
      } catch (createError) {
        console.warn('Could not create user:', createError)
      }
    }

    let coupon

    if (source === 'affiliate' && !adminCouponId) {
      // DIRECT CUSTOM COUPON CREATION by affiliate
      console.log('=== DEBUG CREATE CUSTOM COUPON ===')
      console.log('Session user ID:', session.user.id)
      console.log('User exists:', !!userExists)
      console.log('New coupon code:', code.toUpperCase())
      
      // Determine product/membership IDs based on target type
      let productIds: string[] = []
      let membershipIds: string[] = []
      
      if (targetType === 'product') {
        // Get all products (could be limited based on business rules)
        const products = await prisma.product.findMany({
          where: { isActive: true },
          select: { id: true }
        })
        productIds = products.map(p => p.id)
      } else if (targetType === 'membership') {
        // Get all memberships
        const memberships = await prisma.membershipPlan.findMany({
          where: { isActive: true },
          select: { id: true }
        })
        membershipIds = memberships.map(m => m.id)
      }
      // For 'all' and 'course', we leave both arrays empty (applies to all)

      coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          description: description || `Kupon affiliate ${discountValue}${discountType === 'PERCENTAGE' ? '%' : 'K'} off`,
          discountType: discountType as any,
          discountValue: discountValue,
          usageLimit: usageLimit || null,
          usageCount: 0,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: true,
          productIds: productIds,
          membershipIds: membershipIds,
          minPurchase: null,
          validFrom: new Date(),
          basedOnCouponId: null, // No template, pure custom
          ...(userExists && { createdBy: session.user.id }),
          isAffiliateEnabled: false, // Created by affiliate, not for other affiliates
        },
      })

      console.log('✅ Custom coupon created successfully:', coupon.id)
      
    } else {
      // TEMPLATE-BASED COUPON CREATION (existing logic)
      console.log('=== DEBUG CREATE TEMPLATE-BASED COUPON ===')
      
      // Get admin coupon as template
      const adminCoupon = await prisma.coupon.findUnique({
        where: { 
          id: adminCouponId,
        },
      })

      if (!adminCoupon) {
        return NextResponse.json(
          { error: 'Kupon admin tidak ditemukan' },
          { status: 400 }
        )
      }

      if (!adminCoupon.isAffiliateEnabled || !adminCoupon.isActive || adminCoupon.createdBy !== null) {
        return NextResponse.json(
          { error: 'Kupon ini tidak tersedia untuk affiliate' },
          { status: 400 }
        )
      }

      // Check how many times this affiliate has already generated from this template
      if (adminCoupon.maxGeneratePerAffiliate) {
        const generatedCount = await prisma.coupon.count({
          where: {
            basedOnCouponId: adminCouponId,
            createdBy: session.user.id,
          },
        })

        if (generatedCount >= adminCoupon.maxGeneratePerAffiliate) {
          return NextResponse.json(
            { error: `Anda sudah mencapai batas maksimal ${adminCoupon.maxGeneratePerAffiliate}x generate kupon ini` },
            { status: 400 }
          )
        }
      }

      console.log('Session user ID:', session.user.id)
      console.log('User exists:', !!userExists)
      console.log('Admin coupon ID:', adminCouponId)
      console.log('New coupon code:', code.toUpperCase())
      
      coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          description: adminCoupon.description,
          discountType: adminCoupon.discountType,
          discountValue: adminCoupon.discountValue,
          usageLimit: adminCoupon.maxUsagePerCoupon || null,
          usageCount: 0,
          validUntil: adminCoupon.validUntil,
          isActive: true,
          productIds: adminCoupon.productIds,
          membershipIds: adminCoupon.membershipIds,
          minPurchase: adminCoupon.minPurchase,
          validFrom: adminCoupon.validFrom,
          basedOnCouponId: adminCouponId,
          ...(userExists && { createdBy: session.user.id }), // Only set if user exists
          isAffiliateEnabled: false,
        },
      })

      console.log('✅ Template coupon created successfully:', coupon.id)
    }

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating affiliate coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    )
  }
}
