import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/mentor/materials/files - Create new file for a lesson
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { lessonId, title, fileName, fileUrl, fileType, fileSize } = body

    if (!lessonId || !title || !fileUrl) {
      return NextResponse.json(
        { error: 'lessonId, title, and fileUrl are required' },
        { status: 400 }
      )
    }

    // Verify access to this lesson's course
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

    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (lesson.module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get max order
    const maxOrder = await prisma.lessonFile.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const file = await prisma.lessonFile.create({
      data: {
        lessonId,
        title,
        fileName: fileName || title,
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize || null,
        order: (maxOrder?.order || 0) + 1
      }
    })

    return NextResponse.json({ 
      success: true,
      file 
    })
  } catch (error) {
    console.error('POST /api/mentor/materials/files error:', error)
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}

// GET /api/mentor/materials/files - Get files for a lesson
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const files = await prisma.lessonFile.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ 
      success: true,
      files 
    })
  } catch (error) {
    console.error('GET /api/mentor/materials/files error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
