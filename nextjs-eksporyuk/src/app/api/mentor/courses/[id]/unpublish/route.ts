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

// POST /api/mentor/courses/[id]/unpublish - Unpublish course
export async function POST(
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

    const { id: courseId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only unpublish your own courses' }, { status: 403 })
      }
    }

    // Find course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Update course to unpublished
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        isPublished: false,
        status: 'APPROVED' // Keep as approved but not published
      }
    })

    return NextResponse.json({
      success: true,
      course: updatedCourse
    })
  } catch (error) {
    console.error('POST /api/mentor/courses/[id]/unpublish error:', error)
    return NextResponse.json(
      { error: 'Failed to unpublish course' },
      { status: 500 }
    )
  }
}
