import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/community/online-users - Get currently active users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get users active in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

    // Get user's group memberships
    const userGroupMemberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    })
    const userGroupIds = userGroupMemberships.map(g => g.groupId)

    // Get user's membership IDs
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      select: { membershipId: true }
    })
    const userMembershipIds = userMemberships.map(m => m.membershipId)

    // Get users from same groups
    const groupMemberUserIds = userGroupIds.length > 0 ? await prisma.groupMember.findMany({
      where: { groupId: { in: userGroupIds }, userId: { not: session.user.id } },
      select: { userId: true },
      distinct: ['userId']
    }).then(members => members.map(m => m.userId)) : []

    // Get users with same memberships
    const membershipUserIds = userMembershipIds.length > 0 ? await prisma.userMembership.findMany({
      where: {
        membershipId: { in: userMembershipIds },
        userId: { not: session.user.id },
        isActive: true
      },
      select: { userId: true },
      distinct: ['userId']
    }).then(members => members.map(m => m.userId)) : []

    // Combine and dedupe user IDs
    const relatedUserIds = [...new Set([...groupMemberUserIds, ...membershipUserIds])]

    if (relatedUserIds.length === 0) {
      // Update current user's last active time
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastActiveAt: new Date() }
      })
      return NextResponse.json([])
    }

    // Get active users from related users
    const activeUsers = await prisma.user.findMany({
      where: {
        id: { in: relatedUserIds },
        lastActiveAt: { gte: fifteenMinutesAgo }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lastActiveAt: true,
        role: true
      },
      orderBy: { lastActiveAt: 'desc' },
      take: limit
    })

    // Update current user's last active time
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() }
    })

    return NextResponse.json(activeUsers)

  } catch (error) {
    console.error('Error fetching online users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    )
  }
}