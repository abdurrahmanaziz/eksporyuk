import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchTerm, limit = 20 } = await request.json()

    if (!searchTerm || !searchTerm.trim()) {
      return NextResponse.json({ error: 'Search term required' }, { status: 400 })
    }

    // Get Giphy API key from integrations settings
    const integration = await prisma.integrationConfig.findFirst({
      where: { 
        service: 'giphy',
        isActive: true 
      }
    })

    if (!integration) {
      return NextResponse.json({ 
        error: 'Giphy integration not configured',
        data: []
      }, { status: 200 })
    }

    // Extract API key from config JSON
    const config = integration.config as { GIPHY_API_KEY?: string }
    const apiKey = config?.GIPHY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Giphy API key not configured',
        data: []
      }, { status: 200 })
    }

    // Search Giphy API
    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchTerm)}&limit=${limit}&rating=pg-13&lang=en`
    
    const giphyResponse = await fetch(giphyUrl)
    
    if (!giphyResponse.ok) {
      throw new Error('Giphy API error')
    }

    const giphyData = await giphyResponse.json()

    return NextResponse.json({
      success: true,
      data: giphyData.data || [],
      pagination: giphyData.pagination || {}
    })

  } catch (error: any) {
    console.error('Giphy search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search GIFs',
      data: []
    }, { status: 500 })
  }
}