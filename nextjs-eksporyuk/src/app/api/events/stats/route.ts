import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/events/stats - Get event statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Total events count
    const totalEvents = await prisma.event.count();

    // Published events count
    const publishedEvents = await prisma.event.count({
      where: { isPublished: true },
    });

    // Upcoming events count
    const upcomingEvents = await prisma.event.count({
      where: {
        startDate: { gte: now },
        isPublished: true,
      },
    });

    // Past events count
    const pastEvents = await prisma.event.count({
      where: {
        endDate: { lt: now },
      },
    });

    // Total RSVPs count
    const totalRsvps = await prisma.eventRSVP.count();

    // Total attendees (GOING status)
    const totalAttendees = await prisma.eventRSVP.count({
      where: { status: 'GOING' },
    });

    // Events by type
    const eventsByType = await prisma.event.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      totalEvents,
      publishedEvents,
      upcomingEvents,
      pastEvents,
      totalRsvps,
      totalAttendees,
      eventsByType: eventsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event stats' },
      { status: 500 }
    );
  }
}
