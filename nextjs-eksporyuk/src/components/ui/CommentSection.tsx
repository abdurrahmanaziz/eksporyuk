'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, MoreVertical, Trash2, Reply, Heart } from 'lucide-react'
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
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand all replies by default when comments load
  useEffect(() => {
    const expandAll: Record<string, boolean> = {}
    const setRepliesExpanded = (commentList: Comment[]) => {
      comments.forEach(comment => {
        if (comment.other_PostComment && comment.other_PostComment.length > 0) {
          expandAll[comment.id] = true
          setRepliesExpanded(comment.other_PostComment)
        }
      })
    }
    setRepliesExpanded(comments)
    setShowReplies(prev => ({ ...prev, ...expandAll }))
  }, [comments])

  // Auto-resize textarea
  const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto'
      element.style.height = element.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight(textareaRef.current)
  }, [newComment, replyContent])

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
        toast.success('Komentar ditambahkan')
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
        toast.success('Balasan ditambahkan')
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
        toast.success('Komentar dihapus')
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
    // Use username if available, otherwise use name without @mention
    if (username) {
      setReplyContent(`@${username} `)
    } else {
      setReplyContent('') // Don't add @mention if no username
    }
  }

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  const formatRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale })
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
            className="text-blue-600 hover:underline font-medium"
          >
            {part}
          </Link>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const renderComment = (comment: Comment, depth = 0) => {
    const commentAuthor = comment.author || comment.user
    if (!commentAuthor) return null
    
    const isReply = depth > 0
    const maxDepth = 3 // Maximum nesting level

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'mt-3' : 'mb-4'}`}
      >
        <div className="flex gap-3">
          {/* Thread line for nested replies */}
          {isReply && (
            <div className="flex items-stretch">
              <div className="w-8 flex justify-center">
                <div className="w-0.5 bg-gray-200 dark:bg-gray-700 h-full"></div>
              </div>
            </div>
          )}
          
          <Link href={`/${commentAuthor.username}`}>
            <Avatar className={isReply ? "h-7 w-7" : "h-8 w-8"}>
              <AvatarImage src={commentAuthor.avatar || undefined} />
              <AvatarFallback className="bg-blue-500 text-white text-xs">
                {commentAuthor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
              <div className="flex items-start justify-between">
                <Link
                  href={`/${commentAuthor.username}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {commentAuthor.name}
                </Link>
                
                {session?.user?.id === commentAuthor.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
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
              
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                {renderContentWithMentions(comment.content)}
              </p>
            </div>

            <div className="flex items-center gap-4 mt-1 px-2">
              <button className="text-xs text-muted-foreground hover:text-blue-600 transition-colors">
                Suka
              </button>
              <button
                onClick={() => handleReply(comment.id, commentAuthor.username, commentAuthor.name)}
                className="text-xs text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Reply className="h-3 w-3" />
                Balas
              </button>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {/* Reply Input - show inline when replying to this comment */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session?.user?.avatar || undefined} />
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Balas ${commentAuthor.name}...`}
                    className="min-h-[60px] text-sm resize-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitReply(comment.id)
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || submitting}
                    >
                      {submitting ? 'Mengirim...' : 'Kirim'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies - rendered with indentation */}
            {comment.replies && comment.replies.length > 0 && (
              <div className={`mt-2 ${depth < maxDepth ? 'ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : 'ml-2'}`}>
                {!showReplies[comment.id] && comment.replies.length > 0 && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mb-2"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Lihat {comment.replies.length} balasan
                  </button>
                )}

                {showReplies[comment.id] && (
                  <>
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 mb-2"
                    >
                      Sembunyikan balasan
                    </button>
                    {comment.replies.map(reply => renderComment(reply, depth + 1))}
                  </>
                )}
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
      {/* New Comment Input */}
      {session?.user && (
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session.user.avatar || undefined} />
            <AvatarFallback className="bg-blue-500 text-white">
              {session.user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar... (gunakan @username untuk mention)"
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                {submitting ? 'Mengirim...' : 'Kirim Komentar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Belum ada komentar. Jadilah yang pertama berkomentar!
          </p>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}
