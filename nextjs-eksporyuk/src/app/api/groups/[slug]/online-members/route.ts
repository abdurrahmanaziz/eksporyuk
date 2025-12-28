import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Get group member user IDs first
    const groupMemberIds = await prisma.groupMember.findMany({
      where: { groupId: group.id },
      select: { userId: true }
    })
    const memberUserIds = groupMemberIds.map(m => m.userId)

    // Get online members in this group (excluding current user)
    const onlineMembers = await prisma.user.findMany({
      where: {
        isOnline: true,
        id: { 
          not: session.user.id,
          in: memberUserIds
        },
        role: {
          in: ['MEMBER_PREMIUM', 'MEMBER_FREE', 'ADMIN']
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
        lastActiveAt: true
      }
    })

    // Get follower counts manually (no relations)
    const membersWithCounts = await Promise.all(onlineMembers.map(async (user) => {
      const [followersCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: user.id } }),
        prisma.follow.count({ where: { followerId: user.id } })
      ])
      return {
        ...user,
        _count: { followers: followersCount, following: followingCount }
      }
    }))

    // Get total online count
    const totalOnline = await prisma.user.count({
      where: {
        isOnline: true,
        id: { 
          not: session.user.id,
          in: memberUserIds
        },
        role: {
          in: ['MEMBER_PREMIUM', 'MEMBER_FREE', 'ADMIN']
        }
      }
    })

    // Check if current user follows these users
    const followingIds = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: membersWithCounts.map(u => u.id) }
      },
      select: { followingId: true }
    })

    const followingSet = new Set(followingIds.map(f => f.followingId))

    const membersWithFollowStatus = membersWithCounts.map(user => ({
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
