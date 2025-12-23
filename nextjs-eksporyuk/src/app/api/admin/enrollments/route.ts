import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET all enrollments (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') // 'completed' | 'in-progress'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (courseId) {
      where.courseId = courseId
    }

    if (status === 'completed') {
      where.completed = true
    } else if (status === 'in-progress') {
      where.completed = false
    }

    // Get total count first
    const total = await prisma.courseEnrollment.count({ where })

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get user and course data separately (more efficient)
    const userIds = [...new Set(enrollments.map(e => e.userId))]
    const courseIds = [...new Set(enrollments.map(e => e.courseId))]

    const [users, courses] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          title: true,
          thumbnail: true
        }
      })
    ])

    const userMap = new Map(users.map(u => [u.id, u]))
    const courseMap = new Map(courses.map(c => [c.id, c]))

    // Get detailed progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await prisma.userCourseProgress.findUnique({
          where: {
            userId_courseId: {
              userId: enrollment.userId,
              courseId: enrollment.courseId
            }
          }
        })

        // Get quiz attempts count - need to get quiz IDs first since no relation
        const courseQuizzes = await prisma.quiz.findMany({
          where: { courseId: enrollment.courseId },
          select: { id: true }
        })
        const quizIds = courseQuizzes.map(q => q.id)
        
        const quizAttempts = quizIds.length > 0 ? await prisma.quizAttempt.count({
          where: {
            userId: enrollment.userId,
            quizId: { in: quizIds }
          }
        }) : 0

        // Get assignment submissions count - need to get assignment IDs first since no relation
        const courseAssignments = await prisma.assignment.findMany({
          where: { courseId: enrollment.courseId },
          select: { id: true }
        })
        const assignmentIds = courseAssignments.map(a => a.id)
        
        const assignmentSubmissions = assignmentIds.length > 0 ? await prisma.assignmentSubmission.count({
          where: {
            userId: enrollment.userId,
            assignmentId: { in: assignmentIds }
          }
        }) : 0

        const user = userMap.get(enrollment.userId)
        const course = courseMap.get(enrollment.courseId)

        return {
          ...enrollment,
          user: user || { id: enrollment.userId, name: 'Unknown', email: '' },
          course: course || { id: enrollment.courseId, title: 'Unknown Course' },
          detailedProgress: progress,
          quizAttempts,
          assignmentSubmissions
        }
      })
    )

    // Apply search filter after getting user/course data
    let filteredEnrollments = enrollmentsWithProgress
    if (search) {
      const searchLower = search.toLowerCase()
      filteredEnrollments = enrollmentsWithProgress.filter(e => 
        e.user.name?.toLowerCase().includes(searchLower) ||
        e.user.email?.toLowerCase().includes(searchLower) ||
        e.course.title?.toLowerCase().includes(searchLower)
      )
    }

    // Get all courses for filter dropdown
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Get overall statistics
    const stats = await prisma.courseEnrollment.aggregate({
      _count: true,
      _avg: {
        progress: true
      }
    })

    const completedCount = await prisma.courseEnrollment.count({
      where: { completed: true }
    })

    return NextResponse.json({ 
      enrollments: filteredEnrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      courses: allCourses,
      stats: {
        total: stats._count,
        completed: completedCount,
        inProgress: stats._count - completedCount,
        avgProgress: Math.round(stats._avg.progress || 0)
      }
    })
  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

// POST - Manually enroll a user to a course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'userId and courseId are required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'User is already enrolled in this course' }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
        completed: false
      }
    })

    // Also create progress record
    await prisma.userCourseProgress.create({
      data: {
        userId,
        courseId,
        progress: 0,
        completedLessons: {}
      }
    })

    return NextResponse.json({ 
      success: true,
      enrollment,
      message: 'User enrolled successfully'
    })
  } catch (error) {
    console.error('Create enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}

// DELETE - Remove enrollment
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const enrollmentId = searchParams.get('id')

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    // Get enrollment first to get userId and courseId
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Delete related records
    await prisma.$transaction([
      // Delete progress
      prisma.userCourseProgress.deleteMany({
        where: {
          userId: enrollment.userId,
          courseId: enrollment.courseId
        }
      }),
      // Delete enrollment
      prisma.courseEnrollment.delete({
        where: { id: enrollmentId }
      })
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Enrollment removed successfully'
    })
  } catch (error) {
    console.error('Delete enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    )
  }
}
