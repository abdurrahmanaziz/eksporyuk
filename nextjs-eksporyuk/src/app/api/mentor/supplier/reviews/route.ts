import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/supplier/reviews
 * List semua supplier yang di-assign ke mentor untuk di-review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only MENTOR role can access
    if (session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Forbidden - Only mentors can access' },
        { status: 403 }
      );
    }

    // Check if mentor is authorized
    const mentor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAuthorizedSupplierReviewer: true }
    });

    if (!mentor?.isAuthorizedSupplierReviewer) {
      return NextResponse.json(
        { error: 'Forbidden - You are not authorized to review suppliers' },
        { status: 403 }
      );
    }

    // Get status filter from query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {
      assignedMentorId: session.user.id
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Get suppliers assigned to this mentor
    const suppliers = await prisma.supplierProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            avatar: true
          }
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            answers: true
          }
        },
        products: {
          select: {
            id: true,
            title: true,
            status: true
          },
          take: 5
        }
      },
      orderBy: [
        { mentorReviewedAt: 'asc' }, // Belum direview dulu
        { createdAt: 'desc' }
      ]
    });

    // Format response
    const formatted = suppliers.map(supplier => ({
      id: supplier.id,
      companyName: supplier.companyName,
      slug: supplier.slug,
      logo: supplier.logo,
      supplierType: supplier.supplierType,
      status: supplier.status,
      province: supplier.province,
      city: supplier.city,
      businessCategory: supplier.businessCategory,
      user: supplier.user,
      assessment: supplier.assessments[0] || null,
      productsCount: supplier.totalProducts,
      products: supplier.products,
      mentorReviewedAt: supplier.mentorReviewedAt,
      mentorNotes: supplier.mentorNotes,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length
    });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER REVIEWS API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
