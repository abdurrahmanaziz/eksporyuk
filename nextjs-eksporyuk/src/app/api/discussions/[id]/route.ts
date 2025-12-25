import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * PUT /api/discussions/[id]
 * Mark discussion as solved (Mentor only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isMarkedSolved } = body

    // Get discussion with course info
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            mentor: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    // Only mentor or admin can mark as solved
    const isAdmin = session.user.role === 'ADMIN'
    const isMentor = discussion.course.mentorId === session.user.id

    if (!isAdmin && !isMentor) {
      return NextResponse.json(
        { error: 'Only course mentor can mark discussions as solved' },
        { status: 403 }
      )
    }

    // Update discussion
    const updated = await prisma.courseDiscussion.update({
      where: { id },
      data: {
        isMarkedSolved: Boolean(isMarkedSolved),
        solvedBy: isMarkedSolved ? session.user.id : null,
        solvedAt: isMarkedSolved ? new Date() : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    // Notify discussion author
    if (isMarkedSolved && discussion.userId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: discussion.userId,
            type: 'ACHIEVEMENT',
            title: 'Discussion Marked as Solved',
            message: `${session.user.name} marked your discussion "${discussion.title?.substring(0, 50)}..." as solved`,
            link: `/learn/${discussion.course.slug}?tab=discussions&thread=${discussion.id}`
          }
        })
      } catch (notifError) {
        console.error('Failed to send notification:', notifError)
      }
    }

    return NextResponse.json({
      message: isMarkedSolved ? 'Marked as solved' : 'Unmarked as solved',
      discussion: updated
    })
  } catch (error) {
    console.error('Error updating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to update discussion' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/discussions/[id]
 * Delete discussion (Author or Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get discussion
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id },
      include: {
        replies: true
      }
    })

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    // Only author or admin can delete
    const isAdmin = session.user.role === 'ADMIN'
    const isAuthor = discussion.userId === session.user.id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'You can only delete your own discussions' },
        { status: 403 }
      )
    }

    // Delete discussion and all replies (cascade)
    await prisma.courseDiscussion.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Discussion deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting discussion:', error)
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/discussions/[id]
 * Increment view count
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'view') {
      await prisma.courseDiscussion.update({
        where: { id },
        data: {
          viewCount: { increment: 1 }
        }
      })

      return NextResponse.json({ message: 'View count updated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to update discussion' },
      { status: 500 }
    )
  }
}
