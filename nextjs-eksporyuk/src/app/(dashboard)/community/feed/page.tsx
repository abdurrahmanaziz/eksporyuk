'use client'

import { useState, useEffect, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { ReactionPicker, ReactionSummary } from '@/components/ui/Reactions'
import { RenderPostContent, mentionStyles } from '@/components/community/RenderPostContent'
import {
  Users,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  Heart,
  TrendingUp,
  Globe,
  Lock,
  Crown,
  Plus,
  Filter,
  Send,
  Loader2,
  UserPlus,
  Eye,
  Calendar,
  MoreHorizontal,
  Edit3,
  Trash2,
  Flag
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
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
import NearbyMembersWidget, { MemberDirectoryLink } from '@/components/member/NearbyMembersWidget'
import MemberLocationBadge from '@/components/member/MemberLocationBadge'
import FeedBanner from '@/components/banners/FeedBanner'
import SidebarBanner from '@/components/banners/SidebarBanner'
import UserHoverCard from '@/components/community/UserHoverCard'
import CommentSection from '@/components/ui/CommentSection'
import { getBackgroundById } from '@/lib/post-backgrounds'

interface Post {
  id: string
  content: string
  contentFormatted?: { html?: string } | null
  type: string
  images?: string[]
  backgroundId?: string
  createdAt: string
  isPinned: boolean
  author: {
    id: string
    name: string
    avatar?: string
    role: string
    province?: string
    city?: string
    locationVerified?: boolean
  }
  group?: {
    id: string
    name: string
    slug: string
    type: string
    avatar?: string
  }
  likes: any[]
  reactions: any[]
  comments: any[]
  _count: {
    likes: number
    reactions: number
    comments: number
  }
  reactionsCount?: Record<string, number>
}

interface Group {
  id: string
  name: string
  slug: string
  type: string
  avatar?: string
  description: string
  _count: {
    members: number
    posts: number
  }
}

interface Event {
  id: string
  title: string
  startDate: string
  type: string
  location?: string
  group?: {
    name: string
    slug: string
  }
}

interface ActiveUser {
  id: string
  name: string
  avatar?: string
  lastActiveAt: string
}

export default function CommunityFeedPage() {
  const { data: session } = useSession()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  
  // Post creation
  const [postContent, setPostContent] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  // Reactions & interactions
  const [postReactions, setPostReactions] = useState<Record<string, any>>({})
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({})
  const [savingPost, setSavingPost] = useState<Record<string, boolean>>({})

  // Edit post states
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [deletingPost, setDeletingPost] = useState<string | null>(null)

  // Comment states
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [postComments, setPostComments] = useState<Record<string, any[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (session) {
      fetchPosts()
      fetchSuggestedGroups()
      fetchUpcomingEvents()
      fetchActiveUsers()
    }
  }, [session])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/feed?filter=all&page=1&limit=20`)
      console.log('Feed API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Feed API data:', data)
        console.log('Posts count:', data.posts?.length || 0)
        setPosts(data.posts || [])
        
        // Fetch reactions for all posts
        if (data.posts && data.posts.length > 0) {
          await fetchAllReactions(data.posts.map((p: any) => p.id))
          await fetchAllSavedStatus(data.posts.map((p: any) => p.id))
        }
      } else {
        const errorData = await response.json()
        console.error('Feed API error:', errorData)
        toast.error('Gagal memuat feed: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast.error('Gagal memuat feed')
    } finally {
      setLoading(false)
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

  const fetchSuggestedGroups = async () => {
    try {
      const response = await fetch('/api/groups/suggested')
      if (response.ok) {
        const data = await response.json()
        setSuggestedGroups(data.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Failed to fetch suggested groups:', error)
    }
  }

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/events/upcoming?limit=3')
      if (response.ok) {
        const data = await response.json()
        setUpcomingEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchActiveUsers = async () => {
    try {
      const response = await fetch('/api/community/online-users')
      if (response.ok) {
        const data = await response.json()
        setActiveUsers(data.slice(0, 8) || [])
      }
    } catch (error) {
      console.error('Failed to fetch active users:', error)
    }
  }

  const createPost = async (postData: any) => {
    const contentToPost = postData?.text || postContent;
    if (!contentToPost.trim() || posting) return

    setPosting(true)
    try {
      const response = await fetch('/api/community/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToPost,
          groupId: selectedGroupId || null,
          taggedUsers: postData?.taggedUsers || [],
          images: postData?.images || [],
          videos: postData?.videos || [],
          contentFormatted: postData?.contentFormatted || null,
          backgroundId: postData?.backgroundId || null,
        }),
      })

      if (response.ok) {
        setPostContent('')
        setSelectedGroupId('')
        fetchPosts()
        toast.success('Post berhasil dibuat!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal membuat post')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Gagal membuat post')
    } finally {
      setPosting(false)
    }
  }

  const handleReact = async (postId: string, reactionType: string) => {
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

  // Post Actions Functions
  const handleEditPost = (post: Post) => {
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
      formData.append('content', postData.text || editingPost?.content || '')

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
        formData.append('images', JSON.stringify(editingPost?.images || []))
      }

      const response = await fetch(`/api/posts/${editingPost?.id}`, {
        method: 'PATCH',
        body: formData,
      })

      if (response.ok) {
        toast.success('Postingan berhasil diupdate')
        setEditingPost(null)
        setEditContent('')
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
      setActionLoading(false)
    }
  }

  const handleDeletePost = async () => {
    if (!deletingPost) return

    try {
      const response = await fetch(`/api/posts/${deletingPost}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Postingan berhasil dihapus')
        setDeletingPost(null)
        fetchPosts()
      } else {
        toast.error('Gagal menghapus postingan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleSavePost = async (postId: string) => {
    console.log('handleSavePost called for:', postId)
    
    // Optimistic update
    setSavingPost(prev => ({ ...prev, [postId]: true }))
    const wasSaved = savedPosts[postId]
    console.log('Current saved status:', wasSaved)
    setSavedPosts(prev => ({ ...prev, [postId]: !wasSaved }))

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      })
      
      console.log('Save API response:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Save API data:', data)
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

  // Share function
  const handleSharePost = async (post: Post) => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`
    const shareText = `${post.author.name}: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Postingan dari Eksporyuk',
          text: shareText,
          url: shareUrl,
        })
        toast.success('Berhasil dibagikan!')
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          // Fallback to clipboard
          copyToClipboard(shareUrl)
        }
      }
    } else {
      // Fallback for desktop
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link disalin ke clipboard!', {
        description: 'Anda dapat menempelkan link ini di mana saja'
      })
    }).catch(() => {
      toast.error('Gagal menyalin link')
    })
  }

  const handleReactToPost = async (postId: string, type: string) => {
    try {
      await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      fetchPosts()
    } catch (error) {
      console.error('Error reacting to post:', error)
      toast.error('Gagal memberikan reaksi')
    }
  }

  const joinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchSuggestedGroups()
        toast.success('Berhasil bergabung dengan grup!')
      }
    } catch (error) {
      console.error('Failed to join group:', error)
      toast.error('Gagal bergabung dengan grup')
    }
  }

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'PUBLIC':
        return <Globe className="w-3 h-3" />
      case 'PRIVATE':
        return <Lock className="w-3 h-3" />
      case 'PREMIUM':
        return <Crown className="w-3 h-3" />
      default:
        return <Globe className="w-3 h-3" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: idLocale })
    } catch {
      return dateString
    }
  }

  if (!session) {
    return (
      <ResponsivePageWrapper>
        <div className="container max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Login Required</h3>
              <p className="text-muted-foreground text-center">
                Silakan login untuk melihat feed komunitas
              </p>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <style jsx global>{mentionStyles}</style>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-md">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                    Feed Komunitas
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Tetap terhubung dengan komunitas ekspor dan aktivitas terbaru
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Menu */}
          <div className="mb-6 sm:mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/community/feed">
              <Button variant="default" size="sm" className="whitespace-nowrap shadow-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Feed
              </Button>
            </Link>
            <Link href="/community/groups">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" />
                Grup
              </Button>
            </Link>
            <Link href="/community/events">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Calendar className="w-4 h-4 mr-2" />
                Event
              </Button>
            </Link>
            <Link href="/member-directory">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" />
                Member Directory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              {/* Feed Banner at Top */}
              <FeedBanner index={0} />

              {/* Create Post Card */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Buat Postingan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RichTextEditor
                    value={postContent}
                    onChange={setPostContent}
                    onSubmit={createPost}
                    placeholder="Apa yang ingin Anda bagikan hari ini?"
                    showSubmitButton={true}
                    submitButtonText={posting ? "Memposting..." : "Kirim"}
                    submitButtonDisabled={!postContent.trim() || posting}
                    allowScheduling={false}
                    allowPolls={false}
                    allowEvents={false}
                    userAvatar={session?.user?.avatar || ''}
                    userName={session?.user?.name || ''}
                  />
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <div className="space-y-4 sm:space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2">Memuat feed...</span>
                    </div>
                  ) : posts.length === 0 ? (
                    <Card className="border-0 shadow-md">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="text-center">
                          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Postingan</h3>
                          <p className="text-gray-600">
                            Jadilah yang pertama membuat postingan di komunitas!
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post, index) => (
                      <Fragment key={post.id}>
                        {/* Insert banner every 5 posts */}
                        {index > 0 && index % 5 === 4 && <FeedBanner index={index} />}
                        
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-3 flex-1">
                              <UserHoverCard userId={post.author.id} username={post.author.name}>
                                <Avatar className="cursor-pointer w-10 h-10 sm:w-12 sm:h-12">
                                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </UserHoverCard>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <UserHoverCard userId={post.author.id} username={post.author.name}>
                                    <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                                      {post.author.name}
                                    </span>
                                  </UserHoverCard>
                                  {post.author.role === 'ADMIN' && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">Admin</Badge>
                                  )}
                                  {post.author.role === 'MENTOR' && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">Mentor</Badge>
                                  )}
                                  {post.author.city && (
                                    <MemberLocationBadge
                                      city={post.author.city}
                                      province={post.author.province}
                                      locationVerified={post.author.locationVerified}
                                      size="sm"
                                      showLink={false}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(post.createdAt)}
                                  </p>
                                  {post.group && (
                                    <>
                                      <span className="text-xs text-gray-300">•</span>
                                      <Link
                                        href={`/community/groups/${post.group.slug}`}
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        {getGroupTypeIcon(post.group.type)}
                                        <span>{post.group.name}</span>
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Post Menu Dropdown */}
                            {session?.user?.id === post.author.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Postingan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeletingPost(post.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus Postingan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Post Content with Background */}
                        {post.backgroundId && !post.images?.length ? (
                          // Post with background
                          (() => {
                            const bg = getBackgroundById(post.backgroundId);
                            return bg ? (
                              <div
                                className="rounded-xl p-6 mb-4 min-h-[150px] flex items-center justify-center"
                                style={bg.style}
                              >
                                <p
                                  className="text-center text-lg font-medium leading-relaxed whitespace-pre-wrap"
                                  style={{ color: bg.textColor }}
                                >
                                  {post.content}
                                </p>
                              </div>
                            ) : (
                              <RenderPostContent 
                                content={post.content}
                                contentFormatted={post.contentFormatted}
                                className="mb-4 text-gray-800"
                              />
                            );
                          })()
                        ) : (
                          // Regular post content
                          <RenderPostContent 
                            content={post.content}
                            contentFormatted={post.contentFormatted}
                            className="mb-4 text-gray-800"
                          />
                        )}

                        {/* Post Images */}
                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 mb-4 rounded-lg overflow-hidden ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.images.slice(0, 4).map((image, idx) => (
                              <div key={idx} className="relative h-64 group">
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

                        {/* Reactions Summary */}
                        {postReactions[post.id]?.counts && Object.values(postReactions[post.id].counts).some((count: any) => count > 0) && (
                          <div className="mb-3">
                            <ReactionSummary
                              reactionsCount={postReactions[post.id].counts}
                              onViewReactions={() => {}}
                            />
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-6">
                            <ReactionPicker
                              onReact={(type) => {
                                const currentReaction = postReactions[post.id]?.currentReaction
                                if (currentReaction === type) {
                                  handleRemoveReact(post.id)
                                } else if (currentReaction) {
                                  handleRemoveReact(post.id)
                                  setTimeout(() => handleReact(post.id, type), 300)
                                } else {
                                  handleReact(post.id, type)
                                }
                              }}
                              currentUserReaction={postReactions[post.id]?.currentReaction || null}
                            />
                            
                            <button 
                              onClick={() => toggleComments(post.id)}
                              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {post._count.comments}
                              </span>
                            </button>
                            
                            <button 
                              onClick={() => handleSharePost(post)}
                              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                            
                            <button 
                              onClick={() => handleSavePost(post.id)}
                              disabled={savingPost[post.id]}
                              className={`flex items-center gap-2 transition-colors ml-auto ${
                                savedPosts[post.id]
                                  ? 'text-yellow-600 hover:text-yellow-700'
                                  : 'text-gray-600 hover:text-yellow-600'
                              }`}
                            >
                              {savedPosts[post.id] ? (
                                <BookmarkCheck className="w-5 h-5 fill-current" />
                              ) : (
                                <Bookmark className="w-5 h-5" />
                              )}
                            </button>
                          </div>

                          {/* Comment Section */}
                          {expandedComments[post.id] && (
                            <div className="pt-4 border-t border-gray-100">
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
                        </div>
                      </CardContent>
                    </Card>
                  </Fragment>
                    ))
                  )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sidebar Banner */}
              <SidebarBanner />
              
              {/* Member Directory Link */}
              <MemberDirectoryLink />

              {/* Nearby Members */}
              <NearbyMembersWidget limit={5} />

              {/* Active Users Card */}
              {activeUsers.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span>Online Sekarang</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {activeUsers.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Groups Card */}
              {suggestedGroups.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      Saran Grup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestedGroups.map(group => (
                        <div key={group.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={group.avatar} alt={group.name} />
                            <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/community/groups/${group.slug}`}
                              className="font-semibold text-sm text-gray-900 hover:text-blue-600 block truncate"
                            >
                              {group.name}
                            </Link>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {group.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="w-3 h-3" />
                                <span>{group._count.members} member</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => joinGroup(group.id)}
                                className="text-xs h-7 px-2 hover:bg-blue-50"
                              >
                                Gabung
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Events Card */}
              {upcomingEvents.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      Acara Mendatang
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingEvents.map(event => (
                        <div key={event.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDate(event.startDate)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 truncate">{event.location}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Post Dialog */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
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
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPost} onOpenChange={() => setDeletingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Postingan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPost(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsivePageWrapper>
  )
}