import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/supplier/authorized-mentors
 * Get list of mentors with authorization status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, authorized, not-authorized

    const where: any = { role: 'MENTOR' };

    if (filter === 'authorized') {
      where.isAuthorizedSupplierReviewer = true;
    } else if (filter === 'not-authorized') {
      where.isAuthorizedSupplierReviewer = false;
    }

    const mentors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        isAuthorizedSupplierReviewer: true,
        supplierReviewerAuthorizedAt: true,
        supplierReviewerAuthorizedBy: true,
        _count: {
          select: {
            supplierReviewsAssigned: true
          }
        },
        createdAt: true
      },
      orderBy: [
        { isAuthorizedSupplierReviewer: 'desc' },
        { name: 'asc' }
      ]
    });

    // Get authorizer names
    const authorizerIds = mentors
      .map(m => m.supplierReviewerAuthorizedBy)
      .filter(Boolean) as string[];

    const authorizers = await prisma.user.findMany({
      where: { id: { in: authorizerIds } },
      select: { id: true, name: true }
    });

    const authorizerMap = Object.fromEntries(
      authorizers.map(a => [a.id, a.name])
    );

    // Format response
    const formatted = mentors.map(mentor => ({
      ...mentor,
      authorizedByName: mentor.supplierReviewerAuthorizedBy
        ? authorizerMap[mentor.supplierReviewerAuthorizedBy] || 'Unknown'
        : null,
      assignedSuppliersCount: mentor._count.supplierReviewsAssigned
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length
    });

  } catch (error: any) {
    console.error('[ADMIN AUTHORIZED MENTORS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/supplier/authorized-mentors
 * Toggle mentor authorization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mentorId, authorize } = body;

    if (!mentorId || typeof authorize !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing mentorId or authorize flag' },
        { status: 400 }
      );
    }

    // Check if user is mentor
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { id: true, role: true, name: true }
    });

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    if (mentor.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'User is not a mentor' },
        { status: 400 }
      );
    }

    // Update authorization
    const updated = await prisma.user.update({
      where: { id: mentorId },
      data: {
        isAuthorizedSupplierReviewer: authorize,
        supplierReviewerAuthorizedAt: authorize ? new Date() : null,
        supplierReviewerAuthorizedBy: authorize ? session.user.id : null
      }
    });

    return NextResponse.json({
      success: true,
      message: `Mentor ${authorize ? 'authorized' : 'unauthorized'} successfully`,
      data: {
        id: updated.id,
        name: updated.name,
        isAuthorizedSupplierReviewer: updated.isAuthorizedSupplierReviewer
      }
    });

  } catch (error: any) {
    console.error('[ADMIN AUTHORIZE MENTOR ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
