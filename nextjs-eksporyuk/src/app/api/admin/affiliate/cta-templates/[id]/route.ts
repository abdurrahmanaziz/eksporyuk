import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/affiliate/cta-templates/[id]
 * Get single CTA template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.affiliateCTATemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('[ADMIN_CTA_TEMPLATE_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/affiliate/cta-templates/[id]
 * Update CTA template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      buttonText,
      buttonType,
      description,
      backgroundColor,
      textColor,
      icon,
      isActive,
      displayOrder
    } = body

    const template = await prisma.affiliateCTATemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(buttonText && { buttonText }),
        ...(buttonType && { buttonType }),
        ...(description !== undefined && { description }),
        ...(backgroundColor && { backgroundColor }),
        ...(textColor && { textColor }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder })
      }
    })

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('[ADMIN_CTA_TEMPLATE_UPDATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/affiliate/cta-templates/[id]
 * Delete CTA template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.affiliateCTATemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('[ADMIN_CTA_TEMPLATE_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
