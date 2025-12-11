import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { pusherService } from '@/lib/pusher'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * UPDATE USER ONLINE STATUS
 * Endpoint untuk update status online user dengan real-time broadcast
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { isOnline } = await req.json()

    // Check if user exists first
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update status di database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnline: isOnline,
        lastActiveAt: new Date(),
        ...(isOnline ? {} : { lastSeenAt: new Date() })
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        isOnline: true,
        lastSeenAt: true,
        role: true
      }
    })

    // Broadcast status change via Pusher
    await pusherService.broadcast('user-status-changed', {
      userId: updatedUser.id,
      isOnline: updatedUser.isOnline,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      timestamp: new Date().toISOString()
    })

    // Notify followers
    const followers = await prisma.follow.findMany({
      where: { followingId: session.user.id },
      select: { followerId: true }
    })

    if (followers.length > 0) {
      const channels = followers.map(f => `user-${f.followerId}`)
      await pusherService.triggerMultiple(channels, 'following-status-changed', {
        userId: updatedUser.id,
        isOnline: updatedUser.isOnline,
        name: updatedUser.name,
        avatar: updatedUser.avatar
      })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('[USER_PRESENCE_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update presence' },
      { status: 500 }
    )
  }
}

/**
 * GET ONLINE USERS
 * Fetch daftar user yang sedang online dengan filter
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // Filter by role (e.g., MENTOR)
    const groupId = searchParams.get('groupId') // Filter by group membership
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    const whereClause: any = {
      isOnline: true,
      id: { not: session.user.id } // Exclude self
    }

    if (role) {
      whereClause.role = role
    }

    if (groupId) {
      whereClause.groupMemberships = {
        some: {
          groupId: groupId
        }
      }
    }

    const onlineUsers = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        isOnline: true,
        lastActiveAt: true,
        mentorProfile: {
          select: {
            expertise: true,
            bio: true
          }
        },
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    })

    // Check if current user follows these users
    const followingIds = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: onlineUsers.map(u => u.id) }
      },
      select: { followingId: true }
    })

    const followingSet = new Set(followingIds.map(f => f.followingId))

    const usersWithFollowStatus = onlineUsers.map(user => ({
      ...user,
      isFollowing: followingSet.has(user.id)
    }))

    return NextResponse.json({
      success: true,
      users: usersWithFollowStatus,
      total: usersWithFollowStatus.length
    })
  } catch (error: any) {
    console.error('[GET_ONLINE_USERS_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch online users' },
      { status: 500 }
    )
  }
}
