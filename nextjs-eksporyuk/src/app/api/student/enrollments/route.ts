import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// GET user's enrolled courses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        course: {
          include: {
            mentor: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: {
                modules: true,
                enrollments: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await prisma.userCourseProgress.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: enrollment.courseId
            }
          }
        })

        return {
          ...enrollment,
          detailedProgress: progress
        }
      })
    )

    return NextResponse.json({ enrollments: enrollmentsWithProgress })
  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
