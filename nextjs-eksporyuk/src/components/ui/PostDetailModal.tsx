'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, Play, Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RenderPostContent } from '@/components/community/RenderPostContent'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PostDetailModalProps {
  post: {
    id: string
    content: string
    contentFormatted?: { html?: string } | null
    images?: string[]
    videos?: string[]
    documents?: string[]
    createdAt: string
    updatedAt?: string
    author: {
      id: string
      name: string
      avatar?: string
      username?: string
      province?: string
      city?: string
    }
    group?: {
      id: string
      name: string
      slug: string
      avatar?: string
    }
    _count?: {
      likes: number
      comments: number
    }
  }
  isOpen: boolean
  onClose: () => void
  initialImageIndex?: number
}

/**
 * Modern post detail modal showing full post with images/videos
 * Left side: images/videos with navigation
 * Right side: post content, author info, and interactions
 */
export function PostDetailModal({
  post,
  isOpen,
  onClose,
  initialImageIndex = 0,
}: PostDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex)
  
  // Combine images and videos for media array
  const mediaItems = [
    ...(post.images?.map(url => ({ url, type: 'image' as const })) || []),
    ...(post.videos?.map(url => ({ url, type: 'video' as const })) || []),
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

  const currentMedia = hasMedia ? mediaItems[currentImageIndex] : null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Main container - Modern 2-column layout */}
      <div className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left: Media Section */}
        {hasMedia ? (
          <div className="flex-1 bg-black dark:bg-gray-950 flex flex-col items-center justify-center min-h-96 lg:min-h-full relative">
            {currentMedia?.type === 'image' ? (
              <Image
                src={currentMedia.url}
                alt="Post media"
                fill
                className="object-contain"
                priority
              />
            ) : (
              <video
                src={currentMedia?.url}
                controls
                autoPlay
                className="max-h-full max-w-full"
              />
            )}

            {/* Media navigation - only if multiple media */}
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

                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-lg">
                  <p className="text-white text-sm font-medium">
                    {currentImageIndex + 1} / {mediaItems.length}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Right: Post Content Section */}
        <div className={cn(
          "flex flex-col h-full",
          hasMedia ? "lg:w-96 lg:border-l border-gray-200 dark:border-gray-800" : "flex-1",
          "overflow-y-auto"
        )}>
          
          {/* Author Header */}
          <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {post.author.name}
                  </p>
                  {post.author.username && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Group badge if exists */}
            {post.group && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {post.group.avatar && (
                    <Image 
                      src={post.group.avatar} 
                      alt={post.group.name}
                      width={14}
                      height={14}
                      className="rounded-full mr-1"
                    />
                  )}
                  {post.group.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
            <RenderPostContent content={post.content} />
            
            {/* Timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              {format(new Date(post.createdAt), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
            </p>

            {/* Documents if any */}
            {post.documents && post.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dokumen:</p>
                {post.documents.map((doc, idx) => {
                  const filename = doc.split('/').pop() || 'document'
                  return (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      📄 {filename}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Interaction Stats */}
          {post._count && (post._count.likes > 0 || post._count.comments > 0) && (
            <div className="px-4 lg:px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
              {post._count.likes > 0 && (
                <span className="mr-4">
                  <Heart className="h-4 w-4 inline mr-1 text-red-500" />
                  {post._count.likes} suka
                </span>
              )}
              {post._count.comments > 0 && (
                <span>
                  <MessageCircle className="h-4 w-4 inline mr-1 text-blue-500" />
                  {post._count.comments} komentar
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-4 lg:px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-4 flex-shrink-0">
            <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300">
              <Heart className="h-5 w-5" />
              <span className="text-sm hidden sm:inline">Suka</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm hidden sm:inline">Komentar</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300">
              <Share2 className="h-5 w-5" />
              <span className="text-sm hidden sm:inline">Bagikan</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300">
              <Bookmark className="h-5 w-5" />
              <span className="text-sm hidden sm:inline">Simpan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs text-right">
        <p>ESC to close</p>
        {hasMedia && mediaItems.length > 1 && <p>← → to navigate</p>}
      </div>
    </div>
  )
}
