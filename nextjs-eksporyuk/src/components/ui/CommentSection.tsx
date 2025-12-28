'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, MoreVertical, Trash2, Reply, Heart, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'
import { Button } from './button'
import { Textarea } from './textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: string
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
  // Support both naming conventions
  replies?: Comment[]
  other_PostComment?: Comment[]
  parentId: string | null
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  onRefresh: () => void
}

export default function CommentSection({ postId, comments, onRefresh }: CommentSectionProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)

  // Get replies from comment (support both naming conventions)
  const getReplies = (comment: Comment): Comment[] => {
    return comment.replies || comment.other_PostComment || []
  }

  // Auto-expand all replies by default
  useEffect(() => {
    const expandAll: Record<string, boolean> = {}
    const processComments = (commentList: Comment[]) => {
      commentList.forEach(comment => {
        const replies = getReplies(comment)
        if (replies.length > 0) {
          expandAll[comment.id] = true
          processComments(replies)
        }
      })
    }
    processComments(comments)
    setExpandedReplies(expandAll)
  }, [comments])

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

  // Render mentions with links
  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1)
        return (
          <Link
            key={index}
            href={`/${username}`}
            className="text-blue-600 hover:underline font-semibold"
          >
            {part}
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
              {renderContentWithMentions(comment.content)}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-4 mt-2">
              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors group">
                <Heart className="h-4 w-4 group-hover:fill-red-500" />
                <span>Suka</span>
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
              <div className="mt-3 space-y-3">
                {replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Get top-level comments only
  const topLevelComments = comments.filter(c => !c.parentId)

  return (
    <div className="space-y-4">
      {/* New Comment Input - Threads/IG style */}
      {session?.user && (
        <div className="flex gap-3 items-start">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={(session.user as any)?.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis komentar... (gunakan @username untuk mention)"
                className="flex-1 bg-transparent border-0 resize-none min-h-[24px] max-h-[120px] text-sm focus:ring-0 focus-visible:ring-0 p-0 placeholder:text-gray-400"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="rounded-full px-6 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Mengirim...
                  </span>
                ) : (
                  'Kirim Komentar'
                )}
              </Button>
            </div>
          </div>
        </div>
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
