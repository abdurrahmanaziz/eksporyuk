'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { MoreVertical, Edit, Trash2, Pin, PinOff, Flag } from 'lucide-react'
import ReportDialog from '@/components/community/ReportDialog'

interface PostMenuProps {
  postId: string
  authorId: string
  content: string
  isPinned: boolean
  onPostUpdated?: () => void
  onPostDeleted?: () => void
}

export default function PostMenu({
  postId,
  authorId,
  content,
  isPinned,
  onPostUpdated,
  onPostDeleted
}: PostMenuProps) {
  const { data: session } = useSession()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [loading, setLoading] = useState(false)

  const isOwner = session?.user?.id === authorId
  const isAdmin = session?.user?.role === 'ADMIN'
  const canModerate = isAdmin // Bisa ditambah check moderator role

  const handleEdit = async () => {
    if (!editContent.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (res.ok) {
        setShowEditDialog(false)
        onPostUpdated?.()
      } else {
        alert('Failed to edit post')
      }
    } catch (error) {
      console.error('Edit post error:', error)
      alert('Failed to edit post')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        onPostDeleted?.()
      } else {
        alert('Failed to delete post')
      }
    } catch (error) {
      console.error('Delete post error:', error)
      alert('Failed to delete post')
    } finally {
      setLoading(false)
    }
  }

  const handlePin = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/pin`, {
        method: 'POST'
      })

      if (res.ok) {
        onPostUpdated?.()
      } else {
        alert('Failed to pin/unpin post')
      }
    } catch (error) {
      console.error('Pin post error:', error)
      alert('Failed to pin/unpin post')
    } finally {
      setLoading(false)
    }
  }

  const handleReport = () => {
    setShowReportDialog(true)
  }

  if (!session) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Owner actions */}
          {isOwner && (
            <>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Postingan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Postingan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Moderator actions */}
          {canModerate && (
            <>
              <DropdownMenuItem onClick={handlePin}>
                {isPinned ? (
                  <>
                    <PinOff className="w-4 h-4 mr-2" />
                    Lepas Pin
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-2" />
                    Sematkan Postingan
                  </>
                )}
              </DropdownMenuItem>
              {!isOwner && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Postingan
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Report action (for non-owners) */}
          {!isOwner && (
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="w-4 h-4 mr-2" />
              Laporkan Postingan
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Postingan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className="resize-none"
              placeholder="Apa yang ingin Anda bagikan?"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editContent.trim() || loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        type="POST"
        targetId={postId}
      />
    </>
  )
}
