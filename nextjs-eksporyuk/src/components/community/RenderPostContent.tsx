'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RenderPostContentProps {
  content: string
  contentFormatted?: { html?: string } | null
  className?: string
}

export function RenderPostContent({ content, contentFormatted, className = '' }: RenderPostContentProps) {
  const router = useRouter()

  // If we have formatted HTML with mentions
  if (contentFormatted && contentFormatted.html) {
    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if clicked element is a mention tag
      if (target.classList.contains('mention-tag')) {
        e.preventDefault()
        const userId = target.getAttribute('data-user-id')
        const userName = target.getAttribute('data-user-name')
        
        if (userId) {
          // Navigate to user profile
          router.push(`/profile/${userId}`)
        }
      }
    }

    return (
      <div 
        className={`prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words ${className}`}
        dangerouslySetInnerHTML={{ __html: contentFormatted.html }}
        onClick={handleClick}
        style={{
          cursor: 'default'
        }}
      />
    )
  }

  // Fallback to plain text
  return (
    <div className={`prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words ${className}`}>
      {content}
    </div>
  )
}

// CSS untuk mention tag - Facebook style dengan gradient
export const mentionStyles = `
  .mention-tag {
    display: inline-block;
    padding: 0 6px;
    border-radius: 4px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff;
    cursor: pointer;
    user-select: all;
    font-weight: 500;
    transition: opacity 0.2s, transform 0.15s;
  }
  .mention-tag:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
  .dark .mention-tag {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff;
  }
  .dark .mention-tag:hover {
    opacity: 0.85;
  }
`
