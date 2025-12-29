import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/affiliate/bio/cta
 * Add CTA button to bio page
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      buttonText,
      buttonType,
      buttonStyle,
      targetType,
      customUrl,
      membershipId,
      productId,
      courseId,
      optinFormId,
      optinDisplayMode,
      backgroundColor,
      textColor,
      thumbnailUrl,
      price,
      originalPrice,
      subtitle,
      showPrice,
      showThumbnail,
      titleSize,
      subtitleSize,
      buttonTextSize
    } = body

    console.log('Creating CTA button:', { buttonText, buttonType, targetType, customUrl, membershipId, productId, courseId, optinFormId })

    // Validate required fields
    if (!buttonText || !buttonType) {
      return NextResponse.json(
        { error: 'Button text and type are required' },
        { status: 400 }
      )
    }

    // Get affiliate profile and bio page (manual lookups)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 })
    }

    const bioPage = await prisma.affiliateBioPage.findFirst({
      where: { affiliateId: affiliateProfile.id }
    })

    if (!bioPage) {
      return NextResponse.json(
        { error: 'Bio page not found. Create a bio page first.' },
        { status: 404 }
      )
    }

    // Get current max display order
    const maxOrder = await prisma.affiliateBioCTA.findFirst({
      where: { bioPageId: bioPage.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    // Prepare data object, only include IDs if they are provided
    const ctaData: any = {
      bioPageId: bioPage.id,
      buttonText,
      buttonType,
      buttonStyle: buttonStyle || 'button',
      targetType: targetType || null,
      targetUrl: customUrl || null,
      backgroundColor: backgroundColor || '#3B82F6',
      textColor: textColor || '#FFFFFF',
      thumbnailUrl: thumbnailUrl || null,
      price: price || null,
      originalPrice: originalPrice || null,
      subtitle: subtitle || null,
      showPrice: showPrice || false,
      showThumbnail: showThumbnail || false,
      titleSize: titleSize || 'sm',
      subtitleSize: subtitleSize || 'xs',
      buttonTextSize: buttonTextSize || 'sm',
      displayOrder: (maxOrder?.displayOrder || 0) + 1
    }

    // Only add foreign key fields if they have valid values
    if (membershipId) ctaData.membershipId = membershipId
    if (productId) ctaData.productId = productId
    if (courseId) ctaData.courseId = courseId
    if (optinFormId) {
      ctaData.optinFormId = optinFormId
      ctaData.optinDisplayMode = optinDisplayMode || 'button'
    }

    console.log('CTA data to create:', ctaData)

    // Create CTA button
    const ctaButton = await prisma.affiliateBioCTA.create({
      data: ctaData
    })

    return NextResponse.json({
      message: 'CTA button added successfully',
      ctaButton
    })
  } catch (error) {
    console.error('Error adding CTA button:', error)
    return NextResponse.json(
      { error: 'Failed to add CTA button' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/affiliate/bio/cta
 * Get all CTA buttons
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ ctaButtons: [] })
    }

    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: user.id }
    })

    if (!affiliateProfile) {
      return NextResponse.json({ ctaButtons: [] })
    }

    const bioPage = await prisma.affiliateBioPage.findFirst({
      where: { affiliateId: affiliateProfile.id }
    })

    if (!bioPage) {
      return NextResponse.json({ ctaButtons: [] })
    }

    // Fetch CTA buttons with related data
    const ctaButtons = await prisma.affiliateBioCTA.findMany({
      where: { bioPageId: bioPage.id },
      orderBy: { displayOrder: 'asc' }
    })

    // Manually fetch related data for each CTA
    const ctaButtonsWithRelations = await Promise.all(
      ctaButtons.map(async (cta) => {
        const [membership, product, course, optinForm] = await Promise.all([
          cta.membershipId ? prisma.membership.findUnique({ where: { id: cta.membershipId } }) : null,
          cta.productId ? prisma.product.findUnique({ where: { id: cta.productId } }) : null,
          cta.courseId ? prisma.course.findUnique({ where: { id: cta.courseId } }) : null,
          cta.optinFormId ? prisma.affiliateOptinForm.findUnique({ where: { id: cta.optinFormId } }) : null
        ])
        return { ...cta, membership, product, course, optinForm }
      })
    )

    return NextResponse.json({
      ctaButtons: ctaButtonsWithRelations
    })
  } catch (error) {
    console.error('Error fetching CTA buttons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CTA buttons' },
      { status: 500 }
    )
  }
}
