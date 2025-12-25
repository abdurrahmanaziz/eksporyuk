'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Settings,
  UserPlus,
  LogOut,
  Image as ImageIcon,
  Send,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Video,
  Link2,
  MapPin,
  Smile,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Plus,
  Rocket,
  BookOpen,
  FileText,
  Award,
  Search,
  UserCheck,
  MessageSquare,
  Edit3,
  Trash2,
  Pin,
  Flag,
  MessageSquareOff,
  Unlock,
  Loader2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import GroupSidebar from '@/components/groups/GroupSidebar'
import RichTextEditor from '@/components/ui/RichTextEditor'
import DashboardBanner from '@/components/banners/DashboardBanner'
import SidebarBanner from '@/components/banners/SidebarBanner'
import OnlineStatusBadge from '@/components/presence/OnlineStatusBadge'
import { ReactionPicker, ReactionSummary, ReactionModal } from '@/components/ui/Reactions'
import { PollCreator, PollVote } from '@/components/ui/PollCreator'
import { EventCreator, EventDisplay } from '@/components/ui/EventCreator'
import CommentSection from '@/components/ui/CommentSection'
import ReactionButton, { ReactionType } from '@/components/ui/ReactionButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import MemberLocationBadge from '@/components/member/MemberLocationBadge'

// Gamification components
import QuizList from '@/components/groups/QuizList'
import BadgeList from '@/components/groups/BadgeList'
import ChallengeList from '@/components/groups/ChallengeList'
import ScheduledPosts from '@/components/groups/ScheduledPosts'

interface Group {
  id: string
  name: string
  description: string
  avatar: string | null
  avatarShape?: string | null
  coverImage: string | null
  type: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
  showStats?: boolean
  owner: {
    id: string
    name: string
    image: string | null
  }
  _count: {
    members: number
    posts: number
  }
}

interface Membership {
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface Post {
  id: string
  content: string
  contentFormatted?: any
  images: string[]
  videos: string[]
  documents: string[]
  linkPreview?: any
  taggedUsers: string[]
  pollData?: any
  eventData?: any
  location?: any
  quoteStyle?: string
  scheduledAt?: string
  commentsEnabled: boolean
  isPinned?: boolean
  reactionsCount?: Record<string, number>
  createdAt: string
  author: {
    id: string
    name: string
    image: string | null
    role: string
    province?: string
    city?: string
    locationVerified?: boolean
  }
  reactions?: Array<{
    id: string
    type: string
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string
      image: string | null
    }
  }>
  _count: {
    comments: number
    reactions: number
  }
}

const getGroupIcon = (type: string) => {
  switch (type) {
    case 'PUBLIC':
      return <Eye className="w-4 h-4" />
    case 'PRIVATE':
      return <Lock className="w-4 h-4" />
    case 'HIDDEN':
      return <EyeOff className="w-4 h-4" />
    default:
      return null
  }
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: idLocale })
  } catch {
    return dateString
  }
}

