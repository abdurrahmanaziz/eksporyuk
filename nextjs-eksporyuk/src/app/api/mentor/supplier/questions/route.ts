import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/supplier/questions
 * Get all assessment questions (filtered by supplier type if provided)
 */
export async function GET(request: NextRequest) {
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
        { error: 'Forbidden - You are not authorized to manage questions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const supplierType = searchParams.get('supplierType');

    const where: any = { isActive: true };
    
    if (supplierType) {
      where.OR = [
        { supplierTypes: { has: supplierType } },
        { supplierTypes: { isEmpty: true } } // Universal questions
      ];
    }

    const questions = await prisma.supplierAssessmentQuestion.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: questions,
      total: questions.length
    });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER QUESTIONS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentor/supplier/questions
 * Create new assessment question
 */
export async function POST(request: NextRequest) {
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
        { error: 'Forbidden - You are not authorized to manage questions' },
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
      displayOrder
    } = body;

    // Validation
    if (!question || !category || !questionType || !maxScore) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create question
    const newQuestion = await prisma.supplierAssessmentQuestion.create({
      data: {
        question,
        category,
        questionType,
        answerOptions: answerOptions || [],
        supplierTypes: supplierTypes || [],
        maxScore,
        displayOrder: displayOrder || 999,
        isActive: true,
        createdBy: session.user.id,
        createdByName: mentor.name || 'Unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Assessment question created successfully',
      data: newQuestion
    }, { status: 201 });

  } catch (error: any) {
    console.error('[MENTOR SUPPLIER QUESTIONS POST ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
