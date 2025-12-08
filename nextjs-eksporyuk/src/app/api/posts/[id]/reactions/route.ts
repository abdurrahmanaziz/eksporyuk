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
    const { type } = await req.json();

    // Validate reaction type
    const validTypes = ['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Check if user already has a reaction on this post
    const existingReaction = await prisma.postReaction.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    let reaction;
    
    if (existingReaction) {
      if (existingReaction.type === type) {
        // Same reaction - remove it
        await prisma.postReaction.delete({
          where: { id: existingReaction.id },
        });
        reaction = null;
      } else {
        // Different reaction - update it
        reaction = await prisma.postReaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
      }
    } else {
      // New reaction
      reaction = await prisma.postReaction.create({
        data: {
          postId,
          userId: session.user.id,
          type,
        },
      });

      // Create notification for post author (if not own post)
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });

      if (post && post.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: 'REACTION',
            userId: post.authorId,
            actorId: session.user.id,
            postId: postId,
            message: `mereaksi postingan Anda`
          }
        });
      }
    }

    // Update post reactions count
    const reactionCounts = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { id: true },
    });

    const reactionsCount = reactionCounts.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    await prisma.post.update({
      where: { id: postId },
      data: { reactionsCount },
    });

    return NextResponse.json({
      success: true,
      reaction,
      reactionsCount,
      counts: reactionsCount, // Alias for consistency
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id]/reactions - Remove user's reaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Find user's reaction
    const existingReaction = await prisma.postReaction.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    if (!existingReaction) {
      return NextResponse.json({ error: 'No reaction found' }, { status: 404 });
    }

    // Delete the reaction
    await prisma.postReaction.delete({
      where: { id: existingReaction.id },
    });

    // Update reaction counts
    const reactionCounts = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { id: true },
    });

    const reactionsCount = reactionCounts.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    await prisma.post.update({
      where: { id: postId },
      data: { reactionsCount },
    });

    return NextResponse.json({
      success: true,
      message: 'Reaction removed',
      reactionsCount,
      counts: reactionsCount, // Alias for consistency
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: postId } = await params;
    
    const reactions = await prisma.postReaction.findMany({
      where: { postId },
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

    const reactionCounts = await prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { id: true },
    });

    const reactionsCount = reactionCounts.reduce((acc, curr) => {
      acc[curr.type] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get current user's reaction if logged in
    let currentReaction = null
    if (session?.user?.id) {
      const userReaction = await prisma.postReaction.findFirst({
        where: {
          postId,
          userId: session.user.id
        },
        select: { type: true }
      })
      currentReaction = userReaction?.type || null
    }

    return NextResponse.json({
      reactions,
      reactionsCount,
      counts: reactionsCount, // Alias for consistency
      currentReaction,
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}