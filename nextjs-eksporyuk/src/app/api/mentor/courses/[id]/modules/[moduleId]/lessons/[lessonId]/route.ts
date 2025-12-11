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

// GET single lesson
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
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

    const { id: courseId, moduleId, lessonId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only view your own course lessons' }, { status: 403 })
      }
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson || lesson.moduleId !== moduleId) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Get lesson error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }
}

// PUT update lesson
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
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

    const { id: courseId, moduleId, lessonId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only edit your own course lessons' }, { status: 403 })
      }
    }
    
    const body = await req.json()
    const { title, content, videoUrl, duration, order, isFree } = body

    // Check if lesson exists
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson || lesson.moduleId !== moduleId) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Update lesson
    const updatedLesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        title: title !== undefined ? title : lesson.title,
        content: content !== undefined ? content : lesson.content,
        videoUrl: videoUrl !== undefined ? videoUrl : lesson.videoUrl,
        duration: duration !== undefined ? duration : lesson.duration,
        order: order !== undefined ? order : lesson.order,
        isFree: isFree !== undefined ? isFree : lesson.isFree
      }
    })

    return NextResponse.json({
      message: 'Lesson updated successfully',
      lesson: updatedLesson
    })
  } catch (error) {
    console.error('Update lesson error:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

// DELETE lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
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

    const { id: courseId, moduleId, lessonId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only delete your own course lessons' }, { status: 403 })
      }
    }

    // Check if lesson exists
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson || lesson.moduleId !== moduleId) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Delete lesson
    await prisma.courseLesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({
      message: 'Lesson deleted successfully'
    })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}
