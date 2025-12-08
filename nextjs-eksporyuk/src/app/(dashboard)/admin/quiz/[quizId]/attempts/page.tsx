import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileQuestion,
  User
} from 'lucide-react'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface PageProps {
  params: {
    quizId: string
  }
}

export default async function QuizAttemptsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Only ADMIN and MENTOR can view attempts
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
    redirect('/dashboard')
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      },
      lesson: {
        select: {
          id: true,
          title: true
        }
      },
      _count: {
        select: {
          questions: true
        }
      }
    }
  })

  if (!quiz) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Quiz not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all attempts with user info
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: params.quizId,
      isCompleted: true // Only show completed attempts
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      answers: {
        include: {
          question: true
        }
      }
    },
    orderBy: {
      completedAt: 'desc'
    }
  })

  // Calculate statistics
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter(a => a.isPassed).length
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0
  const avgScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts)
    : 0

  // Count essays needing grading
  const needsGrading = attempts.filter(attempt =>
    attempt.answers.some(answer => !answer.isGraded && answer.question.type === 'ESSAY')
  ).length

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link href={`/admin/courses/${quiz.course.slug}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Link>
            </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{quiz.title}</h1>
              <p className="text-muted-foreground mt-1">{quiz.course.title}</p>
              {quiz.lesson && (
                <p className="text-sm text-muted-foreground">Lesson: {quiz.lesson.title}</p>
              )}
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <FileQuestion className="w-4 h-4 mr-2" />
              {quiz._count.questions} Questions
            </Badge>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalAttempts}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Attempts</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{passedAttempts}</div>
                <div className="text-sm text-muted-foreground mt-1">Passed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{passRate}%</div>
                <div className="text-sm text-muted-foreground mt-1">Pass Rate</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{avgScore}%</div>
                <div className="text-sm text-muted-foreground mt-1">Average Score</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {needsGrading > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">
                    {needsGrading} {needsGrading === 1 ? 'attempt' : 'attempts'} need manual grading
                  </p>
                  <p className="text-sm text-yellow-800">
                    Some students have essay answers waiting for review.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attempts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed attempts yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => {
                    const needsGradingFlag = attempt.answers.some(
                      a => !a.isGraded && a.question.type === 'ESSAY'
                    )

                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{attempt.user.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {attempt.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {attempt.score}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.earnedScore}/{attempt.maxScore} pts
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={attempt.isPassed ? 'default' : 'destructive'}
                            className={attempt.isPassed ? 'bg-green-600' : ''}
                          >
                            {attempt.isPassed ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </>
                            )}
                          </Badge>
                          {needsGradingFlag && (
                            <Badge variant="secondary" className="ml-2">
                              <Clock className="w-3 h-3 mr-1" />
                              Needs Grading
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.timeSpent
                            ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {attempt.completedAt
                            ? new Date(attempt.completedAt).toLocaleString('id-ID')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/quiz/${quiz.id}/grade/${attempt.id}`}>
                              {needsGradingFlag ? 'Grade' : 'Review'}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
