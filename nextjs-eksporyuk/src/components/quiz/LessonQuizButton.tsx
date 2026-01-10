'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileQuestion,
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  Award,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface LessonQuizButtonProps {
  lessonId: string
  hasAccess: boolean
}

export default function LessonQuizButton({ lessonId, hasAccess }: LessonQuizButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quizData, setQuizData] = useState<any>(null)

  useEffect(() => {
    fetchQuizData()
  }, [lessonId])

  const fetchQuizData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/quiz/lesson/${lessonId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.hasQuiz) {
          setQuizData(data)
        }
      }
    } catch (error) {
      console.error('Fetch quiz error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    if (!hasAccess) {
      toast.error('Enroll kursus terlebih dahulu')
      return
    }

    if (quizData?.userStatus?.attemptsLeft === 0) {
      toast.error('Anda telah mencapai batas maksimum percobaan')
      return
    }

    router.push(`/quiz/${quizData.quiz.id}`)
  }

  if (loading || !quizData?.hasQuiz) {
    return null
  }

  const { quiz, userStatus } = quizData

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileQuestion className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{quiz.title}</h3>
              {quiz.description && (
                <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {quiz.questionCount} {quiz.questionCount === 1 ? 'Question' : 'Questions'}
              </Badge>
              {quiz.timeLimit && (
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {quiz.timeLimit} minutes
                </Badge>
              )}
              <Badge variant="outline">
                Passing Score: {quiz.passingScore}%
              </Badge>
              {quiz.maxAttempts && (
                <Badge variant="outline">
                  Max Attempts: {quiz.maxAttempts}
                </Badge>
              )}
            </div>

            {userStatus.hasPassed ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Quiz Passed!</p>
                  <p className="text-sm text-green-700">
                    Best Score: {userStatus.bestScore}%
                  </p>
                </div>
              </div>
            ) : userStatus.bestScore !== null ? (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900">Not Passed Yet</p>
                  <p className="text-sm text-yellow-700">
                    Best Score: {userStatus.bestScore}% (Required: {quiz.passingScore}%)
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {userStatus.hasActiveAttempt ? (
                <Button onClick={handleStartQuiz} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Resume Quiz
                </Button>
              ) : userStatus.hasPassed ? (
                <Button onClick={handleStartQuiz} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
              ) : userStatus.attemptsLeft === 0 ? (
                <Button disabled size="lg">
                  <XCircle className="w-4 h-4 mr-2" />
                  No Attempts Left
                </Button>
              ) : (
                <Button onClick={handleStartQuiz} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  {userStatus.attemptsUsed > 0 ? 'Retry Quiz' : 'Start Quiz'}
                </Button>
              )}

              {userStatus.attemptsLeft !== null && (
                <Badge variant="secondary">
                  {userStatus.attemptsLeft} {userStatus.attemptsLeft === 1 ? 'attempt' : 'attempts'} left
                </Badge>
              )}

              {userStatus.lastAttempt?.isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/quiz/${quiz.id}/result/${userStatus.lastAttempt.id}`)}
                >
                  <Award className="w-4 h-4 mr-2" />
                  View Last Result
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
