import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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

    // Get user's active membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!userMembership) {
      return NextResponse.json({
        membership: null,
        courses: [],
      })
    }

    // Fetch membership separately
    const membership = await prisma.membership.findUnique({
      where: { id: userMembership.membershipId }
    })

    if (!membership) {
      return NextResponse.json({
        membership: null,
        courses: [],
      })
    }

    // Fetch membershipCourses separately
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: membership.id }
    })

    // Fetch courses for membershipCourses
    const membershipCourseIds = membershipCourses.map(mc => mc.courseId)
    const coursesForMembership = membershipCourseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: membershipCourseIds } }
        })
      : []

    // Create a map of courses
    const courseMapForMembership = new Map(coursesForMembership.map(c => [c.id, c]))

    // Get all course IDs from membership
    const courseIds = membershipCourses.map(mc => mc.courseId)

    // Fetch additional data for each course
    const coursesWithDetails = await Promise.all(
      membershipCourses.map(async (mc) => {
        const course = courseMapForMembership.get(mc.courseId)
        if (!course) return null

        // Get modules
        const modules = await prisma.courseModule.findMany({
          where: { courseId: course.id },
          orderBy: { order: 'asc' },
        })

        // Get all lessons for these modules
        const moduleIds = modules.map(m => m.id)
        const lessons = moduleIds.length > 0 
          ? await prisma.courseLesson.findMany({
              where: { moduleId: { in: moduleIds } },
              orderBy: { order: 'asc' },
            })
          : []

        // Group lessons by module
        const lessonsGrouped = modules.map(module => ({
          ...module,
          lessons: lessons.filter(l => l.moduleId === module.id),
        }))

        // Get mentor info - fetch user directly using mentorId
        const mentorUser = await prisma.user.findUnique({
          where: { id: course.mentorId },
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        })

        // Get enrollment
        const enrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
        })

        // Get user progress
        const userProgress = await prisma.userCourseProgress.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
        })

        // Get enrollment count
        const enrollmentCount = await prisma.courseEnrollment.count({
          where: { courseId: course.id },
        })

        // Calculate totals
        const totalModules = lessonsGrouped.length
        const totalLessons = lessonsGrouped.reduce((sum, m) => sum + m.lessons.length, 0)
        const totalDuration = lessonsGrouped.reduce((sum, m) => 
          sum + m.lessons.reduce((lsum, l) => lsum + (l.duration || 0), 0), 0
        )

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
          enrollmentCount,
          instructor: mentorUser ? {
            id: mentorUser.id,
            name: mentorUser.name,
            avatar: mentorUser.avatar,
          } : null,
          isEnrolled: !!enrollment,
          isFreeForMember: true,
          userProgress: userProgress ? {
            progress,
            completedLessons,
            lastAccessedAt: userProgress.updatedAt?.toISOString() || null,
          } : null,
        }
      })
    )

    // Filter out null values
    const validCoursesWithDetails = coursesWithDetails.filter(c => c !== null)

    // Get membershipIncluded courses
    const membershipIncludedCourses = await prisma.course.findMany({
      where: {
        membershipIncluded: true,
        status: { in: ['PUBLISHED', 'APPROVED'] },
        affiliateOnly: false,
        isAffiliateTraining: false,
        isAffiliateMaterial: false,
        roleAccess: { not: 'AFFILIATE' },
        id: { notIn: courseIds }, // Avoid duplicates
      },
    })

    // Fetch details for membershipIncluded courses
    const includedCoursesWithDetails = await Promise.all(
      membershipIncludedCourses.map(async (course) => {
        const modules = await prisma.courseModule.findMany({
          where: { courseId: course.id },
          orderBy: { order: 'asc' },
        })

        const moduleIds = modules.map(m => m.id)
        const lessons = moduleIds.length > 0
          ? await prisma.courseLesson.findMany({
              where: { moduleId: { in: moduleIds } },
              orderBy: { order: 'asc' },
            })
          : []

        const lessonsGrouped = modules.map(module => ({
          ...module,
          lessons: lessons.filter(l => l.moduleId === module.id),
        }))

        const mentorUser = await prisma.user.findUnique({
          where: { id: course.mentorId },
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        })

        const enrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
        })

        const userProgress = await prisma.userCourseProgress.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
        })

        const enrollmentCount = await prisma.courseEnrollment.count({
          where: { courseId: course.id },
        })

        const totalModules = lessonsGrouped.length
        const totalLessons = lessonsGrouped.reduce((sum, m) => sum + m.lessons.length, 0)
        const totalDuration = lessonsGrouped.reduce((sum, m) => 
          sum + m.lessons.reduce((lsum, l) => lsum + (l.duration || 0), 0), 0
        )

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
          enrollmentCount,
          instructor: mentorUser ? {
            id: mentorUser.id,
            name: mentorUser.name,
            avatar: mentorUser.avatar,
          } : null,
          isEnrolled: !!enrollment,
          isFreeForMember: true,
          userProgress: userProgress ? {
            progress,
            completedLessons,
            lastAccessedAt: userProgress.updatedAt?.toISOString() || null,
          } : null,
        }
      })
    )

    // Combine all courses
    const courses = [...validCoursesWithDetails, ...includedCoursesWithDetails]

    // Check if membership is active
    const now = new Date()
    const isActive = userMembership.status === 'ACTIVE' && 
      (!userMembership.endDate || new Date(userMembership.endDate) > now)

    return NextResponse.json({
      membership: {
        id: membership.id,
        name: membership.name,
        isActive,
        endDate: userMembership.endDate?.toISOString() || null,
      },
      courses,
    })
  } catch (error) {
    console.error('Error fetching membership courses:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
