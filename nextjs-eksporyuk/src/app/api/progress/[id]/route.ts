import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PUT /api/progress/:id - Update progress
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const progressId = params.id
    const body = await req.json()
    const { progress, completedLessons, isCompleted, completedAt } = body

    // Verify ownership
    const existingProgress = await prisma.userCourseProgress.findUnique({
      where: { id: progressId }
    })

    if (!existingProgress || existingProgress.userId !== session.user.id) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Update progress
    const updated = await prisma.userCourseProgress.update({
      where: { id: progressId },
      data: {
        progress: progress !== undefined ? progress : existingProgress.progress,
        completedLessons: completedLessons || existingProgress.completedLessons,
        isCompleted: isCompleted !== undefined ? isCompleted : existingProgress.isCompleted,
        completedAt: completedAt ? new Date(completedAt) : existingProgress.completedAt,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ progress: updated })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
