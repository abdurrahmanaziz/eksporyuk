import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


type Params = {
  id: string
}

// GET /api/admin/certificate-templates/[id] - Get single template
export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/certificate-templates/[id] - Update template
export async function PUT(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const body = await req.json()

    const existing = await prisma.certificateTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (body.isDefault && !existing.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: params.id }
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.certificateTemplate.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        backgroundColor: body.backgroundColor,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        textColor: body.textColor,
        layout: body.layout,
        logoUrl: body.logoUrl,
        signatureUrl: body.signatureUrl,
        backgroundImage: body.backgroundImage,
        borderStyle: body.borderStyle,
        fontFamily: body.fontFamily,
        titleFontSize: body.titleFontSize,
        mentorName: body.mentorName,
        directorName: body.directorName,
        showLogo: body.showLogo,
        showSignature: body.showSignature,
        showQrCode: body.showQrCode,
        showBorder: body.showBorder,
        isActive: body.isActive,
        isDefault: body.isDefault
      }
    })

    return NextResponse.json({ 
      template,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/certificate-templates/[id] - Delete template
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    
    // Check if template is in use
    const coursesCount = await prisma.course.count({
      where: { certificateTemplateId: params.id }
    })

    if (coursesCount > 0) {
      return NextResponse.json({ 
        message: `Cannot delete template. It is being used by ${coursesCount} course(s)`,
        coursesCount 
      }, { status: 400 })
    }

    await prisma.certificateTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
