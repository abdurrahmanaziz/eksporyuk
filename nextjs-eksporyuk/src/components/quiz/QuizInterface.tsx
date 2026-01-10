'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface QuizOption {
  id: string
  text: string
}

interface Question {
  id: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'
  question: string
  points: number
  order: number
  options?: QuizOption[]
}

interface QuizInterfaceProps {
  quizId: string
  onComplete?: (result: any) => void
}

export default function QuizInterface({ quizId, onComplete }: QuizInterfaceProps) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<any>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set())
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Load quiz
  useEffect(() => {
    loadQuiz()
  }, [quizId])

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Load existing answers
  useEffect(() => {
    if (attempt?.answers) {
      const loadedAnswers: Record<string, any> = {}
      attempt.answers.forEach((ans: any) => {
        loadedAnswers[ans.questionId] = {
          selectedOption: ans.selectedOption,
          textAnswer: ans.textAnswer
        }
      })
      setAnswers(loadedAnswers)
      setSavedAnswers(new Set(attempt.answers.map((a: any) => a.questionId)))
    }
  }, [attempt])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/quiz/${quizId}/start`)
      
      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Failed to load quiz')
        return
      }

      const data = await res.json()
      setQuiz(data.quiz)
      setAttempt(data.attempt)
      setQuestions(data.questions)

      // Set timer if quiz has time limit
      if (data.quiz.timeLimit) {
        const elapsedSeconds = Math.floor(
          (Date.now() - new Date(data.attempt.startedAt).getTime()) / 1000
        )
        const remainingSeconds = (data.quiz.timeLimit * 60) - elapsedSeconds
        setTimeLeft(Math.max(0, remainingSeconds))
      }
    } catch (error) {
      console.error('Load quiz error:', error)
      toast.error('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = useCallback(async (questionId: string, answer: any) => {
    try {
      const res = await fetch(`/api/quiz/${quizId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId,
          ...answer
        })
      })

      if (res.ok) {
        setSavedAnswers(prev => new Set([...prev, questionId]))
        return true
      }
    } catch (error) {
      console.error('Save answer error:', error)
    }
    return false
  }, [quizId, attempt?.id])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    const timeout = setTimeout(() => {
      saveAnswer(questionId, value)
    }, 2000)

    setAutoSaveTimeout(timeout)
  }

  const handleNext = () => {
    // Save current answer before moving
    if (currentQuestion && answers[currentQuestion.id]) {
      saveAnswer(currentQuestion.id, answers[currentQuestion.id])
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleQuestionJump = (index: number) => {
    // Save current answer before jumping
    if (currentQuestion && answers[currentQuestion.id]) {
      saveAnswer(currentQuestion.id, answers[currentQuestion.id])
    }
    setCurrentQuestionIndex(index)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Save all unsaved answers first
      const savePromises = questions.map(q => {
        if (answers[q.id] && !savedAnswers.has(q.id)) {
          return saveAnswer(q.id, answers[q.id])
        }
        return Promise.resolve(true)
      })

      await Promise.all(savePromises)

      // Submit quiz
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id
        })
      })

      if (!res.ok) {
        throw new Error('Failed to submit quiz')
      }

      const result = await res.json()
      
      toast.success('Quiz submitted successfully!')
      
      if (onComplete) {
        onComplete(result)
      } else {
        router.push(`/quiz/${quizId}/result/${attempt.id}`)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit quiz')
    } finally {
      setIsSubmitting(false)
      setShowSubmitDialog(false)
    }
  }

  const handleAutoSubmit = () => {
    toast.info('Time is up! Submitting quiz...')
    handleSubmit()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const answeredCount = questions.filter(q => answers[q.id]).length

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    )
  }

  if (!quiz || !currentQuestion) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Quiz not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              {quiz.description && (
                <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
              )}
            </div>
            {timeLeft !== null && (
              <Badge variant={timeLeft < 300 ? 'destructive' : 'default'} className="text-lg px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{answeredCount} answered</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>

          {/* Question */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {currentQuestion.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary">
                      {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                    </Badge>
                    {savedAnswers.has(currentQuestion.id) && (
                      <Badge variant="default" className="bg-green-600">
                        <Save className="w-3 h-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Multiple Choice / True False */}
              {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.selectedOption || ''}
                  onValueChange={(value) =>
                    handleAnswerChange(currentQuestion.id, { selectedOption: value })
                  }
                >
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {/* Short Answer */}
              {currentQuestion.type === 'SHORT_ANSWER' && (
                <div className="space-y-2">
                  <Label>Your Answer</Label>
                  <Textarea
                    value={answers[currentQuestion.id]?.textAnswer || ''}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, { textAnswer: e.target.value })
                    }
                    placeholder="Type your answer here..."
                    rows={3}
                  />
                </div>
              )}

              {/* Essay */}
              {currentQuestion.type === 'ESSAY' && (
                <div className="space-y-2">
                  <Label>Your Essay</Label>
                  <Textarea
                    value={answers[currentQuestion.id]?.textAnswer || ''}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, { textAnswer: e.target.value })
                    }
                    placeholder="Write your essay here..."
                    rows={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={() => setShowSubmitDialog(true)} size="lg">
                Submit Quiz
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar - Question Navigator */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {questions.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={index === currentQuestionIndex ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuestionJump(index)}
                    className={`relative ${
                      answers[q.id]
                        ? 'border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {index + 1}
                    {answers[q.id] && (
                      <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-600" />
                    )}
                  </Button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Answered:</span>
                  <span className="font-semibold">{answeredCount}/{questions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span className="font-semibold">{quiz.passingScore}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-orange-600">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {questions.length - answeredCount} question(s) are unanswered.
                </span>
              )}
              <br />
              Are you sure you want to submit? You cannot change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
