import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/groups/suggested - Get suggested groups for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get groups user is not already a member of
    const userGroupIds = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    }).then(members => members.map(m => m.groupId))

    // Get user's current memberships to suggest relevant premium groups
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        membership: {
          include: {
            membershipGroups: {
              select: { groupId: true }
            }
          }
        }
      }
    })

    const accessibleGroupIds = userMemberships.flatMap(
      um => um.membership.membershipGroups.map(mg => mg.groupId)
    )

    // Find suggested groups - simplified query (no invalid relations)
    const suggestedGroups = await prisma.group.findMany({
      where: {
        AND: [
          { isActive: true },
          { id: { notIn: userGroupIds } },
          {
            OR: [
              { type: 'PUBLIC' },
              { id: { in: accessibleGroupIds } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get counts and owner info manually for each group
    const groupsWithDetails = await Promise.all(suggestedGroups.map(async (group) => {
      const [owner, membersCount, postsCount, sampleMembers] = await Promise.all([
        prisma.user.findUnique({
          where: { id: group.ownerId },
          select: { id: true, name: true, avatar: true }
        }),
        prisma.groupMember.count({ where: { groupId: group.id } }),
        prisma.post.count({ where: { groupId: group.id } }),
        prisma.groupMember.findMany({
          where: { groupId: group.id },
          take: 3,
          select: { userId: true }
        })
      ])

      // Get user details for sample members
      const memberUserIds = sampleMembers.map(m => m.userId)
      const memberUsers = memberUserIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: memberUserIds } },
        select: { id: true, name: true, avatar: true }
      }) : []

      return {
        ...group,
        owner,
        _count: { members: membersCount, posts: postsCount },
        members: sampleMembers.map(m => ({
          ...m,
          user: memberUsers.find(u => u.id === m.userId) || null
        }))
      }
    }))

    // Sort by member count (most popular first)
    groupsWithDetails.sort((a, b) => b._count.members - a._count.members)

    return NextResponse.json(groupsWithDetails)

  } catch (error) {
    console.error('Error fetching suggested groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggested groups' },
      { status: 500 }
    )
  }
}