import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, mentionedUserIds } = await request.json()

    if (!postId || !mentionedUserIds || !Array.isArray(mentionedUserIds)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Get post details
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Send notification to each mentioned user using notificationService
    const notificationPromises = mentionedUserIds.map(async (userId: string) => {
      // Don't notify self
      if (userId === session.user.id) return null

      try {
        // Use unified notificationService which handles:
        // - Database notification creation
        // - Pusher real-time notification
        // - OneSignal push notification
        const result = await notificationService.send({
          userId,
          type: 'MENTION',
          title: 'Disebutkan dalam Postingan',
          message: `${post.author.name} menyebut Anda dalam sebuah postingan`,
          postId,
          redirectUrl: `/posts/${postId}`,
          actorId: post.authorId,
          actorName: post.author.name || undefined,
          actorAvatar: post.author.avatar || undefined,
          metadata: {
            preview: post.content.slice(0, 100),
            notificationType: 'mention'
          },
          channels: ['pusher', 'onesignal']
        })

        return { success: result.success, userId, notificationId: result.notificationId }
      } catch (error) {
        console.error(`Failed to notify user ${userId}:`, error)
        return { success: false, userId, error }
      }
    })

    const results = await Promise.all(notificationPromises)
    const successful = results.filter(r => r?.success).length

    return NextResponse.json({ 
      success: true,
      notified: successful,
      total: mentionedUserIds.length,
      results
    })

  } catch (error: any) {
    console.error('Mention notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notifications',
      details: error.message
    }, { status: 500 })
  }
}
