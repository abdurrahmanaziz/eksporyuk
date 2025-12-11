import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Helper function to award points
async function awardPoints(userId: string, groupId: string, points: number, type: string, sourceId?: string, description?: string) {
  // Update or create user points
  await prisma.userPoints.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    },
    update: {
      points: { increment: points },
      totalEarned: { increment: points > 0 ? points : 0 }
    },
    create: {
      userId,
      groupId,
      points,
      totalEarned: points > 0 ? points : 0
    }
  })

  // Log the transaction
  await prisma.pointTransaction.create({
    data: {
      userId,
      groupId,
      points,
      type,
      sourceId,
      description
    }
  })
}

// Helper function to award badge
async function awardBadge(userId: string, badgeId: string, groupId?: string, reason?: string) {
  // Check if user already has this badge
  const existingBadge = await prisma.userBadge.findFirst({
    where: {
      userId,
      badgeId,
      groupId: groupId || null
    }
  })

  if (!existingBadge) {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        groupId,
        reason
      }
    })

    // Award badge points
    const badge = await prisma.badgeDefinition.findUnique({
      where: { id: badgeId }
    })

    if (badge?.points && groupId) {
      await awardPoints(userId, groupId, badge.points, 'BADGE_EARN', badgeId, `Badge earned: ${badge.name}`)
    }

    return true
  }
  return false
}

// POST /api/groups/[slug]/quizzes/[quizId]/attempt - Start or submit quiz attempt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, quizId } = await params
    const body = await req.json()
    const { action, attemptId, answers } = body

    // Find group
    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      }
    })

    if (!membership && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not a group member' }, { status: 403 })
    }

    const quiz = await prisma.groupQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        rewardBadge: true
      }
    })

    if (!quiz || quiz.groupId !== group.id || !quiz.isActive) {
      return NextResponse.json({ error: 'Quiz not found or inactive' }, { status: 404 })
    }

    // Check quiz availability
    const now = new Date()
    if (quiz.startDate && quiz.startDate > now) {
      return NextResponse.json({ error: 'Quiz has not started yet' }, { status: 400 })
    }
    if (quiz.endDate && quiz.endDate < now) {
      return NextResponse.json({ error: 'Quiz has ended' }, { status: 400 })
    }

    // ACTION: START - Create new attempt
    if (action === 'start') {
      // Check attempts limit
      const attemptCount = await prisma.groupQuizAttempt.count({
        where: {
          quizId: quiz.id,
          userId: session.user.id
        }
      })

      if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
        return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 400 })
      }

      // Calculate max possible score
      const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)

      // Create attempt
      const attempt = await prisma.groupQuizAttempt.create({
        data: {
          quizId: quiz.id,
          userId: session.user.id,
          maxScore
        }
      })

      return NextResponse.json({
        attempt,
        message: 'Quiz started successfully'
      }, { status: 201 })
    }

    // ACTION: SUBMIT - Complete the quiz
    if (action === 'submit') {
      if (!attemptId || !answers) {
        return NextResponse.json({ error: 'Missing attemptId or answers' }, { status: 400 })
      }

      // Find the attempt
      const attempt = await prisma.groupQuizAttempt.findUnique({
        where: { id: attemptId }
      })

      if (!attempt || attempt.userId !== session.user.id || attempt.quizId !== quizId) {
        return NextResponse.json({ error: 'Invalid attempt' }, { status: 400 })
      }

      if (attempt.isCompleted) {
        return NextResponse.json({ error: 'Quiz already submitted' }, { status: 400 })
      }

      // Check time limit
      if (quiz.timeLimit) {
        const startTime = new Date(attempt.startedAt).getTime()
        const elapsed = (now.getTime() - startTime) / 1000 / 60 // minutes
        if (elapsed > quiz.timeLimit + 1) { // 1 minute grace
          // Mark as completed but with 0 score
          await prisma.groupQuizAttempt.update({
            where: { id: attemptId },
            data: {
              isCompleted: true,
              completedAt: now,
              timeSpent: Math.round(elapsed * 60)
            }
          })
          return NextResponse.json({ error: 'Time limit exceeded' }, { status: 400 })
        }
      }

      // Grade the answers
      let score = 0
      const gradedAnswers = []

      for (const answer of answers) {
        const question = quiz.questions.find(q => q.id === answer.questionId)
        if (!question) continue

        const options = Array.isArray(question.options) ? question.options : []
        const correctOption = options.find((opt: any) => opt.isCorrect)
        const isCorrect = correctOption && answer.selectedOption === correctOption.id
        const pointsEarned = isCorrect ? question.points : 0
        score += pointsEarned

        gradedAnswers.push({
          attemptId,
          questionId: question.id,
          selectedOption: answer.selectedOption,
          isCorrect,
          pointsEarned
        })
      }

      // Calculate percentage and pass status
      const percentage = attempt.maxScore > 0 ? (score / attempt.maxScore) * 100 : 0
      const isPassed = percentage >= quiz.passingScore
      const timeSpent = Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000)

      // Save answers
      await prisma.groupQuizAnswer.createMany({
        data: gradedAnswers
      })

      // Update attempt
      const completedAttempt = await prisma.groupQuizAttempt.update({
        where: { id: attemptId },
        data: {
          score,
          percentage,
          isPassed,
          isCompleted: true,
          completedAt: now,
          timeSpent
        }
      })

      // Award points for completion
      await awardPoints(
        session.user.id,
        group.id,
        quiz.rewardPoints,
        'QUIZ_COMPLETE',
        quiz.id,
        `Completed quiz: ${quiz.title}`
      )

      // Award badge if passed and badge is configured
      let badgeAwarded = false
      if (isPassed && quiz.rewardBadgeId) {
        badgeAwarded = await awardBadge(
          session.user.id,
          quiz.rewardBadgeId,
          group.id,
          `Passed quiz: ${quiz.title} with ${percentage.toFixed(1)}%`
        )
      }

      // Get results with explanations if showResults is enabled
      let results = null
      if (quiz.showResults) {
        results = await prisma.groupQuizAnswer.findMany({
          where: { attemptId },
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                explanation: true,
                points: true
              }
            }
          }
        })
      }

      return NextResponse.json({
        attempt: completedAttempt,
        score,
        maxScore: attempt.maxScore,
        percentage,
        isPassed,
        passingScore: quiz.passingScore,
        timeSpent,
        badgeAwarded,
        results,
        message: isPassed ? 'Congratulations! You passed the quiz!' : 'Quiz completed. Better luck next time!'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Quiz attempt error:', error)
    return NextResponse.json(
      { error: 'Failed to process quiz attempt' },
      { status: 500 }
    )
  }
}

// GET /api/groups/[slug]/quizzes/[quizId]/attempt - Get user's attempts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, quizId } = await params

    const group = await prisma.group.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const quiz = await prisma.groupQuiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.groupId !== group.id) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const attempts = await prisma.groupQuizAttempt.findMany({
      where: {
        quizId,
        userId: session.user.id
      },
      include: {
        answers: quiz.showResults ? {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                explanation: true,
                points: true
              }
            }
          }
        } : false
      },
      orderBy: { startedAt: 'desc' }
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('Get attempts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    )
  }
}
