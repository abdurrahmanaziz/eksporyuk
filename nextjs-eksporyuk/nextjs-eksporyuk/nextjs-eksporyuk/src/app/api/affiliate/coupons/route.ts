import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/affiliate/coupons - Get affiliate's own coupons
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('[GET /api/affiliate/coupons] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[GET /api/affiliate/coupons] User:', session.user.name, 'Role:', session.user.role)
    
    // Check if user has active affiliate profile (any role can be affiliate)
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { isActive: true }
    })

    // Check if user has earned affiliate commissions
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true, totalEarnings: true }
    })

    const hasEarnedCommissions = wallet && (Number(wallet.balance) > 0 || Number(wallet.totalEarnings) > 0)
    const isAdmin = ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role)
    const hasAccess = affiliateProfile?.isActive || isAdmin || hasEarnedCommissions

    if (!hasAccess) {
      console.log('[GET /api/affiliate/coupons] Access denied. User lacks affiliate status, admin role, or commission earnings')
      return NextResponse.json({ 
        error: 'Unauthorized - Anda belum terdaftar sebagai affiliate atau belum memiliki komisi.' 
      }, { status: 401 })
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
    
    if (!session?.user) {
      console.log('[POST /api/affiliate/coupons] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[POST /api/affiliate/coupons] User:', session.user.name, 'Role:', session.user.role)
    
    // Check if user has active affiliate profile (any role can be affiliate)
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { isActive: true }
    })

    // Check if user has earned affiliate commissions
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true, totalEarnings: true }
    })

    const hasEarnedCommissions = wallet && (Number(wallet.balance) > 0 || Number(wallet.totalEarnings) > 0)
    const isAdmin = ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role)
    const hasAccess = affiliateProfile?.isActive || isAdmin || hasEarnedCommissions

    if (!hasAccess) {
      console.log('[POST /api/affiliate/coupons] Access denied. User lacks affiliate status, admin role, or commission earnings')
      return NextResponse.json({ 
        error: 'Unauthorized - Anda belum terdaftar sebagai affiliate atau belum memiliki komisi.' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { code, adminCouponId, description, discountType, discountValue, usageLimit, validUntil, targetType, source } = body

    // ENFORCE: Affiliate MUST use admin template - no custom coupons allowed
    if (!adminCouponId || adminCouponId === '') {
      console.log('[POST /api/affiliate/coupons] Rejected: Affiliate attempted custom coupon creation')
      return NextResponse.json(
        { error: 'Affiliate tidak diizinkan membuat kupon sendiri. Kupon harus berasal dari template admin.' },
        { status: 403 }
      )
    }

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

    // Template-based coupon creation ONLY (required for all affiliates)
    console.log('=== AFFILIATE COUPON FROM ADMIN TEMPLATE ===')
    
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

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating affiliate coupon:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    )
  }
}
