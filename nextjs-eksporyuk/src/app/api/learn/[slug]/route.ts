import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/learn/[slug] - Get course details for learning (by slug)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              include: {
                files: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user has access to this course
    let hasAccess = false
    let progress = 0

    console.log('🔍 User info:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      roleType: typeof session.user.role
    })

    // 0. Admin and Mentor have full access
    if (session.user.role === 'ADMIN' || session.user.role === 'MENTOR') {
      hasAccess = true
      console.log(`✅ ${session.user.role} bypass - Full access granted to: ${session.user.email}`)
      
      // Auto-create enrollment for admin/mentor to track progress
      const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id
          }
        }
      })

      if (!existingEnrollment) {
        await prisma.courseEnrollment.create({
          data: {
            userId: session.user.id,
            courseId: course.id,
            progress: 0
          }
        })
        console.log(`✅ Auto-enrolled ${session.user.role}: ${session.user.email}`)
      } else {
        progress = existingEnrollment.progress || 0
      }
    }

    // 1. Check direct enrollment
    if (!hasAccess) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id
          }
        }
      })

      if (enrollment) {
        hasAccess = true
        progress = enrollment.progress || 0
      }
    }

    // 2. Check membership access
    if (!hasAccess) {
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          status: 'ACTIVE',
          endDate: {
            gte: new Date()
          }
        },
        include: {
          membership: {
            include: {
              membershipCourses: {
                where: {
                  courseId: course.id
                }
              }
            }
          }
        }
      })

      if (userMembership && userMembership.membership.membershipCourses.length > 0) {
        hasAccess = true
        
        // Auto-enroll user if accessing via membership
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: course.id
            }
          }
        })

        if (!existingEnrollment) {
          await prisma.courseEnrollment.create({
            data: {
              userId: session.user.id,
              courseId: course.id,
              enrolledAt: new Date(),
              progress: 0
            }
          })
        }
      }
    }

    // 3. Get user progress
    const userProgress = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id
        }
      }
    })

    // If user doesn't have access (and is NOT admin/mentor), filter out locked lessons
    if (!hasAccess && session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      course.modules = course.modules.map(module => ({
        ...module,
        lessons: module.lessons.filter(lesson => lesson.isFree)
      }))
    }

    console.log('🎯 Final result:', {
      hasAccess,
      progress,
      modulesCount: course.modules.length,
      lessonsCount: course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    })

    return NextResponse.json({
      course,
      hasAccess,
      progress,
      userProgress
    })
  } catch (error) {
    console.error('Error fetching course for learning:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}
