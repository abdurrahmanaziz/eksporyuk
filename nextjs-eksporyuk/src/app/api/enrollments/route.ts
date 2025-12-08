import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/enrollments - Get user enrollments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    if (courseId) {
      // Check specific enrollment
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId
        },
        include: {
          course: {
            include: {
              mentor: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })

      // Fetch progress separately
      const progress = await prisma.userCourseProgress.findFirst({
        where: {
          userId: session.user.id,
          courseId
        }
      })

      return NextResponse.json({ 
        enrollment: enrollment ? { ...enrollment, progress } : null 
      })
    }

    // Get all user enrollments
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        course: {
          include: {
            mentor: {
              include: {
                user: true
              }
            },
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await prisma.userCourseProgress.findFirst({
          where: {
            userId: session.user.id,
            courseId: enrollment.courseId
          }
        })
        return { ...enrollment, progress }
      })
    )

    return NextResponse.json({ enrollments: enrollmentsWithProgress })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ message: 'courseId required' }, { status: 400 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    // Only allow enrollment in published courses (unless admin/mentor)
    if (course.status !== 'PUBLISHED' && !['ADMIN', 'MENTOR'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Course not available' }, { status: 403 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { message: 'Already enrolled', enrollment: existingEnrollment },
        { status: 200 }
      )
    }

    // Check monetization type
    if (course.monetizationType === 'PAID') {
      // For paid courses, redirect to payment
      return NextResponse.json(
        { 
          message: 'Payment required',
          redirectTo: `/checkout/course/${course.slug}`
        },
        { status: 402 }
      )
    }

    if (course.monetizationType === 'MEMBERSHIP') {
      // Check if user has active membership
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
          OR: [
            { expiresAt: { gte: new Date() } },
            { expiresAt: null } // Lifetime
          ]
        }
      })

      if (!membership && !['ADMIN', 'MENTOR'].includes(session.user.role)) {
        return NextResponse.json(
          { 
            message: 'Membership required',
            redirectTo: '/dashboard/upgrade'
          },
          { status: 403 }
        )
      }
    }

    // Create enrollment (FREE or MEMBERSHIP with valid membership)
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        progress: 0,
        completed: false
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      enrollment,
      message: 'Successfully enrolled in course'
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
