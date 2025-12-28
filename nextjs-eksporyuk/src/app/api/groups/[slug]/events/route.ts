import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
      orderBy: {
        startDate: filter === 'past' ? 'desc' : 'asc'
      }
    })

    // Get creators and RSVP data manually (no relations in schema)
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const [creator, rsvpCount, userRsvp] = await Promise.all([
        prisma.user.findUnique({
          where: { id: event.creatorId },
          select: { id: true, name: true, avatar: true }
        }),
        prisma.eventRSVP.count({ where: { eventId: event.id } }),
        prisma.eventRSVP.findFirst({
          where: { eventId: event.id, userId: session.user.id },
          select: { id: true, status: true }
        })
      ])

      return {
        ...event,
        creator,
        _count: { rsvps: rsvpCount },
        isRSVPd: !!userRsvp
      }
    }))

    return NextResponse.json({ events: eventsWithDetails })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[slug]/events - Create event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    // Find group by slug first
    const group = await prisma.group.findUnique({
      where: { slug: slug },
      select: { id: true }
    })
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is member
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
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
        id: createId(),
        groupId: group.id,
        creatorId: session.user.id,
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        meetLink,
        maxAttendees,
        updatedAt: new Date(),
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
        groupId: group.id,
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
            id: createId(),
            userId: member.userId,
            type: 'EVENT_CREATED',
            title: 'Event Baru',
            message: `${session.user.name} membuat event: ${title}`,
            link: `/community/groups/${params.id}`,
            updatedAt: new Date(),
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
