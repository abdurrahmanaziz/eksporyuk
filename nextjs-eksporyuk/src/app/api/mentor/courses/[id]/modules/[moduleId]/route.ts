import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Helper function to check course ownership for mentor
async function checkCourseAccess(userId: string, userRole: string, courseId: string) {
  if (userRole === 'ADMIN') return { allowed: true }
  
  const mentorProfile = await prisma.mentor.findUnique({
    where: { userId }
  })
  
  if (!mentorProfile) return { allowed: false }
  
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { mentorId: true }
  })
  
  if (!course) return { allowed: false }
  
  return { allowed: course.mentorId === mentorProfile.id }
}

// GET single module
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
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

    const { id: courseId, moduleId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only view your own course modules' }, { status: 403 })
      }
    }

    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json({ module })
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

    const { id: courseId, moduleId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only edit your own course modules' }, { status: 403 })
      }
    }
    
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

    const { id: courseId, moduleId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only delete your own course modules' }, { status: 403 })
      }
    }

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
