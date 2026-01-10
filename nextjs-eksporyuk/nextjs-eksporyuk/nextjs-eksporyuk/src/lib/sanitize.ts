import DOMPurify from 'isomorphic-dompurify'

/**
 * HTML Sanitization Helper
 * Menggunakan DOMPurify untuk mencegah XSS attacks
 */

// Default allowed tags untuk konten user-generated
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'span', 'div',
  'blockquote', 'pre', 'code',
  'img', 'video', 'audio', 'source',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr'
]

// Default allowed attributes
const DEFAULT_ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id', 'style',
  'src', 'alt', 'width', 'height', 'title',
  'controls', 'autoplay', 'loop', 'muted',
  'type', 'colspan', 'rowspan'
]

// Strict config untuk komentar dan input sederhana
const STRICT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
}

// Rich content config untuk postingan dengan media
const RICH_CONFIG = {
  ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
  ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
  ADD_ATTR: ['target'], // Allow target attribute
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
}

/**
 * Sanitize HTML content - strict mode (untuk komentar, bio, dll)
 * @param html - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeStrict(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, STRICT_CONFIG)
}

/**
 * Sanitize HTML content - rich mode (untuk postingan, artikel)
 * @param html - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeRich(html: string | null | undefined): string {
  if (!html) return ''
  
  // Add safe target="_blank" to all links
  const clean = DOMPurify.sanitize(html, {
    ...RICH_CONFIG,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  })
  
  // Add rel="noopener noreferrer" to external links for security
  return clean.replace(
    /<a\s+([^>]*href=["'][^"']*["'][^>]*)>/gi, 
    (match, attrs) => {
      if (!attrs.includes('rel=')) {
        return `<a ${attrs} rel="noopener noreferrer">`
      }
      return match
    }
  )
}

/**
 * Sanitize HTML untuk email templates
 * Lebih permisif karena email clients handle dengan aman
 */
export function sanitizeEmail(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...DEFAULT_ALLOWED_TAGS, 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'style'],
    ALLOWED_ATTR: [...DEFAULT_ALLOWED_ATTR, 'bgcolor', 'align', 'valign', 'border', 'cellpadding', 'cellspacing'],
    ALLOW_DATA_ATTR: false
  })
}

/**
 * Strip all HTML tags - hanya return text content
 * @param html - Raw HTML string
 * @returns Plain text without any HTML
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Check apakah string berisi potentially dangerous HTML
 * @param html - String to check
 * @returns true jika berisi dangerous content
 */
export function hasDangerousHtml(html: string | null | undefined): boolean {
  if (!html) return false
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:/i,
    /vbscript:/i
  ]
  
  return dangerousPatterns.some(pattern => pattern.test(html))
}

/**
 * Sanitize object dengan semua string properties
 * Useful untuk sanitize entire form data
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T, 
  mode: 'strict' | 'rich' = 'strict'
): T {
  const sanitize = mode === 'strict' ? sanitizeStrict : sanitizeRich
  const result: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitize(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? sanitize(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value, mode)
    } else {
      result[key] = value
    }
  }
  
  return result as T
}

// Default export untuk kompatibilitas
export default {
  sanitizeStrict,
  sanitizeRich,
  sanitizeEmail,
  stripHtml,
  hasDangerousHtml,
  sanitizeObject
}
