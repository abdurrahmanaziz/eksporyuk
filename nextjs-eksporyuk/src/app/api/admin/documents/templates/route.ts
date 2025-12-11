import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/documents/templates - List all document templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (type) where.type = type
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [templates, total] = await Promise.all([
      prisma.exportDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              generated: true,
            },
          },
        },
      }),
      prisma.exportDocument.count({ where }),
    ])

    // Get unique types for filter
    const types = await prisma.exportDocument.findMany({
      select: { type: true },
      distinct: ['type'],
    })

    return NextResponse.json({
      templates,
      types: types.map(t => t.type),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching document templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/documents/templates - Create new document template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, description, templateHtml, templateFields, isActive, isPremium } = body

    if (!name || !type || !templateHtml) {
      return NextResponse.json({ error: 'Name, type, and templateHtml are required' }, { status: 400 })
    }

    // Parse templateFields if it's a string
    let parsedFields = templateFields
    if (typeof templateFields === 'string') {
      try {
        parsedFields = JSON.parse(templateFields)
      } catch {
        parsedFields = []
      }
    }

    const template = await prisma.exportDocument.create({
      data: {
        name,
        type,
        description: description || null,
        templateHtml,
        templateFields: parsedFields || [],
        isActive: isActive ?? true,
        isPremium: isPremium ?? false,
        createdBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error('Error creating document template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