export default function GroupDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const groupSlug = params?.slug as string

  // Sidebar state untuk responsive layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [group, setGroup] = useState<Group | null>(null)
  const [userMembership, setUserMembership] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [eventFilter, setEventFilter] = useState<'upcoming' | 'past' | 'my'>('upcoming')
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [filteredMembers, setFilteredMembers] = useState<any[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [mentors, setMentors] = useState<any[]>([])
  const [loadingMentors, setLoadingMentors] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed')
  const [activeSection, setActiveSection] = useState<'feed' | 'events' | 'classes' | 'members' | 'mentors' | 'scheduled'>('feed')
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true)
  const [storiesScrollPosition, setStoriesScrollPosition] = useState(0)
  const [selectedReactionModal, setSelectedReactionModal] = useState<{ postId: string; reactions: any[]; reactionsCount: Record<string, number> } | null>(null)

  // Post management states
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<string | null>(null)
  const [reportingPost, setReportingPost] = useState<Post | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [postComments, setPostComments] = useState<Record<string, any[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [postReactions, setPostReactions] = useState<Record<string, { currentReaction: ReactionType | null; counts: Record<string, number> }>>({})
  const [submittingPost, setSubmittingPost] = useState(false)
  const [editPostContent, setEditPostContent] = useState('')
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const [savingPost, setSavingPost] = useState<Record<string, boolean>>({})
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leavingGroup, setLeavingGroup] = useState(false)
  const [showGroupMenu, setShowGroupMenu] = useState(false)

  useEffect(() => {
    if (groupSlug) {
      fetchGroupDetails()
      fetchPosts()
      fetchStories()
    }
  }, [groupSlug])

  // Fetch events when event section is active or filter changes
  useEffect(() => {
    if (activeSection === 'events' && groupSlug) {
      fetchEvents()
    }
  }, [activeSection, eventFilter, groupSlug])

  // Fetch courses when classes section is active
  useEffect(() => {
    if (activeSection === 'classes' && groupSlug) {
      fetchCourses()
    }
  }, [activeSection, groupSlug])

  // Fetch members when members section is active
  useEffect(() => {
    if (activeSection === 'members' && groupSlug) {
      fetchMembers()
    }
  }, [activeSection, groupSlug])

  // Fetch mentors when mentors section is active
  useEffect(() => {
    if (activeSection === 'mentors' && groupSlug) {
      fetchMentors()
    }
  }, [activeSection, groupSlug])

  // Filter members based on search
  useEffect(() => {
    if (memberSearch.trim() === '') {
      setFilteredMembers(members)
    } else {
      const filtered = members.filter((member: any) =>
        member.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.user.email.toLowerCase().includes(memberSearch.toLowerCase())
      )
      setFilteredMembers(filtered)
    }
  }, [memberSearch, members])

  // Detect sidebar state and window size
  useEffect(() => {
    const checkSidebarState = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      setSidebarCollapsed(collapsed)
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkSidebarState()
    checkMobile()

    window.addEventListener('resize', checkMobile)
    window.addEventListener('storage', checkSidebarState)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('storage', checkSidebarState)
    }
  }, [])

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}`)
      if (res.ok) {
        const data = await res.json()
        setGroup(data.group)
        setUserMembership(data.membership)
      } else if (res.status === 404) {
        router.push('/community/groups')
      }
    } catch (error) {
      console.error('Error fetching group:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}/posts`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
        
        // Fetch reactions and save status for all posts
        if (data.posts && data.posts.length > 0) {
          await fetchAllReactions(data.posts.map((p: any) => p.id))
          await fetchAllSavedStatus(data.posts.map((p: any) => p.id))
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

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

  const fetchAllSavedStatus = async (postIds: string[]) => {
    try {
      const saved: Record<string, boolean> = {}
      await Promise.all(
        postIds.map(async (postId) => {
          try {
            const response = await fetch(`/api/posts/${postId}/save`)
            if (response.ok) {
              const data = await response.json()
              saved[postId] = data.isSaved || false
            }
          } catch (err) {
            console.error(`Error fetching save status for post ${postId}:`, err)
          }
        })
      )
      setSavedPosts(saved)
    } catch (error) {
      console.error('Error fetching save status:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true)
      const res = await fetch(`/api/groups/${groupSlug}/events?filter=${eventFilter}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const res = await fetch(`/api/groups/${groupSlug}/courses`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true)
      const res = await fetch(`/api/groups/${groupSlug}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
        setFilteredMembers(data.members || [])
        
        // Get following status for all members
        if (data.members && data.members.length > 0) {
          await fetchFollowingStatus(data.members.map((m: any) => m.user.id))
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchMentors = async () => {
    try {
      setLoadingMentors(true)
      const res = await fetch(`/api/users/presence?role=MENTOR&groupId=${group?.id}`)
      if (res.ok) {
        const data = await res.json()
        setMentors(data.users || [])
        
        // Get following status for all mentors
        if (data.users && data.users.length > 0) {
          await fetchFollowingStatus(data.users.map((m: any) => m.id))
        }
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoadingMentors(false)
    }
  }

  const fetchFollowingStatus = async (userIds: string[]) => {
    try {
      const following = new Set<string>()
      await Promise.all(
        userIds.map(async (userId) => {
          if (userId === session?.user?.id) return // Skip self
          try {
            const response = await fetch(`/api/users/${userId}/follow`)
            if (response.ok) {
              const data = await response.json()
              if (data.isFollowing) {
                following.add(userId)
              }
            }
          } catch (err) {
            console.error(`Error checking follow status for ${userId}:`, err)
          }
        })
      )
      setFollowingUsers(following)
    } catch (error) {
      console.error('Error fetching following status:', error)
    }
  }

  const handleFollowToggle = async (userId: string) => {
    try {
      const isFollowing = followingUsers.has(userId)
      const method = isFollowing ? 'DELETE' : 'POST'
      
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          if (isFollowing) {
            newSet.delete(userId)
          } else {
            newSet.add(userId)
          }
          return newSet
        })
        toast.success(isFollowing ? 'Unfollow berhasil' : 'Follow berhasil')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal mengubah status follow')
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error('Gagal mengubah status follow')
    }
  }

  const handleStartChat = (userId: string) => {
    router.push(`/messages?user=${userId}`)
  }

  const fetchStories = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}/stories`)
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    }
  }

  const scrollStories = (direction: 'left' | 'right') => {
    const container = document.getElementById('stories-container')
    if (container) {
      const scrollAmount = 300
      const newPosition = direction === 'left' 
        ? storiesScrollPosition - scrollAmount 
        : storiesScrollPosition + scrollAmount
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setStoriesScrollPosition(newPosition)
    }
  }

  const handleJoinGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (res.ok) {
        toast.success('Berhasil bergabung ke grup!')
        fetchGroupDetails()
      } else {
        const error = await res.json()
        
        // Check if membership is required
        if (error.requiresUpgrade) {
          toast.error(error.message || 'Grup ini memerlukan membership premium')
          // Optionally redirect to membership page after delay
          setTimeout(() => {
            router.push('/membership')
          }, 2000)
        } else {
          toast.error(error.error || 'Gagal bergabung ke grup')
        }
      }
    } catch (error) {
      console.error('Error joining group:', error)
      toast.error('Terjadi kesalahan saat bergabung')
    }
  }

  const handleLeaveGroup = async () => {
    setLeavingGroup(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/members`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Anda telah keluar dari grup')
        setShowLeaveConfirm(false)
        router.push('/community/groups')
      } else {
        toast.error('Gagal keluar dari grup')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLeavingGroup(false)
    }
  }

  const handleCreatePost = async (postData: any) => {
    if (!postData.text && (!postData.images || postData.images.length === 0)) {
      toast.error('Konten tidak boleh kosong')
      return false
    }

    setPosting(true)
    try {
      const res = await fetch(`/api/groups/${groupSlug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postData.text,
          images: postData.images || [],
          videos: postData.videos || [],
          documents: postData.documents || [],
          type: postData.type || 'POST',
          metadata: postData.metadata || null,
        }),
      })

      if (res.ok) {
        toast.success('Postingan berhasil dibuat!')
        fetchPosts()
        return true
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal membuat postingan')
        return false
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Terjadi kesalahan')
      return false
    } finally {
      setPosting(false)
    }
  }

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
      setPostReactions(prev => ({
        ...prev,
        [postId]: previousReaction || { counts: {}, currentReaction: null }
      }))
      toast.error('Gagal menambahkan reaksi')
    }
  }

  const handleRemoveReact = async (postId: string) => {
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
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            counts: data.reactionsCount || data.counts || {},
            currentReaction: null,
          }
        }))
      } else {
        setPostReactions(prev => ({
          ...prev,
          [postId]: previousReaction || { counts: {}, currentReaction: null }
        }))
        toast.error('Gagal menghapus reaksi')
      }
    } catch (error) {
      console.error('Error removing reaction:', error)
      setPostReactions(prev => ({
        ...prev,
        [postId]: previousReaction || { counts: {}, currentReaction: null }
      }))
      toast.error('Gagal menghapus reaksi')
    }
  }

  const handleSavePost = async (postId: string) => {
    // Optimistic update
    setSavingPost(prev => ({ ...prev, [postId]: true }))
    const wasSaved = savedPosts[postId]
    setSavedPosts(prev => ({ ...prev, [postId]: !wasSaved }))

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setSavedPosts(prev => ({ ...prev, [postId]: data.isSaved }))
        
        // Show immediate notification
        if (data.isSaved) {
          toast.success('Postingan berhasil disimpan!', {
            description: 'Lihat semua postingan tersimpan',
            action: {
              label: 'Lihat Simpanan',
              onClick: () => window.location.href = '/saved-posts'
            },
            duration: 5000
          })
        } else {
          toast.success('Postingan dihapus dari simpanan')
        }
      } else {
        // Rollback on error
        setSavedPosts(prev => ({ ...prev, [postId]: wasSaved }))
        toast.error('Gagal menyimpan postingan')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      setSavedPosts(prev => ({ ...prev, [postId]: wasSaved }))
      toast.error('Gagal menyimpan postingan')
    } finally {
      setSavingPost(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleVotePoll = async (postId: string, optionIds: string[]) => {
    try {
      await fetch(`/api/posts/${postId}/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds }),
      })
      fetchPosts()
    } catch (error) {
      console.error('Error voting on poll:', error)
    }
  }

  // Post Management Functions
  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setEditPostContent(post.content)
  }

  const handleUpdatePost = async (postData: any) => {
    if (!postData.text && (!postData.images || postData.images.length === 0)) {
      toast.error('Konten tidak boleh kosong')
      return false
    }

    setSubmittingPost(true)
    try {
      const formData = new FormData()
      formData.append('content', postData.text || editingPost?.content || '')

      if (postData.images && postData.images.length > 0) {
        for (const image of postData.images) {
          if (typeof image === 'string' && image.startsWith('data:')) {
            const blob = await fetch(image).then(r => r.blob())
            formData.append('images', blob, `image-${Date.now()}.jpg`)
          } else if (image instanceof File) {
            formData.append('images', image)
          }
        }
      } else if (editingPost?.images) {
        formData.append('images', JSON.stringify(editingPost.images || []))
      }

      const response = await fetch(`/api/posts/${editingPost?.id}`, {
        method: 'PATCH',
        body: formData,
      })

      if (response.ok) {
        toast.success('Postingan berhasil diupdate')
        setEditingPost(null)
        setEditPostContent('')
        fetchPosts()
        return true
      } else {
        toast.error('Gagal mengupdate postingan')
        return false
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
      return false
    } finally {
      setSubmittingPost(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Yakin ingin menghapus postingan ini?')) return

    setDeletingPost(postId)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Postingan berhasil dihapus')
        fetchPosts()
      } else {
        toast.error('Gagal menghapus postingan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingPost(null)
    }
  }

  const handleToggleComments = async (postId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/toggle-comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentsEnabled: !currentStatus }),
      })

      if (response.ok) {
        toast.success(currentStatus ? 'Komentar dinonaktifkan' : 'Komentar diaktifkan')
        fetchPosts()
      } else {
        toast.error('Gagal mengubah status komentar')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handlePinPost = async (postId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success(currentStatus ? 'Postingan di-unpin' : 'Postingan di-pin')
        fetchPosts()
      } else {
        toast.error('Gagal mengubah status pin')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleReportPost = async () => {
    if (!reportReason) {
      toast.error('Pilih alasan laporan')
      return
    }

    setSubmittingReport(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'POST',
          postId: reportingPost?.id,
          reason: reportReason,
          description: reportDetails,
        }),
      })

      if (response.ok) {
        toast.success('Laporan berhasil dikirim ke admin')
        setReportingPost(null)
        setReportReason('')
        setReportDetails('')
      } else {
        toast.error('Gagal mengirim laporan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmittingReport(false)
    }
  }

  // Comment functions
  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments[postId]
    
    if (!isExpanded && !postComments[postId]) {
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

  // Reaction handlers
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

  const handleToggleEventAttendance = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/event/attend`, {
        method: 'POST',
      })
      fetchPosts()
    } catch (error) {
      console.error('Error toggling event attendance:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat grup...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  const isMember = userMembership !== null
  const isOwner = userMembership?.role === 'OWNER'
  const isAdmin = userMembership?.role === 'ADMIN' || session?.user?.role === 'ADMIN'
  const isMentor = userMembership?.role === 'MENTOR' || userMembership?.role === 'MODERATOR'
  const canAccessScheduled = isOwner || isAdmin || isMentor

  return (
    <ResponsivePageWrapper>
      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <Link
              href="/community/groups"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Grup</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-gray-900 text-sm truncate max-w-[150px]">
                {group?.name || 'Loading...'}
              </h1>
            </div>
          </div>
        )}
        {/* Cover Image - Taller & Wider with Enhanced Gradients */}
        <div
          className="h-48 sm:h-56 md:h-64 lg:h-80 relative shadow-2xl overflow-hidden"
          style={
            group.coverImage
              ? {
                  backgroundImage: `url(${group.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  background: 'linear-gradient(to bottom right, rgb(37, 99, 235), rgb(147, 51, 234), rgb(236, 72, 153))'
                }
          }
        >
          {/* Multi-layered gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 via-transparent to-purple-600/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
          
          {/* Decorative gradient elements - Enhanced */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/30 to-transparent rounded-full blur-3xl -ml-40 -mb-40 animate-pulse" style={{animationDelay: '1s'}} />
          </div>

          <div className="hidden lg:block absolute top-6 left-6 z-10">
            <Link
              href="/community/groups"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 border border-white/20 shadow-lg hover:shadow-xl"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
        </div>

        {/* Avatar Floating - Outside Card */}
        <div className="w-full -mt-20 sm:-mt-24 md:-mt-28 relative z-30">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 flex justify-center">
            <div className={`w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 ${group.avatarShape === 'rounded' ? 'rounded-3xl' : 'rounded-full'} bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 shadow-2xl ring-4 ring-white ring-offset-8 ring-offset-gray-50 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold text-white hover:shadow-3xl transition-shadow duration-300`}>
              {group.avatar ? (
                <img
                  src={group.avatar}
                  alt={group.name}
                  className={`w-full h-full ${group.avatarShape === 'rounded' ? 'rounded-3xl' : 'rounded-full'} object-cover`}
                />
              ) : (
                group.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          
          {/* Menu Dropdown - Positioned after Avatar for higher z-index */}
          {isMember && (
            <div className="absolute top-32 right-4 sm:top-36 sm:right-8 z-50">
              <div className="relative">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Button clicked!', showGroupMenu)
                    setShowGroupMenu(!showGroupMenu)
                  }}
                  className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border-2 border-gray-300 bg-white shadow-md cursor-pointer"
                >
                  <MoreHorizontal className="h-6 w-6 text-gray-700" />
                </button>
                
                {showGroupMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('Backdrop clicked!')
                        setShowGroupMenu(false)
                      }}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Share clicked!')
                          navigator.clipboard.writeText(window.location.href)
                          toast.success('Link grup berhasil disalin!')
                          setShowGroupMenu(false)
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      >
                        <Share2 className="w-4 h-4 mr-3" />
                        Bagikan Grup
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const message = `Bergabunglah dengan grup ${group.name}!`
                          const url = window.location.href
                          window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`, '_blank')
                          setShowGroupMenu(false)
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      >
                        <MessageSquare className="w-4 h-4 mr-3" />
                        Bagikan ke WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.info('Fitur simpan grup akan segera hadir')
                          setShowGroupMenu(false)
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      >
                        <Bookmark className="w-4 h-4 mr-3" />
                        Simpan Grup
                      </button>
                      <div className="border-t border-gray-200 my-1" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.info('Fitur laporan akan segera hadir')
                          setShowGroupMenu(false)
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      >
                        <Flag className="w-4 h-4 mr-3" />
                        Laporkan Grup
                      </button>
                      {!isOwner && (
                        <>
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Leave group clicked!')
                              setShowLeaveConfirm(true)
                              setShowGroupMenu(false)
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Keluar dari Grup
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Group Info Card */}
        <div className="w-full -mt-16 sm:-mt-18 md:-mt-20 relative z-20">
          <div className="max-w-[90rem] mx-auto px-2 lg:px-3 relative">
            <Card className="shadow-2xl border-0 overflow-visible bg-gradient-to-b from-white to-gray-50 hover:shadow-3xl transition-shadow duration-300">
              <CardContent className="pt-20 sm:pt-24 pb-8 px-6 sm:px-8 lg:px-24 xl:px-32 relative">
                {/* Name & Status - Centered */}
                <div className="flex flex-col items-center text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    {group.name}
                  </h1>
                  
                  {/* Status Grup & Last Active */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200">
                      {getGroupIcon(group.type)}
                      {group.type}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Aktif baru saja
                    </span>
                  </div>
                </div>

                {/* Deskripsi Grup */}
                <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto leading-relaxed text-base">
                  {group.description}
                </p>

                {/* Decorative divider */}
                <div className="mb-8 flex justify-center">
                  <div className="w-24 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full" />
                </div>

                {/* Desktop Layout: Stats + Buttons */}
                <div className="hidden lg:block space-y-6">
                  {/* Stats Pills - Centered */}
                  {group.showStats !== false && (
                    <div className="flex gap-3 flex-wrap justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-bold text-gray-900">{group._count.members}</span>
                          <span className="text-gray-600 ml-1 text-sm">Member</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                        <div>
                          <span className="font-bold text-gray-900">{group._count.posts}</span>
                          <span className="text-gray-600 ml-1 text-sm">Post</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <div>
                          <span className="font-bold text-gray-900">{events?.length || 0}</span>
                          <span className="text-gray-600 ml-1 text-sm">Event</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-md hover:shadow-lg transition-shadow">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <div>
                          <span className="font-bold text-gray-900">{courses?.length || 0}</span>
                          <span className="text-gray-600 ml-1 text-sm">Kelas</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-100 border border-amber-300 shadow-md hover:shadow-lg transition-shadow">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <div>
                          <span className="font-bold text-gray-900">{mentors?.length || 0}</span>
                          <span className="text-gray-600 ml-1 text-sm">Mentor</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Centered */}
                  {!isMember && (
                    <div className="flex justify-center">
                      <Button size="lg" onClick={handleJoinGroup} className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Gabung Grup
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Layout: Centered */}
                <div className="lg:hidden space-y-6">
                  {/* Stats Pills */}
                  {group.showStats !== false && (
                    <div className="flex gap-2 justify-center flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                      <Users className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{group._count.members}</span>
                        <span className="text-gray-600 ml-1 text-xs">Member</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                      <MessageCircle className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{group._count.posts}</span>
                        <span className="text-gray-600 ml-1 text-xs">Post</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{events?.length || 0}</span>
                        <span className="text-gray-600 ml-1 text-xs">Event</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{courses?.length || 0}</span>
                        <span className="text-gray-600 ml-1 text-xs">Kelas</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{mentors?.length || 0}</span>
                        <span className="text-gray-600 ml-1 text-xs">Mentor</span>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-center">
                    {!isMember && (
                      <Button size="lg" onClick={handleJoinGroup} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Gabung Grup
                      </Button>
                    )}
                  </div>
                </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Content Area - Full Width Responsive */}
        <div className="w-full py-4 sm:py-6">
          <div className="max-w-full px-4 lg:px-6">
            {/* Section Tabs - Mobile: 2 Rows, Desktop: 1 Row */}
            {isMember && (
              <div className="mb-4">
                {/* Mobile: 2 Baris */}
                <div className="lg:hidden space-y-2">
                  {/* Baris 1: Feed, Event, Kelas */}
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                      variant={activeSection === 'feed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection('feed')}
                      className="min-w-[100px]"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Feed
                    </Button>
                    <Button
                      variant={activeSection === 'events' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection('events')}
                      className="min-w-[100px]"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Event
                    </Button>
                    <Button
                      variant={activeSection === 'classes' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection('classes')}
                      className="min-w-[100px]"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Kelas
                    </Button>
                  </div>
                  
                  {/* Baris 2: Member, Mentor, Terjadwal */}
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                      variant={activeSection === 'members' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection('members')}
                      className="min-w-[100px]"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Member
                    </Button>
                    <Button
                      variant={activeSection === 'mentors' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection('mentors')}
                      className="min-w-[100px]"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Mentor
                    </Button>
                    {canAccessScheduled && (
                      <Button
                        variant={activeSection === 'scheduled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveSection('scheduled')}
                        className="min-w-[100px]"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Terjadwal
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop: 1 Baris */}
                <div className="hidden lg:flex gap-2 justify-center flex-wrap">
                  <Button
                    variant={activeSection === 'feed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSection('feed')}
                    className="min-w-[100px]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Feed
                  </Button>
                  <Button
                    variant={activeSection === 'events' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSection('events')}
                    className="min-w-[100px]"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Event
                  </Button>
                  <Button
                    variant={activeSection === 'classes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSection('classes')}
                    className="min-w-[100px]"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Kelas
                  </Button>
                  <Button
                    variant={activeSection === 'members' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSection('members')}
                    className="min-w-[100px]"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Member
                  </Button>
                  <Button
                    variant={activeSection === 'mentors' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSection('mentors')}
                    className="min-w-[100px]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mentor
                  </Button>
                  {canAccessScheduled && (
                    <Button
                      variant={activeSection === 'scheduled' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSection('scheduled')}
                      className="min-w-[100px]"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Terjadwal
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Content - Adaptive Width */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 order-1 lg:order-1">
              
              {/* Feed Section */}
              {activeSection === 'feed' && (
                <>
              {/* Group Banner at Top */}
              <div className="mb-4 sm:mb-6">
                <DashboardBanner placement="DASHBOARD" />
              </div>

              {/* Rich Text Editor for Creating Posts - Mobile Optimized */}
              {isMember && (
                <div className="mb-4 sm:mb-6 max-w-full overflow-hidden">
                  <RichTextEditor
                    onSubmit={handleCreatePost}
                    placeholder="Apa yang Anda pikirkan?"
                    allowScheduling={true}
                    allowPolls={true}
                    allowEvents={true}
                    allowMedia={true}
                    allowMentions={true}
                    allowHashtags={true}
                    groupSlug={groupSlug}
                    showSubmitButton={true}
                    submitButtonText="Post"
                  />
                </div>
              )}

              {/* Posts Feed */}
              <div className="space-y-4 max-w-full overflow-hidden">
            {posts.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Belum ada postingan di grup ini
                  </p>
                  {isMember && (
                    <p className="text-sm text-gray-500 mt-2">
                      Jadilah yang pertama membuat postingan!
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => {
                const userReaction = post.reactions?.find(
                  (reaction) => reaction.user.id === session?.user?.id
                )?.type as any

                return (
                  <Card key={post.id}>
                    <CardContent className="p-3 sm:p-4">
                      {/* Pinned Badge */}
                      {post.isPinned && (
                        <div className="mb-3 flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                          <Pin className="h-4 w-4 fill-blue-600" />
                          <span className="font-semibold">Postingan Dipasang</span>
                        </div>
                      )}

                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarImage
                              src={post.author.image || undefined}
                            />
                            <AvatarFallback>
                              {post.author.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/${post.author.name}`} className="font-semibold hover:text-blue-600 transition-colors">
                                {post.author.name}
                              </Link>
                              {post.author.city && (
                                <MemberLocationBadge
                                  city={post.author.city}
                                  province={post.author.province}
                                  locationVerified={post.author.locationVerified}
                                  size="sm"
                                  showLink={true}
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(post.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Post Menu Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {session?.user?.id === post.author.id || isAdmin || isOwner ? (
                              // Owner/Admin actions
                              <>
                                {session?.user?.id === post.author.id && (
                                  <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit Postingan
                                  </DropdownMenuItem>
                                )}
                                {(isAdmin || isOwner) && (
                                  <DropdownMenuItem onClick={() => handlePinPost(post.id, post.isPinned || false)}>
                                    <Pin className="mr-2 h-4 w-4" />
                                    {post.isPinned ? 'Unpin' : 'Pin'} Postingan
                                  </DropdownMenuItem>
                                )}
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

                      {/* Post Content */}
                      {post.contentFormatted ? (
                        <div
                          className="text-gray-800 mb-3 prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: post.contentFormatted.html }}
                        />
                      ) : (
                        <p className="text-gray-800 mb-3 whitespace-pre-wrap">
                          {post.content}
                        </p>
                      )}

                      {/* Media Display */}
                      {post.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3 max-w-full">
                          {post.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt=""
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {post.videos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 max-w-full">
                          {post.videos.map((video, index) => (
                            <video
                              key={index}
                              src={video}
                              controls
                              className="w-full rounded-lg max-h-64"
                            />
                          ))}
                        </div>
                      )}

                      {/* Link Preview */}
                      {post.linkPreview && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4 max-w-full overflow-hidden">
                          <div className="flex gap-3">
                            {post.linkPreview.image && (
                              <img src={post.linkPreview.image} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{post.linkPreview.title}</h4>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{post.linkPreview.description}</p>
                              <p className="text-blue-500 text-xs mt-1 truncate">{post.linkPreview.siteName}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Poll Display */}
                      {post.pollData && (
                        <div className="mb-4">
                          <PollVote
                            poll={{
                              ...post.pollData,
                              id: post.id,
                              totalVotes: post.pollData.totalVotes || 0,
                              userVotes: post.pollData.userVotes || [],
                            }}
                            onVote={(optionIds) => handleVotePoll(post.id, optionIds)}
                            currentUserId={session?.user?.id || ''}
                          />
                        </div>
                      )}

                      {/* Event Display */}
                      {post.eventData && (
                        <div className="mb-4">
                          <EventDisplay
                            event={{
                              ...post.eventData,
                              id: post.id,
                              attendees: post.eventData.attendees || [],
                              userAttending: post.eventData.userAttending || false,
                            }}
                            onToggleAttendance={() => handleToggleEventAttendance(post.id)}
                          />
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
                        {!post.commentsEnabled && expandedComments[post.id] && (
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">Komentar dinonaktifkan untuk postingan ini</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
        </div>
        
        {/* Reaction Modal */}
        {selectedReactionModal && (
          <ReactionModal
            isOpen={true}
            onClose={() => setSelectedReactionModal(null)}
            reactions={selectedReactionModal.reactions}
            reactionsCount={selectedReactionModal.reactionsCount}
          />
        )}

        {/* Edit Post Dialog */}
        {editingPost && (
          <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">Edit Postingan</DialogTitle>
                <DialogDescription className="text-base">
                  Ubah konten, tambah gambar, video, atau media lainnya
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 px-2">
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
                  submitButtonText={submittingPost ? 'Menyimpan...' : 'Simpan Perubahan'}
                  submitButtonDisabled={submittingPost}
                  toolbarPosition="bottom"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Report Post Dialog */}
        <Dialog open={!!reportingPost} onOpenChange={() => setReportingPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Laporkan Postingan</DialogTitle>
              <DialogDescription>
                Pilih alasan pelaporan. Tim admin akan meninjau laporan Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Alasan</Label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="inappropriate">Konten Tidak Pantas</SelectItem>
                    <SelectItem value="harassment">Pelecehan</SelectItem>
                    <SelectItem value="misinformation">Misinformasi</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="details">Detail (Opsional)</Label>
                <Textarea
                  id="details"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Jelaskan lebih detail..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportingPost(null)}>
                Batal
              </Button>
              <Button 
                onClick={handleReportPost} 
                disabled={!reportReason || submittingReport}
              >
                {submittingReport ? (
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
                </>
              )}

              {/* Events Section */}
              {activeSection === 'events' && (
                <div className="space-y-4">
                  {/* Filter Tabs */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-2 overflow-x-auto">
                        <Button
                          variant={eventFilter === 'upcoming' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEventFilter('upcoming')}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Akan Datang
                        </Button>
                        <Button
                          variant={eventFilter === 'past' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEventFilter('past')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Selesai
                        </Button>
                        <Button
                          variant={eventFilter === 'my' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEventFilter('my')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Event Saya
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Events List */}
                  {loadingEvents ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Memuat event...</p>
                      </CardContent>
                    </Card>
                  ) : events.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {eventFilter === 'upcoming' && 'Belum Ada Event'}
                          {eventFilter === 'past' && 'Belum Ada Event Selesai'}
                          {eventFilter === 'my' && 'Anda Belum Terdaftar di Event'}
                        </h3>
                        <p className="text-gray-500">
                          {eventFilter === 'upcoming' && 'Event yang akan datang akan muncul di sini'}
                          {eventFilter === 'past' && 'Event yang telah selesai akan muncul di sini'}
                          {eventFilter === 'my' && 'Event yang Anda ikuti akan muncul di sini'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <Card key={event.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Event Thumbnail */}
                              {event.thumbnail && (
                                <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                  <img 
                                    src={event.thumbnail} 
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Event Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-2 truncate">
                                  {event.title}
                                </h3>
                                
                                <div className="space-y-1 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">
                                      {format(new Date(event.startDate), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                      {format(new Date(event.startDate), 'HH:mm', { locale: idLocale })} - 
                                      {format(new Date(event.endDate), 'HH:mm', { locale: idLocale })} WIB
                                    </span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{event.location}</span>
                                    </div>
                                  )}
                                  {event.type === 'ONLINE' && (
                                    <div className="flex items-center gap-2">
                                      <Video className="w-4 h-4 flex-shrink-0" />
                                      <span>Online Event</span>
                                    </div>
                                  )}
                                </div>

                                {/* Event Stats & Actions */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users className="w-4 h-4" />
                                    <span>{event._count?.rsvps || 0} peserta</span>
                                  </div>
                                  
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Lihat Detail
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Classes Section */}
              {activeSection === 'classes' && (
                <div className="space-y-4">
                  {loadingCourses ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Memuat kelas...</p>
                      </CardContent>
                    </Card>
                  ) : courses.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Belum Ada Kelas
                        </h3>
                        <p className="text-gray-500">
                          Anda belum memiliki kelas yang terhubung dengan grup ini
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                          <CardContent className="p-0">
                            {/* Course Thumbnail */}
                            {course.thumbnail && (
                              <div className="relative w-full h-48 bg-gray-100">
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />
                                {/* Progress Badge */}
                                {course.userProgress > 0 && (
                                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                                    {course.userProgress}%
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Course Info */}
                            <div className="p-4">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                {course.title}
                              </h3>

                              {/* Mentor */}
                              <div className="flex items-center gap-2 mb-3">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={course.mentor?.user?.avatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {course.mentor?.name?.charAt(0) || 'M'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">{course.mentor?.name}</span>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  <span>{course._count?.modules || 0} modul</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{course._count?.enrollments || 0} peserta</span>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              {course.userProgress > 0 && (
                                <div className="mb-4">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                      style={{ width: `${course.userProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Action Button */}
                              <Link href={`/courses/${course.slug || course.id}`}>
                                <Button className="w-full" size="sm">
                                  {course.isCompleted ? (
                                    <>
                                      <Award className="w-4 h-4 mr-2" />
                                      Selesai
                                    </>
                                  ) : course.userProgress > 0 ? (
                                    <>
                                      <Rocket className="w-4 h-4 mr-2" />
                                      Lanjutkan Belajar
                                    </>
                                  ) : (
                                    <>
                                      <BookOpen className="w-4 h-4 mr-2" />
                                      Mulai Belajar
                                    </>
                                  )}
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members Section */}
              {activeSection === 'members' && (
                <div className="space-y-4">
                  {/* Search Bar with Member Count */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Member Grup</h3>
                        <span className="text-sm text-gray-500">
                          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Cari member..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Members List - Single Card */}
                  {loadingMembers ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Memuat member...</p>
                      </CardContent>
                    </Card>
                  ) : filteredMembers.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {memberSearch ? 'Member Tidak Ditemukan' : 'Belum Ada Member'}
                        </h3>
                        <p className="text-gray-500">
                          {memberSearch 
                            ? 'Coba kata kunci pencarian lain' 
                            : 'Grup ini belum memiliki member'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        <div className="divide-y divide-gray-100">
                          {filteredMembers.map((member) => (
                            <div key={member.id} className="py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center justify-between gap-3">
                                {/* Member Info */}
                                <Link 
                                  href={`/${member.user.name}`}
                                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                                >
                                  <Avatar className="w-10 h-10 flex-shrink-0">
                                    <AvatarImage src={member.user.avatar || undefined} />
                                    <AvatarFallback>
                                      {member.user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-medium truncate">
                                        {member.user.name}
                                      </h4>
                                      {member.role !== 'MEMBER' && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                          {member.role === 'OWNER' ? 'Owner' : 
                                           member.role === 'ADMIN' ? 'Admin' : 
                                           member.role === 'MODERATOR' ? 'Moderator' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>

                                {/* Actions */}
                                {member.user.id !== session?.user?.id && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Chat Icon */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 w-9 p-0"
                                      onClick={() => handleStartChat(member.user.id)}
                                      title="Kirim pesan"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Follow Button */}
                                    <Button
                                      variant={followingUsers.has(member.user.id) ? 'outline' : 'default'}
                                      size="sm"
                                      onClick={() => handleFollowToggle(member.user.id)}
                                    >
                                      {followingUsers.has(member.user.id) ? (
                                        <>
                                          <UserCheck className="w-4 h-4 mr-1" />
                                          <span className="hidden sm:inline">Following</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="w-4 h-4 mr-1" />
                                          <span className="hidden sm:inline">Follow</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Mentors Section */}
              {activeSection === 'mentors' && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">Mentor Grup</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Hubungi mentor untuk mendapatkan bantuan dan bimbingan
                      </p>
                    </CardContent>
                  </Card>

                  {loadingMentors ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Memuat mentor...</p>
                      </CardContent>
                    </Card>
                  ) : mentors.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Belum Ada Mentor
                        </h3>
                        <p className="text-gray-500">
                          Mentor akan segera hadir untuk membantu Anda
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mentors.map((mentor: any) => (
                        <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="relative flex-shrink-0">
                                <Avatar className="w-16 h-16">
                                  <AvatarImage src={mentor.avatar || undefined} />
                                  <AvatarFallback className="text-lg">{mentor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1">
                                  <OnlineStatusBadge
                                    isOnline={mentor.isOnline}
                                    lastSeenAt={mentor.lastActiveAt}
                                    size="sm"
                                    userId={mentor.id}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{mentor.name}</h4>
                                {mentor.mentorProfile?.expertise && (
                                  <p className="text-sm text-gray-600 mb-2">{mentor.mentorProfile.expertise}</p>
                                )}
                                {mentor.mentorProfile?.bio && (
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{mentor.mentorProfile.bio}</p>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant={followingUsers.has(mentor.id) ? "outline" : "default"}
                                    onClick={() => handleFollowToggle(mentor.id)}
                                    className="flex-1"
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    {followingUsers.has(mentor.id) ? 'Following' : 'Follow'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Start chat with mentor
                                      fetch('/api/chat/start', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: mentor.id })
                                      }).then(res => res.json()).then(data => {
                                        window.location.href = `/chat?room=${data.room.id}`
                                      })
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Chat
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scheduled Posts Section (Admin/Mentor Only) */}
              {activeSection === 'scheduled' && canAccessScheduled && (
                <ScheduledPosts 
                  groupId={group.id}
                  groupSlug={groupSlug}
                  isAdmin={canAccessScheduled}
                  userRole={session?.user?.role}
                  userMembershipRole={userMembership?.role}
                />
              )}
              </div>

              {/* Right Sidebar - Responsive Order */}
              <div className="lg:col-span-1 order-2 lg:order-2">
                <div className="lg:sticky lg:top-4 space-y-4">
                  <GroupSidebar groupId={group.id} groupSlug={groupSlug} />
                  <SidebarBanner />
                  <SidebarBanner />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Group Confirmation Dialog */}
        <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <LogOut className="w-5 h-5" />
                Keluar dari Grup?
              </DialogTitle>
              <DialogDescription className="pt-4 space-y-3">
                <p className="text-base">
                  Apakah Anda yakin ingin keluar dari grup <span className="font-semibold text-gray-900">{group.name}</span>?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ Setelah keluar, Anda tidak akan bisa melihat postingan, event, dan konten grup lainnya. Anda perlu bergabung kembali untuk mengakses grup ini.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={leavingGroup}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveGroup}
                disabled={leavingGroup}
              >
                {leavingGroup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Ya, Keluar dari Grup
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </ResponsivePageWrapper>
  )
}
