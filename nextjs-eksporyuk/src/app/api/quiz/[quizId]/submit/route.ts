import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * POST /api/quiz/[quizId]/submit
 * Submit quiz and calculate score
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

    const { attemptId } = await req.json()

    // Verify attempt
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: session.user.id,
        quizId: params.quizId,
        isCompleted: false
      },
      include: {
        quiz: {
          include: {
            questions: true
          }
        },
        answers: true
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Invalid attempt' }, { status: 403 })
    }

    // Calculate time spent
    const timeSpent = Math.floor(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
    )

    // Grade all answers
    let totalEarned = 0
    const gradedAnswers = []
    
    // Calculate max score
    const maxScore = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0)

    for (const question of attempt.quiz.questions) {
      const userAnswer = attempt.answers.find(a => a.questionId === question.id)
      
      if (!userAnswer) {
        // No answer provided
        gradedAnswers.push({
          questionId: question.id,
          isCorrect: false,
          pointsEarned: 0
        })
        continue
      }

      let isCorrect = false
      let pointsEarned = 0

      // Grade based on question type
      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const options = question.options as any[]
        const correctOption = options.find(o => o.isCorrect)
        
        if (correctOption && userAnswer.selectedOption === correctOption.id) {
          isCorrect = true
          pointsEarned = question.points
        }
      } else if (question.type === 'SHORT_ANSWER') {
        // For short answer, do case-insensitive comparison
        if (
          question.correctAnswer &&
          userAnswer.textAnswer?.toLowerCase().trim() === 
          question.correctAnswer.toLowerCase().trim()
        ) {
          isCorrect = true
          pointsEarned = question.points
        }
      } else if (question.type === 'ESSAY') {
        // Essay needs manual grading
        isCorrect = false
        pointsEarned = 0
      }

      totalEarned += pointsEarned

      // Update answer with grading
      await prisma.quizAnswer.update({
        where: { id: userAnswer.id },
        data: {
          isCorrect,
          pointsEarned,
          isGraded: question.type !== 'ESSAY' // Essay needs manual grading
        }
      })

      gradedAnswers.push({
        questionId: question.id,
        question: question.question,
        type: question.type,
        isCorrect,
        pointsEarned,
        points: question.points,
        userAnswer: userAnswer.selectedOption || userAnswer.textAnswer,
        explanation: question.explanation
      })
    }

    // Calculate percentage score
    const scorePercentage = maxScore > 0
      ? Math.round((totalEarned / maxScore) * 100)
      : 0

    const isPassed = scorePercentage >= attempt.quiz.passingScore

    // Update attempt
    const completedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        score: scorePercentage,
        earnedScore: totalEarned,
        isPassed,
        timeSpent
      }
    })

    // Update course progress if quiz is attached to lesson
    if (attempt.quiz.lessonId && isPassed) {
      await updateLessonProgress(
        session.user.id,
        attempt.quiz.courseId,
        attempt.quiz.lessonId
      )
    }

    // Send notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: isPassed ? 'ACHIEVEMENT' : 'SYSTEM',
        title: isPassed 
          ? `🎉 Quiz Passed: ${attempt.quiz.title}`
          : `Quiz Completed: ${attempt.quiz.title}`,
        message: `You scored ${scorePercentage}%. ${isPassed ? 'Great job!' : 'Keep trying!'}`,
        link: `/quiz/${params.quizId}/result/${attemptId}`
      }
    })

    return NextResponse.json({
      success: true,
      attempt: completedAttempt,
      result: {
        score: scorePercentage,
        earnedScore: totalEarned,
        maxScore: attempt.maxScore,
        isPassed,
        timeSpent,
        answers: gradedAnswers
      }
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}

/**
 * Update lesson progress when quiz is passed
 */
async function updateLessonProgress(
  userId: string,
  courseId: string,
  lessonId: string
) {
  try {
    // Get user progress
    let progress = await prisma.userCourseProgress.findFirst({
      where: {
        userId,
        courseId
      }
    })

    if (!progress) {
      progress = await prisma.userCourseProgress.create({
        data: {
          userId,
          courseId,
          progress: 0,
          hasAccess: true
        }
      })
    }

    // Add lesson to completed lessons
    let completedLessons = (progress.completedLessons as string[]) || []
    
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)

      // Calculate new progress
      const totalLessons = await prisma.courseLesson.count({
        where: {
          module: {
            courseId
          }
        }
      })

      const progressPercentage = totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0

      await prisma.userCourseProgress.update({
        where: { id: progress.id },
        data: {
          progress: progressPercentage,
          completedLessons,
          lastAccessedAt: new Date()
        }
      })
    }
  } catch (error) {
    console.error('Update lesson progress error:', error)
  }
}
