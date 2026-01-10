import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET all lessons for a module
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { moduleId } = await params

    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Get lessons error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMsg)
    return NextResponse.json(
      { 
        error: 'Failed to fetch lessons',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}

// POST create new lesson
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, moduleId } = await params
    const body = await req.json()
    const { title, content, videoUrl, duration, order, isFree } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check if module exists
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId }
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Create lesson
    const lessonId = `les_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const lesson = await prisma.courseLesson.create({
      data: {
        id: lessonId,
        title,
        content: content || '',
        videoUrl: videoUrl || null,
        duration: duration || null,
        order: order || 1,
        isFree: isFree || false,
        moduleId,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Lesson created successfully',
      lesson
    }, { status: 201 })
  } catch (error) {
    console.error('Create lesson error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMsg)
    return NextResponse.json(
      { 
        error: 'Failed to create lesson',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}
