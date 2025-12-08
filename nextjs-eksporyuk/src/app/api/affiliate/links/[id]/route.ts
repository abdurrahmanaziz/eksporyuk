import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// PATCH /api/affiliate/links/[id] - Archive/Unarchive a link
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isArchived } = await request.json()

    // Verify the link belongs to the user
    const link = await prisma.affiliateLink.findUnique({
      where: { id: params.id },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    if (link.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update archive status
    const updatedLink = await prisma.affiliateLink.update({
      where: { id: params.id },
      data: { isArchived },
    })

    return NextResponse.json({
      success: true,
      link: {
        id: updatedLink.id,
        isArchived: updatedLink.isArchived,
      },
    })
  } catch (error) {
    console.error('Error updating link:', error)
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    )
  }
}
