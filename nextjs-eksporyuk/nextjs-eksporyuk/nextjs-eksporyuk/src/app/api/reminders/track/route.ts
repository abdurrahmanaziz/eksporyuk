/**
 * POST /api/reminders/track
 * Track reminder interactions (delivered, opened, clicked)
 * Called when user interacts with reminder notification
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reminderService } from '@/lib/services/reminderService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logId, interaction } = body

    if (!logId || !interaction) {
      return NextResponse.json(
        { error: 'logId and interaction are required' },
        { status: 400 }
      )
    }

    const validInteractions = ['delivered', 'opened', 'clicked']
    if (!validInteractions.includes(interaction)) {
      return NextResponse.json(
        { error: `Invalid interaction. Must be one of: ${validInteractions.join(', ')}` },
        { status: 400 }
      )
    }

    await reminderService.trackInteraction(logId, interaction)

    return NextResponse.json({
      success: true,
      message: `Interaction '${interaction}' tracked successfully`,
    })
  } catch (error: any) {
    console.error('[Reminder Track]', error)
    return NextResponse.json(
      { error: 'Failed to track interaction', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reminders/track
 * Tracking pixel endpoint for email opens
 * Returns 1x1 transparent GIF
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const logId = searchParams.get('id')

    if (logId) {
      // Track as opened
      await reminderService.trackInteraction(logId, 'opened')
    }

    // Return 1x1 transparent GIF
    const transparentGif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(transparentGif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[Reminder Track Pixel]', error)
    // Still return transparent GIF even on error
    const transparentGif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    return new NextResponse(transparentGif, {
      headers: { 'Content-Type': 'image/gif' },
    })
  }
}
