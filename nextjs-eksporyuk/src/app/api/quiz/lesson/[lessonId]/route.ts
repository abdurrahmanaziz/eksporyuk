import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/quiz/lesson/[lessonId] - Get quiz for a lesson
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { lessonId } = await params

    // Find quiz for this lesson
    const quiz = await prisma.quiz.findFirst({
      where: {
        lessonId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        passingScore: true,
        timeLimit: true,
        maxAttempts: true,
        courseId: true,
        _count: {
          select: {
            questions: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { hasQuiz: false },
        { status: 200 }
      )
    }

    // Get user's attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quiz.id,
        userId: session.user.id
      },
      orderBy: {
        startedAt: 'desc'
      },
      select: {
        id: true,
        score: true,
        isPassed: true,
        isCompleted: true,
        startedAt: true
      }
    })

    // Check if user has active (incomplete) attempt
    const activeAttempt = attempts.find(a => !a.isCompleted)

    // Calculate best score
    const completedAttempts = attempts.filter(a => a.isCompleted)
    const bestScore = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map(a => a.score || 0))
      : null

    // Check if passed
    const hasPassed = completedAttempts.some(a => a.isPassed)

    // Calculate attempts left
    const attemptsUsed = attempts.length
    const attemptsLeft = quiz.maxAttempts
      ? Math.max(0, quiz.maxAttempts - attemptsUsed)
      : null

    return NextResponse.json({
      hasQuiz: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        questionCount: quiz._count.questions
      },
      userStatus: {
        hasActiveAttempt: !!activeAttempt,
        activeAttemptId: activeAttempt?.id,
        hasPassed,
        bestScore,
        attemptsUsed,
        attemptsLeft,
        lastAttempt: attempts[0] || null
      }
    })
  } catch (error) {
    console.error('Get lesson quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
