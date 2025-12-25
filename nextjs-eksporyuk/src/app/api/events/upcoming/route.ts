import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/events/upcoming - Get upcoming events for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user's direct group memberships
    const directGroupMemberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    })
    const directGroupIds = directGroupMemberships.map(g => g.groupId)

    // Get user's memberships
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      select: { membershipId: true }
    })
    const membershipIds = userMemberships.map(m => m.membershipId)

    // Get groups via membership
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: { in: membershipIds } },
      select: { groupId: true }
    })
    const membershipGroupIds = membershipGroups.map(g => g.groupId)

    // Get groups user owns
    const ownedGroups = await prisma.group.findMany({
      where: { ownerId: session.user.id, isActive: true },
      select: { id: true }
    })
    const ownedGroupIds = ownedGroups.map(g => g.id)

    // Get public groups
    const publicGroups = await prisma.group.findMany({
      where: { type: 'PUBLIC', isActive: true },
      select: { id: true }
    })
    const publicGroupIds = publicGroups.map(g => g.id)

    // Combine all accessible group IDs
    const accessibleGroupIds = [...new Set([...directGroupIds, ...membershipGroupIds, ...ownedGroupIds, ...publicGroupIds])]

    // Get upcoming events (no relations to organizer, group, attendees)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: { gte: new Date() },
        OR: [
          { groupId: { in: accessibleGroupIds } },
          { isPublished: true },
          { creatorId: session.user.id }
        ]
      },
      orderBy: { startDate: 'asc' },
      take: limit
    })

    // Get organizer and group info manually for each event
    const eventsWithDetails = await Promise.all(upcomingEvents.map(async (event) => {
      const [organizer, group, attendeesCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: event.creatorId },
          select: { id: true, name: true, avatar: true }
        }),
        event.groupId ? prisma.group.findUnique({
          where: { id: event.groupId },
          select: { id: true, name: true, slug: true, type: true }
        }) : null,
        prisma.eventRSVP.count({ where: { eventId: event.id, status: 'GOING' } })
      ])

      return {
        ...event,
        organizer,
        group,
        _count: { attendees: attendeesCount }
      }
    }))

    return NextResponse.json({
      events: eventsWithDetails,
      total: eventsWithDetails.length
    })

  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming events' },
      { status: 500 }
    )
  }
}