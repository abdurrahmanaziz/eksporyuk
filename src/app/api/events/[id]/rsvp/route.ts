import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/events/[id]/rsvp - RSVP to event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json() // GOING, MAYBE, NOT_GOING

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Check if event exists and get details
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            rsvps: {
              where: {
                status: 'GOING'
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check max attendees
    if (
      status === 'GOING' &&
      event.maxAttendees &&
      event._count.rsvps >= event.maxAttendees
    ) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Upsert RSVP
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id
        }
      },
      create: {
        eventId: params.id,
        userId: session.user.id,
        status
      },
      update: {
        status
      }
    })

    // Notify event creator
    if (status === 'GOING') {
      await prisma.notification.create({
        data: {
          userId: event.creatorId,
          type: 'EVENT_RSVP',
          title: 'RSVP Event Baru',
          message: `${session.user.name} akan menghadiri event: ${event.title}`,
          link: `/community/groups/${event.groupId}`
        }
      })
    }

    return NextResponse.json({ 
      rsvp,
      message: 'RSVP updated successfully' 
    })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json(
      { error: 'Failed to update RSVP' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id]/rsvp - Remove RSVP
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.eventRSVP.delete({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id
        }
      }
    })

    return NextResponse.json({ message: 'RSVP removed successfully' })
  } catch (error) {
    console.error('Remove RSVP error:', error)
    return NextResponse.json(
      { error: 'Failed to remove RSVP' },
      { status: 500 }
    )
  }
}

// GET /api/events/[id]/rsvp - Get event RSVPs
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rsvps = await prisma.eventRSVP.findMany({
      where: {
        eventId: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const grouped = {
      going: rsvps.filter(r => r.status === 'GOING'),
      maybe: rsvps.filter(r => r.status === 'MAYBE'),
      notGoing: rsvps.filter(r => r.status === 'NOT_GOING')
    }

    return NextResponse.json({ rsvps: grouped })
  } catch (error) {
    console.error('Get RSVPs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    )
  }
}
