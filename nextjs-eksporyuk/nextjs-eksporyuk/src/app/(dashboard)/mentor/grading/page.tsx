'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react'

interface Submission {
  id: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  status: 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE'
  score: number | null
  feedback: string | null
  submittedAt: string
  gradedAt: string | null
  user: {
    id: string
    name: string
    email: string
  }
  assignment: {
    id: string
    title: string
    maxScore: number
    course: {
      id: string
      title: string
    }
  }
}

export default function MentorGradingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending')
  const [loading, setLoading] = useState(true)
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/api/auth/signin')
      return
    }
    fetchSubmissions()
  }, [session, status, router])

  const fetchSubmissions = async () => {
    try {
      const coursesRes = await fetch('/api/courses?mentorId=me')
      if (!coursesRes.ok) throw new Error('Failed to load courses')
      const coursesData = await coursesRes.json()

      const allSubmissions: Submission[] = []
      for (const course of coursesData.courses || []) {
        const assignmentsRes = await fetch(`/api/assignments?courseId=${course.id}`)
        if (!assignmentsRes.ok) continue
        const assignmentsData = await assignmentsRes.json()

        for (const assignment of assignmentsData.assignments || []) {
          const submissionsRes = await fetch(`/api/assignments/${assignment.id}/submissions`)
          if (submissionsRes.ok) {
            const submissionsData = await submissionsRes.json()
            allSubmissions.push(...(submissionsData.submissions || []).map((s: any) => ({
              ...s,
              assignment: {
                ...assignment,
                course: { id: course.id, title: course.title }
              }
            })))
          }
        }
      }

      setSubmissions(allSubmissions.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ))
    } catch (err) {
      console.error('Error fetching submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingSubmission) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/assignments/${gradingSubmission.assignment.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: gradingSubmission.id,
          score: parseInt(score),
          feedback,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to grade submission')
      }

      await fetchSubmissions()
      setGradingSubmission(null)
      setScore('')
      setFeedback('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending') return s.status === 'SUBMITTED' || s.status === 'LATE'
    if (filter === 'graded') return s.status === 'GRADED'
    return true
  })

  const pendingCount = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE').length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Penilaian Tugas</h1>
          <p className="text-gray-600 mt-1">Review dan beri nilai untuk tugas siswa</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium border-b-2 -mb-px ${
              filter === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Menunggu Penilaian {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setFilter('graded')}
            className={`px-4 py-2 font-medium border-b-2 -mb-px ${
              filter === 'graded'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Sudah Dinilai
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium border-b-2 -mb-px ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua
          </button>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Submission
              </h3>
              <p className="text-gray-600">
                Belum ada tugas yang dikumpulkan untuk dinilai
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {submission.assignment.title}
                        </h3>
                        <Badge className={
                          submission.status === 'GRADED'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'LATE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {submission.status === 'GRADED' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sudah Dinilai
                            </>
                          ) : submission.status === 'LATE' ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Terlambat
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Menunggu
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Kursus: {submission.assignment.course.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Siswa: {submission.user.name} ({submission.user.email})
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Dikumpulkan: {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    {submission.status !== 'GRADED' && (
                      <Button
                        onClick={() => {
                          setGradingSubmission(submission)
                          setScore('')
                          setFeedback('')
                        }}
                      >
                        Beri Nilai
                      </Button>
                    )}
                  </div>

                  {/* Submission Content */}
                  <div className="border-t pt-4">
                    {submission.content && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Jawaban:</h4>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                          {submission.content}
                        </div>
                      </div>
                    )}
                    {submission.fileUrl && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">File:</h4>
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-5 h-5" />
                          {submission.fileName || 'Download File'}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Graded Info */}
                  {submission.status === 'GRADED' && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">Nilai:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {submission.score} / {submission.assignment.maxScore}
                        </span>
                      </div>
                      {submission.feedback && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Feedback:</h4>
                          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                            {submission.feedback}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Dinilai pada: {formatDate(submission.gradedAt!)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Beri Nilai Tugas</CardTitle>
                <p className="text-gray-600 mt-1">{gradingSubmission.assignment.title}</p>
                <p className="text-sm text-gray-500">Siswa: {gradingSubmission.user.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGradingSubmission(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrade} className="space-y-6">
                {/* Show submission */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Jawaban Siswa:</h3>
                  {gradingSubmission.content && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {gradingSubmission.content}
                    </div>
                  )}
                  {gradingSubmission.fileUrl && (
                    <a
                      href={gradingSubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
                    >
                      <Download className="w-5 h-5" />
                      {gradingSubmission.fileName || 'Download File'}
                    </a>
                  )}
                </div>

                <div>
                  <Label htmlFor="score">
                    Nilai (Max: {gradingSubmission.assignment.maxScore})
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="0"
                    max={gradingSubmission.assignment.maxScore}
                    required
                    className="mt-1"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback (Opsional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                    className="mt-1"
                    placeholder="Berikan feedback untuk siswa..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={submitting || !score}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Nilai'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGradingSubmission(null)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </ResponsivePageWrapper>
  )
}
