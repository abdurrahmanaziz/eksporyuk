import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * PUT /api/admin/course-reviews/[id]
 * Admin moderate review (approve/reject/delete)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, moderationNote } = await req.json()

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const review = await prisma.courseReview.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        user: true
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update review
    const updatedReview = await prisma.courseReview.update({
      where: { id: params.id },
      data: {
        isApproved: action === 'approve',
        moderatedBy: session.user.id,
        moderatedAt: new Date(),
        moderationNote: moderationNote || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Recalculate course rating
    await updateCourseRating(review.courseId)

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: review.userId,
        type: 'SYSTEM',
        title: `Review ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your review for "${review.course.title}" has been ${action === 'approve' ? 'approved' : 'rejected'} by admin.${moderationNote ? ` Note: ${moderationNote}` : ''}`,
        link: `/courses/${review.course.slug || review.course.id}`
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `REVIEW_${action.toUpperCase()}`,
        entity: 'REVIEW',
        entityId: params.id,
        metadata: {
          courseId: review.courseId,
          reviewUserId: review.userId,
          moderationNote
        }
      }
    })

    return NextResponse.json({
      message: `Review ${action}d successfully`,
      review: updatedReview
    })
  } catch (error) {
    console.error('Moderate review error:', error)
    return NextResponse.json(
      { error: 'Failed to moderate review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/course-reviews/[id]
 * Admin delete review
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const review = await prisma.courseReview.findUnique({
      where: { id: params.id }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Delete review (helpful votes will cascade delete)
    await prisma.courseReview.delete({
      where: { id: params.id }
    })

    // Recalculate course rating
    await updateCourseRating(review.courseId)

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'REVIEW_DELETED',
        entity: 'REVIEW',
        entityId: params.id,
        metadata: {
          courseId: review.courseId,
          reviewUserId: review.userId
        }
      }
    })

    return NextResponse.json({
      message: 'Review deleted successfully'
    })
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to recalculate course rating
 */
async function updateCourseRating(courseId: string) {
  const stats = await prisma.courseReview.aggregate({
    where: {
      courseId,
      isApproved: true
    },
    _avg: {
      rating: true
    }
  })

  const avgRating = stats._avg.rating || 0

  await prisma.course.update({
    where: { id: courseId },
    data: {
      rating: avgRating
    }
  })
}
