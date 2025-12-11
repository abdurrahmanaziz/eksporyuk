/**
 * GET /api/chat/link-preview
 * Fetch Open Graph metadata from a URL for link preview
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

// Cache for link previews (in production, use Redis)
const linkPreviewCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Check cache
    const cached = linkPreviewCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EksporyukBot/1.0; +https://eksporyuk.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    const html = await response.text()
    
    // Parse Open Graph and meta tags
    const metadata = parseMetadata(html, url)

    // Cache the result
    linkPreviewCache.set(url, { data: metadata, timestamp: Date.now() })

    return NextResponse.json(metadata)
  } catch (error: any) {
    console.error('[API] Link preview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    )
  }
}

function parseMetadata(html: string, baseUrl: string) {
  const getMetaContent = (property: string): string | undefined => {
    // Try og: prefix
    let match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    if (!match) {
      // Try reverse order (content before property)
      match = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'))
    }
    return match?.[1]
  }

  // Get title
  let title = getMetaContent('og:title') || getMetaContent('twitter:title')
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    title = titleMatch?.[1]?.trim()
  }

  // Get description
  let description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description')
  if (description && description.length > 200) {
    description = description.substring(0, 200) + '...'
  }

  // Get image
  let image = getMetaContent('og:image') || getMetaContent('twitter:image')
  if (image && !image.startsWith('http')) {
    // Make relative URLs absolute
    const urlObj = new URL(baseUrl)
    image = new URL(image, urlObj.origin).href
  }

  // Get site name
  const siteName = getMetaContent('og:site_name')

  // Get favicon
  let favicon: string | undefined
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i)
  
  if (faviconMatch) {
    favicon = faviconMatch[1]
    if (!favicon.startsWith('http')) {
      const urlObj = new URL(baseUrl)
      favicon = new URL(favicon, urlObj.origin).href
    }
  } else {
    // Try default favicon location
    const urlObj = new URL(baseUrl)
    favicon = `${urlObj.origin}/favicon.ico`
  }

  return {
    title,
    description,
    image,
    siteName,
    favicon,
  }
}
