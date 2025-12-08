import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

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
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    // Transform data
    const transformedMembers = members.map(member => ({
      ...member,
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
