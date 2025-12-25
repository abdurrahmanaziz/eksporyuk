import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/quizzes/attempts/[id]/submit - Submit quiz attempt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: attemptId } = await params
    const body = await req.json()
    const { answers, timeSpent } = body // answers = [{ questionId, selectedOption?, textAnswer? }]

    // Verify attempt ownership
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    if (attempt.isCompleted) {
      return NextResponse.json(
        { message: 'Attempt already submitted' },
        { status: 400 }
      )
    }

    // Grade answers
    let earnedScore = 0
    const gradedAnswers = []

    for (const answer of answers) {
      const question = attempt.quiz.questions.find(q => q.id === answer.questionId)
      if (!question) continue

      let isCorrect = false
      let pointsEarned = 0

      // Auto-grade multiple choice
      if (question.type === 'MULTIPLE_CHOICE' && question.options) {
        const options = JSON.parse(question.options as string)
        const correctOption = options.find((opt: any) => opt.isCorrect)
        
        if (correctOption && answer.selectedOption === correctOption.id) {
          isCorrect = true
          pointsEarned = question.points
          earnedScore += question.points
        }
      }

      // Auto-grade true/false
      if (question.type === 'TRUE_FALSE' && question.correctAnswer) {
        if (answer.selectedOption === question.correctAnswer) {
          isCorrect = true
          pointsEarned = question.points
          earnedScore += question.points
        }
      }

      // Save answer
      const savedAnswer = await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption || null,
          textAnswer: answer.textAnswer || null,
          isCorrect,
          pointsEarned,
          isGraded: question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE'
        }
      })

      gradedAnswers.push(savedAnswer)
    }

    // Calculate score percentage
    const scorePercent = attempt.quiz.maxScore > 0
      ? Math.round((earnedScore / attempt.maxScore) * 100)
      : 0

    const isPassed = scorePercent >= attempt.quiz.passingScore

    // Update attempt
    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        earnedScore,
        score: scorePercent,
        isPassed,
        isCompleted: true,
        completedAt: new Date(),
        timeSpent: timeSpent || null
      },
      include: {
        quiz: true,
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    // Auto-update progress if quiz passed
    if (isPassed && attempt.quiz.lessonId) {
      try {
        // Get enrollment
        const enrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId: attempt.userId,
              courseId: attempt.quiz.courseId
            }
          }
        })

        if (enrollment) {
          const completedLessons = (enrollment.completedLessons as string[]) || []

          // Add lesson if quiz is associated with a lesson
          if (!completedLessons.includes(attempt.quiz.lessonId)) {
            completedLessons.push(attempt.quiz.lessonId)

            // Get course structure to calculate progress
            const course = await prisma.course.findUnique({
              where: { id: attempt.quiz.courseId },
              include: {
                modules: {
                  include: {
                    lessons: { select: { id: true } }
                  }
                }
              }
            })

            const totalLessons = course!.modules.reduce((sum, m) => sum + m.lessons.length, 0)
            const progressPercent = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0

            // Update enrollment progress
            await prisma.courseEnrollment.update({
              where: {
                userId_courseId: {
                  userId: attempt.userId,
                  courseId: attempt.quiz.courseId
                }
              },
              data: {
                completedLessons,
                progress: progressPercent,
                isCompleted: progressPercent === 100,
                completedAt: progressPercent === 100 ? new Date() : null,
                lastAccessedAt: new Date()
              }
            })

            // If 100% complete, auto-generate certificate
            if (progressPercent === 100) {
              try {
                // Check if certificate already exists
                const existingCert = await prisma.certificate.findFirst({
                  where: {
                    userId: attempt.userId,
                    courseId: attempt.quiz.courseId
                  }
                })

                if (!existingCert) {
                  await prisma.certificate.create({
                    data: {
                      userId: attempt.userId,
                      courseId: attempt.quiz.courseId,
                      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                      issuedAt: new Date(),
                      isVerified: true
                    }
                  })
                }

                // Check if this is a training course and user is affiliate
                const course = await prisma.course.findUnique({
                  where: { id: attempt.quiz.courseId },
                  select: { 
                    id: true,
                    title: true,
                    category: true,
                    trainingCategories: {
                      select: { id: true }
                    }
                  }
                })

                // If this is a training course (has training category)
                if (course?.trainingCategories?.length && course.trainingCategories.length > 0) {
                  // Check if user is affiliate
                  const affiliateProfile = await prisma.affiliateProfile.findUnique({
                    where: { userId: attempt.userId },
                    select: { 
                      id: true, 
                      trainingCompleted: true,
                      onboardingCompleted: true,
                      profileCompleted: true,
                      bankName: true
                    }
                  })

                  if (affiliateProfile && !affiliateProfile.trainingCompleted) {
                    // Mark training as completed
                    await prisma.affiliateProfile.update({
                      where: { id: affiliateProfile.id },
                      data: {
                        trainingCompleted: true,
                        trainingCompletedAt: new Date()
                      }
                    })

                    console.log(`✅ Training completed for affiliate ${attempt.userId} - Course: ${course.title}`)
                  }
                }
              } catch (certError) {
                console.log('Certificate creation error (may already exist):', certError)
              }
            }
          }
        }
      } catch (progressError) {
        console.log('Progress update error:', progressError)
        // Don't fail the quiz submission if progress update fails
      }
    }

    return NextResponse.json({ 
      attempt: updated,
      courseCompleted: enrollment ? true : false,
      shouldRedirectToOnboarding: false // Will be set by completion logic
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
