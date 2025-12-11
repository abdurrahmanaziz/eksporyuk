import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { notifyCourseRejected } from '@/lib/notifications'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/mentor/courses/[id]/reject - Reject course (ADMIN only)
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
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Find course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        mentor: {
          include: {
            user: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Update course status to REJECTED
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        reviewedBy: session.user.id,
        isPublished: false
      }
    })

    // Send notification to mentor
    await notifyCourseRejected(courseId, course.mentorId, reason).catch((err) =>
      console.error('Failed to send course rejection notification:', err)
    )

    return NextResponse.json({
      success: true,
      course: updatedCourse
    })
  } catch (error) {
    console.error('POST /api/mentor/courses/[id]/reject error:', error)
    return NextResponse.json(
      { error: 'Failed to reject course' },
      { status: 500 }
    )
  }
}
