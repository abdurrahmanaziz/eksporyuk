import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/affiliate/coupons/generate - Generate coupon from template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, customCode } = body

    if (!templateId || !customCode) {
      return NextResponse.json(
        { error: 'Template ID and custom code are required' },
        { status: 400 }
      )
    }

    // Get template coupon
    const template = await prisma.coupon.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (!template.isActive || !template.isAffiliateEnabled) {
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

      if (affiliateGeneratedCount >= template.maxGeneratePerAffiliate) {
        return NextResponse.json(
          { error: `You have reached the generation limit (${template.maxGeneratePerAffiliate})` },
          { status: 400 }
        )
      }
    }

    // Check if custom code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: customCode.toUpperCase() },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Kode kupon sudah digunakan' },
        { status: 400 }
      )
    }

    // Create new coupon based on template
    const newCoupon = await prisma.coupon.create({
      data: {
        code: customCode.toUpperCase(),
        description: template.description,
        discountType: template.discountType,
        discountValue: template.discountValue,
        usageLimit: template.maxUsagePerCoupon,
        usageCount: 0,
        validUntil: template.validUntil,
        expiresAt: template.expiresAt,
        isActive: true,
        minPurchase: template.minPurchase,
        productIds: template.productIds,
        membershipIds: template.membershipIds,
        courseIds: template.courseIds,
        isAffiliateEnabled: false, // Generated coupons cannot be templates
        maxGeneratePerAffiliate: null,
        maxUsagePerCoupon: null,
        basedOnCouponId: template.id,
        createdBy: session.user.id as string,
      },
      include: {
        basedOnCoupon: {
          select: {
            code: true,
          }
        }
      }
    })

    return NextResponse.json({ coupon: newCoupon }, { status: 201 })
  } catch (error) {
    console.error('Error generating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to generate coupon' },
      { status: 500 }
    )
  }
}
