import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// DELETE /api/mentor/materials/modules/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: moduleId } = await params

    // Get module with course info
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: true
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Delete module (cascade will delete lessons)
    await prisma.courseModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Module deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/mentor/materials/modules/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    )
  }
}

// PUT /api/mentor/materials/modules/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: moduleId } = await params
    const body = await request.json()
    const { title, description, order } = body

    // Get module with course info
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: true
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const updatedModule = await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        title: title || module.title,
        description: description !== undefined ? description : module.description,
        order: order !== undefined ? order : module.order
      }
    })

    return NextResponse.json({ 
      success: true,
      module: updatedModule
    })
  } catch (error) {
    console.error('PUT /api/mentor/materials/modules/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}
