import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Total courses stats
    const totalCourses = await prisma.course.count()
    const publishedCourses = await prisma.course.count({
      where: { isPublished: true },
    })
    const pendingCourses = await prisma.course.count({
      where: { status: 'PENDING_REVIEW' },
    })

    // Enrollment stats
    const totalEnrollments = await prisma.courseEnrollment.count()
    const activeEnrollments = await prisma.courseEnrollment.count({
      where: { completed: false },
    })

    // Get unique active students (students with at least 1 enrollment)
    const activeStudents = await prisma.courseEnrollment.groupBy({
      by: ['userId'],
      where: { completed: false },
    })

    // Completion stats
    const completedEnrollments = await prisma.courseEnrollment.count({
      where: { completed: true },
    })

    const completionRate =
      totalEnrollments > 0
        ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1)
        : 0

    // Certificates issued
    const totalCertificates = await prisma.certificate.count()

    // Revenue stats (from course transactions)
    const courseRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'COURSE',
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    })

    // Top 5 courses by enrollment
    const topCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        thumbnail: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    // Enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const enrollmentTrends = await prisma.courseEnrollment.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    })

    // Group by date
    const trendsByDate = enrollmentTrends.reduce((acc: any, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + item._count
      return acc
    }, {})

    const trends = Object.entries(trendsByDate).map(([date, count]) => ({
      date,
      enrollments: count,
    }))

    // Recent enrollments (last 10)
    const recentEnrollments = await prisma.courseEnrollment.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    })

    // Completion rate by course (top 5)
    const courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {},
        },
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      take: 5,
    })

    const completionRatesByCourse = await Promise.all(
      courses.map(async (course) => {
        const completedCount = await prisma.courseEnrollment.count({
          where: {
            courseId: course.id,
            completed: true,
          },
        })

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalEnrollments: course._count.enrollments,
          completedEnrollments: completedCount,
          completionRate:
            course._count.enrollments > 0
              ? ((completedCount / course._count.enrollments) * 100).toFixed(1)
              : '0',
        }
      })
    )

    return NextResponse.json({
      overview: {
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalEnrollments,
        activeEnrollments,
        activeStudents: activeStudents.length,
        completedEnrollments,
        completionRate: parseFloat(completionRate as string),
        totalCertificates,
        totalRevenue: courseRevenue._sum.amount || 0,
      },
      topCourses: topCourses.map((course) => ({
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        enrollmentCount: course._count.enrollments,
      })),
      enrollmentTrends: trends,
      recentEnrollments: recentEnrollments.map((enrollment) => ({
        id: enrollment.id,
        userName: enrollment.user.name,
        userEmail: enrollment.user.email,
        userAvatar: enrollment.user.avatar,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.createdAt,
      })),
      completionRatesByCourse,
    })
  } catch (error) {
    console.error('Error fetching course analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
