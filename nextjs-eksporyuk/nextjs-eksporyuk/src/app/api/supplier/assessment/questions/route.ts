import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/supplier/assessment/questions?supplierType=PRODUSEN
// Get assessment questions for specific supplier type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const supplierType = searchParams.get('supplierType')

    if (!supplierType || !['PRODUSEN', 'PABRIK', 'TRADER', 'AGGREGATOR'].includes(supplierType)) {
      return NextResponse.json(
        { error: 'Invalid or missing supplierType parameter' },
        { status: 400 }
      )
    }

    // Get active questions for this supplier type
    const questions = await prisma.supplierAssessmentQuestion.findMany({
      where: {
        supplierType: supplierType as any,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' },
      ],
    })

    // Group questions by category
    const groupedQuestions = questions.reduce((acc, question) => {
      const category = question.category || 'Umum'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(question)
      return acc
    }, {} as Record<string, typeof questions>)

    return NextResponse.json({
      success: true,
      data: {
        supplierType,
        questions,
        groupedQuestions,
        totalQuestions: questions.length,
      },
    })
  } catch (error) {
    console.error('[ASSESSMENT_QUESTIONS_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/supplier/assessment/questions - Create new question (ADMIN/MENTOR only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is ADMIN or MENTOR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Only ADMIN and MENTOR can create questions.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      supplierType,
      category,
      question,
      questionType,
      options,
      minValue,
      maxValue,
      weight,
      order,
    } = body

    // Validation
    if (!supplierType || !question || !questionType) {
      return NextResponse.json(
        { error: 'Missing required fields: supplierType, question, questionType' },
        { status: 400 }
      )
    }

    if (!['PRODUSEN', 'PABRIK', 'TRADER', 'AGGREGATOR'].includes(supplierType)) {
      return NextResponse.json(
        { error: 'Invalid supplierType' },
        { status: 400 }
      )
    }

    if (!['ABC', 'RANGE', 'MULTIPLE_CHOICE', 'TEXT', 'NUMBER'].includes(questionType)) {
      return NextResponse.json(
        { error: 'Invalid questionType' },
        { status: 400 }
      )
    }

    // Create question
    const newQuestion = await prisma.supplierAssessmentQuestion.create({
      data: {
        supplierType: supplierType as any,
        category: category || 'Umum',
        question,
        questionType: questionType as any,
        options: options || null,
        minValue: minValue !== undefined ? parseInt(minValue) : null,
        maxValue: maxValue !== undefined ? parseInt(maxValue) : null,
        weight: weight ? parseInt(weight) : 1,
        order: order !== undefined ? parseInt(order) : 0,
        isActive: true,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: newQuestion,
      message: 'Assessment question created successfully',
    })
  } catch (error) {
    console.error('[ASSESSMENT_QUESTIONS_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
