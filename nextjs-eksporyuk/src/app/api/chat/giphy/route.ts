/**
 * GET /api/chat/giphy
 * Search GIFs from Giphy API
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65' // Free tier API key

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const trending = searchParams.get('trending')
    
    let url: string
    
    if (trending === 'true') {
      url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
    } else if (query) {
      url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
    } else {
      return NextResponse.json({ gifs: [] })
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Giphy API request failed')
    }
    
    const data = await response.json()
    
    // Transform response to simpler format
    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.fixed_height.url,
      preview: gif.images.fixed_height_small.url || gif.images.preview_gif.url,
      width: gif.images.fixed_height.width,
      height: gif.images.fixed_height.height,
    }))
    
    return NextResponse.json({ gifs })
  } catch (error: any) {
    console.error('[API] Giphy search error:', error)
    return NextResponse.json(
      { error: 'Failed to search GIFs', message: error.message },
      { status: 500 }
    )
  }
}
