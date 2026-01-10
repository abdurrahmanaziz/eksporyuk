import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/courses/[id]/publish - Publish course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    // Find course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch modules and lessons separately
    const modules = await prisma.courseModule.findMany({
      where: { courseId: courseId }
    })

    // Fetch lessons for all modules
    const moduleIds = modules.map(m => m.id)
    const lessons = moduleIds.length > 0 
      ? await prisma.courseLesson.findMany({
          where: { moduleId: { in: moduleIds } }
        })
      : []

    // Group lessons by moduleId
    const lessonsByModule = new Map<string, typeof lessons>()
    for (const lesson of lessons) {
      const existing = lessonsByModule.get(lesson.moduleId) || []
      existing.push(lesson)
      lessonsByModule.set(lesson.moduleId, existing)
    }

    // Validation: Course must have at least 1 module with 1 lesson
    if (modules.length === 0) {
      return NextResponse.json(
        { error: 'Course must have at least 1 module before publishing' },
        { status: 400 }
      )
    }

    const hasLessons = modules.some(m => (lessonsByModule.get(m.id)?.length || 0) > 0)
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
    console.error('POST /api/admin/courses/[id]/publish error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMsg)
    return NextResponse.json(
      { 
        error: 'Failed to publish course',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}
