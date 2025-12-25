import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/community/members - Get all community members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get all users with their stats - only ADMIN, MENTOR, MEMBER_PREMIUM
    const members = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['ADMIN', 'MENTOR', 'MEMBER_PREMIUM']
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        city: true,
        province: true,
        locationVerified: true,
        bio: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    // Manually fetch counts
    const memberIds = members.map(m => m.id)
    const [postCounts, followerCounts, followingCounts] = await Promise.all([
      prisma.post.groupBy({
        by: ['authorId'],
        where: { authorId: { in: memberIds } },
        _count: { id: true }
      }),
      prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { in: memberIds } },
        _count: { followerId: true }
      }),
      prisma.follow.groupBy({
        by: ['followerId'],
        where: { followerId: { in: memberIds } },
        _count: { followingId: true }
      })
    ])

    const postCountMap = new Map(postCounts.map((p: any) => [p.authorId, p._count.id]))
    const followerCountMap = new Map(followerCounts.map((f: any) => [f.followingId, f._count.followerId]))
    const followingCountMap = new Map(followingCounts.map((f: any) => [f.followerId, f._count.followingId]))

    // Transform data
    const transformedMembers = members.map(member => ({
      ...member,
      _count: {
        posts: postCountMap.get(member.id) || 0,
        followers: followerCountMap.get(member.id) || 0,
        following: followingCountMap.get(member.id) || 0,
      },
      memberSince: member.createdAt.toISOString(),
    }))

    return NextResponse.json({
      members: transformedMembers,
      pagination: {
        page,
        limit,
        total: members.length,
        hasMore: members.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching community members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}
