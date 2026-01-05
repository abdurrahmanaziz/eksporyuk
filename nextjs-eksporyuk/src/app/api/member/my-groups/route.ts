import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's joined groups with detailed info
    const userGroupMemberships = await prisma.groupMember.findMany({
      where: {
        userId
      }
    })

    if (userGroupMemberships.length === 0) {
      return NextResponse.json({
        groups: [],
        stats: {
          totalGroups: 0,
          adminGroups: 0,
          totalMembers: 0,
          recentlyJoined: 0
        }
      })
    }

    // Get group details separately
    const groupIds = userGroupMemberships.map(gm => gm.groupId)
    const groupDetails = await prisma.group.findMany({
      where: {
        id: { in: groupIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        type: true,
        isActive: true,
        createdAt: true,
        ownerId: true
      }
    })

    // Combine group memberships with group details
    const groups = await Promise.all(
      userGroupMemberships
        .filter(gm => {
          const group = groupDetails.find(g => g.id === gm.groupId)
          return group && group.isActive
        })
        .map(async (gm) => {
          const group = groupDetails.find(g => g.id === gm.groupId)
          if (!group) return null

          // Get member count for this group
          const memberCount = await prisma.groupMember.count({
            where: { groupId: group.id }
          })

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            image: group.avatar,
            type: group.type,
            memberCount,
            role: gm.role,
            joinedAt: gm.joinedAt.toISOString(),
            isOwner: group.ownerId === userId,
            createdAt: group.createdAt.toISOString()
          }
        })
    )

    // Filter out null values
    const validGroups = groups.filter(g => g !== null)

    // Sort by role priority (owner, admin, moderator, member) then by join date
    const roleOrder = { OWNER: 0, ADMIN: 1, MODERATOR: 2, MEMBER: 3 }
    validGroups.sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 3
      const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 3
      
      if (roleA !== roleB) {
        return roleA - roleB
      }
      
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    })

    // Calculate stats
    const stats = {
      totalGroups: validGroups.length,
      adminGroups: validGroups.filter(g => ['OWNER', 'ADMIN'].includes(g.role)).length,
      totalMembers: validGroups.reduce((acc, g) => acc + g.memberCount, 0),
      recentlyJoined: validGroups.filter(g => {
        const joinDate = new Date(g.joinedAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return joinDate > weekAgo
      }).length
    }

    return NextResponse.json({
      groups: validGroups,
      stats,
      success: true
    })

  } catch (error) {
    console.error('Error fetching user groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}