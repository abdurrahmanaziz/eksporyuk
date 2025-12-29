import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/mentor/materials/modules - Get modules for a course
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify user has access to this course
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If mentor, verify they own this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          mentorId: mentorProfile?.id
        }
      })

      if (!course) {
        return NextResponse.json({ error: 'Course not found or access denied' }, { status: 403 })
      }
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        courseId: true,
        _count: {
          select: { lessons: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ 
      success: true,
      modules 
    })
  } catch (error) {
    console.error('GET /api/mentor/materials/modules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

// POST /api/mentor/materials/modules - Create new module
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
    const { courseId, title, description, order } = body

    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'courseId and title are required' },
        { status: 400 }
      )
    }

    // Verify mentor owns this course
    if (user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id }
      })

      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          mentorId: mentorProfile?.id
        }
      })

      if (!course) {
        return NextResponse.json({ error: 'Course not found or access denied' }, { status: 403 })
      }
    }

    // Get max order
    const maxOrder = await prisma.courseModule.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const module = await prisma.courseModule.create({
      data: {
        courseId,
        title,
        description: description || '',
        order: order || (maxOrder?.order || 0) + 1
      }
    })

    return NextResponse.json({ 
      success: true,
      module 
    })
  } catch (error) {
    console.error('POST /api/mentor/materials/modules error:', error)
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    )
  }
}
