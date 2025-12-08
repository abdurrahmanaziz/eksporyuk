import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'PENDING';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Status filter
    if (status !== 'ALL') {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              whatsapp: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          membership: {
            select: {
              membershipId: true,
              membership: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                },
              },
            },
          },
          coupon: {
            select: {
              code: true,
            },
          },
          affiliateConversion: {
            select: {
              commissionAmount: true,
              affiliate: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate stats
    const now = new Date();
    const [pendingCount, expiredCount] = await Promise.all([
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({
        where: {
          status: 'PENDING',
          expiredAt: { lt: now },
        },
      }),
    ]);

    const stats = {
      total,
      pending: pendingCount,
      expired: expiredCount,
    };

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      transactions,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching payment confirmations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
