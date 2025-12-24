import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET all modules for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId } = await params

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    })

    // Fetch lessons for all modules
    const moduleIds = modules.map(m => m.id)
    const lessons = moduleIds.length > 0
      ? await prisma.courseLesson.findMany({
          where: { moduleId: { in: moduleIds } },
          orderBy: { order: 'asc' }
        })
      : []

    // Group lessons by moduleId and count
    const lessonsByModule = new Map<string, typeof lessons>()
    for (const lesson of lessons) {
      const existing = lessonsByModule.get(lesson.moduleId) || []
      existing.push(lesson)
      lessonsByModule.set(lesson.moduleId, existing)
    }

    // Add lessons and count to modules
    const modulesWithLessons = modules.map(m => ({
      ...m,
      lessons: lessonsByModule.get(m.id) || [],
      _count: {
        lessons: (lessonsByModule.get(m.id) || []).length
      }
    }))

    return NextResponse.json({ modules: modulesWithLessons })
  } catch (error) {
    console.error('Get modules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

// POST create new module
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await req.json()
    const { title, description, order } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Create module
    const module = await prisma.courseModule.create({
      data: {
        title,
        description: description || '',
        order: order || 1,
        courseId
      }
    })

    return NextResponse.json({
      message: 'Module created successfully',
      module
    }, { status: 201 })
  } catch (error) {
    console.error('Create module error:', error)
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    )
  }
}
