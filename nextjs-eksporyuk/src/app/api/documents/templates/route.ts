import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }
    
    if (type) where.type = type
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    // Non-admins only see active templates
    if (session.user.role !== 'ADMIN') {
      where.isActive = true
    }

    const templates = await prisma.exportDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        isActive: true,
        isPremium: true,
        createdAt: true
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, description, templateHtml, templateFields, isActive, isPremium } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const template = await prisma.exportDocument.create({
      data: {
        name,
        type,
        description,
        templateHtml: templateHtml || '<html><body>Template</body></html>',
        templateFields: templateFields ? JSON.parse(templateFields) : {},
        isActive: isActive ?? true,
        isPremium: isPremium ?? false,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
