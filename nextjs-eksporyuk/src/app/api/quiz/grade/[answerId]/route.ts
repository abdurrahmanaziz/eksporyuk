import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// PUT /api/quiz/grade/[answerId] - Grade essay answer manually
export async function PUT(
  req: NextRequest,
  { params }: { params: { answerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN and MENTOR can grade
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { answerId } = params
    const { pointsEarned, feedback } = await req.json()

    // Validate input
    if (typeof pointsEarned !== 'number' || pointsEarned < 0) {
      return NextResponse.json(
        { error: 'Invalid points earned' },
        { status: 400 }
      )
    }

    // Get answer with question and attempt
    const answer = await prisma.quizAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        attempt: {
          include: {
            quiz: true,
            answers: true
          }
        }
      }
    })

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      )
    }

    // Validate points don't exceed question points
    if (pointsEarned > answer.question.points) {
      return NextResponse.json(
        { error: `Points cannot exceed ${answer.question.points}` },
        { status: 400 }
      )
    }

    // Update answer
    await prisma.quizAnswer.update({
      where: { id: answerId },
      data: {
        pointsEarned,
        feedback: feedback || null,
        isGraded: true,
        isCorrect: pointsEarned === answer.question.points
      }
    })

    // Recalculate attempt score
    const allAnswers = await prisma.quizAnswer.findMany({
      where: { attemptId: answer.attemptId },
      include: { question: true }
    })

    const totalEarned = allAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0)
    const maxScore = allAnswers.reduce((sum, a) => sum + a.question.points, 0)
    const scorePercentage = maxScore > 0 ? Math.round((totalEarned / maxScore) * 100) : 0
    const isPassed = scorePercentage >= answer.attempt.quiz.passingScore

    // Update attempt
    await prisma.quizAttempt.update({
      where: { id: answer.attemptId },
      data: {
        earnedScore: totalEarned,
        score: scorePercentage,
        isPassed
      }
    })

    // Send notification to student if grading is complete
    const allGraded = allAnswers.every(a => a.isGraded)
    if (allGraded) {
      await prisma.notification.create({
        data: {
          userId: answer.attempt.userId,
          type: 'SYSTEM',
          title: '📝 Quiz Graded',
          message: `Your quiz "${answer.attempt.quiz.title}" has been graded. Score: ${scorePercentage}%`,
          link: `/quiz/${answer.attempt.quizId}/result/${answer.attemptId}`,
          isRead: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      newScore: scorePercentage,
      isPassed,
      allGraded
    })
  } catch (error) {
    console.error('Grade answer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
