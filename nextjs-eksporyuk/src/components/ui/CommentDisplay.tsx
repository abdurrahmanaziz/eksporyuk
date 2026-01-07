'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { 
  File, Download, Play, FileText
} from 'lucide-react'
import { formatFileSize, getFileIcon } from '@/lib/file-upload'

interface CommentMediaProps {
  images?: string[]
  videos?: string[]
  documents?: string[]
}

/**
 * Render comment media attachments
 * Support: images, videos, documents
 */
export function CommentMedia({ images, videos, documents }: CommentMediaProps) {
  return (
    <div className="space-y-2 mt-2">
      {/* Images - Responsive grid */}
      {images && images.length > 0 && (
        <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((image, idx) => (
            <div 
              key={idx} 
              className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer"
              onClick={() => window.open(image, '_blank')}
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
  )
}

interface CommentMentionProps {
  userId: string
  username: string
  name: string
}

/**
 * Render @mention tag dalam comment dengan clickable link
 */
export function CommentMention({ userId, username, name }: CommentMentionProps) {
  return (
    <Link href={`/@${username}`}>
      <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
        @{username}
      </span>
    </Link>
  )
}

interface RenderCommentContentProps {
  content: string
  mentionedUsers?: string[]
  showFormatted?: boolean
}

/**
 * Parse dan render comment content dengan mention tags
 * Detects @mention patterns dan replace dengan clickable tags
 */
export function RenderCommentContent({
  content,
  mentionedUsers = [],
  showFormatted = false
}: RenderCommentContentProps) {
  if (!content) return null

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
    // Check if this mention is in mentionedUsers
    const isMentioned = mentionedUsers && mentionedUsers.includes(username)

    if (isMentioned) {
      parts.push(
        <CommentMention
          key={`mention-${match.index}`}
          userId={username}
          username={username}
          name={`@${username}`}
        />
      )
    } else {
      // Just render as plain text if not in mentioned list
      parts.push(`@${username}`)
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
