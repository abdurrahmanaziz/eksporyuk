import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/user/[username] - Get public profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const session = await getServerSession(authOptions)

    // Fetch user profile (manual lookups for production)
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        coverImage: true,
        bio: true,
        role: true,
        province: true,
        city: true,
        locationVerified: true,
        createdAt: true,
        isOnline: true,
        lastSeenAt: true,
        isFounder: true,
        isCoFounder: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Manual lookups for role-specific profiles
    const [supplierProfile, affiliateProfile] = await Promise.all([
      prisma.supplierProfile.findFirst({
        where: { userId: user.id },
        select: {
          id: true,
          companyName: true,
          logo: true,
          banner: true,
          businessCategory: true,
        }
      }),
      prisma.affiliateProfile.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          affiliateCode: true,
          tier: true,
          totalEarnings: true,
          totalConversions: true,
        }
      })
    ])

    // Enrich user with profiles
    const userWithProfiles = {
      ...user,
      supplierProfile,
      affiliateProfile,
    }

    // Manually fetch stats
    const [postsCount, followingCount, followersCount, groupMembershipsData, courseEnrollmentsCount] = await Promise.all([
      prisma.post.count({ where: { authorId: userWithProfiles.id } }),
      prisma.follow.count({ where: { followerId: userWithProfiles.id } }),
      prisma.follow.count({ where: { followingId: userWithProfiles.id } }),
      prisma.groupMember.findMany({
        where: { userId: userWithProfiles.id },
        select: {
          role: true,
          joinedAt: true,
          groupId: true,
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.courseEnrollment.count({ where: { userId: user.id } })
    ])

    // Fetch groups for memberships
    const groupIds = groupMembershipsData.map(gm => gm.groupId)
    const groups = groupIds.length > 0 ? await prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        avatar: true,
        type: true,
      }
    }) : []
    
    const groupMap = new Map(groups.map(g => [g.id, g]))
    
    // Get member counts for groups
    const memberCounts = groupIds.length > 0 ? await prisma.groupMember.groupBy({
      by: ['groupId'],
      where: { groupId: { in: groupIds } },
      _count: { id: true }
    }) : []
    
    const memberCountMap = new Map(memberCounts.map(mc => [mc.groupId, mc._count.id]))
    
    const groupMemberships = groupMembershipsData.map(gm => ({
      role: gm.role,
      joinedAt: gm.joinedAt,
      group: groupMap.get(gm.groupId) ? {
        ...groupMap.get(gm.groupId),
        _count: {
          members: memberCountMap.get(gm.groupId) || 0
        }
      } : null
    })).filter(gm => gm.group !== null)
    
    // Enrich user with stats
    const enrichedUser = {
      ...userWithProfiles,
      _count: {
        posts: postsCount,
        following: followingCount,
        followers: followersCount,
        groupMemberships: groupMembershipsData.length,
        courseEnrollments: courseEnrollmentsCount,
      },
      groupMemberships
    }

    // Check if viewing own profile
    const isOwnProfile = session?.user?.email ? 
      (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id === enrichedUser.id 
      : false

    // Check if following
    let isFollowing = false
    if (session?.user?.email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      if (currentUser) {
        isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: currentUser.id,
            followingId: enrichedUser.id
          }
        }) !== null
      }
    }

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        authorId: enrichedUser.id,
        OR: [
          { groupId: null }, // Global posts
          // Public group posts - we'll filter manually
        ]
      },
      take: 20, // Get extra to filter
      orderBy: [
        { isPinned: 'desc' }, // Pinned posts first
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        content: true,
        images: true,
        isPinned: true,
        commentsEnabled: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        groupId: true,
      }
    })
    
    // Fetch authors, groups for posts
    const postGroupIds = [...new Set(recentPosts.map(p => p.groupId).filter(Boolean))] as string[]
    const [postAuthors, postGroups] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: [enrichedUser.id] } },
        select: {
          id: true,
          name: true,
          avatar: true,
          username: true,
        }
      }),
      postGroupIds.length > 0 ? prisma.group.findMany({
        where: { 
          id: { in: postGroupIds },
          type: 'PUBLIC'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          type: true,
        }
      }) : []
    ])
    
    const authorMap = new Map(postAuthors.map(a => [a.id, a]) as [string, typeof postAuthors[0]][])
    const postGroupMap = new Map(postGroups.map(g => [g.id, g]) as [string, typeof postGroups[0]][])
    
    // Get reaction counts and user reactions
    const postIds = recentPosts.map(p => p.id)
    const [reactions, likeCounts, commentCounts] = await Promise.all([
      postIds.length > 0 ? prisma.postReaction.findMany({
        where: { postId: { in: postIds } },
        select: {
          id: true,
          postId: true,
          userId: true,
          type: true,
        }
      }) : [],
      postIds.length > 0 ? prisma.postLike.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { id: true }
      }) : [],
      postIds.length > 0 ? prisma.postComment.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { id: true }
      }) : []
    ])
    
    const likeCountMap = new Map(likeCounts.map(lc => [lc.postId, lc._count.id]) as [string, number][])
    const commentCountMap = new Map(commentCounts.map(cc => [cc.postId, cc._count.id]) as [string, number][])
    
    // Fetch reaction users
    const reactionUserIds = [...new Set(reactions.map(r => r.userId))]
    const reactionUsers = reactionUserIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: reactionUserIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
      }
    }) : []
    const reactionUserMap = new Map(reactionUsers.map(u => [u.id, u]))
    
    // Enrich posts - only include public group posts or global posts
    const enrichedPosts = recentPosts
      .filter(post => !post.groupId || postGroupMap.has(post.groupId))
      .slice(0, 10) // Take only 10 after filtering
      .map(post => ({
        ...post,
        author: authorMap.get(post.authorId),
        group: post.groupId ? postGroupMap.get(post.groupId) : null,
        _count: {
          likes: likeCountMap.get(post.id) || 0,
          comments: commentCountMap.get(post.id) || 0,
        },
        reactions: reactions
          .filter(r => r.postId === post.id)
          .map(r => ({
            ...r,
            user: reactionUserMap.get(r.userId)
          }))
      }))

    // Role-specific data
    let roleData: any = {}
    
    // Note: SUPPLIER role doesn't exist in current schema, skip product loading
    // Products are linked to users directly via creatorId
    
    if (enrichedUser.role === 'AFFILIATE') {
      // Only show to profile owner
      if (isOwnProfile) {
        const topLinks = await prisma.affiliateLink.findMany({
          where: { userId: enrichedUser.id },
          take: 5,
          orderBy: { conversions: 'desc' },
          select: {
            id: true,
            fullUrl: true,
            shortCode: true,
            clicks: true,
            conversions: true,
            createdAt: true,
          }
        })
        roleData = { topLinks }
      }
    }

    if (enrichedUser.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: enrichedUser.id },
        select: { id: true }
      })
      if (mentorProfile) {
        const courses = await prisma.course.findMany({
          where: {
            mentorId: mentorProfile.id,
            isPublished: true,
          },
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            monetizationType: true,
            enrollmentCount: true,
          }
        })
        roleData = { courses }
      }
    }

    return NextResponse.json({
      user: {
        ...enrichedUser,
        isOwnProfile,
        isFollowing,
      },
      posts: enrichedPosts,
      roleData,
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
