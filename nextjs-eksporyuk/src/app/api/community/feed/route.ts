import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// Helper to get post with all details (no relations in schema)
async function getPostWithDetails(post: any) {
  const [author, group, likes, reactions, comments, likesCount, reactionsCount, commentsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: post.authorId },
      select: { id: true, name: true, email: true, avatar: true, role: true, province: true, city: true, locationVerified: true }
    }),
    post.groupId ? prisma.group.findUnique({
      where: { id: post.groupId },
      select: { id: true, name: true, slug: true, type: true, avatar: true }
    }) : null,
    prisma.postLike.findMany({ where: { postId: post.id } }),
    prisma.postReaction.findMany({ where: { postId: post.id } }),
    prisma.postComment.findMany({ where: { postId: post.id }, orderBy: { createdAt: 'asc' } }),
    prisma.postLike.count({ where: { postId: post.id } }),
    prisma.postReaction.count({ where: { postId: post.id } }),
    prisma.postComment.count({ where: { postId: post.id } })
  ])

  // Get users for likes
  const likeUserIds = likes.map((l: any) => l.userId)
  const likeUsers = likeUserIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: likeUserIds } },
    select: { id: true, name: true, avatar: true }
  }) : []
  const likeUserMap = new Map(likeUsers.map(u => [u.id, u]))

  // Get users for reactions
  const reactionUserIds = reactions.map((r: any) => r.userId)
  const reactionUsers = reactionUserIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: reactionUserIds } },
    select: { id: true, name: true, avatar: true }
  }) : []
  const reactionUserMap = new Map(reactionUsers.map(u => [u.id, u]))

  // Get users for comments
  const commentUserIds = comments.map((c: any) => c.userId)
  const commentUsers = commentUserIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: commentUserIds } },
    select: { id: true, name: true, avatar: true }
  }) : []
  const commentUserMap = new Map(commentUsers.map(u => [u.id, u]))

  const likesWithUsers = likes.map((l: any) => ({ ...l, user: likeUserMap.get(l.userId) || null }))
  const reactionsWithUsers = reactions.map((r: any) => ({ ...r, user: reactionUserMap.get(r.userId) || null }))
  const commentsWithUsers = comments.map((c: any) => ({ ...c, user: commentUserMap.get(c.userId) || null, replies: [] }))

  // Calculate reactions count by type
  const reactionsCountByType: Record<string, number> = {}
  reactions.forEach((r: any) => {
    reactionsCountByType[r.type] = (reactionsCountByType[r.type] || 0) + 1
  })

  return {
    ...post,
    author,
    group,
    likes: likesWithUsers,
    reactions: reactionsWithUsers,
    comments: commentsWithUsers,
    _count: { likes: likesCount, reactions: reactionsCount, comments: commentsCount },
    images: post.images || [],
    videos: post.videos || [],
    documents: post.documents || [],
    backgroundId: post.backgroundId || null,
    reactionsCount: reactionsCountByType,
    pollData: post.pollData || null,
    eventData: post.eventData || null,
    commentsEnabled: post.commentsEnabled !== false
  }
}

