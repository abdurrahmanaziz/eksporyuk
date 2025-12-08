import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/progress?courseId=xxx - Get user's progress for a course
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

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

    // Get enrollment to check if user has access
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

    // Get course structure
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
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
      return NextResponse.json({ message: 'Course tidak ditemukan' }, { status: 404 })
    }

    // Calculate total lessons
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)

    // Get completed lessons from enrollment
    const completedLessons = enrollment.completedLessons as string[] || []

    // Calculate progress
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0

    return NextResponse.json({
      progress: {
        courseId,
        userId: user.id,
        totalLessons,
        completedLessons: completedLessons.length,
        progress: progressPercent,
        isCompleted: progressPercent === 100,
        completedAt: enrollment.completedAt,
        lastAccessedAt: enrollment.lastAccessedAt
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil progress' },
      { status: 500 }
    )
  }
}
