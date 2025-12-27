import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { containsBannedWords, filterBannedWords } from '@/lib/moderation'
import { notificationService } from '@/lib/services/notificationService'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Helper to get post with author and counts (no relations exist in schema)
async function getPostWithDetails(post: any, includeComments = false) {
  const [author, likesCount, reactionsCount, commentsCount, likes, reactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: post.authorId },
      select: { id: true, name: true, email: true, avatar: true, role: true, lastActiveAt: true, province: true, city: true, locationVerified: true }
    }),
    prisma.postLike.count({ where: { postId: post.id } }),
    prisma.postReaction.count({ where: { postId: post.id } }),
    prisma.postComment.count({ where: { postId: post.id } }),
    prisma.postLike.findMany({ where: { postId: post.id }, select: { userId: true } }),
    prisma.postReaction.findMany({ where: { postId: post.id } })
  ])

  // Get reaction users
  const reactionUserIds = reactions.map((r: any) => r.userId)
  const reactionUsers = reactionUserIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: reactionUserIds } },
    select: { id: true, name: true, avatar: true }
  }) : []
  const reactionUserMap = new Map(reactionUsers.map(u => [u.id, u]))

  const reactionsWithUsers = reactions.map((r: any) => ({
    ...r,
    user: reactionUserMap.get(r.userId) || null
  }))

  // Get comments if needed
  let comments: any[] = []
  if (includeComments) {
    const rawComments = await prisma.postComment.findMany({
      where: { postId: post.id },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })
    const commentUserIds = rawComments.map((c: any) => c.userId)
    const commentUsers = commentUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: commentUserIds } },
      select: { id: true, name: true, avatar: true }
    }) : []
    const commentUserMap = new Map(commentUsers.map(u => [u.id, u]))
    comments = rawComments.map((c: any) => ({
      ...c,
      user: commentUserMap.get(c.userId) || null
    }))
  }

  return {
    ...post,
    author,
    likes,
    reactions: reactionsWithUsers,
    comments,
    _count: { comments: commentsCount, likes: likesCount, reactions: reactionsCount }
  }
}

// GET /api/groups/[slug]/posts - Get group posts (feed)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    // Check if user is ADMIN - bypass all access checks
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

    // Find group by slug first
    const group = await prisma.group.findFirst({
      where: { slug, isActive: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check access - simplified (no relations)
    if (!isAdmin) {
      const hasAccess = group.type === 'PUBLIC' || group.ownerId === session?.user?.id
      
      if (!hasAccess && session?.user?.id) {
        // Check direct membership
        const directMember = await prisma.groupMember.findFirst({
          where: { groupId: group.id, userId: session.user.id }
        })
        
        // Check membership access
        const membershipAccess = await prisma.userMembership.findFirst({
          where: {
            userId: session.user.id,
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            membership: {
              membershipGroups: { some: { groupId: group.id } }
            }
          }
        })

        if (!directMember && !membershipAccess) {
          return NextResponse.json({ error: 'Access denied to this group' }, { status: 403 })
        }
      } else if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this group' }, { status: 403 })
      }
    }

    const posts = await prisma.post.findMany({
      where: {
        groupId: group.id,
        type: { in: ['POST', 'POLL', 'ANNOUNCEMENT'] },
        approvalStatus: 'APPROVED',
      },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    })

    // Get details for all posts
    const transformedPosts = await Promise.all(posts.map(post => getPostWithDetails(post, true)))

    // Ensure all required fields are present
    const finalPosts = transformedPosts.map(post => ({
      ...post,
      images: post.images || [],
      videos: post.videos || [],
      documents: post.documents || [],
      taggedUsers: post.taggedUsers || [],
      reactionsCount: post.reactionsCount || {},
      reactions: post.reactions || [],
      commentsEnabled: post.commentsEnabled !== false,
    }))

    return NextResponse.json({
      posts: finalPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
    })
  } catch (error) {
    console.error('Error fetching group posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/groups/[slug]/posts - Create post in group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const { content, images, type, metadata } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check if user is ADMIN - bypass all access checks
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    // Find group
    const group = await prisma.group.findFirst({
      where: { slug, isActive: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check membership (no compound key in schema)
    let membership = await prisma.groupMember.findFirst({
      where: { groupId: group.id, userId: session.user.id }
    })

    // ADMIN can skip membership check
    if (!isAdmin) {
      const hasDirectMembership = !!membership
      const hasMembershipAccess = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          membership: { membershipGroups: { some: { groupId: group.id } } }
        }
      })
      const isOwner = group.ownerId === session.user.id

      if (!hasDirectMembership && !hasMembershipAccess && !isOwner) {
        return NextResponse.json({ error: 'You must be a member to post in this group' }, { status: 403 })
      }
    }

    // Check for banned words
    let filteredContent = content
    const bannedWords = (group.bannedWords as string[]) || []
    if (containsBannedWords(content, bannedWords)) {
      filteredContent = filterBannedWords(content, bannedWords)
    }

    // Determine approval status
    const isAdminOrModerator = ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership?.role || '')
    const approvalStatus = (group.requireApproval && !isAdminOrModerator) ? 'PENDING' : 'APPROVED'

    // Create post
    const post = await prisma.post.create({
      data: {
        id: createId(),
        content: filteredContent,
        images: images || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        type: type || 'POST',
        authorId: session.user.id,
        groupId: group.id,
        approvalStatus,
        ...(type === 'STORY' && { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }),
        ...(type === 'ANNOUNCEMENT' && { isPinned: true }),
        updatedAt: new Date(),
      },
    })

    // Get author info manually (no relations)
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, avatar: true, role: true }
    })

    const postWithAuthor = { ...post, author, _count: { comments: 0, likes: 0 } }

    // If post requires approval, notify moderators
    if (approvalStatus === 'PENDING') {
      const moderators = await prisma.groupMember.findMany({
        where: { groupId: group.id, role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] } },
        select: { userId: true }
      })
      await prisma.notification.createMany({
        data: moderators.map(mod => ({
          id: createId(),
          userId: mod.userId,
          type: 'POST_PENDING_APPROVAL',
          title: 'Postingan Baru Menunggu Persetujuan',
          message: `${session.user.name} membuat postingan yang perlu disetujui`,
          link: `/community/groups/${slug}`,
          updatedAt: new Date(),
        }))
      })
    } else if (approvalStatus === 'APPROVED') {
      // 🔔 NOTIFICATION: Notify all group members about new post
      const groupMembers = await prisma.groupMember.findMany({
        where: { 
          groupId: group.id, 
          userId: { not: session.user.id } 
        },
        select: { userId: true }
      })
      
      if (groupMembers.length > 0) {
        try {
          await notificationService.sendBulk({
            userIds: groupMembers.map(m => m.userId),
            type: 'GROUP_POST',
            title: `Postingan Baru di ${group.name}`,
            message: `${session.user.name} membuat postingan baru`,
            postId: post.id,
            groupId: group.id,
            actorId: session.user.id,
            actorName: session.user.name,
            redirectUrl: `/community/groups/${slug}/posts/${post.id}`,
            channels: ['pusher', 'onesignal'], // Real-time + Push notification
          })
        } catch (notifError) {
          console.error('Failed to send group post notification:', notifError)
        }
      }
    }

    return NextResponse.json({ post: postWithAuthor }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
