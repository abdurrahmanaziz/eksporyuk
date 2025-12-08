import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/mentor/materials/lessons - Get lessons for a module
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify access to this module's course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      const module = await prisma.courseModule.findUnique({
        where: { id: moduleId },
        include: { course: true }
      })

      if (!module || module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        duration: true,
        order: true,
        isFree: true,
        moduleId: true,
        createdAt: true,
        files: {
          select: {
            id: true,
            title: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ 
      success: true,
      lessons 
    })
  } catch (error) {
    console.error('GET /api/mentor/materials/lessons error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

// POST /api/mentor/materials/lessons - Create new lesson
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
    const { moduleId, title, content, videoUrl, duration, isFree, order } = body

    if (!moduleId || !title) {
      return NextResponse.json(
        { error: 'moduleId and title are required' },
        { status: 400 }
      )
    }

    // Verify access to this module's course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      const module = await prisma.courseModule.findUnique({
        where: { id: moduleId },
        include: { course: true }
      })

      if (!module || module.course.mentorId !== mentorProfile?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get max order
    const maxOrder = await prisma.courseLesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const lesson = await prisma.courseLesson.create({
      data: {
        moduleId,
        title,
        content: content || '',
        videoUrl: videoUrl || null,
        duration: duration || null,
        isFree: isFree || false,
        order: order || (maxOrder?.order || 0) + 1
      }
    })

    return NextResponse.json({ 
      success: true,
      lesson 
    })
  } catch (error) {
    console.error('POST /api/mentor/materials/lessons error:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}
