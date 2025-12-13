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

    // Allow AFFILIATE, ADMIN, FOUNDER, CO_FOUNDER roles
    const allowedRoles = ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied. Affiliate access required.' }, { status: 403 })
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
        description: template.description || `Kupon diskon ${template.discountValue}${template.discountType === 'PERCENTAGE' ? '%' : 'K'}`,
        discountType: template.discountType,
        discountValue: Number(template.discountValue), // Ensure it's a number
        usageLimit: template.maxUsagePerCoupon || undefined,
        usageCount: 0,
        validUntil: template.validUntil || undefined,
        expiresAt: template.expiresAt || undefined,
        isActive: true,
        minPurchase: template.minPurchase || undefined,
        productIds: template.productIds || undefined, // Use undefined instead of null
        membershipIds: template.membershipIds || undefined, // Use undefined instead of null
        courseIds: template.courseIds || undefined, // Use undefined instead of null
        isAffiliateEnabled: false, // Generated coupons cannot be templates
        maxGeneratePerAffiliate: undefined,
        maxUsagePerCoupon: undefined,
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
