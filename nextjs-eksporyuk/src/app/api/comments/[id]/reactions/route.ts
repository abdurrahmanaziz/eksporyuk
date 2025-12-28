import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { ReactionType } from '@prisma/client';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[COMMENT REACTION] Session:', session?.user?.id ? 'Found' : 'Not found', session?.user?.email);
    
    if (!session?.user?.id) {
      console.log('[COMMENT REACTION] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;
    const { type } = await req.json();

    // Validate reaction type
    const validTypes = ['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Verify comment exists
    const commentExists = await prisma.postComment.findUnique({
      where: { id: commentId },
      select: { id: true }
    });

    if (!commentExists) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user already has a reaction on this comment
    const existingReaction = await prisma.commentReaction.findFirst({
      where: {
        commentId,
        userId: session.user.id,
      },
    });

    let reaction;
    
    if (existingReaction) {
      if (existingReaction.type === type) {
        // Same reaction - remove it
        await prisma.commentReaction.delete({
          where: { id: existingReaction.id },
        });
        reaction = null;
      } else {
        // Different reaction - update it
        reaction = await prisma.commentReaction.update({
          where: { id: existingReaction.id },
          data: { type: type as ReactionType },
        });
      }
    } else {
      // New reaction - use upsert to handle race conditions
      reaction = await prisma.commentReaction.create({
        data: {
          commentId,
          userId: session.user.id,
          type: type as ReactionType,
        },
      });
    }

    // Update comment reactions count
    const reactionCounts = await prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { id: true },
    });

    const reactionsCount = reactionCounts.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Update PostComment with new reaction count
    await prisma.postComment.update({
      where: { id: commentId },
      data: { reactionsCount },
    });

    return NextResponse.json({
      success: true,
      reaction,
      reactionsCount,
    });
  } catch (error: any) {
    console.error('[COMMENT REACTION API] Error:', error);
    console.error('[COMMENT REACTION API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    
    const reactions = await prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reactionCounts = await prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { id: true },
    });

    const reactionsCount = reactionCounts.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      reactions,
      reactionsCount,
    });
  } catch (error) {
    console.error('Error fetching comment reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}