import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, lessonId } = params
    const userId = session.user.id

    // Find course
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify lesson belongs to course
    const lesson = course.modules
      .flatMap(m => m.lessons)
      .find(l => l.id === lessonId)

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Update or create progress record
    const userProgress = await prisma.userCourseProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id
        }
      },
      update: {
        lastAccessedAt: new Date()
      },
      create: {
        userId,
        courseId: course.id,
        progress: 0,
        hasAccess: true,
        lastAccessedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking lesson access:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
