import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET single module
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, moduleId } = await params

    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId }
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Fetch lessons separately
    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ 
      module: {
        ...module,
        lessons
      }
    })
  } catch (error) {
    console.error('Get module error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    )
  }
}

// PUT update module
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, moduleId } = await params
    const body = await req.json()
    const { title, description, order } = body

    // Check if module exists
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId }
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Update module
    const updatedModule = await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        title: title || module.title,
        description: description !== undefined ? description : module.description,
        order: order !== undefined ? order : module.order
      }
    })

    return NextResponse.json({
      message: 'Module updated successfully',
      module: updatedModule
    })
  } catch (error) {
    console.error('Update module error:', error)
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

// DELETE module
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, moduleId } = await params

    // Check if module exists
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId }
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Delete module (will cascade delete lessons)
    await prisma.courseModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({
      message: 'Module deleted successfully'
    })
  } catch (error) {
    console.error('Delete module error:', error)
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    )
  }
}
