import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Validation: Course must have at least 1 module with 1 lesson
    if (course.modules.length === 0) {
      return NextResponse.json(
        { error: 'Course must have at least 1 module before publishing' },
        { status: 400 }
      )
    }

    const hasLessons = course.modules.some(m => m.lessons.length > 0)
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
    return NextResponse.json(
      { error: 'Failed to publish course' },
      { status: 500 }
    )
  }
}
