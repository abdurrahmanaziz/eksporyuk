import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/certificate-templates - Get all templates
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const templates = await prisma.certificateTemplate.findMany({
      where,
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ 
      templates,
      total: templates.length 
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/certificate-templates - Create new template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      name,
      description,
      backgroundColor = '#FFFFFF',
      primaryColor = '#3B82F6',
      secondaryColor,
      textColor = '#1F2937',
      layout = 'MODERN',
      logoUrl,
      signatureUrl,
      backgroundImage,
      borderStyle,
      fontFamily = 'Inter',
      titleFontSize = '3xl',
      mentorName,
      directorName,
      showLogo = true,
      showSignature = true,
      showQrCode = true,
      showBorder = true,
      isActive = true,
      isDefault = false
    } = body

    if (!name) {
      return NextResponse.json(
        { message: 'Template name is required' },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        description,
        backgroundColor,
        primaryColor,
        secondaryColor,
        textColor,
        layout,
        logoUrl,
        signatureUrl,
        backgroundImage,
        borderStyle,
        fontFamily,
        titleFontSize,
        mentorName,
        directorName,
        showLogo,
        showSignature,
        showQrCode,
        showBorder,
        isActive,
        isDefault
      }
    })

    return NextResponse.json({ 
      template,
      message: 'Template created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
