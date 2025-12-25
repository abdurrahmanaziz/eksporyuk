import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/posts/[id]/comments - Get post comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Recursive include for nested replies (up to 3 levels)
    const replyInclude = {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          username: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              username: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  username: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc' as const,
            },
          },
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
      },
    }

    const comments = await prisma.postComment.findMany({
      where: {
        postId: id,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
        replies: {
          include: replyInclude,
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[id]/comments - Add comment to post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content, parentId, mentions } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentComment = await prisma.postComment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment and increment count
    const [comment] = await prisma.$transaction([
      prisma.postComment.create({
        data: {
          content,
          postId: id,
          userId: session.user.id,
          ...(parentId && { parentId }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              username: true,
            },
          },
        },
      }),
      prisma.post.update({
        where: { id },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      }),
    ])

    // 🔔 NOTIFICATION TRIGGER: New comment on post
    if (!parentId) {
      // Top-level comment → notify post author
      if (post.authorId !== session.user.id) {
        await notificationService.send({
          userId: post.authorId,
          type: 'COMMENT',
          title: 'Komentar Baru',
          message: `${session.user.name} mengomentari postingan Anda`,
          postId: id,
          redirectUrl: `/posts/${id}`,
          channels: ['pusher', 'onesignal'],
        })
      }
    } else {
      // Reply to comment → notify parent comment author
      const parentComment = await prisma.postComment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      })

      if (parentComment && parentComment.userId !== session.user.id) {
        await notificationService.send({
          userId: parentComment.userId,
          type: 'COMMENT_REPLY',
          title: 'Balasan Baru',
          message: `${session.user.name} membalas komentar Anda`,
          commentId: parentId,
          postId: id,
          redirectUrl: `/posts/${id}#comment-${parentId}`,
          channels: ['pusher', 'onesignal'],
        })
      }
    }

    // 🔔 NOTIFICATION: Mention notifications
    if (mentions && mentions.length > 0) {
      // Get user IDs from usernames
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: mentions }
        },
        select: { id: true, username: true, name: true }
      })

      // Create notification for each mentioned user (except the comment author)
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser.id !== session.user.id) {
          await notificationService.send({
            userId: mentionedUser.id,
            type: 'MENTION',
            title: 'Disebutkan dalam Komentar',
            message: `${session.user.name} menyebut Anda dalam sebuah komentar`,
            commentId: comment.id,
            postId: id,
            redirectUrl: `/posts/${id}#comment-${comment.id}`,
            channels: ['pusher', 'onesignal'],
          })
        }
      }
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
