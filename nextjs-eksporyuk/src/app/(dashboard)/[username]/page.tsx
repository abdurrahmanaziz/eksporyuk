'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  Heart,
  Shield,
  Crown,
  Star,
  UserCheck,
  Clock,
  Settings,
  Camera,
  Loader2,
  UserPlus,
  UserMinus,
  ExternalLink,
  MoreVertical,
  Edit3,
  Trash2,
  MessageSquareOff,
  Pin,
  Flag,
  ArrowLeft,
  Lock,
  Unlock,
  Bookmark,
  BookmarkCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ReactionButton, { ReactionType } from '@/components/ui/ReactionButton'
import CommentSection from '@/components/ui/CommentSection'
import SidebarBanner from '@/components/banners/SidebarBanner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface UserProfile {
  id: string
  name: string
  username: string
  avatar: string | null
  coverImage: string | null
  bio: string | null
  role: string
  province: string | null
  city: string | null
  district: string | null
  locationVerified: boolean
  isOnline: boolean
  lastSeenAt: string | null
  createdAt: string
  isFounder: boolean
  isCoFounder: boolean
  isOwnProfile: boolean
  isFollowing: boolean
  _count: {
    posts: number
    groupMemberships: number
    followers: number
    following: number
    courseEnrollments: number
  }
  supplierProfile?: {
    companyName: string
    logo: string | null
    businessCategory: string | null
    _count: {
      products: number
    }
  }
  affiliateProfile?: {
    affiliateCode: string
    tier: number
    totalEarnings: number
    totalConversions: number
  }
  mentorProfile?: {
    expertise: string | null
    bio: string | null
    rating: number
    totalStudents: number
    totalCourses: number
  }
  posts: Array<{
    id: string
    content: string
    createdAt: string
    type: string
    images?: string[]
    _count: {
      likes: number
      comments: number
    }
    author: {
      id: string
      name: string
      avatar: string | null
      username: string
    }
    group: {
      id: string
      name: string
      slug: string
      avatar: string | null
    } | null
  }>
  groupMemberships: Array<{
    role: string
    joinedAt: string
    group: {
      id: string
      name: string
      slug: string
      avatar: string | null
      type: string
      _count: {
        members: number
      }
    }
  }>
}

