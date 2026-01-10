import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

// GET single assignment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

    const { id: courseId, assignmentId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only view your own course assignments' }, { status: 403 })
      }
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Get assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

// PUT update assignment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

    const { id: courseId, assignmentId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only edit your own course assignments' }, { status: 403 })
      }
    }
    
    const body = await req.json()
    const { 
      title, 
      description, 
      instructions,
      maxScore,
      dueDate,
      allowLateSubmission,
      allowedFileTypes,
      maxFileSize,
      isActive
    } = body

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title !== undefined ? title : assignment.title,
        description: description !== undefined ? description : assignment.description,
        instructions: instructions !== undefined ? instructions : assignment.instructions,
        maxScore: maxScore !== undefined ? maxScore : assignment.maxScore,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : assignment.dueDate,
        allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : assignment.allowLateSubmission,
        allowedFileTypes: allowedFileTypes !== undefined ? allowedFileTypes : assignment.allowedFileTypes,
        maxFileSize: maxFileSize !== undefined ? maxFileSize : assignment.maxFileSize,
        isActive: isActive !== undefined ? isActive : assignment.isActive
      }
    })

    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    })
  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// DELETE assignment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

    const { id: courseId, assignmentId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only delete your own course assignments' }, { status: 403 })
      }
    }

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment || assignment.courseId !== courseId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete assignment (will cascade delete submissions)
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({
      message: 'Assignment deleted successfully'
    })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
