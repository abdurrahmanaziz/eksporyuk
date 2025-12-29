import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/events - List all events with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status'); // upcoming, past, all
    const search = searchParams.get('search');
    const isPublished = searchParams.get('isPublished');

    const now = new Date();

    const where: any = {};

    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filter by published status
    if (isPublished !== null && isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    }

    // Filter by date (upcoming/past)
    if (status === 'upcoming') {
      where.startDate = { gte: now };
    } else if (status === 'past') {
      where.endDate = { lt: now };
    }

    // Search by title or description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        startDate: true,
        endDate: true,
        location: true,
        isOnline: true,
        meetingUrl: true,
        maxAttendees: true,
        isPublished: true,
        bannerImage: true,
        createdAt: true,
        updatedAt: true,
        creatorId: true,
        groupId: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    // Manually fetch related data
    const eventIds = events.map(e => e.id)
    const creatorIds = [...new Set(events.map(e => e.creatorId).filter(Boolean))]
    const groupIds = [...new Set(events.map(e => e.groupId).filter(Boolean))]

    const [creators, groups, rsvps] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true, email: true, avatar: true }
      }),
      groupIds.length > 0 ? prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true }
      }) : Promise.resolve([]),
      prisma.eventRSVP.findMany({
        where: { eventId: { in: eventIds } },
        select: { id: true, eventId: true, status: true }
      })
    ])

    const creatorMap = new Map(creators.map(c => [c.id, c]))
    const groupMap = new Map(groups.map(g => [g.id, g]))
    const rsvpsByEvent = rsvps.reduce((acc: any, rsvp) => {
      if (!acc[rsvp.eventId]) acc[rsvp.eventId] = []
      acc[rsvp.eventId].push(rsvp)
      return acc
    }, {})

    const eventsWithStats = events.map((event) => {
      const eventRsvps = rsvpsByEvent[event.id] || []
      const goingCount = eventRsvps.filter((r: any) => r.status === 'GOING').length
      
      return {
        ...event,
        creator: event.creatorId ? creatorMap.get(event.creatorId) || null : null,
        group: event.groupId ? groupMap.get(event.groupId) || null : null,
        rsvps: eventRsvps,
        _count: {
          rsvps: eventRsvps.length
        },
        attendeesCount: goingCount,
        availableSlots: event.maxAttendees ? event.maxAttendees - goingCount : null,
      }
    })

    return NextResponse.json({ events: eventsWithStats })
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      meetingUrl,
      meetingId,
      meetingPassword,
      recordingUrl,
      maxAttendees,
      price,
      commissionType,
      commissionRate,
      thumbnail,
      groupId,
      isPublished,
      isFeatured,
    } = body;

    // Validation
    if (!title || !description || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        meetingUrl,
        meetingId,
        meetingPassword,
        recordingUrl,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        price: price ? parseFloat(price) : 0,
        commissionType: price && price > 0 ? commissionType : null,
        commissionRate: price && price > 0 && commissionRate ? parseFloat(commissionRate) : null,
        thumbnail,
        groupId,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
