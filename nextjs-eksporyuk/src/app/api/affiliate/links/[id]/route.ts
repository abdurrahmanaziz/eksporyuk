import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH /api/affiliate/links/[id] - Update link (archive status or coupon)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isArchived, couponCode } = body

    // Verify the link belongs to the user
    const link = await prisma.affiliateLink.findUnique({
      where: { id: params.id },
      include: {
        membership: true,
        product: true,
        course: true,
      }
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    if (link.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (typeof isArchived === 'boolean') {
      updateData.isArchived = isArchived
    }

    // If couponCode provided, update URL
    if (couponCode !== undefined) {
      let newUrl = link.url
      
      // Remove existing coupon parameter if any
      newUrl = newUrl.replace(/[&?]coupon=[^&]*/, '')
      
      // Add new coupon if provided
      if (couponCode) {
        const separator = newUrl.includes('?') ? '&' : '?'
        newUrl = `${newUrl}${separator}coupon=${couponCode}`
      }
      
      updateData.url = newUrl
    }

    // Update link
    const updatedLink = await prisma.affiliateLink.update({
      where: { id: params.id },
      data: updateData,
      include: {
        membership: true,
        product: true,
        course: true,
      }
    })

    return NextResponse.json({
      success: true,
      link: updatedLink,
    })
  } catch (error) {
    console.error('Error updating link:', error)
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    )
  }
}
