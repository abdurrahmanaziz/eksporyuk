import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notificationService'

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

      return NextResponse.json({ 
        isFollowing: false,
        message: 'Unfollowed successfully'
      })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      })

      // Get follower info for notification
      const follower = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, username: true, avatar: true }
      })

      // Send notification via notificationService (Pusher + OneSignal)
      try {
        await notificationService.send({
          userId: targetUserId,
          type: 'FOLLOW',
          title: 'Pengikut Baru',
          message: `${follower?.name || 'Seseorang'} mulai mengikuti Anda`,
          link: `/${follower?.username || session.user.id}`,
          redirectUrl: `/${follower?.username || session.user.id}`,
          actorId: session.user.id,
          actorName: follower?.name || 'Seseorang',
          actorAvatar: follower?.avatar || undefined,
          channels: ['pusher', 'onesignal'],
        })
      } catch (notifError) {
        console.error('Follow notification error:', notifError)
        // Don't fail the follow if notification fails
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
