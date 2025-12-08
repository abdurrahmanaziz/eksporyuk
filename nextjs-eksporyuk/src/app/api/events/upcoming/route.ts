import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/events/upcoming - Get upcoming events for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get groups user has access to
    const userAccessibleGroups = await prisma.group.findMany({
      where: {
        isActive: true,
        OR: [
          // Direct member
          { members: { some: { userId: session.user.id } } },
          // Via membership
          { 
            membershipGroups: {
              some: {
                membership: {
                  userMemberships: {
                    some: {
                      userId: session.user.id,
                      isActive: true,
                      startDate: { lte: new Date() },
                      endDate: { gte: new Date() }
                    }
                  }
                }
              }
            }
          },
          // Owner
          { ownerId: session.user.id },
          // Public groups for discovery
          { type: 'PUBLIC' }
        ]
      },
      select: { id: true }
    })

    const accessibleGroupIds = userAccessibleGroups.map(g => g.id)

    // Get upcoming events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        AND: [
          { startDate: { gte: new Date() } }, // Future events
          {
            OR: [
              { groupId: { in: accessibleGroupIds } }, // Group events
              { isPublic: true }, // Public events
              { organizerId: session.user.id } // User's own events
            ]
          }
        ]
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        },
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit
    })

    return NextResponse.json({
      events: upcomingEvents,
      total: upcomingEvents.length
    })

  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming events' },
      { status: 500 }
    )
  }
}