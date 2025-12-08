'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, X, Image as ImageIcon, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateStoryProps {
  groupId: string
  onStoryCreated?: () => void
}

export default function CreateStory({ groupId, onStoryCreated }: CreateStoryProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && !image) || loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type: 'STORY',
          images: image ? [image] : []
        })
      })

      if (res.ok) {
        setContent('')
        setImage(null)
        setOpen(false)
        onStoryCreated?.()
      } else {
        alert('Failed to create story')
      }
    } catch (error) {
      console.error('Create story error:', error)
      alert('Failed to create story')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Story
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Story (24 hours)</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">Story akan hilang dalam 24 jam</p>
                </div>
              </div>

              {/* Image Preview */}
              {image && (
                <div className="relative">
                  <img
                    src={image}
                    alt="Story preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Content */}
              <Textarea
                placeholder="Apa yang terjadi?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
              />

              {/* Actions */}
              <div className="flex justify-between">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="story-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('story-image')?.click()}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Photo
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={(!content.trim() && !image) || loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Posting...' : 'Post Story'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
