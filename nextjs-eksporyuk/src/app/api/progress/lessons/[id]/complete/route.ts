import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/progress/lessons/[id]/complete - Mark lesson as complete
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { id: lessonId } = await params
    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ message: 'courseId diperlukan' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    // Get enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ message: 'Anda belum mendaftar course ini' }, { status: 403 })
    }

    // Get lesson to verify it exists
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true
      }
    })

    if (!lesson || lesson.module.courseId !== courseId) {
      return NextResponse.json({ message: 'Pelajaran tidak ditemukan' }, { status: 404 })
    }

    // Get current completed lessons
    const completedLessons = (enrollment.completedLessons as string[]) || []

    // Add lesson if not already completed
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)

      // Get course to check if now 100% complete
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            include: {
              lessons: {
                select: { id: true }
              }
            }
          }
        }
      })

      const totalLessons = course!.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0

      // Update enrollment
      const updated = await prisma.courseEnrollment.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId
          }
        },
        data: {
          completedLessons,
          progress: progressPercent,
          isCompleted: progressPercent === 100,
          completedAt: progressPercent === 100 ? new Date() : null,
          lastAccessedAt: new Date()
        }
      })

      // If 100% complete, trigger certificate generation
      if (progressPercent === 100) {
        // Create certificate
        try {
          await prisma.certificate.create({
            data: {
              userId: user.id,
              courseId,
              certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              issuedAt: new Date(),
              isVerified: true
            }
          })
        } catch (error) {
          console.log('Certificate already exists or error creating:', error)
        }
      }

      return NextResponse.json({
        message: 'Pelajaran ditandai selesai',
        progress: {
          totalLessons,
          completedLessons: completedLessons.length,
          progress: progressPercent,
          isCompleted: progressPercent === 100
        }
      })
    }

    return NextResponse.json({
      message: 'Pelajaran sudah ditandai sebelumnya'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Gagal menandai pelajaran selesai' },
      { status: 500 }
    )
  }
}
