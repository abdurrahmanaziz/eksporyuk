import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/supplier/assessment - Get current user's assessment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get supplier profile
    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    // Get latest assessment
    const assessment = await prisma.supplierAssessment.findFirst({
      where: { supplierId: profile.id },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: assessment,
    })
  } catch (error) {
    console.error('[ASSESSMENT_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/supplier/assessment - Submit assessment answers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get supplier profile
    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    // Check if supplier has supplierType
    if (!profile.supplierType) {
      return NextResponse.json(
        { error: 'Please select supplier type first' },
        { status: 400 }
      )
    }

    // Check status - only ONBOARDING can submit assessment
    if (profile.status !== 'ONBOARDING') {
      return NextResponse.json(
        { 
          error: 'Assessment can only be submitted during onboarding',
          currentStatus: profile.status 
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { answers } = body // Array of { questionId, answer }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing answers array' },
        { status: 400 }
      )
    }

    // Get all questions for this supplier type
    const questions = await prisma.supplierAssessmentQuestion.findMany({
      where: {
        supplierType: profile.supplierType,
        isActive: true,
      },
    })

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No assessment questions available for your supplier type' },
        { status: 400 }
      )
    }

    // Calculate scores
    let totalScore = 0
    let maxScore = 0
    const processedAnswers: any[] = []

    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId)
      
      if (!question) continue

      let score = 0
      const questionMaxScore = 10 * question.weight // Default max score per question

      // Calculate score based on question type
      if (question.questionType === 'RANGE') {
        const answerValue = parseInt(answer.answer)
        if (!isNaN(answerValue) && question.minValue !== null && question.maxValue !== null) {
          // Normalize to 0-10 scale
          const normalized = ((answerValue - question.minValue) / (question.maxValue - question.minValue)) * 10
          score = Math.round(normalized * question.weight)
        }
      } else if (question.questionType === 'ABC') {
        // A=10, B=7, C=4
        const scoreMap: Record<string, number> = { 'A': 10, 'B': 7, 'C': 4 }
        score = (scoreMap[answer.answer] || 0) * question.weight
      } else if (question.questionType === 'NUMBER') {
        const answerValue = parseInt(answer.answer)
        if (!isNaN(answerValue)) {
          score = Math.min(answerValue, 10) * question.weight
        }
      } else {
        // TEXT or MULTIPLE_CHOICE - require manual review
        score = 0 // Will be scored by mentor
      }

      totalScore += score
      maxScore += questionMaxScore

      processedAnswers.push({
        questionId: question.id,
        answer: answer.answer,
        score,
        maxScore: questionMaxScore,
      })
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

    // Create assessment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create assessment
      const assessment = await tx.supplierAssessment.create({
        data: {
          supplierId: profile.id,
          supplierType: profile.supplierType as any,
          totalScore,
          maxScore,
          percentage,
          isCompleted: true,
          submittedAt: new Date(),
        },
      })

      // Create answers
      const answerRecords = await Promise.all(
        processedAnswers.map(answer =>
          tx.supplierAssessmentAnswer.create({
            data: {
              assessmentId: assessment.id,
              questionId: answer.questionId,
              answer: answer.answer,
              score: answer.score,
              maxScore: answer.maxScore,
            },
          })
        )
      )

      // Update supplier profile status to WAITING_REVIEW
      await tx.supplierProfile.update({
        where: { id: profile.id },
        data: {
          status: 'WAITING_REVIEW',
        },
      })

      // Create audit log
      await tx.supplierAuditLog.create({
        data: {
          supplierId: profile.id,
          userId: session.user.id,
          action: 'ASSESSMENT_SUBMITTED',
          notes: `Assessment completed with score: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return { assessment, answers: answerRecords }
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Assessment submitted successfully. Your profile is now under review.',
    })
  } catch (error) {
    console.error('[ASSESSMENT_POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
