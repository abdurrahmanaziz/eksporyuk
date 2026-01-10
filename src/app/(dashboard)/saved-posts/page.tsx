'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Bookmark, Search, X, Heart, MessageCircle, Share2, 
  Trash2, AlertCircle, Loader2 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

interface SavedPost {
  id: string
  savedAt: string
  post: {
    id: string
    content: string
    images: any
    type: string
    createdAt: string
    groupId?: string
    author: {
      id: string
      name: string
      avatar?: string
    }
    group?: {
      id: string
      name: string
      slug: string
    }
    _count: {
      likes: number
      comments: number
    }
  }
}

export default function SavedPostsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [unsavingId, setUnsavingId] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchSavedPosts()
    }
  }, [session])

  useEffect(() => {
    // Filter posts based on search query
    if (searchQuery.trim()) {
      const filtered = savedPosts.filter(item =>
        item.post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.post.group?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredPosts(filtered)
    } else {
      setFilteredPosts(savedPosts)
    }
  }, [searchQuery, savedPosts])

  const fetchSavedPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/me/saved-posts')
      
      if (!response.ok) {
        // Don't throw error for 404/401, just show empty state
        console.error('Failed to fetch saved posts:', response.status)
        setSavedPosts([])
        setFilteredPosts([])
        return
      }

      const data = await response.json()
      setSavedPosts(data.savedPosts || [])
      setFilteredPosts(data.savedPosts || [])
    } catch (error) {
      console.error('Error fetching saved posts:', error)
      // Silent fail - show empty state
      setSavedPosts([])
      setFilteredPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (postId: string) => {
    try {
      setUnsavingId(postId)
      
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to unsave post')
      }

      // Remove from local state
      setSavedPosts(prev => prev.filter(item => item.post.id !== postId))
      toast.success('Postingan dihapus dari simpanan')
    } catch (error) {
      console.error('Error unsaving post:', error)
      toast.error('Gagal menghapus simpanan')
    } finally {
      setUnsavingId(null)
    }
  }

  const handlePostClick = (groupSlug?: string, postId?: string) => {
    if (groupSlug) {
      router.push(`/community/groups/${groupSlug}?post=${postId}`)
    }
  }

  if (!session) {
    return (
      <ResponsivePageWrapper>
        <div className="w-full py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Login Required</h3>
              <p className="text-muted-foreground text-center mb-4">
                Silakan login untuk melihat postingan tersimpan
              </p>
              <Button onClick={() => router.push('/login')}>
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="w-full py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Postingan Tersimpan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredPosts.length} postingan disimpan
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari postingan tersimpan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {searchQuery ? (
              <>
                <Search className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ditemukan</h3>
                <p className="text-muted-foreground text-center">
                  Tidak ada postingan yang cocok dengan pencarian "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Postingan Tersimpan</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Simpan postingan penting untuk dibaca nanti
                </p>
                <Button onClick={() => router.push('/community')}>
                  Jelajahi Komunitas
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((item) => (
            <Card 
              key={item.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handlePostClick(item.post.group?.slug, item.post.id)}
            >
              <CardContent className="pt-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={item.post.author.avatar} />
                      <AvatarFallback>
                        {item.post.author.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.post.author.name}</p>
                      <div className="text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(item.post.createdAt), {
                            addSuffix: true,
                            locale: idLocale
                          })}
                        </span>
                      </div>
                      {item.post.group && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                            <span>di {item.post.group.name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnsave(item.post.id)
                    }}
                    disabled={unsavingId === item.post.id}
                  >
                    {unsavingId === item.post.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </Button>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-sm whitespace-pre-wrap line-clamp-4">
                    {item.post.content}
                  </p>
                </div>

                {/* Post Images */}
                {item.post.images && Array.isArray(item.post.images) && item.post.images.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${
                    item.post.images.length === 1 ? 'grid-cols-1' :
                    item.post.images.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {item.post.images.slice(0, 3).map((img: string, idx: number) => (
                      <div 
                        key={idx}
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                      >
                        <img 
                          src={img} 
                          alt={`Image ${idx + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    <span>{item.post._count.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span>{item.post._count.comments}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto text-xs">
                    <Bookmark className="w-4 h-4 fill-blue-600 text-blue-600" />
                    <span>
                      Disimpan {item.savedAt ? formatDistanceToNow(new Date(item.savedAt), {
                        addSuffix: true,
                        locale: idLocale
                      }) : 'baru saja'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </ResponsivePageWrapper>
  )
}
