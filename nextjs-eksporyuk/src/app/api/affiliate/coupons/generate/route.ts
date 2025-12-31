import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/affiliate/coupons/generate - Generate coupon from template
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting coupon generation...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`👤 User: ${session.user.name} (${session.user.role})`)
    console.log('📋 Full session user:', JSON.stringify(session.user, null, 2))
    
    // Allow AFFILIATE, ADMIN, FOUNDER, CO_FOUNDER roles
    const allowedRoles = ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!allowedRoles.includes(session.user.role)) {
      console.log(`❌ Role ${session.user.role} not allowed. Allowed roles:`, allowedRoles)
      return NextResponse.json({ 
        error: `Access denied. Current role: ${session.user.role}. Required: AFFILIATE, ADMIN, FOUNDER, or CO_FOUNDER.` 
      }, { status: 403 })
    }

    const body = await request.json()
    const { templateId, customCode } = body
    console.log(`📋 Request: templateId=${templateId}, customCode=${customCode}`)

    if (!templateId || !customCode) {
      console.log('❌ Missing templateId or customCode')
      return NextResponse.json(
        { error: 'Template ID and custom code are required' },
        { status: 400 }
      )
    }

    // Get template coupon
    console.log('🔍 Fetching template...')
    const template = await prisma.coupon.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      console.log('❌ Template not found')
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Template found: ${template.code}`)

    if (!template.isActive || !template.isAffiliateEnabled) {
      console.log('❌ Template not available')
      return NextResponse.json(
        { error: 'Template is not available' },
        { status: 400 }
      )
    }

    // Check if affiliate has reached generation limit
    if (template.maxGeneratePerAffiliate) {
      const affiliateGeneratedCount = await prisma.coupon.count({
        where: {
          createdBy: session.user.id as string,
          basedOnCouponId: template.id,
        },
      })

      console.log(`📊 Generated: ${affiliateGeneratedCount}/${template.maxGeneratePerAffiliate}`)

      if (affiliateGeneratedCount >= template.maxGeneratePerAffiliate) {
        console.log('❌ Generation limit reached')
        return NextResponse.json(
          { error: `You have reached the generation limit (${template.maxGeneratePerAffiliate})` },
          { status: 400 }
        )
      }
    }

    // Check if custom code already exists
    console.log('🔍 Checking code uniqueness...')
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: customCode.toUpperCase() },
    })

    if (existingCoupon) {
      console.log('❌ Code already exists')
      return NextResponse.json(
        { error: 'Kode kupon sudah digunakan' },
        { status: 400 }
      )
    }

    // Create new coupon based on template
    console.log('🚀 Creating new coupon...')
    const newCoupon = await prisma.coupon.create({
      data: {
        id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        code: customCode.toUpperCase(),
        description: template.description || `Kupon diskon ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : 'K'}`,
        discountType: template.discountType,
        discountValue: new Prisma.Decimal(String(template.discountValue)),
        usageLimit: template.maxUsagePerCoupon || null,
        usageCount: 0,
        validUntil: template.validUntil || null,
        expiresAt: template.expiresAt || null,
        isActive: true,
        minPurchase: template.minPurchase ? new Prisma.Decimal(String(template.minPurchase)) : null,
        productIds: template.productIds || null,
        membershipIds: template.membershipIds || null,
        courseIds: template.courseIds || null,
        isAffiliateEnabled: false,
        basedOnCouponId: template.id,
        createdBy: session.user.id as string,
      }
    })

    console.log(`✅ Coupon created successfully: ${newCoupon.code}`)
    
    // Convert Decimal fields to strings for JSON serialization
    const response = {
      id: newCoupon.id,
      code: newCoupon.code,
      description: newCoupon.description,
      discountType: newCoupon.discountType,
      discountValue: newCoupon.discountValue.toString(),
      usageLimit: newCoupon.usageLimit,
      usageCount: newCoupon.usageCount,
      validUntil: newCoupon.validUntil?.toISOString() || null,
      expiresAt: newCoupon.expiresAt?.toISOString() || null,
      isActive: newCoupon.isActive,
      minPurchase: newCoupon.minPurchase?.toString() || null,
      validFrom: newCoupon.validFrom?.toISOString() || null,
      productIds: newCoupon.productIds,
      membershipIds: newCoupon.membershipIds,
      courseIds: newCoupon.courseIds,
      isAffiliateEnabled: newCoupon.isAffiliateEnabled,
      isForRenewal: newCoupon.isForRenewal,
      maxGeneratePerAffiliate: newCoupon.maxGeneratePerAffiliate,
      maxUsagePerCoupon: newCoupon.maxUsagePerCoupon,
      basedOnCouponId: newCoupon.basedOnCouponId,
      createdBy: newCoupon.createdBy,
      createdAt: newCoupon.createdAt.toISOString(),
      updatedAt: newCoupon.updatedAt.toISOString(),
      affiliateId: newCoupon.affiliateId,
      generatedBy: newCoupon.generatedBy,
    }
    
    console.log('Response object ready:', JSON.stringify(response))
    return NextResponse.json({ coupon: response }, { status: 201 })
  } catch (error) {
    console.error('❌ Error generating coupon:', error)
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Failed to generate coupon', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
