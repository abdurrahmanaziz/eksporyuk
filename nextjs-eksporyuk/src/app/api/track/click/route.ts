import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * Track email link clicks and redirect to original URL
 * GET /api/track/click?bid=broadcastId&lid=leadId&url=originalUrl
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const broadcastId = searchParams.get('bid')
    const leadId = searchParams.get('lid')
    const url = searchParams.get('url')

    // Validate parameters
    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 })
    }

    // Decode URL
    const targetUrl = decodeURIComponent(url)

    // Track click if broadcast context exists
    if (broadcastId && leadId) {
      try {
        // Update broadcast log with clicked timestamp
        await prisma.affiliateBroadcastLog.updateMany({
          where: {
            broadcastId,
            leadId,
            clickedAt: null, // Only update if not already clicked
          },
          data: {
            clickedAt: new Date(),
          },
        })

        // Update broadcast clicked count
        await prisma.affiliateBroadcast.update({
          where: { id: broadcastId },
          data: {
            clickedCount: {
              increment: 1,
            },
          },
        })
      } catch (error) {
        console.error('[TRACKING] Error tracking click:', error)
        // Continue to redirect even if tracking fails
      }
    }

    // Redirect to original URL
    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error('[TRACKING] Error in click tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
