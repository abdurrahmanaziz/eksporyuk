'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LessonQuizButton from '@/components/quiz/LessonQuizButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, CheckCircle, Circle, Lock, 
  PlayCircle, FileText, MessageSquare, BookOpen, Clock,
  Download, Save, Star, ThumbsUp, MessageCircle, Check, Eye, X, Award
} from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

// Dynamic import for video player (client-side only)
const EnhancedVideoPlayer = dynamic(
  () => import('@/components/learn/EnhancedVideoPlayer'),
  { ssr: false }
)

type LessonFile = {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileSize?: number
  fileType?: string
  order: number
}

type Lesson = {
  id: string
  title: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  isFree: boolean
  isCompleted?: boolean
  files?: LessonFile[]
}

type Module = {
  id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  slug: string
  description: string
  thumbnail?: string
  price: number
  duration?: number
  level?: string
  monetizationType: string
  modules: Module[]
  mentor: {
    id: string
    user: {
      name: string
      email: string
      avatar?: string
    }
  }
}

type CourseNote = {
  id: string
  lessonId: string
  content: string
  timestamp?: number
  createdAt: string
}

type CourseComment = {
  id: string
  lessonId: string
  content: string
  user: {
    name: string
    avatar?: string
  }
  createdAt: string
  replies?: CourseComment[]
}

type CourseReview = {
  id: string
  rating: number
  review: string
  isVerified: boolean
  helpfulCount: number
  user: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
}

type ReviewStats = {
  1: number
  2: number
  3: number
  4: number
  5: number
  total: number
  average: number
}

type CourseDiscussion = {
  id: string
  title: string
  content: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  viewCount: number
  isMarkedSolved: boolean
  solvedBy?: string
  solvedAt?: string
  replies: CourseDiscussionReply[]
  createdAt: string
  updatedAt: string
}

type CourseDiscussionReply = {
  id: string
  content: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  createdAt: string
}

