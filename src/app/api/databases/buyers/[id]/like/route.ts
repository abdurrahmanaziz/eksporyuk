import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/databases/buyers/[id]/like - Toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: buyerId } = await params;

    // Check if already liked
    const existingLike = await prisma.buyerLike.findUnique({
      where: {
        userId_buyerId: {
          userId: session.user.id,
          buyerId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.buyerLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.buyer.update({
          where: { id: buyerId },
          data: { likeCount: { decrement: 1 } }
        })
      ]);

      return NextResponse.json({ liked: false, message: 'Unliked successfully' });
    } else {
      // Like
      await prisma.$transaction([
        prisma.buyerLike.create({
          data: {
            userId: session.user.id,
            buyerId
          }
        }),
        prisma.buyer.update({
          where: { id: buyerId },
          data: { likeCount: { increment: 1 } }
        })
      ]);

      return NextResponse.json({ liked: true, message: 'Liked successfully' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/databases/buyers/[id]/like - Check if user liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ liked: false });
    }

    const { id } = await params;

    const like = await prisma.buyerLike.findUnique({
      where: {
        userId_buyerId: {
          userId: session.user.id,
          buyerId: id
        }
      }
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error('Error checking like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
