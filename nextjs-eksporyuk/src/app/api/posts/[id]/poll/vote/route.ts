import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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
    const { optionIds } = await req.json();

    // Validate input
    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: 'Option IDs are required' }, { status: 400 });
    }

    // Get the post with poll data
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

    // Check if post has poll data
    if (!post.pollData || typeof post.pollData !== 'object') {
      return NextResponse.json({ error: 'Post is not a poll' }, { status: 400 });
    }

    const pollData = post.pollData as any;

    // Check if poll has ended
    if (pollData.endDate && new Date(pollData.endDate) < new Date()) {
      return NextResponse.json({ error: 'Poll has ended' }, { status: 400 });
    }

    // Check if max voters reached
    if (pollData.maxVoters && pollData.totalVotes >= pollData.maxVoters) {
      return NextResponse.json({ error: 'Poll has reached maximum voters' }, { status: 400 });
    }

    // Check if user has already voted
    const existingVotes = pollData.votes || [];
    const userHasVoted = existingVotes.some((vote: any) => vote.userId === session.user.id);
    
    if (userHasVoted && !pollData.allowMultiple) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 400 });
    }

    // Validate option IDs
    const validOptionIds = pollData.options.map((opt: any) => opt.id);
    const invalidOptionIds = optionIds.filter((id: string) => !validOptionIds.includes(id));
    
    if (invalidOptionIds.length > 0) {
      return NextResponse.json({ error: 'Invalid option IDs' }, { status: 400 });
    }

    // Check if multiple selection is allowed
    if (!pollData.allowMultiple && optionIds.length > 1) {
      return NextResponse.json({ error: 'Multiple selection not allowed' }, { status: 400 });
    }

    // Remove existing votes if user is changing their vote
    const updatedVotes = existingVotes.filter((vote: any) => vote.userId !== session.user.id);
    
    // Add new votes
    for (const optionId of optionIds) {
      updatedVotes.push({
        id: `vote_${Date.now()}_${Math.random()}`,
        userId: session.user.id,
        optionId,
        createdAt: new Date().toISOString(),
      });
    }

    // Update option vote counts
    const updatedOptions = pollData.options.map((option: any) => ({
      ...option,
      votes: updatedVotes.filter((vote: any) => vote.optionId === option.id).length,
      voters: pollData.allowAnonymous 
        ? [] 
        : updatedVotes
            .filter((vote: any) => vote.optionId === option.id)
            .map((vote: any) => vote.userId),
    }));

    // Calculate total votes
    const totalVotes = updatedVotes.length;
    const uniqueVoters = new Set(updatedVotes.map((vote: any) => vote.userId)).size;

    // Update poll data
    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      votes: updatedVotes,
      totalVotes: uniqueVoters,
    };

    // Update the post
    await prisma.post.update({
      where: { id: postId },
      data: { pollData: updatedPollData },
    });

    return NextResponse.json({
      success: true,
      pollData: updatedPollData,
    });
  } catch (error) {
    console.error('Error voting on poll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}