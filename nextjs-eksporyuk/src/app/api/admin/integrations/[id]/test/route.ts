import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// POST /api/admin/integrations/[id]/test - Test integration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    // Test based on integration type
    switch (integration.name) {
      case 'GIPHY':
        return await testGiphyIntegration(integration)
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Test not implemented for this integration' 
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Test integration error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test integration' 
    }, { status: 500 })
  }
}

async function testGiphyIntegration(integration: any) {
  if (!integration.apiKey) {
    return NextResponse.json({ 
      success: false,
      error: 'API key is required' 
    }, { status: 400 })
  }

  try {
    // Test Giphy API with a simple search
    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${integration.apiKey}&q=test&limit=1&rating=pg-13&lang=en`
    
    const response = await fetch(giphyUrl)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        success: false,
        error: `Giphy API error: ${errorData.message || 'Invalid API key'}`
      })
    }

    const data = await response.json()
    
    // Update integration with test result
    await prisma.integration.update({
      where: { id: integration.id },
      data: { 
        settings: { 
          ...integration.settings,
          lastTestAt: new Date(),
          lastTestResult: 'success'
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Giphy API connection successful',
      data: {
        resultCount: data.data?.length || 0,
        pagination: data.pagination || {}
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: `Connection failed: ${error.message}` 
    })
  }
}