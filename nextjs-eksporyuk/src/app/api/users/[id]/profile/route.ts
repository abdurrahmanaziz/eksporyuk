import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/users/[id]/profile - Get user profile with stats
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            posts: true,
            postComments: true,
            postLikes: true,
            followers: true,
            following: true,
            groupMemberships: true
          }
        },
        groupMemberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                avatar: true,
                type: true
              }
            }
          },
          take: 10,
          orderBy: {
            joinedAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent activity
    const recentPosts = await prisma.post.findMany({
      where: { authorId: params.id },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    const recentComments = await prisma.postComment.findMany({
      where: { userId: params.id },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Check if viewing own profile or is following
    const isOwnProfile = session.user.id === params.id
    let isFollowing = false
    
    if (!isOwnProfile) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: params.id
          }
        }
      })
      isFollowing = !!follow
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        stats: {
          posts: user._count.posts,
          comments: user._count.postComments,
          likes: user._count.postLikes,
          followers: user._count.followers,
          following: user._count.following,
          groups: user._count.groupMemberships
        },
        groups: user.groupMemberships.map(gm => gm.group),
        recentActivity: {
          posts: recentPosts,
          comments: recentComments
        }
      },
      isOwnProfile,
      isFollowing
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id]/profile - Update online status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { bio } = await req.json()

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        bio,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      user,
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
