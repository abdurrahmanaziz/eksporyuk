import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'
import { validateCommentFiles, UPLOAD_CONFIG } from '@/lib/file-upload'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/posts/[id]/comments - Get post comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verify post exists first
    const postExists = await prisma.post.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!postExists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Nested reply include structure for up to 5 levels
    const nestedReplyInclude = {
      User: {
        select: {
          id: true,
          name: true,
          avatar: true,
          username: true,
        },
      },
      CommentReaction: {
        select: {
          id: true,
          userId: true,
          type: true,
        },
      },
    }

    // Build nested structure for 5 levels
    const level5 = { ...nestedReplyInclude }
    const level4 = { ...nestedReplyInclude, other_PostComment: { include: level5, orderBy: { createdAt: 'asc' as const } } }
    const level3 = { ...nestedReplyInclude, other_PostComment: { include: level4, orderBy: { createdAt: 'asc' as const } } }
    const level2 = { ...nestedReplyInclude, other_PostComment: { include: level3, orderBy: { createdAt: 'asc' as const } } }
    const level1 = { ...nestedReplyInclude, other_PostComment: { include: level2, orderBy: { createdAt: 'asc' as const } } }

    // Get comments with proper relation names (5 levels of nested replies)
    const comments = await prisma.postComment.findMany({
      where: {
        postId: id,
        parentId: null, // Only top-level comments
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            username: true,
          },
        },
        CommentReaction: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
        other_PostComment: {
          include: level1,
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
// Support: text content, images, videos, documents, user mentions
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
    
    // Parse FormData for file uploads
    let content = ''
    let parentId: string | null = null
    let mentions: string[] = []
    let images: string[] = []
    let videos: string[] = []
    let documents: string[] = []
    let taggedAll = false
    let taggedMembers = false

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Legacy JSON request (for comments without media)
      const body = await request.json()
      content = body.content || ''
      parentId = body.parentId || null
      mentions = body.mentions || []
      images = body.images || []
      videos = body.videos || []
      documents = body.documents || []
      taggedAll = body.taggedAll || false
      taggedMembers = body.taggedMembers || false
    } else if (contentType.includes('multipart/form-data')) {
      // FormData request (for comments with media)
      const formData = await request.formData()
      content = formData.get('content') as string || ''
      parentId = formData.get('parentId') as string || null
      mentions = JSON.parse(formData.get('mentions') as string || '[]')
      images = JSON.parse(formData.get('images') as string || '[]')
      videos = JSON.parse(formData.get('videos') as string || '[]')
      documents = JSON.parse(formData.get('documents') as string || '[]')
      taggedAll = formData.get('taggedAll') === 'true'
      taggedMembers = formData.get('taggedMembers') === 'true'
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Konten komentar diperlukan' },
        { status: 400 }
      )
    }

    // Validate file uploads if provided - check URL strings, not File objects
    if (images.length > 0 || videos.length > 0 || documents.length > 0) {
      // Check image count limit
      if (images.length > UPLOAD_CONFIG.comment.maxImages) {
        return NextResponse.json(
          { error: `Maksimal ${UPLOAD_CONFIG.comment.maxImages} gambar per komentar` },
          { status: 400 }
        )
      }

      // Check video count limit
      if (videos.length > UPLOAD_CONFIG.comment.maxVideos) {
        return NextResponse.json(
          { error: `Maksimal ${UPLOAD_CONFIG.comment.maxVideos} video per komentar` },
          { status: 400 }
        )
      }

      // Check document count limit
      if (documents.length > UPLOAD_CONFIG.comment.maxDocuments) {
        return NextResponse.json(
          { error: `Maksimal ${UPLOAD_CONFIG.comment.maxDocuments} dokumen per komentar` },
          { status: 400 }
        )
      }

      // Validate images are string URLs (not empty)
      for (const img of images) {
        if (typeof img !== 'string' || img.trim().length === 0) {
          return NextResponse.json(
            { error: 'Format gambar tidak valid' },
            { status: 400 }
          )
        }
      }

      // Validate videos are string URLs (not empty)
      for (const vid of videos) {
        if (typeof vid !== 'string' || vid.trim().length === 0) {
          return NextResponse.json(
            { error: 'Format video tidak valid' },
            { status: 400 }
          )
        }
      }

      // Validate documents are string URLs (not empty)
      for (const doc of documents) {
        if (typeof doc !== 'string' || doc.trim().length === 0) {
          return NextResponse.json(
            { error: 'Format dokumen tidak valid' },
            { status: 400 }
          )
        }
      }
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, groupId: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Postingan tidak ditemukan' }, { status: 404 })
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentComment = await prisma.postComment.findUnique({
        where: { id: parentId },
        select: { id: true }
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Komentar induk tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    // Build mentionedUsers array - combine regular mentions with @all/@member
    let mentionedUserIds: string[] = []
    
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: mentions }
        },
        select: { id: true }
      })
      mentionedUserIds = mentionedUsers.map(u => u.id)
    }

    // Handle @all tag
    if (taggedAll && post.groupId) {
      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId: post.groupId },
        select: { userId: true }
      })
      mentionedUserIds = [...new Set([...mentionedUserIds, ...groupMembers.map(m => m.userId)])]
    }

    // Handle @member tag (all members except bots/guests)
    if (taggedMembers && post.groupId) {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId: post.groupId,
          user: {
            role: { in: ['MEMBER_PREMIUM', 'MEMBER_FREE', 'MENTOR', 'FOUNDER', 'CO_FOUNDER'] }
          }
        },
        select: { userId: true }
      })
      mentionedUserIds = [...new Set([...mentionedUserIds, ...members.map(m => m.userId)])]
    }

    // Create comment with media attachments
    const [comment] = await prisma.$transaction([
      prisma.postComment.create({
        data: {
          content: content.trim(),
          postId: id,
          userId: session.user.id,
          updatedAt: new Date(),
          images: images.length > 0 ? images : null,
          videos: videos.length > 0 ? videos : null,
          documents: documents.length > 0 ? documents : null,
          mentionedUsers: mentionedUserIds.length > 0 ? mentionedUserIds : null,
          ...(parentId && { parentId }),
        },
        include: {
          User: {
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

    // 🔔 NOTIFICATION: New comment on post
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

    // 🔔 NOTIFICATION: Send to all mentioned users
    if (mentionedUserIds.length > 0) {
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId !== session.user.id) {
          await notificationService.send({
            userId: mentionedUserId,
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
      { error: 'Gagal membuat komentar' },
      { status: 500 }
    )
  }
}
