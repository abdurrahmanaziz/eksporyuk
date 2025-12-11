import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// DELETE /api/posts/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comment = await prisma.postComment.findUnique({
      where: { id: params.commentId },
      select: { userId: true, postId: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only comment author or admin can delete
    if (comment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete comment and decrement count
    await prisma.$transaction([
      prisma.postComment.delete({
        where: { id: params.commentId }
      }),
      prisma.post.update({
        where: { id: params.id },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ message: 'Comment deleted' })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
