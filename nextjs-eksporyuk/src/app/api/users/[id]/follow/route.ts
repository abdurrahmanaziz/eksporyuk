import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { pusherService } from '@/lib/pusher'
import { randomUUID } from 'crypto'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/users/[id]/follow - Toggle follow user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: targetUserId } = await params

    // Tidak bisa follow diri sendiri
    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Cek apakah user target ada
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, username: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cek apakah sudah follow
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      })

      // Notify via Pusher
      try {
        await pusherService.notifyUser(targetUserId, 'user-unfollowed', {
          userId: session.user.id,
          username: session.user.username || 'User'
        })
      } catch (e) {
        console.log('[Follow API] Pusher notification skipped:', e)
      }

      return NextResponse.json({ 
        isFollowing: false,
        message: 'Unfollowed successfully'
      })
    } else {
      // Follow
      const follow = await prisma.follow.create({
        data: {
          id: randomUUID(),
          followerId: session.user.id,
          followingId: targetUserId
        }
      })

      // Get follower info for notification
      const follower = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, username: true, avatar: true }
      })

      const followerName = follower?.name || follower?.username || 'Seseorang'
      const followerUsername = follower?.username || 'user'

      // Create notification record in database
      let notificationId = ''
      try {
        const now = new Date()
        const notification = await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: targetUserId,
            type: 'FOLLOW',
            title: 'Pengikut Baru',
            message: `${followerName} mulai mengikuti Anda`,
            sourceType: 'follow',
            sourceId: follow.id,
            link: `/${followerUsername}`,
            redirectUrl: `/${followerUsername}`,
            actorId: session.user.id,
            actorName: followerName,
            actorAvatar: follower?.avatar || null,
            isRead: false,
            isSent: true,
            sentAt: now,
            updatedAt: now
          }
        })
        notificationId = notification.id
      } catch (e) {
        console.log('[Follow API] Failed to create notification record:', e)
      }

      // Send notification via Pusher (real-time) - use 'notification' event to match NotificationBell listener
      try {
        await pusherService.notifyUser(targetUserId, 'notification', {
          id: notificationId || `follow-${follow.id}`,
          type: 'FOLLOW',
          title: 'Pengikut Baru',
          message: `${followerName} mulai mengikuti Anda`,
          link: `/${followerUsername}`,
          isRead: false,
          createdAt: new Date().toISOString()
        })
      } catch (e) {
        console.log('[Follow API] Pusher notification skipped:', e)
        // Don't fail the follow if Pusher fails
      }

      return NextResponse.json({ 
        isFollowing: true,
        message: 'Followed successfully'
      })
    }
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle follow' },
      { status: 500 }
    )
  }
}

// GET /api/users/[id]/follow - Check if following
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false })
    }

    const { id: targetUserId } = await params

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    })

    return NextResponse.json({ isFollowing: !!isFollowing })
  } catch (error) {
    console.error('Check follow error:', error)
    return NextResponse.json({ isFollowing: false })
  }
}

// DELETE /api/users/[id]/follow - Unfollow user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: targetUserId } = await params

    // Cek apakah ada follow relationship
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    })

    if (!existingFollow) {
      return NextResponse.json({ error: 'Not following this user' }, { status: 400 })
    }

    // Unfollow
    await prisma.follow.delete({
      where: { id: existingFollow.id }
    })

    return NextResponse.json({ 
      isFollowing: false,
      message: 'Unfollowed successfully'
    })
  } catch (error) {
    console.error('Follow error:', error)
    // Return safe error response
    return NextResponse.json(
      { isFollowing: false, error: 'Tidak dapat mengikuti user', success: false },
      { status: 400 }
    )
  }
}
