import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/mentor/materials/lessons/[id]
export async function GET(
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

    const { id: lessonId } = await params

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true
          }
        },
        files: true
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (lesson.module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json({ 
      success: true,
      lesson 
    })
  } catch (error) {
    console.error('GET /api/mentor/materials/lessons/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }
}

// PUT /api/mentor/materials/lessons/[id]
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

    const { id: lessonId } = await params
    const body = await request.json()
    const { title, content, videoUrl, duration, isFree, order } = body

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (lesson.module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const updatedLesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        title: title !== undefined ? title : lesson.title,
        content: content !== undefined ? content : lesson.content,
        videoUrl: videoUrl !== undefined ? videoUrl : lesson.videoUrl,
        duration: duration !== undefined ? duration : lesson.duration,
        isFree: isFree !== undefined ? isFree : lesson.isFree,
        order: order !== undefined ? order : lesson.order
      }
    })

    return NextResponse.json({ 
      success: true,
      lesson: updatedLesson 
    })
  } catch (error) {
    console.error('PUT /api/mentor/materials/lessons/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

// DELETE /api/mentor/materials/lessons/[id]
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

    const { id: lessonId } = await params

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (lesson.module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    await prisma.courseLesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Lesson deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/mentor/materials/lessons/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}
