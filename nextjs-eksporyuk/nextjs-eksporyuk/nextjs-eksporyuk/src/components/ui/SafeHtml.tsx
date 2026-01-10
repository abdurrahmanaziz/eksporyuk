'use client'

import { sanitizeStrict, sanitizeRich } from '@/lib/sanitize'

interface SafeHtmlProps {
  html: string | null | undefined
  mode?: 'strict' | 'rich'
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * SafeHtml Component
 * 
 * Render HTML content dengan sanitasi otomatis untuk mencegah XSS attacks.
 * Gunakan komponen ini daripada dangerouslySetInnerHTML langsung.
 * 
 * @example
 * // Untuk komentar, bio (strict mode - default)
 * <SafeHtml html={comment.content} />
 * 
 * // Untuk postingan dengan rich content
 * <SafeHtml html={post.content} mode="rich" />
 * 
 * // Dengan custom element
 * <SafeHtml html={description} as="p" className="text-gray-600" />
 */
export function SafeHtml({ 
  html, 
  mode = 'strict',
  className = '',
  as: Component = 'div'
}: SafeHtmlProps) {
  if (!html) return null
  
  const sanitizedHtml = mode === 'strict' 
    ? sanitizeStrict(html) 
    : sanitizeRich(html)
  
  if (!sanitizedHtml) return null
  
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

/**
 * Hook untuk mendapatkan sanitized HTML
 * Berguna ketika perlu proses HTML sebelum render
 */
export function useSanitizedHtml(
  html: string | null | undefined, 
  mode: 'strict' | 'rich' = 'strict'
): string {
  if (!html) return ''
  return mode === 'strict' ? sanitizeStrict(html) : sanitizeRich(html)
}

export default SafeHtml
