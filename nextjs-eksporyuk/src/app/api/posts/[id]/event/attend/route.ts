import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Get the post with event data
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        group: {
          include: {
            memberships: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is a member of the group
    if (post.group.memberships.length === 0) {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 });
    }

    // Check if post has event data
    if (!post.eventData || typeof post.eventData !== 'object') {
      return NextResponse.json({ error: 'Post is not an event' }, { status: 400 });
    }

    const eventData = post.eventData as any;

    // Check if event has already started
    if (new Date(eventData.startDate) <= new Date()) {
      return NextResponse.json({ error: 'Cannot change attendance for ongoing or past events' }, { status: 400 });
    }

    // Get current attendees
    const currentAttendees = eventData.attendees || [];
    const isCurrentlyAttending = currentAttendees.includes(session.user.id);

    let updatedAttendees;

    if (isCurrentlyAttending) {
      // Remove user from attendees
      updatedAttendees = currentAttendees.filter((id: string) => id !== session.user.id);
    } else {
      // Check if max attendees reached
      if (eventData.maxAttendees && currentAttendees.length >= eventData.maxAttendees) {
        return NextResponse.json({ error: 'Event is full' }, { status: 400 });
      }

      // Add user to attendees
      updatedAttendees = [...currentAttendees, session.user.id];
    }

    // Update event data
    const updatedEventData = {
      ...eventData,
      attendees: updatedAttendees,
      userAttending: !isCurrentlyAttending,
    };

    // Update the post
    await prisma.post.update({
      where: { id: postId },
      data: { eventData: updatedEventData },
    });

    return NextResponse.json({
      success: true,
      eventData: updatedEventData,
      attending: !isCurrentlyAttending,
    });
  } catch (error) {
    console.error('Error toggling event attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}