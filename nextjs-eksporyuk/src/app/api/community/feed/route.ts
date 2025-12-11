import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
      select: {
        membershipId: true
      }
    })

    const userMembershipIds = currentUserMemberships.map(m => m.membershipId)

    // Get all users who have the same active memberships (community members)
    // For testing: if no membership, get all users
    let communityUserIdList: string[] = []
    
    if (userMembershipIds.length > 0) {
      const communityUserIds = await prisma.userMembership.findMany({
        where: {
          membershipId: { in: userMembershipIds },
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      })
      communityUserIdList = communityUserIds.map(u => u.userId)
    } else {
      // Testing mode: get all users
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      })
      communityUserIdList = allUsers.map(u => u.id)
    }

    // Get groups user has access to via direct membership or membership plans
    const userAccessibleGroups = await prisma.group.findMany({
      where: {
        isActive: true,
        OR: [
          // 1. User is direct member of the group
          { 
            members: { 
              some: { 
                userId: session.user.id 
              } 
            } 
          },
          // 2. User has active membership that includes this group
          { 
            membershipGroups: {
              some: {
                membership: {
                  userMemberships: {
                    some: {
                      userId: session.user.id,
                      isActive: true,
                      startDate: { lte: new Date() },
                      endDate: { gte: new Date() }
                    }
                  }
                }
              }
            }
          },
          // 3. User is owner of the group
          { ownerId: session.user.id },
          // 4. Public groups (for discovery)
          ...(filter === 'all' ? [{ type: 'PUBLIC' as const }] : [])
        ]
      },
      select: { id: true }
    })

    const accessibleGroupIds = userAccessibleGroups.map(g => g.id)

    // Fetch posts with simpler query
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          // Posts in accessible groups
          {
            groupId: { in: accessibleGroupIds }
          },
          // Personal posts from community members
          {
            groupId: null,
            authorId: { in: communityUserIdList }
          }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            province: true,
            city: true,
            locationVerified: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            avatar: true
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            reactions: true,
            comments: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    })

    // Filter approved or null status posts (do this in JS to avoid Prisma issues)
    const filteredPosts = posts.filter(post => 
      post.approvalStatus === 'APPROVED' || post.approvalStatus === null
    )

    // Transform posts to ensure consistent format
    const transformedPosts = filteredPosts.map(post => {
      // Calculate reactions count
      const reactionsCount: Record<string, number> = {}
      if (post.reactions && Array.isArray(post.reactions)) {
        post.reactions.forEach((reaction: any) => {
          reactionsCount[reaction.type] = (reactionsCount[reaction.type] || 0) + 1
        })
      }

      return {
        ...post,
        images: post.images || [],
        videos: post.videos || [],
        documents: post.documents || [],
        reactionsCount,
        pollData: post.pollData || null,
        eventData: post.eventData || null,
        commentsEnabled: post.commentsEnabled !== false
      }
    })

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        hasMore: filteredPosts.length === limit
      },
      filter,
      accessibleGroupsCount: accessibleGroupIds.length
    })

  } catch (error) {
    console.error('Error fetching community feed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { 
        error: 'Failed to fetch feed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    const { content, groupId, images, videos, taggedUsers, contentFormatted, type = 'POST' } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // If groupId specified, verify user has access to post in that group
    if (groupId) {
      const groupAccess = await prisma.group.findFirst({
        where: {
          id: groupId,
          isActive: true,
          OR: [
            // User is member
            { members: { some: { userId: session.user.id } } },
            // User has membership access
            { 
              membershipGroups: {
                some: {
                  membership: {
                    userMemberships: {
                      some: {
                        userId: session.user.id,
                        isActive: true,
                        startDate: { lte: new Date() },
                        endDate: { gte: new Date() }
                      }
                    }
                  }
                }
              }
            },
            // User is owner
            { ownerId: session.user.id }
          ]
        }
      })

      if (!groupAccess) {
        return NextResponse.json(
          { error: 'Access denied to this group' },
          { status: 403 }
        )
      }
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        groupId: groupId || null,
        type,
        images: images || [],
        videos: videos || [],
        taggedUsers: taggedUsers || [],
        contentFormatted: contentFormatted || null,
        approvalStatus: 'APPROVED' // Global posts auto-approved
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        group: groupId ? {
          select: {
            id: true,
            name: true,
            slug: true
          }
        } : undefined
      }
    })

    // Send mention notifications if there are tagged users
    if (taggedUsers && Array.isArray(taggedUsers) && taggedUsers.length > 0) {
      try {
        // Fire and forget - don't wait for notification to complete
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/mention`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            postId: post.id,
            mentionedUserIds: taggedUsers
          })
        }).catch(err => console.error('Failed to send mention notifications:', err))
      } catch (err) {
        console.error('Error triggering mention notifications:', err)
        // Don't fail the post creation if notifications fail
      }
    }

    return NextResponse.json({ 
      success: true, 
      post,
      message: 'Post created successfully'
    })

  } catch (error) {
    console.error('Error creating community post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}