import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = params
    const userId = session.user.id

    // Find course by slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
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
    const hasAccess = await checkCourseAccess(userId, course.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'No access to this course' }, { status: 403 })
    }

    // Get user's progress for this course
    let userProgress = await prisma.userCourseProgress.findFirst({
      where: {
        userId,
        courseId: course.id
      }
    })

    // Create progress record if doesn't exist
    if (!userProgress) {
      userProgress = await prisma.userCourseProgress.create({
        data: {
          userId,
          courseId: course.id,
          progress: 0,
          hasAccess: true
        }
      })
    }

    const completedLessonIds = userProgress.completedLessons 
      ? JSON.parse(userProgress.completedLessons as any) 
      : []

    // Check if user has certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        userId,
        courseId: course.id
      }
    })

    // Format response
    const formattedCourse = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      mentor: course.mentor,
      modules: course.modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        lessons: module.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          order: lesson.order,
          isFree: lesson.isFree,
          isCompleted: completedLessonIds.includes(lesson.id)
        }))
      })),
      progress: userProgress.progress,
      isCompleted: userProgress.isCompleted,
      hasCertificate: !!certificate
    }

    return NextResponse.json({ course: formattedCourse })

  } catch (error) {
    console.error('Error fetching course detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

async function checkCourseAccess(userId: string, courseId: string): Promise<boolean> {
  // Check direct enrollment
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId
      }
    }
  })

  if (enrollment) return true

  // Check membership courses
  const activeMembership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: {
        gte: new Date()
      },
      membership: {
        membershipCourses: {
          some: {
            courseId
          }
        }
      }
    }
  })

  if (activeMembership) return true

  // Check product courses
  const userProduct = await prisma.userProduct.findFirst({
    where: {
      userId,
      isActive: true,
      product: {
        courses: {
          some: {
            courseId
          }
        }
      }
    }
  })

  if (userProduct) return true

  // Check UserCourseProgress with access
  const progress = await prisma.userCourseProgress.findFirst({
    where: {
      userId,
      courseId,
      hasAccess: true
    }
  })

  return !!progress
}
