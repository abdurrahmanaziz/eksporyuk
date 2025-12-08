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

// CSS untuk mention tag (tambahkan ke global styles atau inline)
export const mentionStyles = `
  .mention-tag {
    display: inline-block;
    padding: 0 4px;
    border-radius: 4px;
    background-color: #dbeafe;
    color: #2563eb;
    cursor: pointer;
    user-select: all;
    transition: opacity 0.2s;
  }
  .mention-tag:hover {
    opacity: 0.8;
    background-color: #bfdbfe;
  }
  .dark .mention-tag {
    background-color: rgba(37, 99, 235, 0.3);
    color: #93c5fd;
  }
  .dark .mention-tag:hover {
    background-color: rgba(37, 99, 235, 0.4);
  }
`
