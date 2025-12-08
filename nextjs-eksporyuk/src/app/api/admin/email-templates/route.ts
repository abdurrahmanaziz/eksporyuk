import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - List all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: [
        { isActive: 'desc' },
        { category: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error: any) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, category, roleTarget, subject, body: emailBody, ctaText, ctaLink, isActive } = body

    if (!name || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Name, subject, dan body wajib diisi' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        category: category || null,
        roleTarget: roleTarget || null,
        subject,
        body: emailBody,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        isActive: isActive !== undefined ? isActive : true,
        usageCount: 0
      }
    })

    console.log('✅ Email template created:', template.name)

    return NextResponse.json({
      success: true,
      message: 'Template berhasil dibuat',
      template
    })
  } catch (error: any) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
