import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Search filter - use direct fields only, not relations
    if (search) {
      where.OR = [
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get transactions without includes (no relations in schema)
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Collect IDs for manual enrichment
    const userIds = [...new Set(transactions.map(t => t.userId).filter(Boolean))]
    const productIds = [...new Set(transactions.map(t => t.productId).filter(Boolean))] as string[]
    const courseIds = [...new Set(transactions.map(t => t.courseId).filter(Boolean))] as string[]
    const couponIds = [...new Set(transactions.map(t => t.couponId).filter(Boolean))] as string[]

    // Fetch related data in parallel
    const [users, products, courses, coupons] = await Promise.all([
      userIds.length > 0 ? prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true, whatsapp: true }
      }) : [],
      productIds.length > 0 ? prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }) : [],
      courseIds.length > 0 ? prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true }
      }) : [],
      couponIds.length > 0 ? prisma.coupon.findMany({
        where: { id: { in: couponIds } },
        select: { id: true, code: true }
      }) : [],
    ])

    // Create lookup maps
    const userMap = new Map(users.map(u => [u.id, u]))
    const productMap = new Map(products.map(p => [p.id, p]))
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const couponMap = new Map(coupons.map(c => [c.id, c]))

    // Enrich transactions
    const enrichedTransactions = transactions.map(t => ({
      ...t,
      user: userMap.get(t.userId) || null,
      product: t.productId ? productMap.get(t.productId) || null : null,
      course: t.courseId ? courseMap.get(t.courseId) || null : null,
      coupon: t.couponId ? couponMap.get(t.couponId) || null : null,
    }));

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
      transactions: enrichedTransactions,
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
