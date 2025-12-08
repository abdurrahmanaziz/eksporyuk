import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tracking/click/[logId]
 * Track link clicks in emails dan redirect ke target URL
 * No authentication needed - public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { logId: string } }
) {
  try {
    const { logId } = params
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url') || process.env.NEXT_PUBLIC_APP_URL || '/'

    // Update log dengan clicked status
    await prisma.broadcastLog.updateMany({
      where: {
        id: logId,
        status: { in: ['SENT', 'DELIVERED', 'OPENED'] }
      },
      data: {
        status: 'CLICKED',
        clickedAt: new Date(),
        // Also mark as opened if not yet opened
        ...(await prisma.broadcastLog.findUnique({ 
          where: { id: logId }, 
          select: { openedAt: true } 
        })).openedAt ? {} : { openedAt: new Date() }
      }
    })

    // Update campaign clicked count
    const log = await prisma.broadcastLog.findUnique({
      where: { id: logId },
      select: { campaignId: true, openedAt: true }
    })

    if (log) {
      const updateData: any = {
        clickedCount: { increment: 1 }
      }

      // If this is first open, increment opened count too
      if (!log.openedAt) {
        updateData.openedCount = { increment: 1 }
      }

      await prisma.broadcastCampaign.update({
        where: { id: log.campaignId },
        data: updateData
      })
    }

    // Redirect to target URL
    return NextResponse.redirect(targetUrl, { status: 302 })
  } catch (error: any) {
    console.error('[TRACKING_CLICK] Error:', error)
    
    // Redirect to homepage on error
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || '/',
      { status: 302 }
    )
  }
}
