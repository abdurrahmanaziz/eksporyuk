'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RenderPostContent } from '@/components/community/RenderPostContent'
import { ReactionPicker, ReactionSummary } from '@/components/ui/Reactions'
import CommentSection from '@/components/ui/CommentSection'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PostDetailModalProps {
  post: any
  isOpen: boolean
  onClose: () => void
  initialImageIndex?: number
  // Handlers dari parent (feed page)
  onReact?: (postId: string, type: string) => void
  onRemoveReact?: (postId: string) => void
  onSave?: (postId: string) => void
  onShare?: (post: any) => void
  postReactions?: Record<string, any>
  isSaved?: boolean
}

/**
 * Facebook-like post detail modal
 * - Menggunakan fungsi dan state dari parent (feed page)
 * - Hanya tampilan saja, semua logika dari parent
 */
export function PostDetailModal({
  post,
  isOpen,
  onClose,
  initialImageIndex = 0,
  onReact,
  onRemoveReact,
  onSave,
  onShare,
  postReactions,
  isSaved = false,
}: PostDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex)

  // Combine images and videos for media array
  const mediaItems = [
    ...(post.images?.map((url: string) => ({ url, type: 'image' as const })) || []),
    ...(post.videos?.map((url: string) => ({ url, type: 'video' as const })) || []),
  ]
  const hasMedia = mediaItems.length > 0

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasMedia) {
        goToPrevious()
      } else if (e.key === 'ArrowRight' && hasMedia) {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasMedia])

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? mediaItems.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === mediaItems.length - 1 ? 0 : prev + 1
    )
  }

  if (!isOpen) return null

  // Safety check - don't render if post is missing
  if (!post || !post.id) return null

  const currentMedia = hasMedia ? mediaItems[currentImageIndex] : null
  const reactionData = postReactions?.[post.id] || { counts: {}, currentReaction: null }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 lg:p-4 overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Main container - Responsive layout */}
      <div className="w-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row my-auto">
        
        {/* Left: Media Section - Desktop only */}
        {hasMedia && (
          <div className="hidden lg:flex flex-1 bg-black dark:bg-gray-950 flex-col items-center justify-center relative min-h-[500px]">
            {currentMedia?.type === 'image' ? (
              <Image
                src={currentMedia.url}
                alt="Post media"
                fill
                className="object-contain"
                priority
              />
            ) : currentMedia?.type === 'video' ? (
              <video
                src={currentMedia?.url}
                controls
                autoPlay
                className="max-h-full max-w-full"
              />
            ) : null}}

            {/* Media navigation */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  aria-label="Previous media"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  aria-label="Next media"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-lg">
                  <p className="text-white text-sm font-medium">
                    {currentImageIndex + 1} / {mediaItems.length}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right/Main: Post Content Section */}
        <div className={cn(
          "flex flex-col h-full",
          hasMedia ? "lg:w-full lg:max-w-md lg:border-l border-gray-200 dark:border-gray-800 w-full" : "flex-1 w-full",
        )}>
          
          {/* Author Header */}
          <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate text-sm lg:text-base">
                    {post.author.name}
                  </p>
                  {post.author.username && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{post.author.username}
                    </p>
                  )}
                  {post.author.city && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      📍 {post.author.city}
                    </p>
                  )}
                </div>
              </Link>

              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
                <MoreHorizontal className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Group badge */}
            {post.group && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {post.group.avatar && (
                    <Image 
                      src={post.group.avatar} 
                      alt={post.group.name}
                      width={12}
                      height={12}
                      className="rounded-full mr-1"
                    />
                  )}
                  {post.group.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4">
            <div className="text-sm lg:text-base leading-relaxed">
              <RenderPostContent content={post.content} />
            </div>
            
            {/* Timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              {format(new Date(post.createdAt), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
            </p>

            {/* Documents */}
            {post.documents && post.documents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Dokumen:</p>
                {post.documents.map((doc: string, idx: number) => {
                  const filename = doc.split('/').pop() || 'document'
                  return (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      📄 {filename}
                    </a>
                  )
                })}
              </div>
            )}

            {/* Mobile Media - Show on mobile only */}
            {hasMedia && (
              <div className="lg:hidden mt-3">
                {currentMedia?.type === 'image' ? (
                  <Image
                    src={currentMedia.url}
                    alt="Post media"
                    width={400}
                    height={400}
                    className="w-full rounded-lg object-cover max-h-96"
                  />
                ) : currentMedia?.type === 'video' ? (
                  <video
                    src={currentMedia?.url}
                    controls
                    className="w-full rounded-lg max-h-96"
                  />
                ) : null}}
                
                {mediaItems.length > 1 && (
                  <div className="flex items-center justify-between mt-2 gap-1">
                    <button
                      onClick={goToPrevious}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {currentImageIndex + 1} / {mediaItems.length}
                    </span>
                    <button
                      onClick={goToNext}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interaction Stats */}
          {(Object.values(reactionData.counts).some((v: any) => v > 0) || post._count?.comments > 0) && (
            <div className="px-3 lg:px-4 py-2 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0 flex gap-4">
              {Object.values(reactionData.counts).some((v: any) => v > 0) && (
                <span>
                  <Heart className="h-3 w-3 inline mr-1 text-red-500" />
                  {Object.values(reactionData.counts).reduce((a: any, b: any) => a + b, 0)} suka
                </span>
              )}
              {post._count?.comments > 0 && (
                <span>
                  <MessageCircle className="h-3 w-3 inline mr-1 text-blue-500" />
                  {post._count.comments} komentar
                </span>
              )}
            </div>
          )}

          {/* Action Buttons - Facebook style */}
          <div className="px-3 lg:px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center gap-1 flex-shrink-0">
            {/* Reactions Picker */}
            <div className="flex-1">
              <ReactionPicker
                onReact={(type) => {
                  const currentReaction = reactionData?.currentReaction
                  if (currentReaction === type) {
                    onRemoveReact?.(post.id)
                  } else if (currentReaction) {
                    onRemoveReact?.(post.id)
                    setTimeout(() => onReact?.(post.id, type), 300)
                  } else {
                    onReact?.(post.id, type)
                  }
                }}
                currentUserReaction={reactionData?.currentReaction || null}
              />
            </div>

            {/* Comment Button */}
            <button 
              className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300 text-xs lg:text-sm"
            >
              <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden sm:inline">Komentar</span>
            </button>

            {/* Share Button */}
            <button 
              onClick={() => onShare?.(post)}
              className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300 text-xs lg:text-sm"
            >
              <Share2 className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>

            {/* Save Button */}
            <button 
              onClick={() => onSave?.(post.id)}
              className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300 text-xs lg:text-sm"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                  <span className="hidden sm:inline text-blue-500">Disimpan</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="hidden sm:inline">Simpan</span>
                </>
              )}
            </button>
          </div>

          {/* Comments Section - menggunakan CommentSection dari sistem yang sudah berjalan */}
          <div className="border-t border-gray-200 dark:border-gray-800 flex-shrink-0 max-h-96 overflow-y-auto">
            <CommentSection 
              postId={post?.id || ''}
              onCommentAdded={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs text-right hidden lg:block">
        <p>ESC to close</p>
        {hasMedia && mediaItems.length > 1 && <p>← → to navigate</p>}
      </div>
    </div>
  )
}
