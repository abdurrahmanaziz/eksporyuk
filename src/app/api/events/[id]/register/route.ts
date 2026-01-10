import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notificationService';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/events/[id]/register - Register/RSVP for event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status = 'GOING' } = body; // GOING, MAYBE, NOT_GOING

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        rsvps: {
          where: { status: 'GOING' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is paid - redirect to checkout
    if (event.price && event.price > 0) {
      return NextResponse.json(
        { 
          error: 'This is a paid event. Please use the checkout endpoint.',
          code: 'PAID_EVENT',
          checkoutUrl: `/api/checkout/event`
        },
        { status: 400 }
      );
    }

    // Check if event is full
    if (event.maxAttendees && event.rsvps.length >= event.maxAttendees && status === 'GOING') {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      );
    }

    // Check if user already has RSVP
    const existingRsvp = await prisma.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id,
        },
      },
    });

    let rsvp;

    if (existingRsvp) {
      // Update existing RSVP
      rsvp = await prisma.eventRSVP.update({
        where: {
          id: existingRsvp.id,
        },
        data: {
          status,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Create new RSVP
      rsvp = await prisma.eventRSVP.create({
        data: {
          eventId: params.id,
          userId: session.user.id,
          status,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      // Send notification for new RSVP
      if (status === 'GOING') {
        await notificationService.send({
          userId: session.user.id,
          type: 'SYSTEM',
          title: '📅 Event Registration Confirmed',
          message: `You have successfully registered for "${rsvp.event.title}". Event starts on ${new Date(rsvp.event.startDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
          link: `/events/${params.id}`,
          channels: ['pusher', 'onesignal']
        });
      }
    }

    return NextResponse.json({ rsvp }, { status: existingRsvp ? 200 : 201 });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/register - Cancel RSVP
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find and delete RSVP
    const rsvp = await prisma.eventRSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!rsvp) {
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      );
    }

    await prisma.eventRSVP.delete({
      where: {
        id: rsvp.id,
      },
    });

    return NextResponse.json({ message: 'RSVP cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to cancel RSVP' },
      { status: 500 }
    );
  }
}
