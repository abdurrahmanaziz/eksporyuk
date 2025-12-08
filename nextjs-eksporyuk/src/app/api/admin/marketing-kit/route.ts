import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/marketing-kit
 * Get all marketing materials (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const materials = await prisma.affiliateMaterial.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/marketing-kit
 * Create new marketing material
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const { title, description, type, category, content, fileUrl, thumbnailUrl, isActive } = data

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    const material = await prisma.affiliateMaterial.create({
      data: {
        title,
        description: description || '',
        type,
        category: category || 'General',
        content: content || null,
        fileUrl: fileUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}
