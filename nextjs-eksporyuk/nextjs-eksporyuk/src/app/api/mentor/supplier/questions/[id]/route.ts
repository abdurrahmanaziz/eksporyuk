import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/mentor/supplier/questions/[id]
 * Update assessment question
 */
export async function PUT(
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
      select: { isAuthorizedSupplierReviewer: true }
    });

    if (!mentor?.isAuthorizedSupplierReviewer) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      question,
      category,
      questionType,
      answerOptions,
      supplierTypes,
      maxScore,
      displayOrder,
      isActive
    } = body;

    const updated = await prisma.supplierAssessmentQuestion.update({
      where: { id: params.id },
      data: {
        ...(question && { question }),
        ...(category && { category }),
        ...(questionType && { questionType }),
        ...(answerOptions !== undefined && { answerOptions }),
        ...(supplierTypes !== undefined && { supplierTypes }),
        ...(maxScore !== undefined && { maxScore }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      data: updated
    });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER QUESTION UPDATE ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mentor/supplier/questions/[id]
 * Soft delete (set isActive = false)
 */
export async function DELETE(
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
      select: { isAuthorizedSupplierReviewer: true }
    });

    if (!mentor?.isAuthorizedSupplierReviewer) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.supplierAssessmentQuestion.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER QUESTION DELETE ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
