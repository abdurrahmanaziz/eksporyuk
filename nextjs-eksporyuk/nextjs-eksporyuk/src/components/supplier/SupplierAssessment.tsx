/**
 * SupplierAssessment Component
 * 
 * Form assessment dinamis berdasarkan supplier type
 * Support question types: RANGE, ABC, TEXT, NUMBER, MULTIPLE_CHOICE
 * Auto-scoring untuk RANGE, ABC, NUMBER
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type QuestionType = 'RANGE' | 'ABC' | 'TEXT' | 'NUMBER' | 'MULTIPLE_CHOICE'

interface AssessmentQuestion {
  id: string
  category: string
  question: string
  questionType: QuestionType
  options: any
  weight: number
  order: number
}

interface AssessmentAnswer {
  questionId: string
  answerText?: string
  answerValue?: number
  score?: number
}

interface SupplierAssessmentProps {
  supplierType: 'PRODUSEN' | 'PABRIK' | 'TRADER' | 'AGGREGATOR'
  onSubmit: (answers: AssessmentAnswer[]) => Promise<void>
  isSubmitting?: boolean
}

export default function SupplierAssessment({ 
  supplierType, 
  onSubmit,
  isSubmitting = false 
}: SupplierAssessmentProps) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({})
  const [currentCategory, setCurrentCategory] = useState<string>('')

  useEffect(() => {
    fetchQuestions()
  }, [supplierType])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/supplier/assessment/questions?supplierType=${supplierType}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }

      const data = await response.json()
      
      if (data.success && data.questions) {
        setQuestions(data.questions)
        
        // Set first category as current
        if (data.questions.length > 0) {
          setCurrentCategory(data.questions[0].category)
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Gagal memuat pertanyaan assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: any, type: QuestionType, options?: any) => {
    let score = 0
    let answerText = ''
    let answerValue: number | undefined = undefined

    switch (type) {
      case 'RANGE':
        answerValue = value
        const { min, max } = options
        score = ((value - min) / (max - min)) * 10
        answerText = `${value} ${options.unit || ''}`
        break
      
      case 'ABC':
        answerText = value
        score = value === 'A' ? 10 : value === 'B' ? 7 : 4
        break
      
      case 'NUMBER':
        answerValue = value
        score = Math.min(value, 10)
        answerText = value.toString()
        break
      
      case 'TEXT':
      case 'MULTIPLE_CHOICE':
        answerText = value
        score = 0 // Manual review by mentor
        break
    }

    setAnswers({
      ...answers,
      [questionId]: {
        questionId,
        answerText,
        answerValue,
        score
      }
    })
  }

  const handleSubmit = async () => {
    // Validate all questions answered
    const unanswered = questions.filter(q => !answers[q.id])
    
    if (unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} pertanyaan yang belum dijawab`)
      // Jump to first unanswered question's category
      if (unanswered[0]) {
        setCurrentCategory(unanswered[0].category)
      }
      return
    }

    // Convert answers to array
    const answersArray = Object.values(answers)
    await onSubmit(answersArray)
  }

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = []
    }
    acc[q.category].push(q)
    return acc
  }, {} as Record<string, AssessmentQuestion[]>)

  const categories = Object.keys(questionsByCategory)
  const currentQuestions = questionsByCategory[currentCategory] || []
  
  // Calculate progress
  const totalQuestions = questions.length
  const answeredQuestions = Object.keys(answers).length
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Memuat pertanyaan assessment...</p>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada pertanyaan assessment untuk tipe supplier ini.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Assessment {supplierType}
            </h2>
            <p className="text-gray-600 mt-1">
              Jawab semua pertanyaan untuk melanjutkan ke tahap selanjutnya
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {answeredQuestions}/{totalQuestions} Dijawab
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const categoryQuestions = questionsByCategory[category]
          const categoryAnswered = categoryQuestions.filter(q => answers[q.id]).length
          const isComplete = categoryAnswered === categoryQuestions.length
          
          return (
            <Button
              key={category}
              variant={currentCategory === category ? 'default' : 'outline'}
              onClick={() => setCurrentCategory(category)}
              className="relative"
            >
              {category}
              {isComplete && (
                <CheckCircle2 className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
              )}
              <Badge variant="secondary" className="ml-2">
                {categoryAnswered}/{categoryQuestions.length}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {currentQuestions.map((question, idx) => {
          const currentAnswer = answers[question.id]
          
          return (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start justify-between">
                  <span>
                    {idx + 1}. {question.question}
                  </span>
                  {currentAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </CardTitle>
                <CardDescription>
                  Bobot: {question.weight} poin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* RANGE Type */}
                {question.questionType === 'RANGE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {question.options.min} {question.options.unit}
                      </span>
                      <span className="font-bold text-lg">
                        {currentAnswer?.answerValue || question.options.min} {question.options.unit}
                      </span>
                      <span className="text-sm text-gray-600">
                        {question.options.max} {question.options.unit}
                      </span>
                    </div>
                    <Slider
                      min={question.options.min}
                      max={question.options.max}
                      step={(question.options.max - question.options.min) / 100}
                      value={[currentAnswer?.answerValue || question.options.min]}
                      onValueChange={(val) => handleAnswerChange(question.id, val[0], 'RANGE', question.options)}
                    />
                  </div>
                )}

                {/* ABC Type */}
                {question.questionType === 'ABC' && (
                  <RadioGroup
                    value={currentAnswer?.answerText || ''}
                    onValueChange={(val) => handleAnswerChange(question.id, val, 'ABC')}
                  >
                    {['A', 'B', 'C'].map((option) => (
                      <div key={option} className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                        <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                        <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">
                          <span className="font-semibold">{option}.</span> {question.options[option]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* NUMBER Type */}
                {question.questionType === 'NUMBER' && (
                  <Input
                    type="number"
                    value={currentAnswer?.answerValue || ''}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value) || 0, 'NUMBER')}
                    placeholder="Masukkan angka"
                  />
                )}

                {/* TEXT Type */}
                {question.questionType === 'TEXT' && (
                  <Textarea
                    value={currentAnswer?.answerText || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value, 'TEXT')}
                    placeholder="Tulis jawaban Anda di sini..."
                    rows={4}
                  />
                )}

                {/* MULTIPLE_CHOICE Type */}
                {question.questionType === 'MULTIPLE_CHOICE' && question.options?.choices && (
                  <RadioGroup
                    value={currentAnswer?.answerText || ''}
                    onValueChange={(val) => handleAnswerChange(question.id, val, 'MULTIPLE_CHOICE')}
                  >
                    {question.options.choices.map((choice: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <RadioGroupItem value={choice} id={`${question.id}-choice-${idx}`} />
                        <Label htmlFor={`${question.id}-choice-${idx}`}>{choice}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <div>
          {currentCategory !== categories[0] && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentIdx = categories.indexOf(currentCategory)
                if (currentIdx > 0) {
                  setCurrentCategory(categories[currentIdx - 1])
                }
              }}
            >
              Kategori Sebelumnya
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {currentCategory !== categories[categories.length - 1] ? (
            <Button
              type="button"
              onClick={() => {
                const currentIdx = categories.indexOf(currentCategory)
                if (currentIdx < categories.length - 1) {
                  setCurrentCategory(categories[currentIdx + 1])
                }
              }}
            >
              Kategori Selanjutnya
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answeredQuestions < totalQuestions}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Mengirim...' : `Submit Assessment (${answeredQuestions}/${totalQuestions})`}
            </Button>
          )}
        </div>
      </div>

      {answeredQuestions < totalQuestions && (
        <p className="text-center text-sm text-gray-500">
          Jawab semua pertanyaan untuk dapat submit assessment
        </p>
      )}
    </div>
  )
}
