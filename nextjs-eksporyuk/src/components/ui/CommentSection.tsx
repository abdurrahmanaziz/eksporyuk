'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, MoreVertical, Trash2, Reply, Heart, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'
import { Button } from './button'
import { Textarea } from './textarea'
import CommentInput from './CommentInput'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { CommentMedia } from './CommentDisplay'

interface Comment {
  id: string
  content: string
  createdAt: string
  images?: string[] | null
  videos?: string[] | null
  documents?: string[] | null
  mentionedUsers?: Array<{id: string, username: string, name: string}> | null
  user?: {
    id: string
    name: string
    avatar: string | null
    username: string | null
  }
  User?: {
    id: string
    name: string
    avatar: string | null
    username: string | null
  }
  author?: {
    id: string
    name: string
    avatar: string | null
    username: string | null
  }
  _count?: {
    likes: number
    replies: number
  }
  reactionsCount?: Record<string, number>
  CommentReaction?: Array<{
    id: string
    userId: string
    type: string
  }>
  // Support both naming conventions
  replies?: Comment[]
  other_PostComment?: Comment[]
  parentId: string | null
}

// Maximum depth for displaying nested replies
const MAX_DISPLAY_DEPTH = 5

interface CommentSectionProps {
  postId: string
  comments?: Comment[]
  onRefresh?: () => void
  onCommentAdded?: () => void
}

