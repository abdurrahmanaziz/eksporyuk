'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RenderPostContentProps {
  content: string
  contentFormatted?: { html?: string } | null
  className?: string
  textColor?: string // Optional text color for background posts
}

export function RenderPostContent({ content, contentFormatted, className = '', textColor }: RenderPostContentProps) {
  const router = useRouter()

  // If we have formatted HTML with mentions
  if (contentFormatted && contentFormatted.html) {
    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if clicked element is a mention tag
      if (target.classList.contains('mention-tag')) {
        e.preventDefault()
        // Use data-username for profile link, fallback to data-user-id
        const username = target.getAttribute('data-username')
        const userId = target.getAttribute('data-user-id')
        
        if (username) {
          router.push(`/${username}`)
        } else if (userId) {
          router.push(`/profile/${userId}`)
        }
      }
    }

    return (
      <div 
        className={`prose prose-sm max-w-none whitespace-pre-wrap break-words ${textColor ? 'mention-inherit-color' : 'text-gray-700 dark:text-gray-300'} ${className}`}
        dangerouslySetInnerHTML={{ __html: contentFormatted.html }}
        onClick={handleClick}
        style={{
          cursor: 'default',
          ...(textColor ? { color: textColor } : {})
        }}
      />
    )
  }

  // Fallback to plain text
  return (
    <div 
      className={`prose prose-sm max-w-none whitespace-pre-wrap break-words ${textColor ? '' : 'text-gray-700 dark:text-gray-300'} ${className}`}
      style={textColor ? { color: textColor } : {}}
    >
      {content}
    </div>
  )
}

// CSS untuk mention tag - Facebook style dengan soft gradient
// Support inherit color for posts with background
export const mentionStyles = `
  .mention-tag {
    display: inline-block !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15)) !important;
    color: #3b82f6 !important;
    cursor: pointer !important;
    user-select: all !important;
    font-weight: 600 !important;
    transition: opacity 0.2s, background 0.2s !important;
  }
  .mention-tag:hover {
    opacity: 0.9 !important;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25)) !important;
  }
  
  /* For posts with background - inherit text color */
  .mention-inherit-color .mention-tag {
    background: rgba(255, 255, 255, 0.2) !important;
    color: inherit !important;
    text-decoration: underline !important;
    text-underline-offset: 2px !important;
  }
  .mention-inherit-color .mention-tag:hover {
    background: rgba(255, 255, 255, 0.3) !important;
  }
  
  .dark .mention-tag {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2)) !important;
    color: #60a5fa !important;
  }
  .dark .mention-tag:hover {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3)) !important;
  }
`
