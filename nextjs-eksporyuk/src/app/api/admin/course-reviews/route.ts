import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/course-reviews
 * Admin get all reviews with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const isApproved = searchParams.get('isApproved')
    const courseId = searchParams.get('courseId')
    const rating = searchParams.get('rating')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (isApproved !== null && isApproved !== undefined) {
      where.isApproved = isApproved === 'true'
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    if (search) {
      where.OR = [
        { review: { contains: search } },
        {
          user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } }
            ]
          }
        },
        {
          course: {
            title: { contains: search }
          }
        }
      ]
    }

    // Get reviews
    const [reviews, total, stats] = await Promise.all([
      prisma.courseReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      }),
      prisma.courseReview.count({ where }),
      prisma.courseReview.groupBy({
        by: ['isApproved'],
        _count: {
          isApproved: true
        }
      })
    ])

    // Get statistics
    const statsObj = {
      total: total,
      approved: stats.find(s => s.isApproved === true)?._count.isApproved || 0,
      pending: stats.find(s => s.isApproved === false)?._count.isApproved || 0
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statsObj
    })
  } catch (error) {
    console.error('Get admin reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    )
  }
}
