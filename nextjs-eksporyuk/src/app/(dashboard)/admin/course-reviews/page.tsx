'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Star, Check, X, Trash2, Search, Filter, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

type Review = {
  id: string
  rating: number
  review: string
  isApproved: boolean
  isVerified: boolean
  helpfulCount: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  course: {
    id: string
    title: string
    slug?: string
  }
}

type Stats = {
  total: number
  approved: number
  pending: number
}

export default function AdminCourseReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, pending: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showModerateDialog, setShowModerateDialog] = useState(false)
  const [moderateAction, setModerateAction] = useState<'approve' | 'reject'>('approve')
  const [moderationNote, setModerationNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        toast.error('Unauthorized access')
      } else {
        fetchReviews()
      }
    }
  }, [status, session, page, filterStatus, filterRating, searchQuery])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (filterStatus !== 'all') {
        params.append('isApproved', filterStatus === 'approved' ? 'true' : 'false')
      }
      if (filterRating !== 'all') {
        params.append('rating', filterRating)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/admin/course-reviews?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast.error('Failed to load reviews')
      }
    } catch (error) {
      console.error('Fetch reviews error:', error)
      toast.error('Error loading reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = (review: Review, action: 'approve' | 'reject') => {
    setSelectedReview(review)
    setModerateAction(action)
    setModerationNote('')
    setShowModerateDialog(true)
  }

  const confirmModerate = async () => {
    if (!selectedReview) return
    
    try {
      setProcessing(true)
      const res = await fetch(`/api/admin/course-reviews/${selectedReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: moderateAction,
          moderationNote
        })
      })

      if (res.ok) {
        toast.success(`Review ${moderateAction}d successfully`)
        setShowModerateDialog(false)
        fetchReviews()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to moderate review')
      }
    } catch (error) {
      console.error('Moderate error:', error)
      toast.error('Error moderating review')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = (review: Review) => {
    setSelectedReview(review)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedReview) return
    
    try {
      setProcessing(true)
      const res = await fetch(`/api/admin/course-reviews/${selectedReview.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Review deleted successfully')
        setShowDeleteDialog(false)
        fetchReviews()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Error deleting review')
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsivePageWrapper>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Course Reviews</h1>
        <p className="text-muted-foreground mt-1">Manage and moderate course reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, course, or review content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">No reviews found</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {review.user.avatar ? (
                      <img src={review.user.avatar} alt={review.user.name} className="w-full h-full rounded-full" />
                    ) : (
                      <span className="font-semibold">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{review.user.name}</p>
                          {review.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {review.isApproved ? (
                            <Badge className="bg-green-600">Approved</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.user.email}</p>
                        <p className="text-sm font-medium text-primary mt-1">{review.course.title}</p>
                      </div>
                      <div className="flex gap-2">
                        {!review.isApproved && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleModerate(review, 'approve')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {review.isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(review, 'reject')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(review)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('id-ID')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • {review.helpfulCount} helpful votes
                      </span>
                    </div>
                    <p className="text-sm">{review.review}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Moderate Dialog */}
      <Dialog open={showModerateDialog} onOpenChange={setShowModerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderateAction === 'approve' ? 'Approve' : 'Reject'} Review
            </DialogTitle>
            <DialogDescription>
              {moderateAction === 'approve' 
                ? 'This review will be visible to all users.'
                : 'This review will be hidden from users.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Moderation Note (Optional)
              </label>
              <Textarea
                placeholder="Add a note about this moderation action..."
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModerateDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmModerate}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
