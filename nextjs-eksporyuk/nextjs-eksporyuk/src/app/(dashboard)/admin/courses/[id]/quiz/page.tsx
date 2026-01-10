'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, Plus, Edit, Trash2, Save, Clock, Target, 
  CheckCircle, AlertCircle, HelpCircle, FileQuestion
} from 'lucide-react'
import { toast } from 'sonner'

type QuizQuestion = {
  id: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY'
  question: string
  explanation?: string
  points: number
  order: number
  options?: { id: string; text: string; isCorrect: boolean }[]
  correctAnswer?: string
}

type Quiz = {
  id: string
  title: string
  description?: string
  passingScore: number
  timeLimit?: number
  maxAttempts?: number
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  showResults: boolean
  isActive: boolean
  lessonId?: string
  questions: QuizQuestion[]
  _count?: {
    attempts: number
  }
}

export default function AdminCourseQuizPage() {
  const params = useParams()
  const courseId = params.id as string
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchQuizzes()
    }
  }, [status, session, router, courseId])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes`)
      if (res.ok) {
        const data = await res.json()
        setQuizzes(data.quizzes || [])
      } else {
        toast.error('Gagal memuat data quiz')
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = () => {
    setEditingQuiz({
      id: '',
      title: '',
      description: '',
      passingScore: 70,
      timeLimit: undefined,
      maxAttempts: undefined,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showResults: true,
      isActive: true,
      questions: []
    })
  }

  const handleSaveQuiz = async () => {
    if (!editingQuiz) return

    if (!editingQuiz.title) {
      toast.error('Judul quiz wajib diisi')
      return
    }

    try {
      const url = editingQuiz.id 
        ? `/api/admin/courses/${params.id}/quizzes/${editingQuiz.id}`
        : `/api/admin/courses/${params.id}/quizzes`
      
      const method = editingQuiz.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuiz)
      })

      if (res.ok) {
        toast.success(editingQuiz.id ? 'Quiz berhasil diupdate' : 'Quiz berhasil dibuat')
        setEditingQuiz(null)
        fetchQuizzes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan quiz')
      }
    } catch (error) {
      console.error('Save quiz error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Yakin ingin menghapus quiz ini? Semua pertanyaan dan hasil attempt akan terhapus.')) return

    try {
      const res = await fetch(`/api/admin/courses/${params.id}/quizzes/${quizId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Quiz berhasil dihapus')
        fetchQuizzes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus quiz')
      }
    } catch (error) {
      console.error('Delete quiz error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleAddQuestion = () => {
    if (!selectedQuiz) return

    const newQuestion: QuizQuestion = {
      id: '',
      type: 'MULTIPLE_CHOICE',
      question: '',
      explanation: '',
      points: 1,
      order: (selectedQuiz.questions?.length || 0) + 1,
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false }
      ]
    }

    setEditingQuestion(newQuestion)
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !selectedQuiz) return

    if (!editingQuestion.question) {
      toast.error('Pertanyaan wajib diisi')
      return
    }

    // Validate at least one correct answer for multiple choice
    if (editingQuestion.type === 'MULTIPLE_CHOICE') {
      const hasCorrectAnswer = editingQuestion.options?.some(opt => opt.isCorrect)
      if (!hasCorrectAnswer) {
        toast.error('Minimal harus ada 1 jawaban yang benar')
        return
      }
    }

    try {
      const url = editingQuestion.id
        ? `/api/admin/courses/${params.id}/quizzes/${selectedQuiz.id}/questions/${editingQuestion.id}`
        : `/api/admin/courses/${params.id}/quizzes/${selectedQuiz.id}/questions`
      
      const method = editingQuestion.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuestion)
      })

      if (res.ok) {
        toast.success(editingQuestion.id ? 'Pertanyaan berhasil diupdate' : 'Pertanyaan berhasil dibuat')
        setEditingQuestion(null)
        fetchQuizzes()
        // Refresh selected quiz
        const updatedQuiz = quizzes.find(q => q.id === selectedQuiz.id)
        if (updatedQuiz) setSelectedQuiz(updatedQuiz)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan pertanyaan')
      }
    } catch (error) {
      console.error('Save question error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedQuiz) return
    if (!confirm('Yakin ingin menghapus pertanyaan ini?')) return

    try {
      const res = await fetch(
        `/api/admin/courses/${params.id}/quizzes/${selectedQuiz.id}/questions/${questionId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        toast.success('Pertanyaan berhasil dihapus')
        fetchQuizzes()
        // Refresh selected quiz
        const updatedQuiz = quizzes.find(q => q.id === selectedQuiz.id)
        if (updatedQuiz) setSelectedQuiz(updatedQuiz)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus pertanyaan')
      }
    } catch (error) {
      console.error('Delete question error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${params.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kursus
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Quiz Management</h1>
            <p className="text-muted-foreground mt-1">Kelola quiz dan pertanyaan untuk kursus ini</p>
          </div>
        </div>
        <Button onClick={handleCreateQuiz}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Quiz Baru
        </Button>
      </div>

      {/* Quiz List */}
      {!selectedQuiz ? (
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada quiz. Klik "Buat Quiz Baru" untuk memulai.</p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {quiz.title}
                        {quiz.isActive ? (
                          <Badge variant="default">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Nonaktif</Badge>
                        )}
                      </CardTitle>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedQuiz(quiz)}
                      >
                        <FileQuestion className="h-4 w-4 mr-1" />
                        Kelola Pertanyaan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingQuiz(quiz)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Pertanyaan</div>
                      <div className="font-semibold">{quiz.questions?.length || 0} soal</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Passing Score</div>
                      <div className="font-semibold">{quiz.passingScore}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Batas Waktu</div>
                      <div className="font-semibold">
                        {quiz.timeLimit ? `${quiz.timeLimit} menit` : 'Tidak terbatas'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Attempts</div>
                      <div className="font-semibold">{quiz._count?.attempts || 0} kali</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Question Management View */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pertanyaan Quiz: {selectedQuiz.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedQuiz.questions?.length || 0} pertanyaan
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pertanyaan
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Questions List */}
          {selectedQuiz.questions?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada pertanyaan. Klik "Tambah Pertanyaan" untuk membuat.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {selectedQuiz.questions?.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Soal {index + 1}</Badge>
                          <Badge>{question.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {question.points} poin
                          </span>
                        </div>
                        <p className="font-medium mb-3">{question.question}</p>
                        
                        {question.type === 'MULTIPLE_CHOICE' && question.options && (
                          <div className="space-y-2 ml-4">
                            {question.options.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                {option.isCorrect ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={option.isCorrect ? 'font-semibold text-green-600' : ''}>
                                  {option.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'TRUE_FALSE' && (
                          <div className="ml-4">
                            <span className="font-semibold">Jawaban: {question.correctAnswer}</span>
                          </div>
                        )}

                        {question.explanation && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm">
                              <strong>Penjelasan:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Quiz Dialog */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl mx-4 my-8">
            <CardHeader>
              <CardTitle>{editingQuiz.id ? 'Edit Quiz' : 'Buat Quiz Baru'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Judul Quiz *</Label>
                  <Input
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                    placeholder="Contoh: Quiz Module 1 - Pengenalan"
                  />
                </div>

                <div>
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={editingQuiz.description || ''}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                    rows={3}
                    placeholder="Deskripsi singkat tentang quiz ini..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      value={editingQuiz.passingScore}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, passingScore: parseInt(e.target.value) })}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label>Batas Waktu (menit)</Label>
                    <Input
                      type="number"
                      value={editingQuiz.timeLimit || ''}
                      onChange={(e) => setEditingQuiz({ 
                        ...editingQuiz, 
                        timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="Kosongkan jika tidak terbatas"
                    />
                  </div>
                </div>

                <div>
                  <Label>Maksimal Attempt</Label>
                  <Input
                    type="number"
                    value={editingQuiz.maxAttempts || ''}
                    onChange={(e) => setEditingQuiz({ 
                      ...editingQuiz, 
                      maxAttempts: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="Kosongkan jika tidak terbatas"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shuffleQuestions"
                      checked={editingQuiz.shuffleQuestions}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, shuffleQuestions: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="shuffleQuestions">Acak urutan pertanyaan</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shuffleAnswers"
                      checked={editingQuiz.shuffleAnswers}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, shuffleAnswers: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="shuffleAnswers">Acak urutan jawaban</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showResults"
                      checked={editingQuiz.showResults}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, showResults: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="showResults">Tampilkan hasil langsung setelah selesai</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingQuiz.isActive}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isActive">Quiz aktif (dapat diakses siswa)</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveQuiz}>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Quiz
                  </Button>
                  <Button variant="outline" onClick={() => setEditingQuiz(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-3xl mx-4 my-8">
            <CardHeader>
              <CardTitle>{editingQuestion.id ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Tipe Pertanyaan</Label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(value: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY') => {
                      const updated = { ...editingQuestion, type: value }
                      if (value === 'TRUE_FALSE') {
                        updated.options = undefined
                        updated.correctAnswer = 'TRUE'
                      } else if (value === 'MULTIPLE_CHOICE' && !updated.options) {
                        updated.options = [
                          { id: '1', text: '', isCorrect: false },
                          { id: '2', text: '', isCorrect: false },
                          { id: '3', text: '', isCorrect: false },
                          { id: '4', text: '', isCorrect: false }
                        ]
                      } else if (value === 'ESSAY') {
                        updated.options = undefined
                        updated.correctAnswer = undefined
                      }
                      setEditingQuestion(updated)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda</SelectItem>
                      <SelectItem value="TRUE_FALSE">Benar/Salah</SelectItem>
                      <SelectItem value="ESSAY">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pertanyaan *</Label>
                  <Textarea
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    rows={3}
                    placeholder="Tulis pertanyaan di sini..."
                  />
                </div>

                {editingQuestion.type === 'MULTIPLE_CHOICE' && editingQuestion.options && (
                  <div>
                    <Label>Pilihan Jawaban</Label>
                    <div className="space-y-3 mt-2">
                      {editingQuestion.options.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => {
                              const updated = { ...editingQuestion }
                              if (updated.options) {
                                updated.options[index].isCorrect = e.target.checked
                                setEditingQuestion(updated)
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <Input
                            value={option.text}
                            onChange={(e) => {
                              const updated = { ...editingQuestion }
                              if (updated.options) {
                                updated.options[index].text = e.target.value
                                setEditingQuestion(updated)
                              }
                            }}
                            placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Centang checkbox untuk menandai jawaban yang benar
                    </p>
                  </div>
                )}

                {editingQuestion.type === 'TRUE_FALSE' && (
                  <div>
                    <Label>Jawaban Benar</Label>
                    <Select
                      value={editingQuestion.correctAnswer || 'TRUE'}
                      onValueChange={(value) => setEditingQuestion({ ...editingQuestion, correctAnswer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRUE">Benar</SelectItem>
                        <SelectItem value="FALSE">Salah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editingQuestion.type === 'ESSAY' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Catatan:</strong> Pertanyaan essay akan dinilai secara manual oleh instructor.
                    </p>
                  </div>
                )}

                <div>
                  <Label>Penjelasan (Opsional)</Label>
                  <Textarea
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    rows={2}
                    placeholder="Penjelasan akan ditampilkan setelah siswa menjawab..."
                  />
                </div>

                <div>
                  <Label>Bobot Poin</Label>
                  <Input
                    type="number"
                    value={editingQuestion.points}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveQuestion}>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Pertanyaan
                  </Button>
                  <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
