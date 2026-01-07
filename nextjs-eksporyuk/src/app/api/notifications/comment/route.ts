import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { smartNotificationService } from '@/lib/services/smartNotificationService'

export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/comment
 * Send notification when someone comments on a post
 * Called from /api/posts/[id]/comments route
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, commentId, commentText } = await request.json()

    if (!postId || !commentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get post and comment details
    const [post, comment] = await Promise.all([
      prisma.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          authorId: true,
          content: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      prisma.postComment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          userId: true,
          content: true
        }
      })
    ])

    if (!post || !comment) {
      return NextResponse.json({ error: 'Post or comment not found' }, { status: 404 })
    }

    // Don't notify if commenting on own post
    if (post.authorId === session.user.id) {
      return NextResponse.json({ success: true, notified: false })
    }

    try {
      // Send notification to post author
      await smartNotificationService.send({
        userId: post.authorId,
        type: 'COMMENT',
        title: 'Komentar Baru',
        message: `${session.user.name || 'Seseorang'} mengomentari postingan Anda`,
        link: `/posts/${postId}#comment-${commentId}`,
        data: {
          postId,
          commentId,
          authorId: session.user.id,
          authorName: session.user.name,
          authorAvatar: session.user.image,
          commentPreview: (commentText || comment.content).substring(0, 50),
          notificationType: 'comment'
        },
        channels: {
          pusher: true,
          onesignal: true
        }
      })

      return NextResponse.json({
        success: true,
        notified: true,
        postAuthorId: post.authorId
      })
    } catch (error) {
      console.error('[COMMENT_NOTIFICATION_ERROR]', error)
      // Don't fail if notification fails
      return NextResponse.json({
        success: true,
        notified: false,
        error: 'Notification failed but comment was created'
      })
    }
  } catch (error: any) {
    console.error('[COMMENT_NOTIFICATION_API_ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send comment notification' },
      { status: 500 }
    )
  }
}
