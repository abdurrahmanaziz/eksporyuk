'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface PageProps {
  params: {
    quizId: string
    attemptId: string
  }
}

export default function QuizGradingPage({ params }: PageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState<any>(null)
  const [grades, setGrades] = useState<Record<string, { points: number; feedback: string }>>({})

  useEffect(() => {
    fetchAttempt()
  }, [params.attemptId])

  const fetchAttempt = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/quiz/${params.quizId}/result/${params.attemptId}`)
      if (res.ok) {
        const data = await res.json()
        setAttempt(data)
        
        // Initialize grades for ungraded essays
        const initialGrades: Record<string, { points: number; feedback: string }> = {}
        data.answers.forEach((answer: any) => {
          if (answer.question.type === 'ESSAY') {
            initialGrades[answer.id] = {
              points: answer.pointsEarned || 0,
              feedback: answer.feedback || ''
            }
          }
        })
        setGrades(initialGrades)
      }
    } catch (error) {
      console.error('Fetch attempt error:', error)
      toast.error('Failed to load quiz attempt')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (answerId: string, field: 'points' | 'feedback', value: number | string) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value
      }
    }))
  }

  const handleSaveGrade = async (answerId: string, maxPoints: number) => {
    const grade = grades[answerId]
    
    if (grade.points < 0 || grade.points > maxPoints) {
      toast.error(`Points must be between 0 and ${maxPoints}`)
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/quiz/grade/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsEarned: grade.points,
          feedback: grade.feedback
        })
      })

      if (res.ok) {
        const result = await res.json()
        toast.success('Grade saved successfully')
        
        if (result.allGraded) {
          toast.success('All answers graded! Student has been notified.')
        }
        
        // Refresh data
        fetchAttempt()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save grade')
      }
    } catch (error) {
      console.error('Save grade error:', error)
      toast.error('Failed to save grade')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    const essayAnswers = attempt?.answers.filter((a: any) => a.question.type === 'ESSAY') || []
    
    for (const answer of essayAnswers) {
      if (!answer.isGraded) {
        await handleSaveGrade(answer.id, answer.question.points)
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Attempt not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const essayAnswers = attempt.answers.filter((a: any) => a.question.type === 'ESSAY')
  const ungradedCount = essayAnswers.filter((a: any) => !a.isGraded).length

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link href={`/admin/quiz/${params.quizId}/attempts`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Attempts
              </Link>
            </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Grade Quiz Attempt</h1>
              <p className="text-muted-foreground mt-1">
                Student: {attempt.user.name} ({attempt.user.email})
              </p>
              <p className="text-sm text-muted-foreground">
                Submitted: {new Date(attempt.completedAt).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {attempt.score}%
              </div>
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
            </div>
          </div>
        </div>

        {/* Grading Summary */}
        {ungradedCount > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">
                      {ungradedCount} essay {ungradedCount === 1 ? 'answer' : 'answers'} need grading
                    </p>
                    <p className="text-sm text-yellow-800">
                      Score will be updated after grading all essays
                    </p>
                  </div>
                </div>
                <Button onClick={handleSaveAll} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Grades
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Essay Answers */}
        <div className="space-y-6">
          {essayAnswers.map((answer: any, index: number) => (
            <Card key={answer.id} className={!answer.isGraded ? 'border-yellow-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Essay Question {index + 1}</Badge>
                      <Badge variant="secondary">{answer.question.points} points</Badge>
                      {answer.isGraded ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Graded
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Needs Grading
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{answer.question.question}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student's Answer */}
                <div>
                  <Label className="text-sm font-semibold">Student's Answer:</Label>
                  <div className="mt-2 p-4 bg-gray-50 border rounded-lg">
                    <p className="whitespace-pre-wrap">
                      {answer.textAnswer || 'No answer provided'}
                    </p>
                  </div>
                </div>

                {/* Grading Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor={`points-${answer.id}`}>
                      Points Earned (Max: {answer.question.points})
                    </Label>
                    <Input
                      id={`points-${answer.id}`}
                      type="number"
                      min={0}
                      max={answer.question.points}
                      value={grades[answer.id]?.points || 0}
                      onChange={(e) =>
                        handleGradeChange(answer.id, 'points', parseInt(e.target.value) || 0)
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`feedback-${answer.id}`}>
                      Feedback (Optional)
                    </Label>
                    <Textarea
                      id={`feedback-${answer.id}`}
                      value={grades[answer.id]?.feedback || ''}
                      onChange={(e) => handleGradeChange(answer.id, 'feedback', e.target.value)}
                      placeholder="Provide feedback to the student..."
                      rows={3}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => handleSaveGrade(answer.id, answer.question.points)}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {answer.isGraded ? 'Update Grade' : 'Save Grade'}
                </Button>

                {/* Current Grade Display */}
                {answer.isGraded && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-blue-900">Current Grade:</p>
                    <p className="text-blue-800 mt-1">
                      Points: {answer.pointsEarned}/{answer.question.points}
                    </p>
                    {answer.feedback && (
                      <p className="text-sm text-blue-700 mt-2">
                        Feedback: {answer.feedback}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Other Answers (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Other Answers (Auto-graded)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attempt.answers
                .filter((a: any) => a.question.type !== 'ESSAY')
                .map((answer: any, index: number) => (
                  <div key={answer.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{answer.question.type.replace('_', ' ')}</Badge>
                        {answer.isCorrect ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Incorrect
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-semibold">
                        {answer.pointsEarned}/{answer.question.points} pts
                      </div>
                    </div>
                    <p className="font-medium mb-2">{answer.question.question}</p>
                    <p className="text-sm text-muted-foreground">
                      Answer: {answer.selectedOption || answer.textAnswer}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ResponsivePageWrapper>
  )
}
