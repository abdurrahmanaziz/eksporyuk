import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface PageProps {
  params: {
    quizId: string
    attemptId: string
  }
}

export default async function QuizResultPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      quiz: {
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: true
                }
              }
            }
          },
          questions: {
            orderBy: { order: 'asc' }
          }
        }
      },
      answers: {
        include: {
          question: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  })

  if (!attempt) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Quiz attempt not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Security: Only allow user to view their own results (or admin/mentor)
  const isOwner = attempt.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  const isMentor = session.user.role === 'MENTOR'

  if (!isOwner && !isAdmin && !isMentor) {
    redirect('/dashboard')
  }

  const { quiz, answers } = attempt
  const course = quiz.lesson?.module?.course

  // Calculate statistics
  const totalQuestions = quiz.questions.length
  const answeredQuestions = answers.length
  const correctAnswers = answers.filter(a => a.isCorrect).length
  const scorePercentage = attempt.score || 0
  const isPassed = attempt.isPassed
  const timeSpent = attempt.timeSpent ? Math.floor(attempt.timeSpent / 60) : 0

  // Check remaining attempts
  const attemptCount = await prisma.quizAttempt.count({
    where: {
      quizId: quiz.id,
      userId: attempt.userId
    }
  })
  const attemptsLeft = quiz.maxAttempts ? quiz.maxAttempts - attemptCount : null

  // Check if essay questions need grading
  const hasUngraded = answers.some(a => !a.isGraded)

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link href={course ? `/learn/${course.slug}` : '/dashboard'}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Link>
            </Button>

          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          {course && (
            <p className="text-muted-foreground mt-1">{course.title}</p>
          )}
        </div>

        {/* Score Card */}
        <Card className={isPassed ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quiz Result</CardTitle>
              <Badge
                variant={isPassed ? 'default' : 'destructive'}
                className={isPassed ? 'bg-green-600' : ''}
              >
                {isPassed ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Passed
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Failed
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Score Display */}
              <div className="text-center py-6">
                <div className="text-6xl font-bold mb-2">
                  {scorePercentage}%
                </div>
                <Progress
                  value={scorePercentage}
                  className="h-3 mb-4"
                />
                <p className="text-muted-foreground">
                  Passing score: {quiz.passingScore}%
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {answeredQuestions - correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {attempt.earnedScore}/{attempt.maxScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Points</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold flex items-center justify-center">
                    <Clock className="w-5 h-5 mr-1" />
                    {timeSpent}m
                  </div>
                  <div className="text-sm text-muted-foreground">Time Spent</div>
                </div>
              </div>

              {/* Pending Grading Notice */}
              {hasUngraded && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">Pending Manual Grading</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Some essay questions require manual grading by your instructor.
                        Your final score may change once grading is complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {!isPassed && attemptsLeft && attemptsLeft > 0 && (
                  <Button asChild>
                    <Link href={`/quiz/${quiz.id}`}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retry Quiz ({attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left)
                    </Link>
                  </Button>
                )}
                {isPassed && course && (
                  <Button asChild>
                    <Link href={`/learn/${course.slug}`}>
                      Continue Learning
                      <Award className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card>
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = answers.find(a => a.questionId === question.id)
                const options = question.options as any[] | null
                const correctOption = options?.find((o: any) => o.isCorrect)
                const userOption = options?.find((o: any) => o.id === userAnswer?.selectedOption)

                return (
                  <div key={question.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          <Badge variant="secondary">{question.points} pts</Badge>
                          {userAnswer?.isCorrect ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Correct
                            </Badge>
                          ) : userAnswer?.isGraded === false ? (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Review
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{question.question}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Score</div>
                        <div className="font-bold">
                          {userAnswer?.pointsEarned || 0}/{question.points}
                        </div>
                      </div>
                    </div>

                    {/* Multiple Choice / True False */}
                    {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && (
                      <div className="space-y-2 mt-4">
                        <div className="text-sm font-semibold text-muted-foreground">Your Answer:</div>
                        <div
                          className={`p-3 border rounded-lg ${
                            userAnswer?.isCorrect
                              ? 'bg-green-50 border-green-500'
                              : 'bg-red-50 border-red-500'
                          }`}
                        >
                          {userOption?.text || 'No answer provided'}
                        </div>

                        {!userAnswer?.isCorrect && correctOption && (
                          <>
                            <div className="text-sm font-semibold text-muted-foreground mt-4">
                              Correct Answer:
                            </div>
                            <div className="p-3 border border-green-500 rounded-lg bg-green-50">
                              {correctOption.text}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Short Answer */}
                    {question.type === 'SHORT_ANSWER' && (
                      <div className="space-y-2 mt-4">
                        <div className="text-sm font-semibold text-muted-foreground">Your Answer:</div>
                        <div
                          className={`p-3 border rounded-lg ${
                            userAnswer?.isCorrect
                              ? 'bg-green-50 border-green-500'
                              : 'bg-red-50 border-red-500'
                          }`}
                        >
                          {userAnswer?.textAnswer || 'No answer provided'}
                        </div>

                        {!userAnswer?.isCorrect && question.correctAnswer && (
                          <>
                            <div className="text-sm font-semibold text-muted-foreground mt-4">
                              Correct Answer:
                            </div>
                            <div className="p-3 border border-green-500 rounded-lg bg-green-50">
                              {question.correctAnswer}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Essay */}
                    {question.type === 'ESSAY' && (
                      <div className="space-y-2 mt-4">
                        <div className="text-sm font-semibold text-muted-foreground">Your Essay:</div>
                        <div className="p-4 border rounded-lg bg-gray-50">
                          <p className="whitespace-pre-wrap">
                            {userAnswer?.textAnswer || 'No answer provided'}
                          </p>
                        </div>

                        {userAnswer?.feedback && (
                          <>
                            <div className="text-sm font-semibold text-muted-foreground mt-4">
                              Instructor Feedback:
                            </div>
                            <div className="p-4 border border-blue-500 rounded-lg bg-blue-50">
                              <p className="whitespace-pre-wrap">{userAnswer.feedback}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-semibold text-blue-900 mb-2">
                          Explanation:
                        </div>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
