import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error: any) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, category, roleTarget, subject, body: emailBody, ctaText, ctaLink, isActive } = body

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        category: category || null,
        roleTarget: roleTarget || null,
        subject,
        body: emailBody,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    console.log('✅ Email template updated:', template.name)

    return NextResponse.json({
      success: true,
      message: 'Template berhasil diupdate',
      template
    })
  } catch (error: any) {
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.emailTemplate.delete({
      where: { id }
    })

    console.log('✅ Email template deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Template berhasil dihapus'
    })
  } catch (error: any) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
