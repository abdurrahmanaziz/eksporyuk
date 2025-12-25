import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/quiz/[quizId]/answer
 * Save answer for a question (auto-save)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId, questionId, selectedOption, textAnswer } = await req.json()

    // Verify attempt belongs to user
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: session.user.id,
        quizId: params.quizId,
        isCompleted: false
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Invalid attempt' }, { status: 403 })
    }

    // Get question details
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if answer already exists
    const existingAnswer = await prisma.quizAnswer.findFirst({
      where: {
        attemptId,
        questionId
      }
    })

    let answer
    if (existingAnswer) {
      // Update existing answer
      answer = await prisma.quizAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOption: selectedOption || null,
          textAnswer: textAnswer || null
        }
      })
    } else {
      // Create new answer
      answer = await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedOption: selectedOption || null,
          textAnswer: textAnswer || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      answerId: answer.id
    })
  } catch (error) {
    console.error('Save answer error:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}
