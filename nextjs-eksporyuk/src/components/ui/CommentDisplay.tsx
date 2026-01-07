'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { 
  File, Download, Play, FileText, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { formatFileSize, getFileIcon } from '@/lib/file-upload'

interface CommentMediaProps {
  images?: string[]
  videos?: string[]
  documents?: string[]
  commentContent?: string
}

/**
 * Image Viewer Modal for Comment Images
 */
function ImageViewerModal({ 
  images, 
  currentIndex, 
  onClose,
  onPrevious,
  onNext,
  commentContent 
}: {
  images: string[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  commentContent?: string
}) {
  // Close on escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && currentIndex > 0) onPrevious()
    if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNext()
  }

  // Add keyboard listener
  useState(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main content */}
      <div 
        className="relative max-w-4xl w-full mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image container */}
        <div className="relative w-full flex items-center justify-center">
          {/* Previous button */}
          {images.length > 1 && currentIndex > 0 && (
            <button
              onClick={onPrevious}
              className="absolute left-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />

          {/* Next button */}
          {images.length > 1 && currentIndex < images.length - 1 && (
            <button
              onClick={onNext}
              className="absolute right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="mt-3 text-white/70 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Comment content */}
        {commentContent && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg max-w-2xl w-full">
            <p className="text-white text-sm whitespace-pre-wrap">{commentContent}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Render comment media attachments
 * Support: images, videos, documents
 */
export function CommentMedia({ images, videos, documents, commentContent }: CommentMediaProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index)
    setViewerOpen(true)
  }

  return (
    <>
      <div className="space-y-2 mt-2">
        {/* Images - Responsive grid */}
        {images && images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((image, idx) => (
              <div 
                key={idx} 
                className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer"
                onClick={() => openImageViewer(idx)}
              >
                <img
                  src={image}
                  alt="comment-image"
                  className="w-full h-auto max-h-80 object-contain hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Videos */}
        {videos && videos.length > 0 && (
          <div className="space-y-2">
            {videos.map((video, idx) => (
              <video
                key={idx}
                src={video}
                controls
                className="w-full max-h-80 rounded-lg bg-black"
              />
            ))}
          </div>
        )}

        {/* Documents */}
        {documents && documents.length > 0 && (
          <div className="space-y-1">
            {documents.map((doc, idx) => {
              const filename = doc.split('/').pop() || 'document'
              return (
                <a
                  key={idx}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-lg">{getFileIcon(filename)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {filename}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-gray-500 flex-shrink-0" />
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && images && images.length > 0 && (
        <ImageViewerModal
          images={images}
          currentIndex={currentImageIndex}
          onClose={() => setViewerOpen(false)}
          onPrevious={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1))}
          commentContent={commentContent}
        />
      )}
    </>
  )
}

interface CommentMentionProps {
  userId: string
  username: string
  name: string
}

/**
 * Render @mention tag dalam comment dengan clickable link
 * Menampilkan nama user (bukan username) seperti Facebook
 */
export function CommentMention({ userId, username, name }: CommentMentionProps) {
  // Display name instead of username (like Facebook)
  const displayName = name || username || 'User'
  
  return (
    <Link href={`/@${username}`}>
      <span 
        className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-sm transition-all hover:opacity-80 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff',
        }}
        title={`@${username}`}
      >
        {displayName}
      </span>
    </Link>
  )
}

interface MentionedUser {
  id?: string
  username: string
  name?: string
}

interface RenderCommentContentProps {
  content: string
  mentionedUsers?: (string | MentionedUser)[]
  showFormatted?: boolean
}

/**
 * Parse dan render comment content dengan mention tags
 * Detects @mention patterns dan replace dengan clickable tags
 * Menampilkan nama user (bukan username) seperti Facebook
 */
export function RenderCommentContent({
  content,
  mentionedUsers = [],
  showFormatted = false
}: RenderCommentContentProps) {
  if (!content) return null

  // Build a map of username -> user data for quick lookup
  const userMap = new Map<string, MentionedUser>()
  mentionedUsers.forEach(user => {
    if (typeof user === 'string') {
      userMap.set(user, { username: user, name: user })
    } else {
      userMap.set(user.username, user)
    }
  })

  // Simple mention regex - detects @username patterns
  const mentionRegex = /@(\w+)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  let match
  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }

    const username = match[1]
    const userData = userMap.get(username)
    
    // Check if this mention is valid
    if (userData) {
      parts.push(
        <CommentMention
          key={`mention-${match.index}`}
          userId={userData.id || username}
          username={username}
          name={userData.name || username}
        />
      )
    } else {
      // Render with gradient style even for unmatched mentions
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-sm cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff',
          }}
        >
          {username}
        </span>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return (
    <div className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 leading-relaxed">
      {parts.length > 0 ? parts : content}
    </div>
  )
}
