import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/users/[id]/profile-preview - Get user profile preview for hover card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        bio: true,
        city: true,
        province: true,
        locationVerified: true,
        createdAt: true,
        _count: {
          select: {
            Post: true,
            Follow_Follow_followingIdToUser: true, // followers (people following this user)
            Follow_Follow_followerIdToUser: true   // following (people this user follows)
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is following this user
    let isFollowing = false
    if (session?.user?.id && session.user.id !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId
          }
        }
      })
      isFollowing = !!follow
    }

    // Transform response to use cleaner names
    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      bio: user.bio,
      city: user.city,
      province: user.province,
      locationVerified: user.locationVerified,
      createdAt: user.createdAt,
      _count: {
        posts: user._count.Post,
        followers: user._count.Follow_Follow_followingIdToUser,
        following: user._count.Follow_Follow_followerIdToUser
      },
      isFollowing
    })
  } catch (error) {
    console.error('Error fetching user profile preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile preview' },
      { status: 500 }
    )
  }
}
