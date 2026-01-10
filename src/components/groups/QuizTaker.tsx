'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  Clock, 
  Trophy, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Award
} from 'lucide-react'
import { toast } from 'sonner'

interface QuizQuestion {
  id: string
  question: string
  questionType: string
  options: Array<{ id: string; text: string }>
  points: number
  imageUrl?: string
}

interface Quiz {
  id: string
  title: string
  description?: string
  passingScore: number
  timeLimit?: number
  showResults: boolean
  rewardPoints: number
  rewardBadge?: {
    name: string
    icon: string
    color: string
  }
  questions: QuizQuestion[]
}

interface QuizTakerProps {
  groupId: string
  quizId: string
  onComplete?: (result: any) => void
  onClose?: () => void
}

export default function QuizTaker({ groupId, quizId, onComplete, onClose }: QuizTakerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  // Fetch quiz and start attempt
  useEffect(() => {
    const fetchQuizAndStart = async () => {
      try {
        // Fetch quiz
        const quizRes = await fetch(`/api/groups/${groupId}/quizzes/${quizId}`)
        if (!quizRes.ok) {
          toast.error('Gagal memuat quiz')
          onClose?.()
          return
        }
        const quizData = await quizRes.json()
        setQuiz(quizData.quiz)

        // Start attempt
        const attemptRes = await fetch(`/api/groups/${groupId}/quizzes/${quizId}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        })

        if (!attemptRes.ok) {
          const error = await attemptRes.json()
          toast.error(error.error || 'Gagal memulai quiz')
          onClose?.()
          return
        }

        const attemptData = await attemptRes.json()
        setAttemptId(attemptData.attempt.id)

        // Set timer if time limit exists
        if (quizData.quiz.timeLimit) {
          setTimeLeft(quizData.quiz.timeLimit * 60) // Convert to seconds
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Terjadi kesalahan')
        onClose?.()
      } finally {
        setLoading(false)
      }
    }

    fetchQuizAndStart()
  }, [groupId, quizId])

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const handleSubmit = async () => {
    if (!attemptId || !quiz) return
    
    setSubmitting(true)
    setConfirmSubmit(false)

    try {
      const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }))

      const res = await fetch(`/api/groups/${groupId}/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          attemptId,
          answers: answersArray
        })
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengirim jawaban')
        return
      }

      const data = await res.json()
      setResults(data)
      setShowResults(true)
      onComplete?.(data)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Terjadi kesalahan saat mengirim jawaban')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !quiz) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat quiz...</p>
        </CardContent>
      </Card>
    )
  }

  // Show results
  if (showResults && results) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            results.isPassed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {results.isPassed ? (
              <Trophy className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {results.isPassed ? 'Selamat! Kamu Lulus! 🎉' : 'Quiz Selesai'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{results.percentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Skor Akhir</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold">{results.score}/{results.maxScore}</p>
              <p className="text-sm text-gray-500">Poin Diperoleh</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Nilai Kelulusan: {results.passingScore}%</span>
              <span className={results.isPassed ? 'text-green-600' : 'text-red-600'}>
                {results.isPassed ? 'LULUS' : 'BELUM LULUS'}
              </span>
            </div>
            <Progress value={results.percentage} className="h-3" />
          </div>

          {/* Time Spent */}
          <div className="text-center text-gray-500">
            <Clock className="w-4 h-4 inline mr-1" />
            Waktu pengerjaan: {Math.floor(results.timeSpent / 60)} menit {results.timeSpent % 60} detik
          </div>

          {/* Badge Awarded */}
          {results.badgeAwarded && quiz.rewardBadge && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <Award className="w-5 h-5 text-yellow-600" />
              <AlertDescription className="ml-2">
                Kamu mendapatkan badge <strong>{quiz.rewardBadge.icon} {quiz.rewardBadge.name}</strong>!
              </AlertDescription>
            </Alert>
          )}

          {/* Results Detail */}
          {quiz.showResults && results.results && (
            <div className="space-y-4 mt-6">
              <h4 className="font-semibold">Detail Jawaban:</h4>
              {results.results.map((result: any, index: number) => (
                <div key={result.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-2">
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        {index + 1}. {result.question.question}
                      </p>
                      <div className="text-sm space-y-1">
                        {(result.question.options as any[]).map((opt: any) => (
                          <div 
                            key={opt.id}
                            className={`p-2 rounded ${
                              opt.isCorrect 
                                ? 'bg-green-100 text-green-700' 
                                : opt.id === result.selectedOption && !result.isCorrect
                                  ? 'bg-red-100 text-red-700'
                                  : ''
                            }`}
                          >
                            {opt.text}
                            {opt.isCorrect && ' ✓'}
                          </div>
                        ))}
                      </div>
                      {result.question.explanation && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          💡 {result.question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={onClose} className="w-full">
            Selesai
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Quiz taking UI
  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <>
      <Card className="max-w-3xl mx-auto">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              <p className="text-sm text-gray-500">
                Soal {currentQuestion + 1} dari {quiz.questions.length}
              </p>
            </div>
            {timeLeft !== null && (
              <Badge 
                variant={timeLeft < 60 ? 'destructive' : 'secondary'}
                className="text-lg px-4 py-1"
              >
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2 mt-3" />
        </CardHeader>

        <CardContent className="p-6">
          {/* Question */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium">{question.question}</h3>
              <Badge variant="outline">{question.points} poin</Badge>
            </div>

            {question.imageUrl && (
              <img 
                src={question.imageUrl} 
                alt="Question" 
                className="max-w-full h-auto rounded-lg mb-4"
              />
            )}
          </div>

          {/* Options */}
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <div 
                key={option.id}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleAnswerChange(question.id, option.id)}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>

        {/* Footer Navigation */}
        <CardFooter className="border-t flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Sebelumnya
          </Button>

          <div className="text-sm text-gray-500">
            {answeredCount} / {quiz.questions.length} dijawab
          </div>

          {currentQuestion < quiz.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
            >
              Kirim Jawaban
            </Button>
          )}
        </CardFooter>

        {/* Question Navigator */}
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-500 mb-2">Navigasi Soal:</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[q.id]
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Confirm Submit Dialog */}
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Jawaban?</DialogTitle>
            <DialogDescription>
              {answeredCount < quiz.questions.length ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Kamu baru menjawab {answeredCount} dari {quiz.questions.length} soal.
                    Soal yang tidak dijawab akan dianggap salah.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="mt-2">Kamu sudah menjawab semua soal. Yakin ingin mengirim?</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Mengirim...' : 'Ya, Kirim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
