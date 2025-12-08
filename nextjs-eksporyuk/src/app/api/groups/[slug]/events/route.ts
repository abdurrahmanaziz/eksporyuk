import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/groups/[slug]/events - Get group events
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'upcoming' // upcoming, past, all
    const limit = parseInt(searchParams.get('limit') || '10')
    const upcoming = searchParams.get('upcoming') === 'true'

    const now = new Date()
    
    // Find group by slug
    const group = await prisma.group.findUnique({
      where: { slug: slug },
      select: { id: true }
    })
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const events = await prisma.event.findMany({
      where: {
        groupId: group.id,
        isPublished: true,
        ...(upcoming || filter === 'upcoming' ? {
          startDate: {
            gte: now
          }
        } : filter === 'past' ? {
          startDate: {
            lt: now
          }
        } : {})
      },
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            rsvps: true
          }
        },
        rsvps: {
          where: {
            userId: session.user.id
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        startDate: filter === 'past' ? 'desc' : 'asc'
      }
    })

    // Transform events to include isRSVPd flag
    const eventsWithRSVP = events.map(event => ({
      ...event,
      isRSVPd: event.rsvps.length > 0,
      rsvps: undefined // Remove from response
    }))

    return NextResponse.json({ events: eventsWithRSVP })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/events - Create event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: params.id,
          userId: session.user.id
        }
      }
    })

    const isAdmin = session.user.role === 'ADMIN'
    const isModerator = member && ['ADMIN', 'MODERATOR', 'OWNER'].includes(member.role)

    if (!isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'Only admins/moderators can create events' },
        { status: 403 }
      )
    }

    const { title, description, startDate, endDate, location, meetLink, maxAttendees } = await req.json()

    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        groupId: params.id,
        creatorId: session.user.id,
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        meetLink,
        maxAttendees
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Notify group members
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: params.id,
        userId: {
          not: session.user.id
        }
      },
      select: {
        userId: true
      }
    })

    await Promise.all(
      members.map(member =>
        prisma.notification.create({
          data: {
            userId: member.userId,
            type: 'EVENT_CREATED',
            title: 'Event Baru',
            message: `${session.user.name} membuat event: ${title}`,
            link: `/community/groups/${params.id}`
          }
        })
      )
    )

    return NextResponse.json({ 
      event,
      message: 'Event created successfully' 
    })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
