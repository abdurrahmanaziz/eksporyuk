import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/supplier/reviews/[id]
 * Get detail supplier untuk review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            avatar: true,
            createdAt: true
          }
        },
        assessments: {
          include: {
            answers: {
              include: {
                question: true
              },
              orderBy: {
                question: {
                  displayOrder: 'asc'
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        products: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Verify supplier is assigned to this mentor
    if (supplier.assignedMentorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - This supplier is not assigned to you' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: supplier
    });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER DETAIL API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentor/supplier/reviews/[id]
 * Submit review & recommendation ke admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check authorization
    const mentor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAuthorizedSupplierReviewer: true, name: true }
    });

    if (!mentor?.isAuthorizedSupplierReviewer) {
      return NextResponse.json(
        { error: 'Forbidden - You are not authorized to review suppliers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notes, recommendation } = body;

    if (!notes || !recommendation) {
      return NextResponse.json(
        { error: 'Notes and recommendation are required' },
        { status: 400 }
      );
    }

    // Validate recommendation: 'APPROVE' or 'REJECT' or 'REQUEST_CHANGES'
    if (!['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(recommendation)) {
      return NextResponse.json(
        { error: 'Invalid recommendation value' },
        { status: 400 }
      );
    }

    // Get supplier
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        assignedMentorId: true,
        status: true,
        companyName: true,
        userId: true
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Verify assigned
    if (supplier.assignedMentorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - This supplier is not assigned to you' },
        { status: 403 }
      );
    }

    // Determine new status based on recommendation
    let newStatus = supplier.status;
    if (recommendation === 'APPROVE') {
      newStatus = 'RECOMMENDED_BY_MENTOR';
    } else if (recommendation === 'REJECT') {
      newStatus = 'LIMITED'; // Or keep WAITING_REVIEW
    } else if (recommendation === 'REQUEST_CHANGES') {
      newStatus = 'ONBOARDING'; // Back to onboarding for changes
    }

    // Update supplier profile
    const updated = await prisma.supplierProfile.update({
      where: { id: params.id },
      data: {
        mentorReviewedBy: session.user.id,
        mentorReviewedAt: new Date(),
        mentorNotes: notes,
        status: newStatus
      }
    });

    // Create audit log
    await prisma.supplierAuditLog.create({
      data: {
        supplierId: params.id,
        action: `MENTOR_REVIEW_${recommendation}`,
        performedBy: session.user.id,
        performedByName: mentor.name || 'Unknown',
        description: `Mentor reviewed and ${recommendation.toLowerCase()} the supplier application`,
        metadata: {
          recommendation,
          notes,
          previousStatus: supplier.status,
          newStatus
        }
      }
    });

    // TODO: Send notification to admin (if APPROVE) or supplier (if REJECT/REQUEST_CHANGES)

    return NextResponse.json({
      success: true,
      message: `Supplier review submitted successfully`,
      data: updated
    });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER REVIEW SUBMIT ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
