import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/quizzes/[id]/start - Start a quiz attempt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: quizId } = await params

    // Get quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true
      }
    })

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    // Check max attempts
    if (quiz.maxAttempts) {
      const attemptCount = await prisma.quizAttempt.count({
        where: {
          quizId,
          userId: session.user.id
        }
      })

      if (attemptCount >= quiz.maxAttempts) {
        return NextResponse.json(
          { message: 'Maximum attempts reached' },
          { status: 400 }
        )
      }
    }

    // Calculate max score
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)

    // Create attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
        maxScore,
        earnedScore: 0,
        score: 0
      }
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
