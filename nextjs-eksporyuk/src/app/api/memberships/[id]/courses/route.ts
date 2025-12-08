import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membershipId = params.id

    // Verify user has this membership
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: session.user.id,
        membershipId: membershipId,
        status: 'ACTIVE',
      },
    })

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Membership not found or not active' },
        { status: 403 }
      )
    }

    // Get courses included in this membership with user progress
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId },
      include: {
        course: {
          include: {
            mentor: {
              select: {
                name: true,
              },
            },
            lessons: {
              select: { id: true },
            },
            enrollments: {
              where: {
                userId: session.user.id,
              },
              include: {
                lessonProgress: {
                  select: {
                    lessonId: true,
                    isCompleted: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const courses = membershipCourses.map((mc) => {
      const course = mc.course
      const enrollment = course.enrollments[0]
      const totalLessons = course.lessons.length
      const completedLessons = enrollment
        ? enrollment.lessonProgress.filter((lp) => lp.isCompleted).length
        : 0
      const progress =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        description: course.description,
        mentorName: course.mentor?.name,
        totalLessons,
        completedLessons,
        progress,
        isEnrolled: !!enrollment,
        lastAccessedAt: enrollment?.lastAccessedAt || null,
      }
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching membership courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
