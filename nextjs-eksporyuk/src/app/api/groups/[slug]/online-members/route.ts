import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[slug]/online-members
// Fetches online members in a specific group
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grup tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get online members in this group (excluding mentors and current user)
    const onlineMembers = await prisma.user.findMany({
      where: {
        isOnline: true,
        id: { not: session.user.id },
        role: {
          in: ['MEMBER_PREMIUM', 'MEMBER_FREE', 'ADMIN']
        },
        groupMemberships: {
          some: {
            groupId: group.id
          }
        }
      },
      take: limit,
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        isOnline: true,
        lastActiveAt: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    })

    // Get total online count (for "lihat semua" feature)
    const totalOnline = await prisma.user.count({
      where: {
        isOnline: true,
        id: { not: session.user.id },
        role: {
          in: ['MEMBER_PREMIUM', 'MEMBER_FREE', 'ADMIN']
        },
        groupMemberships: {
          some: {
            groupId: group.id
          }
        }
      }
    })

    // Check if current user follows these users
    const followingIds = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: onlineMembers.map(u => u.id) }
      },
      select: { followingId: true }
    })

    const followingSet = new Set(followingIds.map(f => f.followingId))

    const membersWithFollowStatus = onlineMembers.map(user => ({
      ...user,
      isFollowing: followingSet.has(user.id)
    }))

    return NextResponse.json({
      success: true,
      members: membersWithFollowStatus,
      total: totalOnline
    })
  } catch (error: any) {
    console.error('[GET_ONLINE_MEMBERS_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat member online' },
      { status: 500 }
    )
  }
}