export default function CommentSection({ postId, comments: propComments, onRefresh, onCommentAdded }: CommentSectionProps) {
  // Use internal state if comments not provided
  const [internalComments, setInternalComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const comments = propComments ?? internalComments
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)

  // Fetch comments if not provided as prop
  const fetchComments = async () => {
    if (propComments) return // Skip if comments are provided
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setInternalComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!propComments && postId) {
      fetchComments()
    }
  }, [postId, propComments])

  // Handle refresh - either call parent's onRefresh or fetch internally
  const handleRefresh = async () => {
    console.log('[CommentSection] Refreshing comments for postId:', postId)
    if (onRefresh) {
      onRefresh()
    } else {
      await fetchComments()
    }
    onCommentAdded?.()
  }

  // Get replies from comment (support both naming conventions)
  const getReplies = (comment: Comment): Comment[] => {
    return comment.replies || comment.other_PostComment || []
  }

  // Auto-expand all replies by default and initialize like states
  useEffect(() => {
    const expandAll: Record<string, boolean> = {}
    const initialLikes: Record<string, number> = {}
    const initialLiked: Record<string, boolean> = {}
    
    const processComments = (commentList: Comment[]) => {
      commentList.forEach(comment => {
        // Set initial like counts from reactionsCount
        if (comment.reactionsCount && typeof comment.reactionsCount === 'object') {
          const likeCount = (comment.reactionsCount as Record<string, number>)['LIKE'] || 0
          initialLikes[comment.id] = likeCount
        }
        
        // Check if current user has liked from CommentReaction array
        if (comment.CommentReaction && Array.isArray(comment.CommentReaction) && session?.user?.id) {
          const userLiked = comment.CommentReaction.some(r => r.userId === session.user?.id)
          initialLiked[comment.id] = userLiked
          // Also set count from CommentReaction if reactionsCount is not available
          if (!comment.reactionsCount && comment.CommentReaction) {
            initialLikes[comment.id] = (comment.CommentReaction || []).filter(r => r.type === 'LIKE').length
          }
        }
        
        const replies = getReplies(comment)
        if (replies.length > 0) {
          expandAll[comment.id] = true
          processComments(replies)
        }
      })
    }
    processComments(comments)
    setExpandedReplies(expandAll)
    setLikeCounts(initialLikes)
    setLikedComments(initialLiked)
  }, [comments, session?.user?.id])

  // Focus reply input when replying
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [replyingTo])

  // Handle mentions - extract @username patterns
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return

    setSubmitting(true)
    try {
      const mentions = extractMentions(newComment)
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          mentions,
        }),
      })

      if (response.ok) {
        setNewComment('')
        toast.success('Komentar berhasil ditambahkan!')
        onRefresh()
      } else {
        toast.error('Gagal menambahkan komentar')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !session?.user?.id) return

    setSubmitting(true)
    try {
      const mentions = extractMentions(replyContent)
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId,
          mentions,
        }),
      })

      if (response.ok) {
        setReplyContent('')
        setReplyingTo(null)
        toast.success('Balasan berhasil ditambahkan!')
        // Auto expand replies for parent
        setExpandedReplies(prev => ({ ...prev, [parentId]: true }))
        onRefresh()
      } else {
        toast.error('Gagal menambahkan balasan')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Yakin ingin menghapus komentar ini?')) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Komentar berhasil dihapus')
        onRefresh()
      } else {
        toast.error('Gagal menghapus komentar')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleReply = (commentId: string, username: string | null, name: string) => {
    setReplyingTo(commentId)
    setReplyContent(username ? `@${username} ` : '')
  }

  // Handle like comment
  const handleLikeComment = async (commentId: string) => {
    if (!session?.user?.id) {
      toast.error('Silakan login untuk menyukai komentar')
      return
    }

    // Optimistic update
    const wasLiked = likedComments[commentId]
    setLikedComments(prev => ({ ...prev, [commentId]: !wasLiked }))
    setLikeCounts(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (wasLiked ? -1 : 1)
    }))

    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'LIKE' }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('Comment reaction error:', data)
        // Revert on error
        setLikedComments(prev => ({ ...prev, [commentId]: wasLiked }))
        setLikeCounts(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 0) + (wasLiked ? 1 : -1)
        }))
        toast.error(data.error || 'Gagal menyukai komentar')
      } else {
        // Update with actual count from server
        if (data.reactionsCount?.LIKE !== undefined) {
          setLikeCounts(prev => ({
            ...prev,
            [commentId]: data.reactionsCount.LIKE
          }))
        }
      }
    } catch (error) {
      // Revert on error
      setLikedComments(prev => ({ ...prev, [commentId]: wasLiked }))
      setLikeCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + (wasLiked ? 1 : -1)
      }))
      console.error('Error liking comment:', error)
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  const formatRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: false, locale: idLocale })
    } catch {
      return date
    }
  }

  // Render mentions with links - Facebook style with soft gradient
  const renderContentWithMentions = (content: string, mentionedUsers?: Array<{id: string, username: string, name: string}> | null) => {
    // Build username to name map
    const userMap = new Map<string, string>()
    if (mentionedUsers) {
      mentionedUsers.forEach(u => {
        userMap.set(u.username.toLowerCase(), u.name)
      })
    }
    
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const usernameText = part.substring(1)
        // Get name from mentionedUsers map, fallback to username
        const displayName = userMap.get(usernameText.toLowerCase()) || usernameText
        
        return (
          <Link
            key={index}
            href={`/${usernameText}`}
            className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-sm transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
              color: '#3b82f6',
            }}
            title={`@${username}`}
          >
            {displayName}
          </Link>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Get comment author (support multiple formats)
  const getCommentAuthor = (comment: Comment) => {
    return comment.author || comment.user || comment.User
  }

  const renderComment = (comment: Comment, depth = 0) => {
    const commentAuthor = getCommentAuthor(comment)
    if (!commentAuthor) return null
    
    const replies = getReplies(comment)
    const hasReplies = replies.length > 0
    const isExpanded = expandedReplies[comment.id]
    const isReply = depth > 0

    return (
      <div key={comment.id} className={`${isReply ? '' : 'pb-4'}`}>
        <div className="flex gap-3">
          {/* Avatar with thread line */}
          <div className="flex flex-col items-center">
            <Link href={`/${commentAuthor.username || commentAuthor.id}`}>
              <Avatar className={`${isReply ? 'h-8 w-8' : 'h-10 w-10'} ring-2 ring-white dark:ring-gray-900`}>
                <AvatarImage src={commentAuthor.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                  {commentAuthor.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
            {/* Thread line connecting to replies */}
            {hasReplies && isExpanded && (
              <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2 min-h-[20px]"></div>
            )}
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            {/* Header: name + time */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/${commentAuthor.username || commentAuthor.id}`}
                className="font-semibold text-sm hover:underline text-gray-900 dark:text-gray-100"
              >
                {commentAuthor.name}
              </Link>
              {commentAuthor.username && (
                <span className="text-xs text-gray-500">@{commentAuthor.username}</span>
              )}
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
              
              {/* Delete menu for own comments */}
              {session?.user?.id === commentAuthor.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto opacity-50 hover:opacity-100">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Comment text */}
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words leading-relaxed">
              {renderContentWithMentions(comment.content, comment.mentionedUsers)}
            </p>

            {/* Comment media attachments */}
            {(comment.images?.length || comment.videos?.length || comment.documents?.length) && (
              <CommentMedia 
                images={comment.images || undefined}
                videos={comment.videos || undefined}
                documents={comment.documents || undefined}
                commentContent={comment.content}
              />
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-4 mt-2">
              <button 
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  likedComments[comment.id] 
                    ? 'text-red-500' 
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${likedComments[comment.id] ? 'fill-red-500' : ''}`} />
                <span>{likeCounts[comment.id] ? `${likeCounts[comment.id]} Suka` : 'Suka'}</span>
              </button>
              <button
                onClick={() => handleReply(comment.id, commentAuthor.username, commentAuthor.name)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span>Balas</span>
              </button>
              {hasReplies && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Sembunyikan {replies.length} balasan</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Lihat {replies.length} balasan</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Inline Reply Input */}
            {replyingTo === comment.id && (
              <div className="flex gap-2 mt-3 items-start">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={(session?.user as any)?.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Balas ${commentAuthor.name}...`}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitReply(comment.id)
                      }
                      if (e.key === 'Escape') {
                        setReplyingTo(null)
                        setReplyContent('')
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || submitting}
                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
              </div>
            )}

            {/* Nested Replies */}
            {hasReplies && isExpanded && (
              <div className={`mt-3 space-y-3 ${depth < MAX_DISPLAY_DEPTH - 1 ? 'pl-2 border-l-2 border-gray-100 dark:border-gray-800' : ''}`}>
                {depth < MAX_DISPLAY_DEPTH ? (
                  replies.map(reply => renderComment(reply, depth + 1))
                ) : (
                  <button
                    onClick={() => {
                      // Could navigate to full thread view or expand inline
                      toast.info('Lihat thread lengkap untuk balasan lebih dalam')
                    }}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Lihat {replies.length} balasan lainnya...
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Count total replies recursively
  const countAllReplies = (comment: Comment): number => {
    const replies = getReplies(comment)
    return replies.length + replies.reduce((acc, reply) => acc + countAllReplies(reply), 0)
  }

  // Get top-level comments only
  const topLevelComments = (comments || []).filter(c => !c.parentId)

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      )}

      {/* New Comment Input - Using enhanced CommentInput with media & mentions */}
      {session?.user && (
        <CommentInput 
          postId={postId}
          onCommentAdded={() => {
            handleRefresh()
            toast.success('Komentar berhasil ditambahkan')
          }}
        />
      )}

      {/* Comments List */}
      <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Belum ada komentar</p>
            <p className="text-gray-400 text-xs mt-1">Jadilah yang pertama berkomentar!</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {topLevelComments.map(comment => (
              <div key={comment.id} className="group">
                {renderComment(comment)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
