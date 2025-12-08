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

    const { id: commentId } = await params;
    const { type } = await req.json();

    // Validate reaction type
    const validTypes = ['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
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
          data: { type },
        });
      }
    } else {
      // New reaction
      reaction = await prisma.commentReaction.create({
        data: {
          commentId,
          userId: session.user.id,
          type,
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

    await prisma.comment.update({
      where: { id: commentId },
      data: { reactionsCount },
    });

    return NextResponse.json({
      success: true,
      reaction,
      reactionsCount,
    });
  } catch (error) {
    console.error('Error handling comment reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
        user: {
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