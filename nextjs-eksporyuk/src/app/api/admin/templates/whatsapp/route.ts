import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Get all WhatsApp templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const roleTarget = searchParams.get('roleTarget')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (roleTarget && roleTarget !== 'ALL') {
      where.roleTarget = roleTarget
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [templates, total] = await Promise.all([
      prisma.whatsAppTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.whatsAppTemplate.count({ where }),
    ])

    return NextResponse.json({ 
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Get WhatsApp templates error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST - Create new WhatsApp template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      category,
      roleTarget,
      message, 
      ctaText,
      ctaLink,
      maxLength,
      variables,
      metadata
    } = body

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      )
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        category: category || 'SISTEM',
        roleTarget: roleTarget || 'ALL',
        message,
        ctaText,
        ctaLink,
        maxLength: maxLength || 1024,
        variables: variables || [],
        metadata: metadata || {},
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Create WhatsApp template error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

// PUT - Update WhatsApp template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      name, 
      category,
      roleTarget,
      message, 
      ctaText,
      ctaLink,
      maxLength,
      variables, 
      metadata,
      isActive 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        name,
        category,
        roleTarget,
        message,
        ctaText,
        ctaLink,
        maxLength,
        variables: variables || [],
        metadata: metadata || {},
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Update WhatsApp template error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE - Delete WhatsApp template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    await prisma.whatsAppTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete WhatsApp template error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
