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

    // Get all courses by this mentor (Course has no relations - query separately)
    const courses = await prisma.course.findMany({
      where: {
        mentorId: session.user.id
      }
    })

    const courseIds = courses.map(c => c.id)

    // Calculate course status counts
    const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length
    const pendingCourses = courses.filter(c => c.status === 'PENDING').length
    const draftCourses = courses.filter(c => c.status === 'DRAFT').length

    // Calculate total students (CourseEnrollment has no relations - use courseId in)
    const totalStudents = await prisma.courseEnrollment.count({
      where: {
        courseId: { in: courseIds }
      }
    })

    // Calculate active students (UserCourseProgress has no relations - use courseId in)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeStudents = await prisma.userCourseProgress.count({
      where: {
        courseId: { in: courseIds },
        lastAccessedAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Calculate total revenue - get enrollments and map prices from courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: { in: courseIds }
      }
    })

    // Create course price map
    const coursePriceMap = new Map(courses.map(c => [c.id, Number(c.price) || 0]))
    const courseTitleMap = new Map(courses.map(c => [c.id, c.title]))

    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      return sum + (coursePriceMap.get(enrollment.courseId) || 0)
    }, 0)

    // Calculate monthly revenue (current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: { in: courseIds },
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const monthlyRevenue = monthlyEnrollments.reduce((sum, enrollment) => {
      return sum + (coursePriceMap.get(enrollment.courseId) || 0)
    }, 0)

    // Calculate average rating (CourseReview has no relations - use courseId in)
    const reviews = await prisma.courseReview.findMany({
      where: {
        courseId: { in: courseIds }
      }
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

    // Calculate completion rate
    const completedEnrollments = await prisma.courseEnrollment.count({
      where: {
        courseId: { in: courseIds },
        completed: true
      }
    })

    const completionRate = totalStudents > 0
      ? (completedEnrollments / totalStudents) * 100
      : 0

    // Get recent enrollments (without relations - query users separately)
    const recentEnrollmentsData = await prisma.courseEnrollment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get user names for recent enrollments
    const userIds = [...new Set(recentEnrollmentsData.map(e => e.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    })
    const userNameMap = new Map(users.map(u => [u.id, u.name]))

    const recentEnrollments = recentEnrollmentsData.map(enrollment => ({
      id: enrollment.id,
      courseName: courseTitleMap.get(enrollment.courseId) || 'Unknown Course',
      studentName: userNameMap.get(enrollment.userId) || 'Unknown Student',
      enrolledAt: enrollment.createdAt.toISOString()
    }))

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
      recentEnrollments
    })

  } catch (error) {
    console.error('Failed to fetch mentor dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
