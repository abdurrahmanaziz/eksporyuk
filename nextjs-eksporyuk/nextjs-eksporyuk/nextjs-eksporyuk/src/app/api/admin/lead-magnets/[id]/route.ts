import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/lead-magnets/[id]
 * Get single lead magnet details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const leadMagnet = await prisma.leadMagnet.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { optinForms: true }
        }
      }
    })

    if (!leadMagnet) {
      return NextResponse.json({ error: 'Lead magnet not found' }, { status: 404 })
    }

    return NextResponse.json({ leadMagnet })
  } catch (error) {
    console.error('[ADMIN] Error fetching lead magnet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead magnet' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/lead-magnets/[id]
 * Update lead magnet
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      fileUrl,
      eventLink,
      whatsappUrl,
      thumbnailUrl,
      isActive
    } = body

    // Check if lead magnet exists
    const existing = await prisma.leadMagnet.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Lead magnet not found' }, { status: 404 })
    }

    // Type-specific validation if type is being changed or URLs are provided
    const finalType = type || existing.type
    
    if (finalType === 'PDF' && fileUrl === '') {
      return NextResponse.json({ error: 'PDF requires fileUrl' }, { status: 400 })
    }
    if (finalType === 'VIDEO' && fileUrl === '') {
      return NextResponse.json({ error: 'VIDEO requires fileUrl' }, { status: 400 })
    }
    if (finalType === 'EVENT' && eventLink === '') {
      return NextResponse.json({ error: 'EVENT requires eventLink' }, { status: 400 })
    }
    if (finalType === 'WHATSAPP' && whatsappUrl === '') {
      return NextResponse.json({ error: 'WHATSAPP requires whatsappUrl' }, { status: 400 })
    }

    const leadMagnet = await prisma.leadMagnet.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(eventLink !== undefined && { eventLink }),
        ...(whatsappUrl !== undefined && { whatsappUrl }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({
      message: 'Lead magnet updated successfully',
      leadMagnet
    })
  } catch (error) {
    console.error('[ADMIN] Error updating lead magnet:', error)
    return NextResponse.json(
      { error: 'Failed to update lead magnet' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/lead-magnets/[id]
 * Delete lead magnet (soft delete by setting to inactive or hard delete if unused)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Check if lead magnet exists and is being used
    const leadMagnet = await prisma.leadMagnet.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { optinForms: true }
        }
      }
    })

    if (!leadMagnet) {
      return NextResponse.json({ error: 'Lead magnet not found' }, { status: 404 })
    }

    // If being used, only deactivate; otherwise hard delete
    if (leadMagnet._count.optinForms > 0) {
      await prisma.leadMagnet.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      return NextResponse.json({
        message: `Lead magnet deactivated (used by ${leadMagnet._count.optinForms} forms)`
      })
    } else {
      await prisma.leadMagnet.delete({
        where: { id: params.id }
      })

      return NextResponse.json({
        message: 'Lead magnet deleted permanently'
      })
    }
  } catch (error) {
    console.error('[ADMIN] Error deleting lead magnet:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead magnet' },
      { status: 500 }
    )
  }
}
