import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/marketing-kit/[id]
 * Get single marketing material
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const material = await prisma.affiliateMaterial.findUnique({
      where: { id },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/marketing-kit/[id]
 * Update marketing material
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const { title, description, type, category, content, fileUrl, thumbnailUrl, isActive } = data

    // Check if material exists
    const existing = await prisma.affiliateMaterial.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const material = await prisma.affiliateMaterial.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        type: type ?? existing.type,
        category: category ?? existing.category,
        content: content ?? existing.content,
        fileUrl: fileUrl ?? existing.fileUrl,
        thumbnailUrl: thumbnailUrl ?? existing.thumbnailUrl,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/marketing-kit/[id]
 * Delete marketing material
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if material exists
    const existing = await prisma.affiliateMaterial.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    await prisma.affiliateMaterial.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
