import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups - Get all groups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const includeCount = searchParams.get('includeCount') === 'true'
    const type = searchParams.get('type') // Filter by type
    const myGroups = searchParams.get('myGroups') === 'true' // Get user's groups only
    
    const where: any = {
      isActive: true,
    }

    // Filter by type if specified
    if (type) {
      where.type = type
    }

    // If myGroups is true, only show groups user is a member of
    if (myGroups && session?.user?.id) {
      // Get user's group IDs
      const userMemberships = await prisma.groupMember.findMany({
        where: { userId: session.user.id },
        select: { groupId: true }
      })
      const userGroupIds = userMemberships.map(m => m.groupId)
      
      if (userGroupIds.length > 0) {
        where.id = { in: userGroupIds }
      } else {
        // User has no groups, return empty
        return NextResponse.json({ groups: [] })
      }
    } else {
      // For public listing, exclude HIDDEN groups unless user is a member
      if (!session?.user?.id) {
        where.type = {
          in: ['PUBLIC', 'PRIVATE'],
        }
      }
    }
    
    const groups = await prisma.group.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        avatar: true,
        coverImage: true,
        type: true,
        createdAt: true,
        ownerId: true,
      },
    })

    // Manually fetch additional data
    const groupIds = groups.map(g => g.id)
    const ownerIds = [...new Set(groups.map(g => g.ownerId).filter(Boolean))]

    const [owners, memberCounts, postCounts, userMemberships] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true, avatar: true }
      }),
      includeCount ? prisma.groupMember.groupBy({
        by: ['groupId'],
        where: { groupId: { in: groupIds } },
        _count: { userId: true }
      }) : Promise.resolve([]),
      includeCount ? prisma.post.groupBy({
        by: ['groupId'],
        where: { groupId: { in: groupIds } },
        _count: { id: true }
      }) : Promise.resolve([]),
      session?.user?.id ? prisma.groupMember.findMany({
        where: {
          userId: session.user.id,
          groupId: { in: groupIds }
        },
        select: { groupId: true, role: true, joinedAt: true }
      }) : Promise.resolve([])
    ])

    const ownerMap = new Map(owners.map(o => [o.id, o]))
    const memberCountMap = new Map(memberCounts.map((m: any) => [m.groupId, m._count.userId]))
    const postCountMap = new Map(postCounts.map((p: any) => [p.groupId, p._count.id]))
    const membershipMap = new Map(userMemberships.map(m => [m.groupId, m]))

    const enrichedGroups = groups.map(group => ({
      ...group,
      owner: group.ownerId ? ownerMap.get(group.ownerId) || null : null,
      ...(includeCount && {
        _count: {
          members: memberCountMap.get(group.id) || 0,
          posts: postCountMap.get(group.id) || 0,
        }
      }),
      ...(session?.user?.id && {
        members: membershipMap.has(group.id) ? [membershipMap.get(group.id)] : []
      })
    }))

    return NextResponse.json({
      groups: enrichedGroups,
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow ADMIN, MENTOR, and MEMBER to create groups
    const allowedRoles = ['ADMIN', 'MENTOR', 'MEMBER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      type,
      avatar,
    } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Name must be at least 3 characters' },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        type: type || 'PUBLIC',
        avatar: avatar || null,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    })

    // Auto-add creator as OWNER member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: 'OWNER',
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
