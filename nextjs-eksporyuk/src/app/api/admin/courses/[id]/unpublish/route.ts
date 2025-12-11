import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/courses/[id]/unpublish - Unpublish course
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

    // Update course to unpublished
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        isPublished: false,
        status: 'APPROVED' // Keep as approved but not published
      }
    })

    return NextResponse.json({
      success: true,
      course: updatedCourse
    })
  } catch (error) {
    console.error('POST /api/admin/courses/[id]/unpublish error:', error)
    return NextResponse.json(
      { error: 'Failed to unpublish course' },
      { status: 500 }
    )
  }
}
