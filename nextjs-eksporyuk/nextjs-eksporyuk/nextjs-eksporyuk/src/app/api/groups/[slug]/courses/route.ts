import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/[slug]/courses - Get user's courses connected to this group
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug: slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get user's enrolled courses that are connected to this group
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id,
        course: {
          groupId: group.id,
          isPublished: true
        }
      },
      include: {
        course: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                user: {
                  select: {
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
        enrolledAt: 'desc'
      }
    })

    // Get user's progress for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await prisma.userCourseProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: enrollment.course.id
      }
        })

        return {
          ...enrollment.course,
          userProgress: progress?.progress || 0,
          isCompleted: progress?.isCompleted || false,
          enrolledAt: enrollment.enrolledAt
        }
      })
    )

    return NextResponse.json({ courses: coursesWithProgress })
  } catch (error) {
    console.error('Get group courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
