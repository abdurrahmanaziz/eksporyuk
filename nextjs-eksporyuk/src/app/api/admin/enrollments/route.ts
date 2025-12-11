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

    const where: any = {}

    if (courseId) {
      where.courseId = courseId
    }

    if (status === 'completed') {
      where.completed = true
    } else if (status === 'in-progress') {
      where.completed = false
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
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
            thumbnail: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

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

        // Get quiz attempts count
        const quizAttempts = await prisma.quizAttempt.count({
          where: {
            userId: enrollment.userId,
            quiz: {
              courseId: enrollment.courseId
            }
          }
        })

        // Get assignment submissions count
        const assignmentSubmissions = await prisma.assignmentSubmission.count({
          where: {
            userId: enrollment.userId,
            assignment: {
              courseId: enrollment.courseId
            }
          }
        })

        return {
          ...enrollment,
          detailedProgress: progress,
          quizAttempts,
          assignmentSubmissions
        }
      })
    )

    return NextResponse.json({ 
      enrollments: enrollmentsWithProgress,
      total: enrollmentsWithProgress.length 
    })
  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
