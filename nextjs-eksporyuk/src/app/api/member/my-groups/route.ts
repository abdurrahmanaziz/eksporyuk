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
      },
      include: {
        group: {
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
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    // Filter active groups and get member counts
    const activeGroupMemberships = userGroupMemberships.filter(gm => gm.group.isActive)
    
    const groups = await Promise.all(
      activeGroupMemberships.map(async (gm) => {
        // Get member count for this group
        const memberCount = await prisma.groupMember.count({
          where: { groupId: gm.group.id }
        })

        // Get recent activity count (posts, messages, etc. if needed)
        // For now, we'll keep it simple

        return {
          id: gm.group.id,
          name: gm.group.name,
          description: gm.group.description,
          image: gm.group.avatar,
          type: gm.group.type,
          memberCount,
          role: gm.role,
          joinedAt: gm.joinedAt.toISOString(),
          isOwner: gm.group.ownerId === userId,
          createdAt: gm.group.createdAt.toISOString()
        }
      })
    )

    // Sort by role priority (owner, admin, moderator, member) then by join date
    const roleOrder = { OWNER: 0, ADMIN: 1, MODERATOR: 2, MEMBER: 3 }
    groups.sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 3
      const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 3
      
      if (roleA !== roleB) {
        return roleA - roleB
      }
      
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    })

    // Calculate stats
    const stats = {
      totalGroups: groups.length,
      adminGroups: groups.filter(g => ['OWNER', 'ADMIN'].includes(g.role)).length,
      totalMembers: groups.reduce((acc, g) => acc + g.memberCount, 0),
      recentlyJoined: groups.filter(g => {
        const joinDate = new Date(g.joinedAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return joinDate > weekAgo
      }).length
    }

    return NextResponse.json({
      groups,
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