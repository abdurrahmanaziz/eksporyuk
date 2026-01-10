import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET single lesson
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { moduleId, lessonId } = await params

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

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { moduleId, lessonId } = await params
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

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { moduleId, lessonId } = await params

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