interface ProfileResponse {
  user: UserProfile
  posts: any[]
  roleData?: {
    products?: any[]
    courses?: any[]
    topLinks?: any[]
    enrolledCourses?: any[]
    upcomingEvents?: any[]
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  
  // Reserved routes that should not be treated as usernames
  const RESERVED_ROUTES = [
    'admin', 'affiliate', 'become-supplier', 'certificates', 'chat',
    'community', 'courses', 'dashboard', 'databases', 'demo', 'documents',
    'features', 'learn', 'member-directory', 'membership', 'membership-documents',
    'mentor', 'my-courses', 'my-dashboard', 'notifications', 'pricing',
    'profile', 'quiz', 'saved-posts', 'supplier', 'wallet', 'api', '_next',
    'static', 'public'
  ]

  // Check if the username is a reserved route
  useEffect(() => {
    if (params.username && RESERVED_ROUTES.includes(params.username as string)) {
      // This is a reserved route, let Next.js handle it normally by doing nothing
      return
    }
  }, [params.username])
  const { data: session } = useSession()
  const username = params?.username as string

  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [following, setFollowing] = useState(false)
  const [submittingPost, setSubmittingPost] = useState(false)

  // Post actions state
  const [editingPost, setEditingPost] = useState<any>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [reportingPost, setReportingPost] = useState<any>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Reaction & Comment state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [postComments, setPostComments] = useState<Record<string, any[]>>({})
  const [postReactions, setPostReactions] = useState<Record<string, any>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const [savingPost, setSavingPost] = useState<Record<string, boolean>>({})
  
  // State for scroll to comment from notification
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const [scrollToCommentId, setScrollToCommentId] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      fetchProfile()
    }
  }, [username])
  
  // Handle scroll to comment from notification redirect
  useEffect(() => {
    if (!loading && profile) {
      const highlightPost = sessionStorage.getItem('highlightPost')
      const scrollToComment = sessionStorage.getItem('scrollToComment')
      
      if (highlightPost) {
        setHighlightedPostId(highlightPost)
        sessionStorage.removeItem('highlightPost')
        
        // Auto-expand comments for the highlighted post
        setExpandedComments(prev => ({ ...prev, [highlightPost]: true }))
        
        // Fetch comments for the highlighted post
        fetchComments(highlightPost)
        
        // Scroll to the post after a short delay
        setTimeout(() => {
          const postElement = document.getElementById(`post-${highlightPost}`)
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            postElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
            setTimeout(() => {
              postElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
            }, 3000)
          }
        }, 500)
      }
      
      if (scrollToComment) {
        setScrollToCommentId(scrollToComment)
        sessionStorage.removeItem('scrollToComment')
        
        // Scroll to comment after comments are loaded
        setTimeout(() => {
          const commentElement = document.getElementById(`comment-${scrollToComment}`)
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            commentElement.classList.add('bg-yellow-50', 'ring-2', 'ring-yellow-400')
            setTimeout(() => {
              commentElement.classList.remove('bg-yellow-50', 'ring-2', 'ring-yellow-400')
            }, 3000)
          }
        }, 1500) // Longer delay to ensure comments are loaded
      }
    }
  }, [loading, profile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/${username}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Profil tidak ditemukan')
        } else {
          setError('Gagal memuat profil')
        }
        return
      }

      const data = await response.json()
      setProfile(data)
      setFollowing(data.user.isFollowing)
      
      // Fetch reactions for all posts
      if (data.posts && data.posts.length > 0) {
        await fetchAllReactions(data.posts.map((p: any) => p.id))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Terjadi kesalahan saat memuat profil')
    } finally {
      setLoading(false)
    }
  }

  // Fetch reactions for multiple posts
  const fetchAllReactions = async (postIds: string[]) => {
    try {
      const reactions: Record<string, any> = {}
      
      await Promise.all(
        postIds.map(async (postId) => {
          try {
            const response = await fetch(`/api/posts/${postId}/reactions`)
            if (response.ok) {
              const data = await response.json()
              reactions[postId] = {
                counts: data.counts || data.reactionsCount || {},
                currentReaction: data.currentReaction || null,
              }
            }
          } catch (err) {
            console.error(`Error fetching reactions for post ${postId}:`, err)
          }
        })
      )
      
      setPostReactions(reactions)
    } catch (error) {
      console.error('Error fetching all reactions:', error)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    const formData = new FormData()
    formData.append('cover', file)

    try {
      const response = await fetch('/api/user/cover', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Cover photo berhasil diupload')
        fetchProfile()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal upload cover photo')
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      toast.error('Gagal upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleFollow = async () => {
    if (!profile?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${profile.user.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        setFollowing(data.isFollowing)
        toast.success(data.isFollowing ? 'Berhasil mengikuti' : 'Berhenti mengikuti')
        fetchProfile()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal mengikuti user')
      }
    } catch (error) {
      console.error('Error following user:', error)
      toast.error('Gagal mengikuti user')
    }
  }

  const handleMessage = async () => {
    if (!profile?.user?.id) return
    
    console.log('[handleMessage] Starting chat with user:', profile.user.id)
    
    try {
      // Start or get existing chat room
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: profile.user.id }),
      })

      console.log('[handleMessage] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[handleMessage] Room created:', data.room)
        // Navigate to chat with the room
        router.push(`/chat?room=${data.room.id}`)
      } else {
        const error = await response.json()
        console.error('[handleMessage] Error response:', error)
        if (error.code === 'SUPPLIER_CHAT_DISABLED') {
          toast.error('User ini tidak menerima pesan langsung')
        } else {
          toast.error(error.error || 'Gagal memulai percakapan')
        }
      }
    } catch (error) {
      console.error('[handleMessage] Exception:', error)
      toast.error('Gagal memulai percakapan')
    }
  }

  const handlePostSubmit = async (postData: any) => {
    if (!postData.text && (!postData.images || postData.images.length === 0)) {
      toast.error('Postingan tidak boleh kosong')
      return false
    }

    if (!profile?.user.id) return false

    try {
      setSubmittingPost(true)
      const formData = new FormData()
      formData.append('content', postData.text)
      formData.append('type', 'POST')
      formData.append('userId', profile.user.id)

      // Handle images - convert base64 to files if needed
      if (postData.images && postData.images.length > 0) {
        for (const image of postData.images) {
          if (typeof image === 'string' && image.startsWith('data:')) {
            // Base64 image
            const blob = await fetch(image).then(r => r.blob())
            formData.append('images', blob, `image-${Date.now()}.jpg`)
          } else if (image instanceof File) {
            formData.append('images', image)
          }
        }
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success('Postingan berhasil dibuat!')
        fetchProfile() // Reload posts
        return true
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal membuat postingan')
        return false
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Gagal membuat postingan')
      return false
    } finally {
      setSubmittingPost(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800', icon: Shield },
      MENTOR: { label: 'Mentor', color: 'bg-purple-100 text-purple-800', icon: Star },
      AFFILIATE: { label: 'Affiliate', color: 'bg-green-100 text-green-800', icon: ExternalLink },
      MEMBER_PREMIUM: { label: 'Premium', color: 'bg-blue-100 text-blue-800', icon: Crown },
      MEMBER_FREE: { label: 'Member', color: 'bg-gray-100 text-gray-800', icon: Users },
    }
    return badges[role as keyof typeof badges] || badges.MEMBER_FREE
  }

  // Post Actions Functions
  const handleEditPost = (post: any) => {
    setEditingPost(post)
    setEditContent(post.content)
  }

  const handleUpdatePost = async (postData: any) => {
    if (!postData.text && (!postData.images || postData.images.length === 0)) {
      toast.error('Konten tidak boleh kosong')
      return false
    }

    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('content', postData.text || editingPost.content)

      // Handle images - convert base64 to files if needed
      if (postData.images && postData.images.length > 0) {
        for (const image of postData.images) {
          if (typeof image === 'string' && image.startsWith('data:')) {
            // Base64 image
            const blob = await fetch(image).then(r => r.blob())
            formData.append('images', blob, `image-${Date.now()}.jpg`)
          } else if (image instanceof File) {
            formData.append('images', image)
          }
        }
      } else {
        // Keep existing images if no new ones
        formData.append('images', JSON.stringify(editingPost.images || []))
      }

      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PATCH',
        body: formData,
      })

      if (response.ok) {
        toast.success('Postingan berhasil diupdate')
        setEditingPost(null)
        setEditContent('')
        fetchProfile()
        return true
      } else {
        toast.error('Gagal mengupdate postingan')
        return false
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Yakin ingin menghapus postingan ini?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Postingan berhasil dihapus')
        setDeletingPostId(null)
        fetchProfile()
      } else {
        toast.error('Gagal menghapus postingan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleComments = async (postId: string, currentStatus: boolean) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/toggle-comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentsEnabled: !currentStatus }),
      })

      if (response.ok) {
        toast.success(currentStatus ? 'Komentar dinonaktifkan' : 'Komentar diaktifkan')
        fetchProfile() // Refresh to update UI
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal mengubah status komentar')
      }
    } catch (error) {
      console.error('Error toggling comments:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePinPost = async (postId: string, currentStatus: boolean) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'PATCH',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || (currentStatus ? 'Postingan di-unpin' : 'Postingan di-pin'))
        fetchProfile() // Refresh to get updated post list with new order
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal mengubah status pin')
      }
    } catch (error) {
      console.error('Error pinning post:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReportPost = async () => {
    if (!reportReason) {
      toast.error('Pilih alasan report')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'POST',
          postId: reportingPost.id,
          reason: reportReason,
          description: reportDescription,
        }),
      })

      if (response.ok) {
        toast.success('Laporan berhasil dikirim ke admin')
        setReportingPost(null)
        setReportReason('')
        setReportDescription('')
      } else {
        toast.error('Gagal mengirim laporan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  // Reaction handlers
  const handleReact = async (postId: string, reactionType: ReactionType) => {
    // Optimistic update
    const previousReaction = postReactions[postId]
    setPostReactions(prev => ({
      ...prev,
      [postId]: {
        counts: {
          ...prev[postId]?.counts,
          [reactionType]: (prev[postId]?.counts?.[reactionType] || 0) + 1,
        },
        currentReaction: reactionType,
      }
    }))

    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update with actual server data
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            counts: data.reactionsCount || data.counts || {},
            currentReaction: data.reaction?.type || reactionType,
          }
        }))
      } else {
        // Rollback on error
        setPostReactions(prev => ({
          ...prev,
          [postId]: previousReaction || { counts: {}, currentReaction: null }
        }))
        toast.error('Gagal menambahkan reaksi')
      }
    } catch (error) {
      console.error('Error reacting:', error)
      // Rollback on error
      setPostReactions(prev => ({
        ...prev,
        [postId]: previousReaction || { counts: {}, currentReaction: null }
      }))
      toast.error('Gagal menambahkan reaksi')
    }
  }

  const handleRemoveReact = async (postId: string) => {
    // Optimistic update
    const previousReaction = postReactions[postId]
    const currentType = previousReaction?.currentReaction
    
    if (currentType) {
      setPostReactions(prev => ({
        ...prev,
        [postId]: {
          counts: {
            ...prev[postId]?.counts,
            [currentType]: Math.max((prev[postId]?.counts?.[currentType] || 1) - 1, 0),
          },
          currentReaction: null,
        }
      }))
    }

    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        // Update with actual server data
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            counts: data.reactionsCount || data.counts || {},
            currentReaction: null,
          }
        }))
      } else {
        // Rollback on error
        setPostReactions(prev => ({
          ...prev,
          [postId]: previousReaction || { counts: {}, currentReaction: null }
        }))
        toast.error('Gagal menghapus reaksi')
      }
    } catch (error) {
      console.error('Error removing reaction:', error)
      // Rollback on error
      setPostReactions(prev => ({
        ...prev,
        [postId]: previousReaction || { counts: {}, currentReaction: null }
      }))
      toast.error('Gagal menghapus reaksi')
    }
  }

  // Fetch comments for a specific post (used by notification redirect)
  const fetchComments = async (postId: string) => {
    if (postComments[postId]) return // Already loaded
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setPostComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  // Comment handlers
  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments[postId]
    
    if (!isExpanded && !postComments[postId]) {
      // Load comments
      setLoadingComments(prev => ({ ...prev, [postId]: true }))
      try {
        const response = await fetch(`/api/posts/${postId}/comments`)
        if (response.ok) {
          const data = await response.json()
          setPostComments(prev => ({ ...prev, [postId]: data.comments || [] }))
        }
      } catch (error) {
        console.error('Error loading comments:', error)
        toast.error('Gagal memuat komentar')
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }))
      }
    }
    
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }))
  }

  const refreshComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setPostComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Error refreshing comments:', error)
    }
  }

  // Save/Bookmark handlers
  const handleSavePost = async (postId: string) => {
    if (savingPost[postId]) return

    const wasSaved = savedPosts[postId]
    
    // Optimistic update
    setSavedPosts(prev => ({ ...prev, [postId]: !wasSaved }))
    setSavingPost(prev => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setSavedPosts(prev => ({ ...prev, [postId]: data.isSaved }))
        toast.success(data.isSaved ? 'Postingan disimpan' : 'Postingan dihapus dari simpanan')
      } else {
        // Rollback on error
        setSavedPosts(prev => ({ ...prev, [postId]: wasSaved }))
        toast.error('Gagal menyimpan postingan')
      }
    } catch (error) {
      // Rollback on error
      setSavedPosts(prev => ({ ...prev, [postId]: wasSaved }))
      toast.error('Gagal menyimpan postingan')
    } finally {
      setSavingPost(prev => ({ ...prev, [postId]: false }))
    }
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: idLocale })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lalu`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} hari lalu`
    
    return formatDate(date)
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (error || !profile) {
    return (
      <ResponsivePageWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Users className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">{error || 'Profil tidak ditemukan'}</h2>
          <p className="text-muted-foreground mb-4">Username yang Anda cari tidak tersedia</p>
          <Button onClick={() => router.push('/member-directory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Region
          </Button>
        </div>
      </ResponsivePageWrapper>
    )
  }

  const roleBadge = getRoleBadge(profile.user?.role || 'MEMBER_FREE')
  const RoleIcon = roleBadge.icon
  const isOwnProfile = profile.user.isOwnProfile || false
  const user = profile.user
  const posts = profile.posts || []
  const roleData = profile.roleData

  return (
    <ResponsivePageWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-blue-500 dark:bg-blue-600 overflow-hidden">
        {user?.coverImage && (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        )}
        
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Upload Cover Button (only for own profile) */}
        {isOwnProfile && (
          <label className="absolute top-6 right-6 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg">
            <div className="flex items-center gap-2">
              {uploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <Camera className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.coverImage ? 'Ganti Cover' : 'Upload Cover'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Profile Header Card */}
        <div className="-mt-20 md:-mt-24 relative z-10">
          <Card className="border-0 shadow-xl rounded-2xl overflow-visible bg-white dark:bg-gray-800">
            <CardContent className="p-0">
              <div className="relative px-6 md:px-8 pt-8 pb-6">
                {/* Avatar & Name Section */}
                <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
                  {/* Avatar */}
                  <div className="relative -mt-20 md:-mt-24">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-white dark:ring-gray-800 shadow-xl bg-white dark:bg-gray-800">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                      <AvatarFallback className="text-4xl bg-blue-500 text-white">
                        {user?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user?.isOnline && (
                      <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 rounded-full ring-4 ring-white dark:ring-gray-800" />
                    )}
                  </div>

                  {/* Name & Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                          {user?.name}
                        </h1>
                        {user?.isFounder && (
                          <Badge className="bg-yellow-500 text-white border-0 shadow-md">
                            <Crown className="h-3 w-3 mr-1" />
                            Founder
                          </Badge>
                        )}
                        {user?.isCoFounder && (
                          <Badge className="bg-blue-500 text-white border-0 shadow-md">
                            <Star className="h-3 w-3 mr-1" />
                            Co-Founder
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="font-medium">@{user?.username}</span>
                        <Badge className={`${roleBadge.color} border-0`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleBadge.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Job Title & Location */}
                    <div className="space-y-1.5">
                      {user?.bio && (
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {user.bio.split('\n')[0]}
                        </p>
                      )}
                      {(user?.city || user?.province) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{[user.city, user.province].filter(Boolean).join(', ')}</span>
                          {user.locationVerified && (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons & Stats */}
                  <div className="md:self-start space-y-4">
                    <div className="flex gap-3">
                      {isOwnProfile ? (
                        <Link href="/profile">
                          <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profil
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Button
                            onClick={handleFollow}
                            variant={following ? 'outline' : 'default'}
                            className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                              following ? 'border-2' : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {following ? (
                              <>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Berhenti Ikuti
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Ikuti
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={handleMessage}
                            variant="outline"
                            className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Pesan
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Stats - Compact */}
                    <div className="flex gap-6 text-sm">
                      <button className="text-left group hover:opacity-80 transition-opacity">
                        <div className="font-bold text-pink-600 dark:text-pink-400">
                          {user?._count.followers || 0}
                        </div>
                        <div className="text-muted-foreground">Pengikut</div>
                      </button>
                      <button className="text-left group hover:opacity-80 transition-opacity">
                        <div className="font-bold text-green-600 dark:text-green-400">
                          {user?._count.following || 0}
                        </div>
                        <div className="text-muted-foreground">Mengikuti</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bio & Additional Info */}
                {(user?.createdAt || user?.isOnline !== undefined) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {user?.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Bergabung {formatDate(user.createdAt)}</span>
                        </div>
                      )}
                      {user?.isOnline !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span>
                            {user.isOnline 
                              ? 'Online sekarang' 
                              : user.lastSeenAt 
                                ? `Terakhir dilihat ${formatRelativeTime(user.lastSeenAt)}`
                                : 'Offline'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Section with Sidebar Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 70% (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Form - Only show on own profile */}
            {isOwnProfile && (
              <Card className="border-0 shadow-md rounded-xl bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <RichTextEditor
                    placeholder="Apa yang Anda pikirkan?"
                    onSubmit={handlePostSubmit}
                    allowMedia={true}
                    allowMentions={true}
                    allowHashtags={true}
                    allowPolls={false}
                    allowEvents={false}
                    allowScheduling={false}
                    showSubmitButton={true}
                    submitButtonText="Posting"
                    submitButtonDisabled={submittingPost}
                    toolbarPosition="bottom"
                  />
                </CardContent>
              </Card>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
              <Card className="border-0 shadow-md rounded-xl bg-white dark:bg-gray-800">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-blue-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Belum ada postingan</p>
                  {isOwnProfile && (
                    <p className="text-sm text-muted-foreground mt-2">Mulai berbagi dengan menulis postingan pertama Anda</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card 
                  key={post.id} 
                  id={`post-${post.id}`}
                  className={`border-0 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 ${highlightedPostId === post.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                >
                  <CardContent className="p-6 relative">

                    {/* Pinned Badge */}
                    {post.isPinned && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                        <Pin className="h-4 w-4 fill-blue-600" />
                        <span className="font-semibold">Postingan Dipasang</span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.author.avatar || undefined} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {post.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link href={`/${post.author.username}`} className="font-semibold hover:text-blue-600 transition-colors">
                              {post.author.name}
                            </Link>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(post.createdAt)}
                              </p>
                              {post.group && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <Link
                                    href={`/community/groups/${post.group.slug}`}
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {post.group.type === 'PUBLIC' && <Eye className="h-3 w-3" />}
                                    {post.group.type === 'PRIVATE' && <Lock className="h-3 w-3" />}
                                    {post.group.type === 'HIDDEN' && <EyeOff className="h-3 w-3" />}
                                    <span>{post.group.name}</span>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Post Menu Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {session?.user?.id === post.author.id ? (
                                // Owner actions
                                <>
                                  <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit Postingan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePinPost(post.id, post.isPinned)}>
                                    <Pin className="mr-2 h-4 w-4" />
                                    {post.isPinned ? 'Unpin' : 'Pin'} Postingan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleComments(post.id, post.commentsEnabled)}>
                                    {post.commentsEnabled ? (
                                      <>
                                        <MessageSquareOff className="mr-2 h-4 w-4" />
                                        Tutup Komentar
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="mr-2 h-4 w-4" />
                                        Buka Komentar
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus Postingan
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                // Other users actions
                                <DropdownMenuItem 
                                  onClick={() => setReportingPost(post)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Flag className="mr-2 h-4 w-4" />
                                  Laporkan ke Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="prose prose-sm max-w-none mb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {post.content}
                        </div>
                        
                        {/* Post Images */}
                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.images.slice(0, 4).map((image, idx) => (
                              <div key={idx} className="relative h-64 rounded-lg overflow-hidden group">
                                <Image
                                  src={image}
                                  alt={`Post image ${idx + 1}`}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reactions and Comments */}
                        <div className="space-y-4 pt-3 border-t">
                          <div className="flex items-center gap-6">
                            <ReactionButton
                              postId={post.id}
                              currentReaction={postReactions[post.id]?.currentReaction}
                              reactionCounts={postReactions[post.id]?.counts || {}}
                              onReact={handleReact}
                              onRemoveReact={handleRemoveReact}
                              disabled={!session?.user}
                            />
                            <button
                              onClick={() => toggleComments(post.id)}
                              className={`flex items-center gap-2 transition-colors group ${
                                post.commentsEnabled
                                  ? 'hover:text-blue-500'
                                  : 'opacity-50 cursor-not-allowed'
                              }`}
                              disabled={!post.commentsEnabled}
                            >
                              <MessageCircle className="h-5 w-5" />
                              <span className="font-medium text-sm">{post._count.comments || 0}</span>
                              {!post.commentsEnabled && <Lock className="h-3 w-3 ml-1" />}
                            </button>
                            <button
                              onClick={() => handleSavePost(post.id)}
                              className={`flex items-center gap-2 transition-colors ml-auto ${
                                savedPosts[post.id]
                                  ? 'text-yellow-600 hover:text-yellow-700'
                                  : 'text-gray-600 hover:text-yellow-600'
                              }`}
                              disabled={savingPost[post.id]}
                            >
                              {savedPosts[post.id] ? (
                                <BookmarkCheck className="h-5 w-5 fill-current" />
                              ) : (
                                <Bookmark className="h-5 w-5" />
                              )}
                            </button>
                          </div>

                          {/* Comment Section */}
                          {expandedComments[post.id] && post.commentsEnabled && (
                            <div className="pt-4 border-t">
                              {loadingComments[post.id] ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <CommentSection
                                  postId={post.id}
                                  comments={postComments[post.id] || []}
                                  onRefresh={() => refreshComments(post.id)}
                                />
                              )}
                            </div>
                          )}

                          {/* Comments Disabled Message */}
                          {!post.commentsEnabled && (
                            <div className="pt-4 border-t">
                              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm">Komentar dinonaktifkan untuk postingan ini</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar - 30% (1 column) */}
          <div className="space-y-6">
            {/* Progress Belajar - Only for own profile or if user is student */}
            {(isOwnProfile || user?.role === 'MENTOR') && (
              <Card className="border-0 shadow-md rounded-xl bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Progress Belajar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roleData?.enrolledCourses && roleData.enrolledCourses.length > 0 ? (
                    roleData.enrolledCourses.slice(0, 3).map((enrollment: any) => (
                      <div key={enrollment.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {enrollment.course?.title || 'Kursus'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {enrollment.progress || 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada kursus
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Tersedia */}
            <Card className="border-0 shadow-md rounded-xl bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Event Mendatang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roleData?.upcomingEvents && roleData.upcomingEvents.length > 0 ? (
                  roleData.upcomingEvents.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{event.date ? formatDate(event.date) : 'TBA'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada event
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Banner */}
            <SidebarBanner />

            {/* Grup yang Diikuti */}
            {user?.groupMemberships && user.groupMemberships.length > 0 && (
              <Card className="border-0 shadow-md rounded-xl bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Grup Aktif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.groupMemberships.slice(0, 3).map((membership) => (
                    <Link 
                      key={membership.group.id} 
                      href={`/community/groups/${membership.group.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={membership.group.avatar || undefined} />
                        <AvatarFallback className="bg-blue-500 text-white text-sm">
                          {membership.group.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {membership.group.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {membership.group._count.members} member
                        </p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Statistik Singkat */}
            <Card className="border-0 shadow-md rounded-xl bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Aktivitas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Postingan</span>
                  <span className="font-semibold text-blue-600">{user?._count.posts || 0}</span>
                </div>
                {user?.role === 'MENTOR' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Siswa</span>
                    <span className="font-semibold text-green-600">{user._count.courseEnrollments || 0}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Grup</span>
                  <span className="font-semibold text-orange-600">{user?._count.groupMemberships || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Edit Postingan</DialogTitle>
            <DialogDescription className="text-base">
              Ubah konten, tambah gambar, video, atau media lainnya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 px-2">
            {editingPost && (
              <RichTextEditor
                placeholder="Tulis sesuatu..."
                initialContent={{
                  text: editingPost.content,
                  images: editingPost.images || [],
                  videos: editingPost.videos || [],
                  documents: editingPost.documents || [],
                }}
                onSubmit={handleUpdatePost}
                allowMedia={true}
                allowMentions={true}
                allowHashtags={true}
                allowPolls={false}
                allowEvents={false}
                allowScheduling={false}
                showSubmitButton={true}
                submitButtonText={actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                submitButtonDisabled={actionLoading}
                toolbarPosition="bottom"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Post Modal */}
      <Dialog open={!!reportingPost} onOpenChange={(open) => !open && setReportingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Laporkan Postingan</DialogTitle>
            <DialogDescription>
              Laporkan postingan yang melanggar aturan komunitas ke admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">Alasan Laporan</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">Spam atau Iklan</SelectItem>
                  <SelectItem value="HARASSMENT">Pelecehan atau Bullying</SelectItem>
                  <SelectItem value="HATE_SPEECH">Ujaran Kebencian</SelectItem>
                  <SelectItem value="MISINFORMATION">Informasi Palsu</SelectItem>
                  <SelectItem value="INAPPROPRIATE">Konten Tidak Pantas</SelectItem>
                  <SelectItem value="COPYRIGHT">Pelanggaran Hak Cipta</SelectItem>
                  <SelectItem value="OTHER">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-description">Detail Laporan (Opsional)</Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
                className="mt-2"
                placeholder="Jelaskan lebih detail..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportingPost(null)} disabled={actionLoading}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReportPost} disabled={actionLoading || !reportReason}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim Laporan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}