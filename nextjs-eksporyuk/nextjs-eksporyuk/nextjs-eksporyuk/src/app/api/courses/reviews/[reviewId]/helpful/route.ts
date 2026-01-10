import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/courses/reviews/[reviewId]/helpful
 * Mark a review as helpful (toggle)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if review exists
    const review = await prisma.courseReview.findUnique({
      where: { id: params.reviewId }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if user already voted
    const existingVote = await prisma.courseReviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId: params.reviewId,
          userId: session.user.id
        }
      }
    })

    if (existingVote) {
      // Remove vote
      await prisma.courseReviewHelpful.delete({
        where: { id: existingVote.id }
      })

      // Decrement helpful count
      await prisma.courseReview.update({
        where: { id: params.reviewId },
        data: {
          helpfulCount: {
            decrement: 1
          },
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Vote removed',
        helpful: false
      })
    } else {
      // Add vote (CourseReviewHelpful requires manual id)
      await prisma.courseReviewHelpful.create({
        data: {
          id: `helpful_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          reviewId: params.reviewId,
          userId: session.user.id
        }
      })

      // Increment helpful count
      const updatedReview = await prisma.courseReview.update({
        where: { id: params.reviewId },
        data: {
          helpfulCount: {
            increment: 1
          },
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Marked as helpful',
        helpful: true,
        helpfulCount: updatedReview.helpfulCount
      })
    }
  } catch (error) {
    console.error('Helpful vote error:', error)
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}
