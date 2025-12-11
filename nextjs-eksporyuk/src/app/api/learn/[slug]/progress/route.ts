import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/learn/[slug]/progress - Mark lesson as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { slug },
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

    // Verify lesson exists in course
    const allLessons = course.modules.flatMap(m => m.lessons)
    const lesson = allLessons.find(l => l.id === lessonId)
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Get or create user progress
    let userProgress = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id
        }
      }
    })

    if (!userProgress) {
      userProgress = await prisma.userCourseProgress.create({
        data: {
          userId: session.user.id,
          courseId: course.id,
          completedLessons: [lessonId],
          lastAccessedAt: new Date()
        }
      })
    } else {
      // Add lesson to completed list if not already there
      const completedLessons = (userProgress.completedLessons as string[]) || []
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId)
        
        userProgress = await prisma.userCourseProgress.update({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: course.id
            }
          },
          data: {
            completedLessons: completedLessons,
            lastAccessedAt: new Date()
          }
        })
      }
    }

    // Calculate progress percentage
    const totalLessons = allLessons.length
    const completedCount = ((userProgress.completedLessons as string[]) || []).length
    const progressPercent = Math.round((completedCount / totalLessons) * 100)

    // Update enrollment progress and completion status
    const enrollment = await prisma.courseEnrollment.updateMany({
      where: {
        userId: session.user.id,
        courseId: course.id
      },
      data: {
        progress: progressPercent,
        completed: progressPercent >= 100,
        completedAt: progressPercent >= 100 ? new Date() : undefined
      }
    })

    // If 100% complete, auto-generate certificate
    let certificate = null
    if (progressPercent >= 100) {
      // Check if certificate already exists
      const existingCert = await prisma.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id
          }
        }
      })

      if (!existingCert) {
        // Generate unique certificate number
        const count = await prisma.certificate.count()
        const year = new Date().getFullYear()
        const certificateNumber = `CERT-${year}-${String(count + 1).padStart(6, '0')}`

        // Create certificate
        certificate = await prisma.certificate.create({
          data: {
            userId: session.user.id,
            courseId: course.id,
            certificateNumber,
            studentName: session.user.name || 'Student',
            courseName: course.title,
            completedAt: new Date(),
            completionDate: new Date(),
            verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificates/verify/${certificateNumber}`
          }
        })
      } else {
        certificate = existingCert
      }
    }

    return NextResponse.json({
      success: true,
      progress: progressPercent,
      completed: progressPercent >= 100,
      completedLessons: userProgress.completedLessons,
      certificate
    })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
