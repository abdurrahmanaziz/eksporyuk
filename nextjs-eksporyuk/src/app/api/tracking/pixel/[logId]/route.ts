import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tracking/pixel/[logId]
 * 1x1 transparent pixel untuk track email opens
 * No authentication needed - public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { logId: string } }
) {
  try {
    const { logId } = params

    // Update log dengan opened status
    await prisma.broadcastLog.updateMany({
      where: {
        id: logId,
        status: { in: ['SENT', 'DELIVERED'] } // Only track opens for sent/delivered emails
      },
      data: {
        status: 'OPENED',
        openedAt: new Date()
      }
    })

    // Juga update campaign opened count
    const log = await prisma.broadcastLog.findUnique({
      where: { id: logId },
      select: { campaignId: true }
    })

    if (log) {
      await prisma.broadcastCampaign.update({
        where: { id: log.campaignId },
        data: {
          openedCount: { increment: 1 }
        }
      })
    }

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('[TRACKING_PIXEL] Error:', error)
    
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif'
      }
    })
  }
}
