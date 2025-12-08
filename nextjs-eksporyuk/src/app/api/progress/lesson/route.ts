import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// POST /api/progress/lesson - Mark lesson as complete
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { lessonId, courseId } = body

    if (!lessonId || !courseId) {
      return NextResponse.json({ 
        error: 'lessonId and courseId required' 
      }, { status: 400 })
    }

    // Get enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      },
      include: {
        course: {
          include: {
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

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 404 })
    }

    // Calculate total lessons
    const totalLessons = enrollment.course.modules.reduce(
      (total, module) => total + module.lessons.length,
      0
    )

    if (totalLessons === 0) {
      return NextResponse.json({ error: 'No lessons found' }, { status: 400 })
    }

    // For now, we'll increment progress
    // In production, you'd track completed lessons in a separate table
    const currentProgress = enrollment.progress
    const progressIncrement = Math.floor(100 / totalLessons)
    const newProgress = Math.min(currentProgress + progressIncrement, 100)

    // Update enrollment
    const updatedEnrollment = await prisma.courseEnrollment.update({
      where: {
        id: enrollment.id
      },
      data: {
        progress: newProgress,
        completed: newProgress >= 100,
        completedAt: newProgress >= 100 ? new Date() : enrollment.completedAt
      }
    })

    // Auto-generate certificate if completed
    let certificate = null
    if (newProgress >= 100) {
      // Check if certificate already exists
      const existingCert = await prisma.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId
          }
        }
      })

      if (!existingCert) {
        // Generate certificate
        const count = await prisma.certificate.count()
        const year = new Date().getFullYear()
        const certificateNumber = `CERT-${year}-${String(count + 1).padStart(6, '0')}`

        certificate = await prisma.certificate.create({
          data: {
            userId: session.user.id,
            courseId,
            certificateNumber,
            studentName: session.user.name || 'Student',
            courseName: enrollment.course.title,
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
      progress: newProgress,
      completed: newProgress >= 100,
      certificate,
      message: newProgress >= 100 ? 'Course completed! Certificate issued.' : 'Progress updated'
    })

  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
