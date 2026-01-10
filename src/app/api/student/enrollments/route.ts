import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get courses data separately
    const courseIds = enrollments.map(e => e.courseId)
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        mentorId: true,
        isPublished: true,
        level: true,
        price: true
      }
    })

    const coursesMap = new Map(courses.map(c => [c.id, c]))

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await prisma.userCourseProgress.findFirst({
          where: {
            userId: session.user.id,
            courseId: enrollment.courseId
          }
        })

        const course = coursesMap.get(enrollment.courseId)

        return {
          ...enrollment,
          course: course || null,
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
