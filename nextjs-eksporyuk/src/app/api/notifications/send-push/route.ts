import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

/**
 * POST /api/notifications/send-push
 * 
 * Send push notification ke user tertentu via OneSignal
 * 
 * Body:
 * {
 *   userId: string (OneSignal Player ID)
 *   heading: string
 *   contents: string
 *   url?: string (launch URL)
 *   bigPicture?: string (image URL for Android)
 *   largeIcon?: string (icon URL)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Validate user is logged in
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, heading, contents, url, bigPicture, largeIcon } = body

    // Validate required fields
    if (!userId || !heading || !contents) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, heading, contents' },
        { status: 400 }
      )
    }

    // Security: User dapat hanya send ke dirinya sendiri
    // Untuk send ke user lain, perlu role ADMIN atau MENTOR
    const canSendToOthers = ['ADMIN', 'SUPER_ADMIN', 'MENTOR'].includes(session.user.role)
    
    if (userId !== session.user.onesignalPlayerId && !canSendToOthers) {
      return NextResponse.json(
        { error: 'Cannot send push to other users' },
        { status: 403 }
      )
    }

    // Call OneSignal REST API
    const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY
    if (!onesignalApiKey) {
      console.error('[API] ONESIGNAL_REST_API_KEY not configured')
      return NextResponse.json(
        { error: 'Push notification service not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignalApiKey}`
      },
      body: JSON.stringify({
        // Send ke specific user by Player ID
        include_player_ids: [userId],
        
        // Content
        headings: { en: heading },
        contents: { en: contents },
        
        // Optional fields
        ...(url && { url, launch_url: url }),
        ...(bigPicture && { big_picture: bigPicture }),
        ...(largeIcon && { large_icon: largeIcon }),
        
        // Settings
        priority: 10, // High priority
        delivery_time_of_day: 'timezone',
        isAndroid: true,
        isChrome: true,
        isFirefox: true,
        isSafari: true,
        
        // Analytics
        campaign_id: 'web-push-notification'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[OneSignal API] Error:', error)
      return NextResponse.json(
        { error: 'Failed to send push notification', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log('[OneSignal] Push notification sent:', {
      userId,
      heading,
      notificationId: data.body?.notification_id
    })

    return NextResponse.json({
      success: true,
      notificationId: data.body?.notification_id,
      message: 'Push notification sent successfully'
    })

  } catch (error) {
    console.error('[API] Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/send-push?userId={id}
 * 
 * Check push notification permission status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      hasOnesignalId: !!session.user.onesignalPlayerId,
      status: session.user.onesignalPlayerId ? 'ready' : 'waiting-permission'
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
