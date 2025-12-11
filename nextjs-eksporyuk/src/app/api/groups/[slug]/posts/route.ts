import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { containsBannedWords, filterBannedWords } from '@/lib/moderation'
import { notificationService } from '@/lib/services/notificationService'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
    // Verify user has access to this group
    const groupAccess = await prisma.group.findFirst({
      where: {
        slug,
        isActive: true,
        ...(isAdmin ? {} : {
          OR: [
            // User is member
            ...(session?.user?.id ? [{ members: { some: { userId: session.user.id } } }] : []),
            // User has membership access
            ...(session?.user?.id ? [{ 
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
            }] : []),
            // User is owner
            ...(session?.user?.id ? [{ ownerId: session.user.id }] : []),
            // Public group (for read access)
            { type: 'PUBLIC' }
          ]
        })
      },
      select: { id: true, slug: true, requireApproval: true, type: true }
    })

    if (!groupAccess) {
      return NextResponse.json(
        { error: 'Access denied to this group' },
        { status: 403 }
      )
    }

    const group = groupAccess

    const posts = await prisma.post.findMany({
      where: {
        groupId: group.id,
        type: { in: ['POST', 'POLL', 'ANNOUNCEMENT'] }, // Include polls and announcements
        approvalStatus: 'APPROVED', // Only show approved posts
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            lastActiveAt: true,
            province: true,
            city: true,
            locationVerified: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          take: 3,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Transform posts to ensure all required fields are present
    const transformedPosts = posts.map(post => ({
      ...post,
      images: post.images || [],
      videos: post.videos || [],
      documents: post.documents || [],
      taggedUsers: post.taggedUsers || [],
      reactionsCount: post.reactionsCount || {},
      reactions: post.reactions || [],
      commentsEnabled: post.commentsEnabled !== false, // Default to true
    }))

    return NextResponse.json({
      posts: transformedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
    })
  } catch (error) {
    console.error('Error fetching group posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Check if user is ADMIN - bypass all access checks
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    // Verify user has access to post in this group
    const groupAccess = await prisma.group.findFirst({
      where: {
        slug,
        isActive: true,
        ...(isAdmin ? {} : {
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
        })
      },
      select: {
        id: true,
        bannedWords: true,
        requireApproval: true,
        ownerId: true
      }
    })

    if (!groupAccess) {
      return NextResponse.json(
        { error: 'Access denied to post in this group' },
        { status: 403 }
      )
    }

    const group = groupAccess

    // ADMIN can skip membership check
    if (!isAdmin) {
      // Check if user is a member or has membership access (more detailed check)
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: session.user.id,
          }
        }
      })

      // Check if user has access via direct membership or membership plan
      const hasDirectMembership = !!membership
      const hasMembershipAccess = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          membership: {
            membershipGroups: {
              some: { groupId: group.id }
            }
          }
        }
      })

      const isOwner = group.ownerId === session.user.id

      if (!hasDirectMembership && !hasMembershipAccess && !isOwner) {
        return NextResponse.json(
          { error: 'You must be a member to post in this group' },
          { status: 403 }
        )
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
        content: filteredContent,
        images: images || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        type: type || 'POST',
        authorId: session.user.id,
        groupId: group.id,
        approvalStatus,
        ...(type === 'STORY' && {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }),
        ...(type === 'ANNOUNCEMENT' && {
          isPinned: true
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    // If post requires approval, notify moderators
    if (approvalStatus === 'PENDING') {
      const moderators = await prisma.groupMember.findMany({
        where: {
          groupId: group.id,
          role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] }
        },
        select: { userId: true }
      })

      await prisma.notification.createMany({
        data: moderators.map(mod => ({
          userId: mod.userId,
          type: 'POST_PENDING_APPROVAL',
          title: 'Postingan Baru Menunggu Persetujuan',
          message: `${session.user.name} membuat postingan yang perlu disetujui`,
          link: `/community/groups/${group.slug}`,
        }))
      })
    } else if (approvalStatus === 'APPROVED') {
      // 🔔 NOTIFICATION TRIGGER: New post in group (notify all members)
      const groupMembers = await prisma.groupMember.findMany({
        where: {
          groupId: group.id,
          userId: { not: session.user.id }, // Exclude post author
        },
        select: { userId: true }
      })

      // Send notification to all group members (use subscription-based)
      if (groupMembers.length > 0) {
        await notificationService.sendToSubscribers({
          targetType: 'GROUP',
          targetId: group.id,
          excludeUserId: session.user.id,
          type: 'POST_NEW',
          title: 'Postingan Baru di Grup',
          message: `${session.user.name} memposting di grup`,
          relatedId: post.id,
          relatedType: 'POST',
          actionUrl: `/community/groups/${slug}/posts/${post.id}`,
          channels: ['pusher'], // Only in-app to avoid spam
        })
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
