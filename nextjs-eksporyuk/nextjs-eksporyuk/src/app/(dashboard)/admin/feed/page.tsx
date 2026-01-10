'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Users,
  Heart,
  Eye,
  Flag,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Pin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Video,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface Post {
  id: string
  content: string
  type: string
  mediaUrls: string[]
  author: {
    id: string
    name: string
    avatar: string | null
    role: string
  }
  group: {
    id: string
    name: string
  } | null
  likesCount: number
  commentsCount: number
  viewsCount: number
  isPinned: boolean
  isReported: boolean
  reportCount: number
  status: string
  createdAt: string
}

interface FeedStats {
  totalPosts: number
  postsToday: number
  reportedPosts: number
  pendingModeration: number
}

export default function AdminFeedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<FeedStats | null>(null)
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({
        tab,
        search: searchQuery,
        group: filterGroup,
      })
      const res = await fetch(`/api/admin/feed?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPosts(data.posts || [])
      setStats(data.stats)
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tab, searchQuery, filterGroup])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchData()
    }
  }, [session, fetchData])

  const handleDeletePost = async () => {
    if (!selectedPost) return
    
    try {
      setActionLoading(true)
      const res = await fetch(`/api/admin/feed/${selectedPost.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Post berhasil dihapus')
      fetchData()
    } catch (error) {
      toast.error('Gagal menghapus post')
    } finally {
      setActionLoading(false)
      setShowDeleteDialog(false)
      setSelectedPost(null)
    }
  }

  const handleTogglePin = async (post: Post) => {
    try {
      const res = await fetch(`/api/admin/feed/${post.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !post.isPinned }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(post.isPinned ? 'Post di-unpin' : 'Post di-pin')
      fetchData()
    } catch (error) {
      toast.error('Gagal mengupdate post')
    }
  }

  const handleApprovePost = async (post: Post) => {
    try {
      const res = await fetch(`/api/admin/feed/${post.id}/approve`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success('Post disetujui')
      fetchData()
    } catch (error) {
      toast.error('Gagal menyetujui post')
    }
  }

  const handleDismissReport = async (post: Post) => {
    try {
      const res = await fetch(`/api/admin/feed/${post.id}/dismiss-report`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Laporan dibatalkan')
      fetchData()
    } catch (error) {
      toast.error('Gagal membatalkan laporan')
    }
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4" />
      case 'VIDEO':
        return <Video className="h-4 w-4" />
      case 'FILE':
        return <FileText className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
      </ResponsivePageWrapper>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Feed</h1>
          <p className="text-muted-foreground">Kelola postingan komunitas</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Post Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.postsToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dilaporkan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.reportedPosts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingModeration || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="reported">Dilaporkan</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari post..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Grup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Grup</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Posts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Grup</TableHead>
                    <TableHead className="text-center">Engagement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Tidak ada post</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-start gap-2 max-w-[300px]">
                            {getPostTypeIcon(post.type)}
                            <p className="text-sm line-clamp-2">{post.content}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.author.avatar || undefined} />
                              <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{post.author.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{post.group?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {post.likesCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> {post.commentsCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {post.viewsCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.isPinned && (
                              <Badge variant="secondary"><Pin className="h-3 w-3 mr-1" /> Pinned</Badge>
                            )}
                            {post.isReported && (
                              <Badge variant="destructive"><Flag className="h-3 w-3 mr-1" /> {post.reportCount}</Badge>
                            )}
                            {post.status === 'PENDING' && (
                              <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(post.createdAt), 'dd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleTogglePin(post)}>
                                <Pin className="h-4 w-4 mr-2" />
                                {post.isPinned ? 'Unpin' : 'Pin'} Post
                              </DropdownMenuItem>
                              {post.status === 'PENDING' && (
                                <DropdownMenuItem onClick={() => handleApprovePost(post)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {post.isReported && (
                                <DropdownMenuItem onClick={() => handleDismissReport(post)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Dismiss Report
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedPost(post)
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Post</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus post ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeletePost} disabled={actionLoading}>
              {actionLoading ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
