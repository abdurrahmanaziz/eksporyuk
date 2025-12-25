import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a mentor
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Not a mentor' }, { status: 403 })
    }

    // Get mentor's courses
    const courses = await prisma.course.findMany({
      where: { mentorId: mentorProfile.id },
      select: {
        id: true,
        title: true,
        isPublished: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    const totalCourses = courses.length
    const publishedCourses = courses.filter((c) => c.isPublished).length
    const courseIds = courses.map((c) => c.id)

    // Total enrollments across all courses
    const totalEnrollments = await prisma.courseEnrollment.count({
      where: { courseId: { in: courseIds } },
    })

    // Active students (unique users enrolled)
    const activeStudents = await prisma.courseEnrollment.groupBy({
      by: ['userId'],
      where: {
        courseId: { in: courseIds },
        completed: false,
      },
    })

    // Completion stats
    const completedEnrollments = await prisma.courseEnrollment.count({
      where: {
        courseId: { in: courseIds },
        completed: true,
      },
    })

    const completionRate =
      totalEnrollments > 0
        ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1)
        : 0

    // Certificates issued
    const totalCertificates = await prisma.certificate.count({
      where: { courseId: { in: courseIds } },
    })

    // Revenue from mentor's courses
    const revenue = await prisma.transaction.aggregate({
      where: {
        type: 'COURSE',
        courseId: { in: courseIds },
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    })

    // Mentor's commission (assuming 50% default)
    const totalRevenue = Number(revenue._sum.amount || 0)
    const mentorCommission = totalRevenue * 0.5 // 50% commission

    // Course performance (top 3 by enrollment)
    const topCourses = await prisma.course.findMany({
      where: { mentorId: mentorProfile.id },
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
      take: 3,
    })

    // Recent students (last 10 enrollments)
    const recentStudents = await prisma.courseEnrollment.findMany({
      where: { courseId: { in: courseIds } },
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

    // Enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const enrollmentTrends = await prisma.courseEnrollment.groupBy({
      by: ['createdAt'],
      where: {
        courseId: { in: courseIds },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    })

    const trendsByDate = enrollmentTrends.reduce((acc: any, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + item._count
      return acc
    }, {})

    const trends = Object.entries(trendsByDate).map(([date, count]) => ({
      date,
      enrollments: count,
    }))

    // Student progress by course
    const courseProgress = await Promise.all(
      courses.slice(0, 5).map(async (course) => {
        const enrollments = await prisma.courseEnrollment.findMany({
          where: { courseId: course.id },
          select: {
            progress: true,
            completed: true,
          },
        })

        const avgProgress =
          enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + e.progress, 0) /
              enrollments.length
            : 0

        return {
          courseId: course.id,
          courseTitle: course.title,
          totalStudents: enrollments.length,
          averageProgress: Math.round(avgProgress),
          completedStudents: enrollments.filter((e) => e.completed).length,
        }
      })
    )

    return NextResponse.json({
      overview: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeStudents: activeStudents.length,
        completedEnrollments,
        completionRate: parseFloat(completionRate as string),
        totalCertificates,
        totalRevenue,
        mentorCommission,
      },
      topCourses: topCourses.map((course) => ({
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        enrollmentCount: course._count.enrollments,
      })),
      enrollmentTrends: trends,
      recentStudents: recentStudents.map((enrollment) => ({
        id: enrollment.id,
        userName: enrollment.user.name,
        userEmail: enrollment.user.email,
        userAvatar: enrollment.user.avatar,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.createdAt,
        progress: enrollment.progress,
      })),
      courseProgress,
    })
  } catch (error) {
    console.error('Error fetching mentor analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
