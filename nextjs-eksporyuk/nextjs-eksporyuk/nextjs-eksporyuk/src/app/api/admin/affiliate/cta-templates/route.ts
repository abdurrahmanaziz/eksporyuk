import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/affiliate/cta-templates
 * Get all CTA templates for admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const buttonType = searchParams.get('buttonType')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (buttonType) where.buttonType = buttonType
    if (isActive !== null) where.isActive = isActive === 'true'

    const templates = await prisma.affiliateCTATemplate.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Group by button type
    const grouped = templates.reduce((acc: any, template) => {
      if (!acc[template.buttonType]) {
        acc[template.buttonType] = []
      }
      acc[template.buttonType].push(template)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      templates,
      grouped,
      total: templates.length
    })
  } catch (error) {
    console.error('[ADMIN_CTA_TEMPLATES_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch CTA templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/affiliate/cta-templates
 * Create new CTA template
 */
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!name || !buttonText || !buttonType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const template = await prisma.affiliateCTATemplate.create({
      data: {
        name,
        buttonText,
        buttonType,
        description,
        backgroundColor: backgroundColor || '#3B82F6',
        textColor: textColor || '#FFFFFF',
        icon,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0
      }
    })

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('[ADMIN_CTA_TEMPLATE_CREATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to create CTA template' },
      { status: 500 }
    )
  }
}
