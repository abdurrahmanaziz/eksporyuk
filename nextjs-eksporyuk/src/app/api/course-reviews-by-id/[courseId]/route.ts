import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/course-reviews-by-id/[courseId]
 * Get all reviews for a course with pagination and filters
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating') // Filter by rating (1-5)
    const sortBy = searchParams.get('sortBy') || 'recent' // recent, helpful, rating
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      courseId: courseId,
      isApproved: true
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'helpful') {
      orderBy = { helpfulCount: 'desc' }
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' }
    }

    // Get reviews
    const [reviews, total] = await Promise.all([
      prisma.courseReview.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      }),
      prisma.courseReview.count({ where })
    ])

    // Get rating statistics
    const stats = await prisma.courseReview.groupBy({
      by: ['rating'],
      where: {
        courseId: params.id,
        isApproved: true
      },
      _count: {
        rating: true
      }
    })

    const ratingStats = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      total: total,
      average: 0
    }

    let totalRating = 0
    stats.forEach(stat => {
      ratingStats[stat.rating as 1 | 2 | 3 | 4 | 5] = stat._count.rating
      totalRating += stat.rating * stat._count.rating
    })

    if (total > 0) {
      ratingStats.average = parseFloat((totalRating / total).toFixed(1))
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: ratingStats
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/course-reviews-by-id/[courseId]
 * Submit a review for a course (only enrolled students)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { rating, review } = await req.json()

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!review || review.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled to review this course' },
        { status: 403 }
      )
    }

    // Check if review already exists
    const existingReview = await prisma.courseReview.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    })

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.courseReview.update({
        where: { id: existingReview.id },
        data: {
          rating,
          review: review.trim(),
          isVerified: enrollment.completed
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      })

      // Update course rating
      await updateCourseRating(courseId)

      return NextResponse.json({
        message: 'Review updated successfully',
        review: updatedReview
      })
    }

    // Create new review
    const newReview = await prisma.courseReview.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        rating,
        review: review.trim(),
        isVerified: enrollment.completed,
        isApproved: true // Auto-approve by default
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Update course rating
    await updateCourseRating(courseId)

    // Create notification for course mentor
    await prisma.notification.create({
      data: {
        userId: course.mentorId,
        type: 'PRODUCT_REVIEW',
        title: 'New Course Review',
        message: `${session.user.name} left a ${rating}-star review on ${course.title}`,
        link: `/mentor/courses/${course.id}?tab=reviews`
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'COURSE_REVIEW_CREATED',
        entity: 'COURSE',
        entityId: courseId,
        metadata: {
          reviewId: newReview.id,
          rating
        }
      }
    })

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: newReview
    }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
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
    },
    _count: {
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
