import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/lead-magnets
 * Get all lead magnets (admin only)
 */
export async function GET(req: NextRequest) {
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

    const leadMagnets = await prisma.leadMagnet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { optinForms: true }
        }
      }
    })

    return NextResponse.json({ leadMagnets })
  } catch (error) {
    console.error('[ADMIN] Error fetching lead magnets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead magnets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/lead-magnets
 * Create new lead magnet (admin only)
 */
export async function POST(req: NextRequest) {
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

    // Validation
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    if (!['PDF', 'VIDEO', 'EVENT', 'WHATSAPP'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be PDF, VIDEO, EVENT, or WHATSAPP' },
        { status: 400 }
      )
    }

    // Type-specific validation
    if (type === 'PDF' && !fileUrl) {
      return NextResponse.json({ error: 'PDF requires fileUrl' }, { status: 400 })
    }
    if (type === 'VIDEO' && !fileUrl) {
      return NextResponse.json({ error: 'VIDEO requires fileUrl' }, { status: 400 })
    }
    if (type === 'EVENT' && !eventLink) {
      return NextResponse.json({ error: 'EVENT requires eventLink' }, { status: 400 })
    }
    if (type === 'WHATSAPP' && !whatsappUrl) {
      return NextResponse.json({ error: 'WHATSAPP requires whatsappUrl' }, { status: 400 })
    }

    const leadMagnet = await prisma.leadMagnet.create({
      data: {
        title,
        description,
        type,
        fileUrl,
        eventLink,
        whatsappUrl,
        thumbnailUrl,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: user.id
      }
    })

    return NextResponse.json({
      message: 'Lead magnet created successfully',
      leadMagnet
    })
  } catch (error) {
    console.error('[ADMIN] Error creating lead magnet:', error)
    return NextResponse.json(
      { error: 'Failed to create lead magnet' },
      { status: 500 }
    )
  }
}
