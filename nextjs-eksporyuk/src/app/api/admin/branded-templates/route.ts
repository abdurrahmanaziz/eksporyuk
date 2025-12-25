import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/branded-templates
 * Fetch all branded templates with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    
    if (category) where.category = category
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [templates, totalCount] = await Promise.all([
      prisma.brandedTemplate.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.brandedTemplate.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('[Branded Templates API] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/branded-templates
 * Create a new branded template
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
      description,
      category,
      type,
      roleTarget,
      subject,
      content,
      ctaText,
      ctaLink,
      priority,
      isDefault,
      isSystem,
      isActive,
      tags,
      variables,
      previewData,
      customBranding
    } = body

    // Generate unique slug
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    while (await prisma.brandedTemplate.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Validate required fields
    if (!name || !category || !type || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults in same category
    if (isDefault) {
      await prisma.brandedTemplate.updateMany({
        where: {
          category,
          type,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    const template = await prisma.brandedTemplate.create({
      data: {
        name,
        slug,
        description,
        category,
        type,
        roleTarget,
        subject,
        content,
        ctaText,
        ctaLink,
        priority: priority || 'NORMAL',
        isDefault: isDefault || false,
        isSystem: isSystem || false,
        isActive: isActive !== false,
        tags: tags || [],
        variables: variables || {},
        previewData: previewData || {},
        customBranding: customBranding || null,
        createdBy: session.user.id
      },
    })

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('[Branded Templates API] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}