import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId]/video/upload
 * Upload video for a lesson
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, moduleId, lessonId } = await params

    // Check if user is admin or mentor of this course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch mentor data separately
    let mentorUserId: string | null = null
    if (course.mentorId) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: course.mentorId }
      })
      mentorUserId = mentor?.userId || null
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isMentor = mentorUserId === session.user.id

    if (!isAdmin && !isMentor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify module exists
    const module = await prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        courseId
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify lesson exists
    const lesson = await prisma.courseLesson.findFirst({
      where: {
        id: lessonId,
        moduleId
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Get form data
    const formData = await req.formData()
    const videoUrl = formData.get('videoUrl') as string
    const duration = formData.get('duration') as string
    const videoId = formData.get('videoId') as string

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required' },
        { status: 400 }
      )
    }

    // Update lesson with video URL
    const updatedLesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        videoUrl,
        duration: duration ? parseInt(duration) : null
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        id: createId(),
        userId: session.user.id,
        action: 'VIDEO_UPLOADED',
        entity: 'LESSON',
        entityId: lessonId,
        metadata: {
          courseId,
          moduleId,
          lessonId,
          videoUrl,
          videoId
        }
      }
    })

    return NextResponse.json({
      success: true,
      lesson: updatedLesson,
      message: 'Video uploaded successfully'
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId]/video/upload
 * Remove video from lesson
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, moduleId, lessonId } = await params

    // Check if user is admin or mentor of this course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch mentor data separately
    let deleteMentorUserId: string | null = null
    if (course.mentorId) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: course.mentorId }
      })
      deleteMentorUserId = mentor?.userId || null
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isMentor = deleteMentorUserId === session.user.id

    if (!isAdmin && !isMentor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get lesson
    const lesson = await prisma.courseLesson.findFirst({
      where: {
        id: lessonId,
        moduleId
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Remove video URL from lesson
    const updatedLesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: null,
        duration: null
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        id: createId(),
        userId: session.user.id,
        action: 'VIDEO_DELETED',
        entity: 'LESSON',
        entityId: lessonId,
        metadata: {
          courseId,
          moduleId,
          lessonId,
          oldVideoUrl: lesson.videoUrl
        }
      }
    })

    return NextResponse.json({
      success: true,
      lesson: updatedLesson,
      message: 'Video removed successfully'
    })
  } catch (error) {
    console.error('Video delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
