import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/databases/buyers/favorites - Get user's favorite buyers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.buyerLike.findMany({
        where: { userId: session.user.id },
        include: {
          buyer: true
        },
        orderBy: { likedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.buyerLike.count({
        where: { userId: session.user.id }
      })
    ]);

    const buyers = likes.map(like => like.buyer);

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
