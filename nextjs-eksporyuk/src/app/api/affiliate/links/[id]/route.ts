import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH /api/affiliate/links/[id] - Update link (archive status or coupon)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  let session: any = null
  let linkId: string = ''
  let body: any = {}
  
  try {
    session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    linkId = resolvedParams.id

    body = await request.json()
    const { isArchived, couponCode } = body

    // Verify the link belongs to the user
    const link = await prisma.affiliateLink.findUnique({
      where: { id: linkId },
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

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        link: link,
      })
    }

    // Update link
    const updatedLink = await prisma.affiliateLink.update({
      where: { id: linkId },
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
  } catch (error: any) {
    console.error('PATCH /api/affiliate/links/[id] ERROR:', {
      linkId,
      userId: session?.user?.id,
      bodyReceived: body,
      errorMessage: error.message,
      errorStack: error.stack,
    })
    return NextResponse.json(
      { error: 'Failed to update link', details: error.message },
      { status: 500 }
    )
  }
}
