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
    const allLessons = course.modules.flatMap(m => m.lessons)
    const lesson = allLessons.find(l => l.id === lessonId)

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Get or create progress record
    let userProgress = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id
        }
      }
    })

    if (!userProgress) {
      userProgress = await prisma.userCourseProgress.create({
        data: {
          userId,
          courseId: course.id,
          progress: 0,
          hasAccess: true,
          completedLessons: JSON.stringify([])
        }
      })
    }

    // Parse completed lessons
    const completedLessonIds: string[] = userProgress.completedLessons 
      ? JSON.parse(userProgress.completedLessons as any)
      : []

    // Add lesson to completed if not already there
    if (!completedLessonIds.includes(lessonId)) {
      completedLessonIds.push(lessonId)

      // Calculate new progress percentage
      const totalLessons = allLessons.length
      const completedCount = completedLessonIds.length
      const newProgress = Math.round((completedCount / totalLessons) * 100)
      const isCompleted = newProgress === 100

      // Update progress
      await prisma.userCourseProgress.update({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id
          }
        },
        data: {
          completedLessons: JSON.stringify(completedLessonIds),
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date()
        }
      })

      // If course is completed, generate certificate
      if (isCompleted) {
        const existingCertificate = await prisma.certificate.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id
            }
          }
        })

        if (!existingCertificate) {
          const certificateNumber = `CERT-${Date.now()}-${userId.slice(0, 6).toUpperCase()}`
          
          await prisma.certificate.create({
            data: {
              userId,
              courseId: course.id,
              certificateNumber,
              studentName: session.user.name || 'Student',
              courseName: course.title,
              completedAt: new Date(),
              completionDate: new Date(),
              verificationUrl: `/certificates/verify/${certificateNumber}`
            }
          })
        }
      }

      return NextResponse.json({ 
        success: true, 
        progress: newProgress,
        isCompleted 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Already completed' 
    })

  } catch (error) {
    console.error('Error marking lesson complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark lesson complete' },
      { status: 500 }
    )
  }
}
