import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all enrollments for the user with course details and progress
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Get certificates for all enrolled courses
    const certificates = await prisma.certificate.findMany({
      where: {
        userId: session.user.id,
        courseId: {
          in: enrollments.map(e => e.courseId)
        }
      },
      select: {
        courseId: true
      }
    })

    const certificateMap = new Map(certificates.map(c => [c.courseId, true]))

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = enrollments.map(enrollment => {
      const totalLessons = enrollment.course.modules.reduce(
        (total, module) => total + module.lessons.length,
        0
      )
      const progress = enrollment.progress || 0

      return {
        courseId: enrollment.courseId,
        course: enrollment.course,
        completedLessons: Math.round((progress / 100) * totalLessons),
        totalLessons,
        lastAccessed: enrollment.updatedAt,
        progress,
        certificateIssued: certificateMap.has(enrollment.courseId) || enrollment.completed
      }
    })

    return NextResponse.json({
      enrollments: enrollmentsWithProgress
    })

  } catch (error) {
    console.error('Error fetching my courses:', error)
    // Return safe empty result instead of error
    return NextResponse.json({ enrollments: [] }, { status: 200 })
  }
}
