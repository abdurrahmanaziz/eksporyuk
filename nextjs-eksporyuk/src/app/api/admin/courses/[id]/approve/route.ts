import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { notifyCourseApproved } from '@/lib/notifications'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/admin/courses/[id]/approve - Approve course
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

    // Update course status to APPROVED
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        reviewedBy: session.user.id,
        rejectedAt: null,
        rejectionReason: null
      }
    })

    // Send notification to mentor
    await notifyCourseApproved(courseId, course.mentorId).catch((err) =>
      console.error('Failed to send course approval notification:', err)
    )

    return NextResponse.json({
      success: true,
      course: updatedCourse
    })
  } catch (error) {
    console.error('POST /api/admin/courses/[id]/approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve course' },
      { status: 500 }
    )
  }
}
