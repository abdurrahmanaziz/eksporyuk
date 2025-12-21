import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/supplier/assign-mentor
 * Assign supplier to authorized mentor for review
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
    const { supplierId, mentorId } = body;

    if (!supplierId || !mentorId) {
      return NextResponse.json(
        { error: 'Missing supplierId or mentorId' },
        { status: 400 }
      );
    }

    // Check if mentor is authorized
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: {
        id: true,
        name: true,
        isAuthorizedSupplierReviewer: true,
        role: true
      }
    });

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    if (mentor.role !== 'MENTOR' || !mentor.isAuthorizedSupplierReviewer) {
      return NextResponse.json(
        { error: 'This mentor is not authorized to review suppliers' },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        companyName: true,
        status: true,
        assignedMentorId: true
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Assign mentor
    const updated = await prisma.supplierProfile.update({
      where: { id: supplierId },
      data: {
        assignedMentorId: mentorId,
        status: 'WAITING_REVIEW' // Set status to waiting review
      }
    });

    // Create audit log
    await prisma.supplierAuditLog.create({
      data: {
        supplierId,
        action: 'MENTOR_ASSIGNED',
        performedBy: session.user.id,
        performedByName: session.user.name || 'Admin',
        description: `Supplier assigned to mentor ${mentor.name} for review`,
        metadata: {
          mentorId,
          mentorName: mentor.name,
          previousMentorId: supplier.assignedMentorId,
          previousStatus: supplier.status,
          newStatus: 'WAITING_REVIEW'
        }
      }
    });

    // TODO: Send notification to mentor

    return NextResponse.json({
      success: true,
      message: `Supplier assigned to ${mentor.name} successfully`,
      data: updated
    });

  } catch (error: any) {
    console.error('[ADMIN ASSIGN MENTOR ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
