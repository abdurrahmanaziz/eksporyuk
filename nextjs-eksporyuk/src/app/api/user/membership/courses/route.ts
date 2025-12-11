import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's active membership with courses
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        membership: {
          include: {
            membershipCourses: {
              include: {
                course: {
                  include: {
                    modules: {
                      include: {
                        lessons: true,
                      },
                    },
                    mentor: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            name: true,
                            avatar: true,
                          },
                        },
                      },
                    },
                    enrollments: {
                      where: { userId },
                    },
                    userProgress: {
                      where: { userId },
                    },
                    _count: {
                      select: {
                        enrollments: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!userMembership) {
      return NextResponse.json({
        membership: null,
        courses: [],
      })
    }

    // Transform courses data
    const courses = userMembership.membership.membershipCourses.map((mc) => {
      const course = mc.course
      
      // Calculate totals
      const totalModules = course.modules.length
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      const totalDuration = course.modules.reduce((sum, m) => 
        sum + m.lessons.reduce((lsum, l) => lsum + (l.duration || 0), 0), 0
      )

      // Get user progress
      const userProgress = course.userProgress[0]
      const enrollment = course.enrollments[0]

      // Calculate progress percentage
      let progress = 0
      let completedLessons = 0
      if (userProgress) {
        const completedLessonsData = userProgress.completedLessons as string[] | null
        completedLessons = completedLessonsData ? completedLessonsData.length : 0
        progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      }

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        description: course.description,
        level: course.level || 'BEGINNER',
        totalModules,
        totalLessons,
        totalDuration,
        enrollmentCount: course._count.enrollments,
        instructor: course.mentor?.user ? {
          id: course.mentor.user.id,
          name: course.mentor.user.name,
          avatar: course.mentor.user.avatar,
        } : null,
        isEnrolled: !!enrollment,
        userProgress: userProgress ? {
          progress,
          completedLessons,
          lastAccessedAt: userProgress.updatedAt?.toISOString() || null,
        } : null,
      }
    })

    // Check if membership is active
    const now = new Date()
    const isActive = userMembership.status === 'ACTIVE' && 
      (!userMembership.endDate || new Date(userMembership.endDate) > now)

    return NextResponse.json({
      membership: {
        id: userMembership.membership.id,
        name: userMembership.membership.name,
        isActive,
        endDate: userMembership.endDate?.toISOString() || null,
      },
      courses,
    })
  } catch (error) {
    console.error('Error fetching membership courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
