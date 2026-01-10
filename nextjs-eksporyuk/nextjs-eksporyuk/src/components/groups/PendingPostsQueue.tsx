'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface PendingPostsQueueProps {
  groupId: string
}

export default function PendingPostsQueue({ groupId }: PendingPostsQueueProps) {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadPendingPosts()
  }, [groupId])

  const loadPendingPosts = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/pending-posts`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Load pending posts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (postId: string, action: 'approve' | 'reject') => {
    setProcessing(postId)
    try {
      const res = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        toast.success(
          action === 'approve' 
            ? 'Postingan disetujui' 
            : 'Postingan ditolak'
        )
        setPosts(posts.filter(p => p.id !== postId))
      } else {
        toast.error('Gagal memproses postingan')
      }
    } catch (error) {
      console.error('Action error:', error)
      toast.error('Gagal memproses postingan')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Memuat...</div>
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Tidak ada postingan yang menunggu persetujuan</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Antrian Persetujuan
            </CardTitle>
            <Badge variant="secondary">
              {posts.length} postingan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Author */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.author?.avatar || ''} />
                        <AvatarFallback>
                          {post.author?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{post.author?.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: idLocale
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      Menunggu
                    </Badge>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                    {post.image && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                        <ImageIcon className="w-4 h-4" />
                        <span>Dengan gambar</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={() => handleAction(post.id, 'approve')}
                      disabled={processing === post.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Setujui
                    </Button>
                    <Button
                      onClick={() => handleAction(post.id, 'reject')}
                      disabled={processing === post.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Tolak
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