export default function CoursePlayerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const courseSlug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [progress, setProgress] = useState(0)
  const [hasAccess, setHasAccess] = useState(false)
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const [notes, setNotes] = useState<CourseNote[]>([])
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  
  const [comments, setComments] = useState<CourseComment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [userReview, setUserReview] = useState<CourseReview | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  
  const [discussions, setDiscussions] = useState<CourseDiscussion[]>([])
  const [discussionTitle, setDiscussionTitle] = useState('')
  const [discussionContent, setDiscussionContent] = useState('')
  const [postingDiscussion, setPostingDiscussion] = useState(false)
  const [selectedDiscussion, setSelectedDiscussion] = useState<CourseDiscussion | null>(null)
  const [discussionFilter, setDiscussionFilter] = useState<'all' | 'solved' | 'unsolved'>('all')
  
  const [videoProgress, setVideoProgress] = useState(0)
  const [isVideoCompleted, setIsVideoCompleted] = useState(false)
  
  // New state for mobile-first design
  const [mobileTab, setMobileTab] = useState<'kurikulum' | 'materi'>('materi')
  const [materiSubTab, setMateriSubTab] = useState<'deskripsi' | 'files' | 'komentar'>('deskripsi')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [expandedModules, setExpandedModules] = useState<string[]>([]) // Track which modules are expanded
  
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (status === 'loading') {
      return // Wait for session to load
    }
    
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=/learn/${courseSlug}`)
      return
    }
    
    if (status === 'authenticated' && session?.user && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      checkProfileAndFetchCourse()
    }
  }, [status, session, courseSlug])

  const checkProfileAndFetchCourse = async () => {
    try {
      // Admin and Mentor bypass profile check - they can access all courses
      const userRole = session?.user?.role
      console.log('[Learn] Checking access for role:', userRole)
      const isAdminOrMentor = userRole === 'ADMIN' || userRole === 'MENTOR'
      
      if (isAdminOrMentor) {
        console.log('[Learn] Admin/Mentor bypass profile check')
        setProfileComplete(true)
        await fetchCourse()
        return
      }
      
      // Check profile completion for regular users
      const profileRes = await fetch('/api/member/onboarding')
      const profileData = await profileRes.json()
      
      if (profileData.success) {
        setProfileComplete(profileData.data.profileCompleted)
        
        // If profile not complete, redirect to complete-profile
        if (!profileData.data.profileCompleted) {
          toast.error('Silakan lengkapi profil Anda terlebih dahulu')
          router.push('/dashboard/complete-profile')
          return
        }
      }
      
      // Profile complete, fetch course
      await fetchCourse()
    } catch (error) {
      console.error('Error checking profile:', error)
      await fetchCourse()
    }
  }

  useEffect(() => {
    if (!course) return
    
    const lessonId = searchParams?.get('lesson')
    if (lessonId) {
      const lesson = course.modules
        .flatMap(m => m.lessons)
        .find(l => l.id === lessonId)
      if (lesson) {
        const module = course.modules.find(m => 
          m.lessons.some(l => l.id === lessonId)
        )
        setCurrentLesson(lesson)
        setCurrentModule(module || null)
        
        setTimeout(() => {
          fetchLessonNotes(lesson.id)
          fetchLessonComments(lesson.id)
        }, 100)
        return
      }
    }
    
    if (!course.modules || course.modules.length === 0) return
    
    const moduleWithLessons = course.modules.find(m => m.lessons && m.lessons.length > 0)
    if (!moduleWithLessons) return
    
    const firstLesson = moduleWithLessons.lessons[0]
    setCurrentLesson(firstLesson)
    setCurrentModule(moduleWithLessons)
    
    setTimeout(() => {
      fetchLessonNotes(firstLesson.id)
      fetchLessonComments(firstLesson.id)
    }, 100)
  }, [course])

  // Auto-expand current module
  useEffect(() => {
    if (currentModule && !expandedModules.includes(currentModule.id)) {
      setExpandedModules(prev => [...prev, currentModule.id])
    }
  }, [currentModule])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/learn/${courseSlug}`)
      if (res.ok) {
        const data = await res.json()
        
        let processedCourse = data.course
        
        if (data.userProgress) {
          const completedLessons = data.userProgress.completedLessons || []
          processedCourse.modules = processedCourse.modules.map((module: Module) => ({
            ...module,
            lessons: module.lessons.map((lesson: Lesson) => ({
              ...lesson,
              isCompleted: completedLessons.includes(lesson.id)
            }))
          }))
        }
        
        setCourse(processedCourse)
        setHasAccess(data.hasAccess || false)
        setProgress(data.progress || 0)
      } else if (res.status === 401) {
        toast.error('Silakan login terlebih dahulu')
        router.push(`/login?redirect=/learn/${courseSlug}`)
      } else if (res.status === 404) {
        toast.error('Kursus tidak ditemukan')
        setCourse(null)
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Terjadi kesalahan')
        setCourse(null)
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Terjadi kesalahan saat memuat kursus')
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLessonChange = (lesson: Lesson, module: Module) => {
    if (!lesson.isFree && !hasAccess) {
      toast.error('Anda perlu enroll kursus ini untuk mengakses lesson ini')
      return
    }
    
    setCurrentLesson(lesson)
    setCurrentModule(module)
    setVideoProgress(0)
    setIsVideoCompleted(false)
    router.push(`/learn/${courseSlug}?lesson=${lesson.id}`, { scroll: false })
    
    fetchLessonNotes(lesson.id)
    fetchLessonComments(lesson.id)
  }

  const handleMarkComplete = async () => {
    if (!currentLesson || !hasAccess) return
    
    try {
      const res = await fetch(`/api/learn/${courseSlug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          completed: true
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success('Lesson ditandai selesai!')
        
        if (course) {
          const updatedModules = course.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => 
              l.id === currentLesson.id ? { ...l, isCompleted: true } : l
            )
          }))
          setCourse({ ...course, modules: updatedModules })
          
          // Update progress
          if (data.progress !== undefined) {
            setProgress(data.progress)
          }
          
          // Handle training completion redirect for affiliates
          if (data.shouldRedirectToOnboarding && data.trainingCompleted) {
            toast.success(
              '🎉 Selamat! Training affiliate selesai!',
              {
                description: 'Lanjutkan setup akun affiliate Anda.',
                action: {
                  label: 'Lanjutkan Setup',
                  onClick: () => router.push('/affiliate/onboarding')
                },
                duration: 8000
              }
            )
            // Auto redirect after 3 seconds if user doesn't click
            setTimeout(() => {
              router.push('/affiliate/onboarding')
            }, 3000)
            return
          }
          
          // Show certificate notification if course completed
          if (data.completed && data.certificate) {
            toast.success(
              '🎉 Selamat! Anda telah menyelesaikan kursus ini!',
              {
                description: 'Sertifikat telah diterbitkan. Klik untuk melihat.',
                action: {
                  label: 'Lihat Sertifikat',
                  onClick: () => router.push('/dashboard/certificates')
                },
                duration: 10000
              }
            )
            // Show review modal only if user hasn't reviewed yet
            if (!userReview) {
              setTimeout(() => setShowReviewModal(true), 1500)
            }
          }
        }
        
        handleNextLesson()
      } else {
        toast.error('Gagal menyimpan progress')
      }
    } catch (error) {
      console.error('Mark complete error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleNextLesson = () => {
    if (!course || !currentLesson || !currentModule) return
    
    const allLessons = course.modules.flatMap(m => 
      m.lessons.map(l => ({ ...l, moduleId: m.id, module: m }))
    )
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id)
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1]
      handleLessonChange(nextLesson, nextLesson.module)
    } else {
      toast.success('Selamat! Anda telah menyelesaikan seluruh kursus!')
    }
  }

  const handlePreviousLesson = () => {
    if (!course || !currentLesson || !currentModule) return
    
    const allLessons = course.modules.flatMap(m => 
      m.lessons.map(l => ({ ...l, moduleId: m.id, module: m }))
    )
    
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id)
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1]
      handleLessonChange(prevLesson, prevLesson.module)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? [] // Tutup modul jika diklik lagi
        : [moduleId] // Buka modul ini, tutup yang lain
    )
  }

  const calculateModuleProgress = (module: Module): number => {
    if (!module.lessons || module.lessons.length === 0) return 0
    const completedCount = module.lessons.filter(l => l.isCompleted).length
    return Math.round((completedCount / module.lessons.length) * 100)
  }

  const fetchLessonNotes = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseSlug}/notes?lessonId=${lessonId}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Fetch notes error:', error)
    }
  }

  const fetchLessonComments = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseSlug}/comments?lessonId=${lessonId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Fetch comments error:', error)
    }
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !currentLesson) return
    
    try {
      setSavingNote(true)
      const res = await fetch(`/api/courses/${courseSlug}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          content: noteContent
        })
      })
      
      if (res.ok) {
        toast.success('Catatan disimpan')
        setNoteContent('')
        fetchLessonNotes(currentLesson.id)
      } else {
        toast.error('Gagal menyimpan catatan')
      }
    } catch (error) {
      console.error('Save note error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSavingNote(false)
    }
  }

  const handlePostComment = async () => {
    if (!commentContent.trim() || !currentLesson) return
    
    try {
      setPostingComment(true)
      const res = await fetch(`/api/courses/${courseSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          content: commentContent
        })
      })
      
      if (res.ok) {
        toast.success('Komentar terposting')
        setCommentContent('')
        fetchLessonComments(currentLesson.id)
      } else {
        toast.error('Gagal posting komentar')
      }
    } catch (error) {
      console.error('Post comment error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setPostingComment(false)
    }
  }

  const handleReplyComment = async (commentId: string) => {
    if (!replyContent.trim() || !currentLesson) return
    
    try {
      setPostingReply(true)
      const res = await fetch(`/api/courses/${courseSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          content: replyContent,
          parentId: commentId
        })
      })
      
      if (res.ok) {
        toast.success('Reply terposting')
        setReplyContent('')
        setReplyingTo(null)
        fetchLessonComments(currentLesson.id)
      } else {
        toast.error('Gagal posting reply')
      }
    } catch (error) {
      console.error('Post reply error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setPostingReply(false)
    }
  }

  const fetchReviews = async (page = 1) => {
    if (!course) return
    try {
      const res = await fetch(`/api/course-reviews-by-id/${course.id}?page=${page}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setReviewStats(data.stats)
        setReviewPage(page)
        setReviewTotalPages(data.pagination?.totalPages || 1)
        
        // Check if user already reviewed
        const myReview = data.reviews.find((r: CourseReview) => r.user.id === session?.user?.id)
        if (myReview) {
          setUserReview(myReview)
          setReviewRating(myReview.rating)
          setReviewText(myReview.review)
          
          // If user has reviewed and course is complete, mark training as completed for affiliates
          if (progress === 100 && (course.isAffiliateTraining || course.affiliateOnly) && session?.user?.role === 'AFFILIATE') {
            try {
              await fetch('/api/affiliate/training/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: course.id })
              })
            } catch (error) {
              console.error('Error marking training complete:', error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Fetch reviews error:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!course || !reviewText.trim() || reviewText.trim().length < 10) {
      toast.error('Review minimal 10 karakter')
      return
    }
    
    // Check if user already has a review
    if (userReview) {
      toast.error('Anda sudah memberikan review untuk kursus ini')
      setShowReviewModal(false)
      return
    }
    
    try {
      setSubmittingReview(true)
      const res = await fetch(`/api/course-reviews-by-id/${course.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          review: reviewText.trim()
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || 'Review berhasil dikirim')
        setUserReview(data.review)
        fetchReviews(1)
        
        // Check if this is an affiliate training course and mark as completed
        if ((course.isAffiliateTraining || course.affiliateOnly) && session?.user?.role === 'AFFILIATE') {
          try {
            // Update training completion status
            await fetch('/api/affiliate/training/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId: course.id })
            })
          } catch (error) {
            console.error('Error updating training completion:', error)
          }
        }
        
        // Auto redirect after successful review submission
        setTimeout(() => {
          if (session?.user?.role === 'AFFILIATE') {
            router.push('/affiliate/dashboard')
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengirim review')
      }
    } catch (error) {
      console.error('Submit review error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/courses/reviews/${reviewId}/helpful`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(data.helpful ? 'Ditandai membantu' : 'Vote dihapus')
        fetchReviews(reviewPage)
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const fetchDiscussions = async () => {
    if (!courseSlug) return
    try {
      const filterParam = discussionFilter === 'all' ? '' : `&solved=${discussionFilter === 'solved'}`
      const res = await fetch(`/api/courses/${courseSlug}/discussions?${filterParam}`)
      if (res.ok) {
        const data = await res.json()
        setDiscussions(data.discussions || [])
      }
    } catch (error) {
      console.error('Fetch discussions error:', error)
    }
  }

  const handlePostDiscussion = async () => {
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      toast.error('Judul dan isi diskusi harus diisi')
      return
    }
    
    if (discussionTitle.length > 200) {
      toast.error('Judul maksimal 200 karakter')
      return
    }
    
    try {
      setPostingDiscussion(true)
      const res = await fetch(`/api/courses/${courseSlug}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: discussionTitle.trim(),
          content: discussionContent.trim()
        })
      })
      
      if (res.ok) {
        toast.success('Diskusi berhasil dibuat')
        setDiscussionTitle('')
        setDiscussionContent('')
        fetchDiscussions()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal membuat diskusi')
      }
    } catch (error) {
      console.error('Post discussion error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setPostingDiscussion(false)
    }
  }

  const handleSelectDiscussion = async (discussion: CourseDiscussion) => {
    setSelectedDiscussion(discussion)
    
    // Increment view count
    try {
      await fetch(`/api/discussions/${discussion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' })
      })
    } catch (error) {
      console.error('Update view count error:', error)
    }
  }

  const handlePostReply = async () => {
    if (!replyContent.trim() || !selectedDiscussion) return
    
    try {
      setPostingReply(true)
      const res = await fetch(`/api/discussions/${selectedDiscussion.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim()
        })
      })
      
      if (res.ok) {
        toast.success('Reply berhasil diposting')
        setReplyContent('')
        fetchDiscussions()
        
        // Update selected discussion with new reply
        const updatedDiscussions = await fetch(`/api/courses/${courseSlug}/discussions`)
        if (updatedDiscussions.ok) {
          const data = await updatedDiscussions.json()
          const updated = data.discussions.find((d: CourseDiscussion) => d.id === selectedDiscussion.id)
          if (updated) {
            setSelectedDiscussion(updated)
          }
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal posting reply')
      }
    } catch (error) {
      console.error('Post reply error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setPostingReply(false)
    }
  }

  const handleMarkSolved = async (discussionId: string, solved: boolean) => {
    try {
      const res = await fetch(`/api/discussions/${discussionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMarkedSolved: solved })
      })
      
      if (res.ok) {
        toast.success(solved ? 'Diskusi ditandai selesai' : 'Tanda selesai dihapus')
        fetchDiscussions()
        
        if (selectedDiscussion?.id === discussionId) {
          setSelectedDiscussion({ ...selectedDiscussion, isMarkedSolved: solved })
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengupdate diskusi')
      }
    } catch (error) {
      console.error('Mark solved error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!confirm('Yakin ingin menghapus diskusi ini?')) return
    
    try {
      const res = await fetch(`/api/discussions/${discussionId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('Diskusi berhasil dihapus')
        setSelectedDiscussion(null)
        fetchDiscussions()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menghapus diskusi')
      }
    } catch (error) {
      console.error('Delete discussion error:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  useEffect(() => {
    if (activeTab === 'discussions' && courseSlug) {
      fetchDiscussions()
    }
  }, [activeTab, discussionFilter, courseSlug])

  useEffect(() => {
    if (course && activeTab === 'reviews') {
      fetchReviews(1)
    }
  }, [course, activeTab])

  const handleVideoComplete = async () => {
    if (isVideoCompleted) return
    
    setIsVideoCompleted(true)
    toast.success('Video selesai ditonton!')
    
    // Auto-mark as completed
    if (hasAccess) {
      await handleMarkComplete()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat kursus...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Kursus tidak ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Kursus yang Anda cari tidak tersedia.
            </p>
            <Link href="/dashboard">
              <Button>Kembali ke Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentLesson || !currentModule) {
    // Check if course has no modules/lessons
    if (course && (!course.modules || course.modules.length === 0 || course.modules.every(m => !m.lessons || m.lessons.length === 0))) {
      return (
        <div className="container mx-auto py-12 px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
              <p className="text-muted-foreground mb-4">
                Kursus ini belum memiliki materi pembelajaran.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Silakan hubungi admin atau tunggu hingga materi ditambahkan.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/courses">
                  <Button variant="outline">Lihat Kursus Lain</Button>
                </Link>
                <Link href="/dashboard">
                  <Button>Kembali ke Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat lesson...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="min-h-screen bg-background">
      {/* Compact Single-Line Header */}
      <div className="bg-card border-b sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back Button - Styled as Button */}
          <Link href="/courses" className="flex-shrink-0">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          {/* Progress Bar with Percentage Inside - Flex Grow */}
          <div className="flex-1 min-w-0">
            <div className="relative h-9 bg-muted rounded-lg overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
              <div className="relative h-full flex items-center justify-center">
                <span className="text-sm font-semibold text-foreground z-10">
                  {Math.round(progress)}% Selesai
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex-shrink-0">
            {progress >= 100 ? (
              <Button
                size="sm"
                onClick={() => setShowReviewModal(true)}
                className="bg-green-600 hover:bg-green-700 h-9 px-4 text-sm font-medium gap-1.5 whitespace-nowrap"
              >
                <Award className="h-4 w-4" />
                <span>Review</span>
              </Button>
            ) : hasAccess ? (
              <Button 
                size="sm" 
                onClick={handleMarkComplete}
                className="h-9 px-4 text-sm font-medium whitespace-nowrap"
              >
                Selesai
              </Button>
            ) : (
              <Link href={`/courses/${courseSlug}`}>
                <Button size="sm" className="h-9 px-4 text-sm font-medium gap-1.5 whitespace-nowrap">
                  <Lock className="h-4 w-4" />
                  <span>Enroll</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
          {/* Main Content */}
          <div className="flex-1 lg:w-2/3 space-y-0 sm:space-y-4">
            {/* Video Player */}
            <Card className="overflow-hidden rounded-none sm:rounded-lg border-0 sm:border">
              <CardContent className="p-0">
                {currentLesson.videoUrl ? (
                  <div className="relative bg-black">
                    {currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                      <div className="aspect-video">
                        <iframe
                          className="w-full h-full"
                          src={(() => {
                            let url = currentLesson.videoUrl
                            if (url.includes('watch?v=')) {
                              url = url.replace('watch?v=', 'embed/')
                            } else if (url.includes('youtu.be/')) {
                              url = url.replace('youtu.be/', 'youtube.com/embed/')
                            }
                            return url
                          })()}
                          title={currentLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : currentLesson.videoUrl.includes('vimeo.com') ? (
                      <div className="aspect-video">
                        <iframe
                          className="w-full h-full"
                          src={currentLesson.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                          title={currentLesson.title}
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <EnhancedVideoPlayer
                        videoUrl={currentLesson.videoUrl}
                        lessonId={currentLesson.id}
                        courseId={course.id}
                        onProgress={setVideoProgress}
                        onComplete={handleVideoComplete}
                        initialProgress={videoProgress}
                      />
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Video tidak tersedia</p>
                    </div>
                  </div>
                )}
                
                {/* Lesson Info Below Video */}
                <div className="p-4 sm:p-5">
                  <h1 className="text-lg sm:text-xl font-bold mb-2">{currentLesson.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span>{currentModule.title}</span>
                    {currentLesson.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {currentLesson.duration} menit
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile: 2 Tabs Layout (Kurikulum & Materi) */}
            <div className="lg:hidden">
              <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'kurikulum' | 'materi')}>
                <div className="bg-card border-b sticky top-[69px] z-30">
                  <TabsList className="w-full grid grid-cols-2 h-12 rounded-none bg-transparent p-0">
                    <TabsTrigger 
                      value="kurikulum" 
                      className="rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent h-full text-sm font-medium"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Kurikulum
                    </TabsTrigger>
                    <TabsTrigger 
                      value="materi" 
                      className="rounded-none border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent h-full text-sm font-medium"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Materi
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="kurikulum" className="mt-0">
                  <div className="bg-card">
                    <div className="p-4 space-y-2">
                      {course.modules.sort((a, b) => a.order - b.order).map((module, moduleIdx) => {
                        const isExpanded = expandedModules.includes(module.id)
                        const moduleProgress = calculateModuleProgress(module)
                        const completedCount = module.lessons.filter(l => l.isCompleted).length
                        
                        return (
                          <div key={module.id} className="border rounded-lg overflow-hidden">
                            {/* Module Header - Clickable */}
                            <button
                              onClick={() => toggleModule(module.id)}
                              className="w-full p-3 bg-muted/50 hover:bg-muted/70 transition-colors flex items-center justify-between"
                            >
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-sm">
                                  {moduleIdx + 1}. {module.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {completedCount}/{module.lessons.length} lessons
                                  </span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{moduleProgress}% selesai</span>
                                </div>
                              </div>
                              <ChevronDown 
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {/* Module Lessons - Collapsible */}
                            {isExpanded && (
                              <div className="p-2 space-y-1.5">
                                {module.lessons.sort((a, b) => a.order - b.order).map((lesson, lessonIdx) => {
                              const isActive = currentLesson?.id === lesson.id
                              const isLocked = !lesson.isFree && !hasAccess
                              
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => {
                                    if (!isLocked) {
                                      handleLessonChange(lesson, module)
                                      setMobileTab('materi')
                                    }
                                  }}
                                  disabled={isLocked}
                                  className={`w-full text-left p-3 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-3 ${
                                    isActive 
                                      ? 'bg-primary/10 border border-primary' 
                                      : 'hover:bg-muted border border-transparent'
                                  }`}
                                >
                                  <div className="flex-shrink-0">
                                    {lesson.isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : isLocked ? (
                                      <Lock className="h-5 w-5 text-muted-foreground" />
                                    ) : isActive ? (
                                      <PlayCircle className="h-5 w-5 text-primary" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`}>
                                      {lessonIdx + 1}. {lesson.title}
                                    </p>
                                    {lesson.duration && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {lesson.duration} menit
                                      </p>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="materi" className="mt-0">
                  <div className="bg-card">
                    {/* Sub-tabs for Materi - 3 Equal Columns */}
                    <div className="border-b bg-muted/30">
                      <div className="grid grid-cols-3 gap-0">
                        <button
                          onClick={() => setMateriSubTab('deskripsi')}
                          className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                            materiSubTab === 'deskripsi'
                              ? 'border-primary text-primary bg-background'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <FileText className="h-4 w-4 mx-auto mb-1 sm:mb-0 sm:inline sm:mr-1.5" />
                          <span className="block sm:inline">Deskripsi</span>
                        </button>
                        <button
                          onClick={() => setMateriSubTab('files')}
                          className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                            materiSubTab === 'files'
                              ? 'border-primary text-primary bg-background'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <Download className="h-4 w-4 mx-auto mb-1 sm:mb-0 sm:inline sm:mr-1.5" />
                          <span className="block sm:inline">Files</span>
                          {currentLesson.files && currentLesson.files.length > 0 && (
                            <span className="ml-1 text-xs">({currentLesson.files.length})</span>
                          )}
                        </button>
                        <button
                          onClick={() => setMateriSubTab('komentar')}
                          className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                            materiSubTab === 'komentar'
                              ? 'border-primary text-primary bg-background'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <MessageSquare className="h-4 w-4 mx-auto mb-1 sm:mb-0 sm:inline sm:mr-1.5" />
                          <span className="block sm:inline">Komentar</span>
                          {comments.length > 0 && (
                            <span className="ml-1 text-xs">({comments.length})</span>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {materiSubTab === 'deskripsi' && (
                        <div className="space-y-4">
                          <div className="prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>Konten tidak tersedia</p>' }} />
                          </div>
                          
                          <LessonQuizButton lessonId={currentLesson.id} hasAccess={hasAccess} />
                          
                          <Separator className="my-4" />
                          
                          <div className="flex items-center justify-between gap-2">
                            <Button 
                              variant="outline" 
                              onClick={handlePreviousLesson}
                              disabled={!course.modules[0].lessons[0] || currentLesson.id === course.modules[0].lessons[0].id}
                              className="flex-1 text-sm h-10"
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Sebelumnya
                            </Button>
                            <Button 
                              onClick={handleNextLesson} 
                              className="flex-1 text-sm h-10"
                            >
                              Selanjutnya
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {materiSubTab === 'files' && (
                        <div>
                          {currentLesson.files && currentLesson.files.length > 0 ? (
                            <div className="space-y-3">
                              {currentLesson.files.map((file) => (
                                <div 
                                  key={file.id} 
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                                      <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium text-sm truncate">{file.title}</div>
                                      <div className="text-xs text-muted-foreground truncate">{file.fileName}</div>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    asChild
                                    className="gap-1.5 flex-shrink-0 ml-2"
                                  >
                                    <a 
                                      href={file.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      download
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Download</span>
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Belum ada file untuk lesson ini</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {materiSubTab === 'komentar' && (
                        <div className="space-y-4">
                          {hasAccess ? (
                            <>
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Tulis komentar atau pertanyaan..."
                                  value={commentContent}
                                  onChange={(e) => setCommentContent(e.target.value)}
                                  rows={3}
                                  className="text-sm"
                                />
                                <Button 
                                  onClick={handlePostComment} 
                                  disabled={postingComment || !commentContent.trim()}
                                  size="sm"
                                  className="w-full"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  {postingComment ? 'Mengirim...' : 'Kirim Komentar'}
                                </Button>
                              </div>
                              
                              <Separator />
                              
                              {comments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                  <p className="text-sm">Belum ada komentar</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {comments.map(comment => (
                                    <div key={comment.id} className="space-y-3">
                                      <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                          {comment.user.avatar ? (
                                            <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full rounded-full" />
                                          ) : (
                                            <span className="text-xs font-semibold">
                                              {comment.user.name.charAt(0).toUpperCase()}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <p className="font-semibold text-sm">{comment.user.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(comment.createdAt).toLocaleString('id-ID')}
                                            </p>
                                          </div>
                                          <p className="text-sm mb-2">{comment.content}</p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                            className="h-7 px-2 text-xs"
                                          >
                                            <MessageSquare className="h-3 w-3 mr-1" />
                                            Balas
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Display Existing Replies */}
                                      {comment.replies && comment.replies.length > 0 && (
                                        <div className="ml-12 space-y-3 border-l-2 border-muted pl-4">
                                          {comment.replies.map(reply => (
                                            <div key={reply.id} className="flex gap-2">
                                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                {reply.user.avatar ? (
                                                  <img src={reply.user.avatar} alt={reply.user.name} className="w-full h-full rounded-full" />
                                                ) : (
                                                  <span className="text-xs font-semibold">
                                                    {reply.user.name.charAt(0).toUpperCase()}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                  <p className="font-semibold text-xs">{reply.user.name}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {new Date(reply.createdAt).toLocaleString('id-ID')}
                                                  </p>
                                                </div>
                                                <p className="text-sm">{reply.content}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Reply Form */}
                                      {replyingTo === comment.id && (
                                        <div className="ml-12 space-y-2">
                                          <Textarea
                                            placeholder="Tulis balasan..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                          />
                                          <div className="flex gap-2">
                                            <Button 
                                              onClick={() => handleReplyComment(comment.id)} 
                                              disabled={postingReply || !replyContent.trim()}
                                              size="sm"
                                            >
                                              {postingReply ? 'Mengirim...' : 'Kirim Balasan'}
                                            </Button>
                                            <Button 
                                              variant="ghost"
                                              onClick={() => {
                                                setReplyingTo(null)
                                                setReplyContent('')
                                              }}
                                              size="sm"
                                            >
                                              Batal
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Enroll kursus untuk berkomentar</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop: Traditional Tabs */}
            <Card className="hidden lg:block">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-3">
                  <TabsList className="w-full grid grid-cols-4 h-auto p-1">
                    <TabsTrigger value="overview" className="flex items-center gap-2 py-2.5">
                      <BookOpen className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-2 py-2.5">
                      <FileText className="h-4 w-4" />
                      Files
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="flex items-center gap-2 py-2.5">
                      <MessageSquare className="h-4 w-4" />
                      Komentar ({comments.length})
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2 py-2.5">
                      <Star className="h-4 w-4" />
                      Reviews ({reviewStats?.total || 0})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="px-6">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>Konten tidak tersedia</p>' }} />
                    </div>
                    
                    <LessonQuizButton lessonId={currentLesson.id} hasAccess={hasAccess} />
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between pt-4 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handlePreviousLesson}
                        disabled={!course.modules[0].lessons[0] || currentLesson.id === course.modules[0].lessons[0].id}
                        className="flex-1 sm:flex-none"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Sebelumnya
                      </Button>
                      <Button onClick={handleNextLesson} className="flex-1 sm:flex-none">
                        Selanjutnya
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="mt-0">
                    {currentLesson.files && currentLesson.files.length > 0 ? (
                      <div className="space-y-3">
                        {currentLesson.files.map((file) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{file.title}</div>
                                <div className="text-sm text-muted-foreground">{file.fileName}</div>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              asChild
                              className="gap-2"
                            >
                              <a 
                                href={file.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Belum ada file untuk lesson ini</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-4 mt-0">
                    {hasAccess ? (
                      <>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Tulis komentar atau pertanyaan..."
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            rows={3}
                          />
                          <Button 
                            onClick={handlePostComment} 
                            disabled={postingComment || !commentContent.trim()}
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {postingComment ? 'Mengirim...' : 'Kirim Komentar'}
                          </Button>
                        </div>
                        
                        <Separator />
                        
                        {comments.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Belum ada komentar</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {comments.map(comment => (
                              <div key={comment.id} className="space-y-3">
                                <div className="flex gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {comment.user.avatar ? (
                                      <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full rounded-full" />
                                    ) : (
                                      <span className="text-sm font-semibold">
                                        {comment.user.name.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-sm">{comment.user.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(comment.createdAt).toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                    <p className="text-sm mb-2">{comment.content}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Balas
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Display Existing Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-14 space-y-3 border-l-2 border-muted pl-4">
                                    {comment.replies.map(reply => (
                                      <div key={reply.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                          {reply.user.avatar ? (
                                            <img src={reply.user.avatar} alt={reply.user.name} className="w-full h-full rounded-full" />
                                          ) : (
                                            <span className="text-xs font-semibold">
                                              {reply.user.name.charAt(0).toUpperCase()}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-sm">{reply.user.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(reply.createdAt).toLocaleString('id-ID')}
                                            </p>
                                          </div>
                                          <p className="text-sm">{reply.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Reply Form */}
                                {replyingTo === comment.id && (
                                  <div className="ml-14 space-y-2">
                                    <Textarea
                                      placeholder="Tulis balasan..."
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      rows={2}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={() => handleReplyComment(comment.id)} 
                                        disabled={postingReply || !replyContent.trim()}
                                        size="sm"
                                      >
                                        {postingReply ? 'Mengirim...' : 'Kirim Balasan'}
                                      </Button>
                                      <Button 
                                        variant="ghost"
                                        onClick={() => {
                                          setReplyingTo(null)
                                          setReplyContent('')
                                        }}
                                        size="sm"
                                      >
                                        Batal
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Enroll kursus untuk berkomentar</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-4 mt-0">
                    {reviewStats && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3 sm:flex-col sm:text-center sm:min-w-[100px]">
                            <div className="text-3xl sm:text-4xl font-bold">{reviewStats.average.toFixed(1)}</div>
                            <div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= Math.round(reviewStats.average)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{reviewStats.total} reviews</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-1.5">
                            {[5, 4, 3, 2, 1].map((star) => (
                              <div key={star} className="flex items-center gap-2">
                                <span className="text-xs w-4 text-muted-foreground">{star}</span>
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-400 rounded-full transition-all"
                                    style={{ width: `${reviewStats.total > 0 ? (reviewStats[star as keyof ReviewStats] as number / reviewStats.total) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-6 text-right">
                                  {reviewStats[star as keyof ReviewStats]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {reviews.length > 0 && hasAccess && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          {reviews.map(review => (
                            <Card key={review.id}>
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {review.user.avatar ? (
                                      <img src={review.user.avatar} alt={review.user.name} className="w-full h-full rounded-full" />
                                    ) : (
                                      <span className="text-sm font-semibold">
                                        {review.user.name.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-sm">{review.user.name}</p>
                                      {review.isVerified && (
                                        <Badge variant="secondary" className="text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-4 w-4 ${
                                              star <= review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString('id-ID')}
                                      </span>
                                    </div>
                                    <p className="text-sm mb-3">{review.review}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleHelpfulVote(review.id)}
                                      className="gap-2"
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                      Helpful ({review.helpfulCount})
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {reviewTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchReviews(reviewPage - 1)}
                              disabled={reviewPage <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {reviewPage} of {reviewTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchReviews(reviewPage + 1)}
                              disabled={reviewPage >= reviewTotalPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {reviews.length === 0 && hasAccess && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Belum ada review untuk kursus ini</p>
                      </div>
                    )}
                    
                    {!hasAccess && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Enroll kursus untuk melihat reviews</p>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Desktop/Tablet Sidebar - Fixed Kurikulum */}
          <div className="hidden lg:block lg:w-1/3 flex-shrink-0">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Kurikulum Kursus</CardTitle>
                <Progress value={progress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(progress)}% Selesai
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {course.modules.sort((a, b) => a.order - b.order).map((module, moduleIdx) => {
                    const isExpanded = expandedModules.includes(module.id)
                    const moduleProgress = calculateModuleProgress(module)
                    const completedCount = module.lessons.filter(l => l.isCompleted).length
                    
                    return (
                      <div key={module.id} className="border-b last:border-b-0">
                        {/* Module Header - Clickable */}
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full p-4 bg-muted/50 hover:bg-muted/70 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-sm">
                              {moduleIdx + 1}. {module.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{completedCount}/{module.lessons.length} lessons</span>
                              <span>•</span>
                              <span>{moduleProgress}% selesai</span>
                            </div>
                          </div>
                          <ChevronDown 
                            className={`h-5 w-5 text-muted-foreground transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Module Lessons - Collapsible */}
                        {isExpanded && (
                          <div>
                            {module.lessons.sort((a, b) => a.order - b.order).map((lesson, lessonIdx) => {
                          const isActive = currentLesson?.id === lesson.id
                          const isLocked = !lesson.isFree && !hasAccess
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => !isLocked && handleLessonChange(lesson, module)}
                              disabled={isLocked}
                              className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                isActive ? 'bg-accent' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {lesson.isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : isLocked ? (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  ) : isActive ? (
                                    <PlayCircle className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                                    {lessonIdx + 1}. {lesson.title}
                                  </p>
                                  {lesson.duration && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {lesson.duration} menit
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
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
      </div>
      
      {/* Review Modal - Shows only if user hasn't reviewed yet */}
      <Dialog open={showReviewModal && !userReview} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-lg mx-4 sm:mx-6 md:mx-8 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-full">
          <DialogHeader className="text-center space-y-6 px-6 sm:px-8 md:px-10 pt-6 sm:pt-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Award className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              🎉 Selamat! Kursus Selesai
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 px-2 sm:px-4">
              Anda telah menyelesaikan kursus ini dengan sempurna! 
              Bagikan pengalaman belajar Anda untuk membantu teman-teman lain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-6 sm:py-8 px-6 sm:px-8 md:px-10">
            {!userReview ? (
              <>
                <div className="text-center">
                  <label className="text-base sm:text-lg font-semibold text-gray-800 mb-4 block">
                    Berikan Rating Anda
                  </label>
                  <div className="flex gap-1 sm:gap-2 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-full p-1"
                      >
                        <Star
                          className={`h-10 w-10 sm:h-12 sm:w-12 ${
                            star <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {reviewRating === 5 ? 'Luar biasa!' : 
                     reviewRating === 4 ? 'Sangat bagus!' : 
                     reviewRating === 3 ? 'Bagus!' : 
                     reviewRating === 2 ? 'Cukup baik' : 'Perlu diperbaiki'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-base sm:text-lg font-semibold text-gray-800 block">
                    Ceritakan Pengalaman Anda
                  </label>
                  <Textarea
                    placeholder="Apa yang paling Anda sukai dari kursus ini? Bagaimana kursus ini membantu Anda? (minimal 10 karakter)"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="resize-none border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-500">
                    {reviewText.trim().length}/10 karakter minimum
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button 
                    onClick={handleSubmitReview} 
                    disabled={submittingReview || reviewText.trim().length < 10}
                    className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {submittingReview ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Kirim Review
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-medium rounded-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    Nanti Saja
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-10">
                <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-8">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-4">
                  Review Berhasil Dikirim! 🎉
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-8 px-2 sm:px-4">
                  Terima kasih atas feedback berharga Anda! Review Anda akan membantu teman-teman lain.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => {
                      setShowReviewModal(false)
                      // Check if user is affiliate and redirect to dashboard
                      if (session?.user?.role === 'AFFILIATE') {
                        router.push('/affiliate/dashboard')
                      } else {
                        router.push('/dashboard')
                      }
                    }}
                    className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  >
                    Lanjutkan ke Dashboard
                  </Button>
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full sm:flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-700 font-medium rounded-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    <Link href="/dashboard/certificates">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Lihat Sertifikat
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
