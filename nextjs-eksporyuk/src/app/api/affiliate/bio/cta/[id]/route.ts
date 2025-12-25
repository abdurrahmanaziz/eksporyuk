import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * PUT /api/affiliate/bio/cta/[id]
 * Update CTA button
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    console.log('Updating CTA button:', { id, body })

    // Check ownership (manual lookups)
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
      return NextResponse.json({ error: 'Bio page not found' }, { status: 404 })
    }

    const ctaButton = await prisma.affiliateBioCTA.findFirst({
      where: { id, bioPageId: bioPage.id }
    })

    if (!ctaButton) {
      return NextResponse.json({ error: 'CTA button not found' }, { status: 404 })
    }

    // Prepare update data, only include fields that are provided
    const updateData: any = {}
    
    if (body.buttonText !== undefined) updateData.buttonText = body.buttonText
    if (body.buttonType !== undefined) updateData.buttonType = body.buttonType
    if (body.buttonStyle !== undefined) updateData.buttonStyle = body.buttonStyle
    if (body.targetType !== undefined) updateData.targetType = body.targetType
    if (body.customUrl !== undefined) updateData.targetUrl = body.customUrl
    if (body.backgroundColor !== undefined) updateData.backgroundColor = body.backgroundColor
    if (body.textColor !== undefined) updateData.textColor = body.textColor
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl || null
    if (body.price !== undefined) updateData.price = body.price || null
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice || null
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle || null
    if (body.showPrice !== undefined) updateData.showPrice = body.showPrice
    if (body.showThumbnail !== undefined) updateData.showThumbnail = body.showThumbnail
    if (body.titleSize !== undefined) updateData.titleSize = body.titleSize || 'sm'
    if (body.subtitleSize !== undefined) updateData.subtitleSize = body.subtitleSize || 'xs'
    if (body.buttonTextSize !== undefined) updateData.buttonTextSize = body.buttonTextSize || 'sm'
    
    // Handle foreign keys - set to null if empty string, otherwise use the value
    if (body.membershipId !== undefined) updateData.membershipId = body.membershipId || null
    if (body.productId !== undefined) updateData.productId = body.productId || null
    if (body.courseId !== undefined) updateData.courseId = body.courseId || null
    if (body.optinFormId !== undefined) {
      updateData.optinFormId = body.optinFormId || null
      if (body.optinFormId && body.optinDisplayMode !== undefined) {
        updateData.optinDisplayMode = body.optinDisplayMode || 'button'
      }
    }

    console.log('Update data:', updateData)

    // Update CTA button
    const updated = await prisma.affiliateBioCTA.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: 'CTA button updated successfully',
      ctaButton: updated
    })
  } catch (error) {
    console.error('Error updating CTA button:', error)
    return NextResponse.json(
      { error: 'Failed to update CTA button' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/affiliate/bio/cta/[id]
 * Delete CTA button
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership (manual lookups)
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
      return NextResponse.json({ error: 'Bio page not found' }, { status: 404 })
    }

    const ctaButton = await prisma.affiliateBioCTA.findFirst({
      where: { id, bioPageId: bioPage.id }
    })

    if (!ctaButton) {
      return NextResponse.json({ error: 'CTA button not found' }, { status: 404 })
    }

    // Delete CTA button
    await prisma.affiliateBioCTA.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'CTA button deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting CTA button:', error)
    return NextResponse.json(
      { error: 'Failed to delete CTA button' },
      { status: 500 }
    )
  }
}
