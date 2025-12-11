import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's courses from:
    // 1. Direct enrollment (CourseEnrollment)
    // 2. From membership (MembershipCourse)
    // 3. From product purchase (ProductCourse)

    const userId = session.user.id

    // Get enrolled courses
    const enrolledCourses = await prisma.courseEnrollment.findMany({
      where: { userId },
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
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Get user's active membership courses
    const activeMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date()
        }
      },
      include: {
        membership: {
          include: {
            membershipCourses: {
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
                    modules: {
                      include: {
                        lessons: {
                          select: {
                            id: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Get courses from purchased products
    const userProducts = await prisma.userProduct.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        product: {
          include: {
            courses: {
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
                    modules: {
                      include: {
                        lessons: {
                          select: {
                            id: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Combine all courses (avoid duplicates)
    const courseMap = new Map()

    // Add enrolled courses
    enrolledCourses.forEach(enrollment => {
      if (!courseMap.has(enrollment.course.id)) {
        courseMap.set(enrollment.course.id, {
          course: enrollment.course,
          progress: enrollment.progress,
          completedAt: enrollment.completedAt,
          enrollmentDate: enrollment.createdAt
        })
      }
    })

    // Add membership courses
    if (activeMembership) {
      activeMembership.membership.membershipCourses.forEach(mc => {
        if (!courseMap.has(mc.course.id)) {
          // Check if user has progress record
          const progressRecord = enrolledCourses.find(e => e.courseId === mc.course.id)
          courseMap.set(mc.course.id, {
            course: mc.course,
            progress: progressRecord?.progress || 0,
            completedAt: progressRecord?.completedAt || null,
            enrollmentDate: activeMembership.createdAt
          })
        }
      })
    }

    // Add product courses
    userProducts.forEach(up => {
      up.product.courses.forEach(pc => {
        if (!courseMap.has(pc.course.id)) {
          const progressRecord = enrolledCourses.find(e => e.courseId === pc.course.id)
          courseMap.set(pc.course.id, {
            course: pc.course,
            progress: progressRecord?.progress || 0,
            completedAt: progressRecord?.completedAt || null,
            enrollmentDate: up.createdAt
          })
        }
      })
    })

    // Get user progress for all courses
    const courseIds = Array.from(courseMap.keys())
    const progressRecords = await prisma.userCourseProgress.findMany({
      where: {
        userId,
        courseId: { in: courseIds }
      }
    })

    // Format response
    const courses = Array.from(courseMap.values()).map(item => {
      const totalLessons = item.course.modules.reduce(
        (sum: number, module: any) => sum + module.lessons.length,
        0
      )

      const progressRecord = progressRecords.find(p => p.courseId === item.course.id)
      const completedLessonsCount = progressRecord?.completedLessons 
        ? (JSON.parse(progressRecord.completedLessons as any) as string[]).length 
        : 0

      return {
        id: item.course.id,
        title: item.course.title,
        slug: item.course.slug,
        thumbnail: item.course.thumbnail,
        description: item.course.description,
        mentor: item.course.mentor,
        progress: progressRecord?.progress || 0,
        totalLessons,
        completedLessons: completedLessonsCount,
        lastAccessedAt: progressRecord?.lastAccessedAt || item.enrollmentDate,
        isCompleted: progressRecord?.isCompleted || false,
        enrollmentDate: item.enrollmentDate
      }
    })

    // Sort by last accessed (most recent first)
    courses.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    )

    return NextResponse.json({ courses })

  } catch (error) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