// GET /api/community/feed - Get personalized community feed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get current user's active memberships
    const currentUserMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      select: { membershipId: true }
    })

    const userMembershipIds = currentUserMemberships.map(m => m.membershipId)

    // Get community users
    let communityUserIdList: string[] = []
    if (userMembershipIds.length > 0) {
      const communityUserIds = await prisma.userMembership.findMany({
        where: {
          membershipId: { in: userMembershipIds },
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        select: { userId: true },
        distinct: ['userId']
      })
      communityUserIdList = communityUserIds.map(u => u.userId)
    } else {
      const allUsers = await prisma.user.findMany({ select: { id: true } })
      communityUserIdList = allUsers.map(u => u.id)
    }

    // Get user's direct group memberships
    const directGroupMemberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    })
    const directGroupIds = directGroupMemberships.map(g => g.groupId)

    // Get groups via membership plan
    const membershipGroupAccess = await prisma.membershipGroup.findMany({
      where: { membershipId: { in: userMembershipIds } },
      select: { groupId: true }
    })
    const membershipGroupIds = membershipGroupAccess.map(g => g.groupId)

    // Get groups user owns
    const ownedGroups = await prisma.group.findMany({
      where: { ownerId: session.user.id, isActive: true },
      select: { id: true }
    })
    const ownedGroupIds = ownedGroups.map(g => g.id)

    // Get public groups if filter is all
    let publicGroupIds: string[] = []
    if (filter === 'all') {
      const publicGroups = await prisma.group.findMany({
        where: { type: 'PUBLIC', isActive: true },
        select: { id: true }
      })
      publicGroupIds = publicGroups.map(g => g.id)
    }

    // Combine all accessible group IDs
    const accessibleGroupIds = [...new Set([...directGroupIds, ...membershipGroupIds, ...ownedGroupIds, ...publicGroupIds])]

    // Build where conditions - handle empty arrays
    const whereConditions: any = {}

    // Build OR conditions for posts
    const postOrConditions = []
    
    // Add group filter if user has access to any groups
    if (accessibleGroupIds.length > 0) {
      postOrConditions.push({ groupId: { in: accessibleGroupIds } })
    }
    
    // Add personal posts filter if user is in community
    if (communityUserIdList.length > 0) {
      postOrConditions.push({ 
        groupId: null, 
        authorId: { in: communityUserIdList } 
      })
    }

    // If no accessible content, return empty
    if (postOrConditions.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      })
    }

    whereConditions.OR = postOrConditions

    // Fetch posts - only get APPROVED or posts without approval status
    const posts = await prisma.post.findMany({
      where: whereConditions,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit
    })

    // Filter in JavaScript for approval status (null or APPROVED)
    const filteredPosts = posts.filter(post => 
      post.approvalStatus === 'APPROVED' || post.approvalStatus === null
    )

    // Get details for all posts
    const transformedPosts = await Promise.all(filteredPosts.map(post => getPostWithDetails(post)))

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: transformedPosts.length,
        hasMore: transformedPosts.length === limit
      },
      filter,
      accessibleGroupsCount: accessibleGroupIds.length
    })

  } catch (error) {
    console.error('Error fetching community feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/community/posts - Create global community post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, groupId, images, videos, taggedUsers, contentFormatted, backgroundId, type = 'POST' } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // If groupId specified, verify user has access
    if (groupId) {
      const group = await prisma.group.findFirst({ where: { id: groupId, isActive: true } })
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 })
      }

      // Check access
      const isOwner = group.ownerId === session.user.id
      const isMember = await prisma.groupMember.findFirst({
        where: { groupId, userId: session.user.id }
      })
      const hasMembershipAccess = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          membership: { membershipGroups: { some: { groupId } } }
        }
      })

      if (!isOwner && !isMember && !hasMembershipAccess) {
        return NextResponse.json({ error: 'Access denied to this group' }, { status: 403 })
      }
    }

    // Background only applies to text-only posts (no images/videos)
    const hasMedia = (images && images.length > 0) || (videos && videos.length > 0)
    const finalBackgroundId = hasMedia ? null : (backgroundId || null)

    // Create the post
    const post = await prisma.post.create({
      data: {
        id: createId(),
        content: content.trim(),
        authorId: session.user.id,
        groupId: groupId || null,
        type,
        images: images || [],
        videos: videos || [],
        taggedUsers: taggedUsers || [],
        contentFormatted: contentFormatted || null,
        backgroundId: finalBackgroundId,
        approvalStatus: 'APPROVED',
        updatedAt: new Date(),
      }
    })

    // Get author and group info manually
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, avatar: true }
    })
    const group = groupId ? await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, slug: true }
    }) : null

    const postWithDetails = { ...post, author, group }

    // Send mention notifications
    if (taggedUsers && Array.isArray(taggedUsers) && taggedUsers.length > 0) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        fetch(`${appUrl}/api/notifications/mention`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
          body: JSON.stringify({ postId: post.id, mentionedUserIds: taggedUsers })
        }).catch(err => console.error('Failed to send mention notifications:', err))
      } catch (err) {
        console.error('Error triggering mention notifications:', err)
      }
    }

    return NextResponse.json({ success: true, post: postWithDetails, message: 'Post created successfully' })

  } catch (error) {
    console.error('Error creating community post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
