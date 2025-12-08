import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

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

// POST /api/mentor/courses/[id]/publish - Publish course
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
        return NextResponse.json({ error: 'You can only publish your own courses' }, { status: 403 })
      }
    }

    // Find course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Validation: Course must have at least 1 module with 1 lesson
    if (course.modules.length === 0) {
      return NextResponse.json(
        { error: 'Course must have at least 1 module before publishing' },
        { status: 400 }
      )
    }

    const hasLessons = course.modules.some(m => m.lessons.length > 0)
    if (!hasLessons) {
      return NextResponse.json(
        { error: 'Course must have at least 1 lesson before publishing' },
        { status: 400 }
      )
    }

    // Update course to PUBLISHED
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      course: updatedCourse
    })
  } catch (error) {
    console.error('POST /api/mentor/courses/[id]/publish error:', error)
    return NextResponse.json(
      { error: 'Failed to publish course' },
      { status: 500 }
    )
  }
}
