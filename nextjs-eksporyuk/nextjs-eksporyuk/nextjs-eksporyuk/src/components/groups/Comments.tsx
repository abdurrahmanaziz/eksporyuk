'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
    role: string
  }
}

interface CommentsProps {
  postId: string
  commentCount: number
  isOpen: boolean
  onClose: () => void
}

export default function Comments({ postId, commentCount, isOpen, onClose }: CommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments()
    }
  }, [isOpen, postId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || posting) return

    try {
      setPosting(true)
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post comment')
      }

      const data = await response.json()
      setComments([data.comment, ...comments])
      setNewComment('')
    } catch (error) {
      console.error('Error posting comment:', error)
      alert(error instanceof Error ? error.message : 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Baru saja'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} hari yang lalu`
    } else {
      return date.toLocaleDateString('id-ID')
    }
  }

  if (!isOpen) return null

  return (
    <div className="border-t mt-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">
          Komentar ({commentCount})
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Tutup
        </Button>
      </div>

      {/* Comment Form */}
      {session && (
        <form onSubmit={handleSubmitComment} className="mb-4">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session.user?.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {session.user?.name?.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Tulis komentar..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || posting}
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Kirim
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Memuat komentar...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Belum ada komentar</p>
            {!session && (
              <p className="text-xs text-gray-400 mt-1">
                Login untuk memberikan komentar pertama
              </p>
            )}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback className="text-xs">
                  {comment.user.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.user.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-900">{comment.content}</p>
                </div>
                <span className="text-xs text-gray-500 ml-3 mt-1 inline-block">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}