import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/quiz/[quizId]/start
 * Start a new quiz attempt
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        lesson: {
          select: {
            id: true,
            title: true
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if user has access to course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: quiz.courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in course' }, { status: 403 })
    }

    // Check max attempts
    if (quiz.maxAttempts) {
      const attemptCount = await prisma.quizAttempt.count({
        where: {
          quizId: params.quizId,
          userId: session.user.id,
          isCompleted: true
        }
      })

      if (attemptCount >= quiz.maxAttempts) {
        return NextResponse.json(
          { error: 'Maximum attempts reached' },
          { status: 403 }
        )
      }
    }

    // Check if there's an ongoing attempt
    let attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: params.quizId,
        userId: session.user.id,
        isCompleted: false
      },
      include: {
        answers: true
      }
    })

    // Create new attempt if none exists
    if (!attempt) {
      const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
      
      attempt = await prisma.quizAttempt.create({
        data: {
          quizId: params.quizId,
          userId: session.user.id,
          maxScore: totalPoints
        },
        include: {
          answers: true
        }
      })
    }

    // Shuffle questions if enabled
    let questions = [...quiz.questions]
    if (quiz.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5)
    }

    // Shuffle answers if enabled
    if (quiz.shuffleAnswers) {
      questions = questions.map(q => {
        if (q.options && typeof q.options === 'object') {
          const options = q.options as any[]
          return {
            ...q,
            options: [...options].sort(() => Math.random() - 0.5)
          }
        }
        return q
      })
    }

    // Remove correct answers from response
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question,
      points: q.points,
      order: q.order,
      options: q.options
        ? (q.options as any[]).map(({ id, text }: any) => ({ id, text }))
        : null
    }))

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        showResults: quiz.showResults,
        course: quiz.course,
        lesson: quiz.lesson
      },
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        answers: attempt.answers
      },
      questions: sanitizedQuestions
    })
  } catch (error) {
    console.error('Start quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to start quiz' },
      { status: 500 }
    )
  }
}
