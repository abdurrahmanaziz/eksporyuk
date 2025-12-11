import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is mentor or admin
    if (session.user.role !== 'MENTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Mentor access required' },
        { status: 403 }
      )
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!mentorProfile) {
      // Create mentor profile if doesn't exist
      await prisma.mentorProfile.create({
        data: {
          userId: session.user.id
        }
      })
    }

    // Get all courses by this mentor
    const courses = await prisma.course.findMany({
      where: {
        mentorId: session.user.id
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      }
    })

    // Calculate course status counts
    const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length
    const pendingCourses = courses.filter(c => c.status === 'PENDING').length
    const draftCourses = courses.filter(c => c.status === 'DRAFT').length

    // Calculate total students (unique enrollments across all courses)
    const totalStudents = await prisma.courseEnrollment.count({
      where: {
        course: {
          mentorId: session.user.id
        }
      }
    })

    // Calculate active students (students who accessed course in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeStudents = await prisma.userCourseProgress.count({
      where: {
        course: {
          mentorId: session.user.id
        },
        lastAccessedAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Calculate total revenue
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        course: {
          mentorId: session.user.id
        }
      },
      include: {
        course: {
          select: {
            price: true
          }
        }
      }
    })

    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      return sum + Number(enrollment.course.price)
    }, 0)

    // Calculate monthly revenue (current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        course: {
          mentorId: session.user.id
        },
        createdAt: {
          gte: startOfMonth
        }
      },
      include: {
        course: {
          select: {
            price: true
          }
        }
      }
    })

    const monthlyRevenue = monthlyEnrollments.reduce((sum, enrollment) => {
      return sum + Number(enrollment.course.price)
    }, 0)

    // Calculate average rating
    const reviews = await prisma.courseReview.findMany({
      where: {
        course: {
          mentorId: session.user.id
        }
      }
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

    // Calculate completion rate
    const completedEnrollments = await prisma.courseEnrollment.count({
      where: {
        course: {
          mentorId: session.user.id
        },
        completed: true
      }
    })

    const completionRate = totalStudents > 0
      ? (completedEnrollments / totalStudents) * 100
      : 0

    // Get recent enrollments
    const recentEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        course: {
          mentorId: session.user.id
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      totalCourses: courses.length,
      publishedCourses,
      pendingCourses,
      draftCourses,
      totalStudents,
      activeStudents,
      totalRevenue,
      monthlyRevenue,
      averageRating,
      totalReviews: reviews.length,
      completionRate,
      recentEnrollments: recentEnrollments.map(enrollment => ({
        id: enrollment.id,
        courseName: enrollment.course.title,
        studentName: enrollment.user.name,
        enrolledAt: enrollment.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Failed to fetch mentor dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
