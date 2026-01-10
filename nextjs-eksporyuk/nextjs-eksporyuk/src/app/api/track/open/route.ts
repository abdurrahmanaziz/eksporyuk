import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * Track email opens via tracking pixel
 * GET /api/track/open?bid=broadcastId&lid=leadId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const broadcastId = searchParams.get('bid')
    const leadId = searchParams.get('lid')

    if (!broadcastId || !leadId) {
      // Return 1x1 transparent pixel even if params missing
      return new NextResponse(
        Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64'
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      )
    }

    // Update broadcast log with opened timestamp
    await prisma.affiliateBroadcastLog.updateMany({
      where: {
        broadcastId,
        leadId,
        openedAt: null, // Only update if not already opened
      },
      data: {
        openedAt: new Date(),
      },
    })

    // Update broadcast opened count
    await prisma.affiliateBroadcast.update({
      where: { id: broadcastId },
      data: {
        openedCount: {
          increment: 1,
        },
      },
    })

    // Return 1x1 transparent GIF pixel
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[TRACKING] Error tracking open:', error)
    
    // Still return pixel even on error
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}
