import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// DELETE /api/admin/courses/[id]/mentors/[mentorId] - Remove mentor from course
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string, mentorId: string } }
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can remove mentors from courses' }, { status: 403 })
    }

    const courseId = params.id
    const mentorId = params.mentorId

    // Find the mentor assignment
    const courseMentor = await prisma.courseMentor.findFirst({
      where: {
        courseId,
        mentorId,
        isActive: true
      }
    })

    if (!courseMentor) {
      return NextResponse.json({ error: 'Mentor assignment not found' }, { status: 404 })
    }

    // Check if this is the only mentor - don't allow removal if it's the last one
    const activeMentorsCount = await prisma.courseMentor.count({
      where: {
        courseId,
        isActive: true
      }
    })

    if (activeMentorsCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot remove the last mentor from a course. Please add another mentor first.' 
      }, { status: 400 })
    }

    // Deactivate mentor assignment instead of hard delete
    await prisma.courseMentor.update({
      where: { id: courseMentor.id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mentor removed from course successfully'
    })

  } catch (error) {
    console.error('DELETE /api/admin/courses/[id]/mentors/[mentorId] error:', error)
    return NextResponse.json(
      { error: 'Failed to remove mentor from course' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/courses/[id]/mentors/[mentorId] - Update mentor role in course
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string, mentorId: string } }
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update mentor roles' }, { status: 403 })
    }

    const courseId = params.id
    const mentorId = params.mentorId
    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    // Find the mentor assignment
    const courseMentor = await prisma.courseMentor.findFirst({
      where: {
        courseId,
        mentorId,
        isActive: true
      }
    })

    if (!courseMentor) {
      return NextResponse.json({ error: 'Mentor assignment not found' }, { status: 404 })
    }

    // Update mentor role
    const updatedCourseMentor = await prisma.courseMentor.update({
      where: { id: courseMentor.id },
      data: { 
        role: role,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      courseMentor: updatedCourseMentor
    })

  } catch (error) {
    console.error('PUT /api/admin/courses/[id]/mentors/[mentorId] error:', error)
    return NextResponse.json(
      { error: 'Failed to update mentor role' },
      { status: 500 }
    )
  }
}