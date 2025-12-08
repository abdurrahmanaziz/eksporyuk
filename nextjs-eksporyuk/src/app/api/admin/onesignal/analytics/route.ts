import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[Analytics GET] Session user:', session?.user?.email, 'Role:', session?.user?.role)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }
    
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') || '20'
    const offset = searchParams.get('offset') || '0'

    console.log('[Analytics] Fetching from OneSignal - App ID:', ONESIGNAL_APP_ID?.substring(0, 10) + '...')

    // Fetch notifications with detailed stats from OneSignal
    const response = await fetch(
      `https://onesignal.com/api/v1/notifications?app_id=${ONESIGNAL_APP_ID}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('[Analytics] OneSignal response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Analytics] OneSignal API error:', response.status, errorText)
      
      // Return empty data instead of throwing error
      return NextResponse.json({
        notifications: [],
        total_count: 0,
        offset: 0,
        limit: 0,
        error: `OneSignal API error: ${response.status}`
      })
    }

    const data = await response.json()
    console.log('[Analytics] OneSignal returned', data.notifications?.length || 0, 'notifications')

    // Transform the data to include detailed analytics
    const notifications = data.notifications.map((notif: any) => ({
      id: notif.id,
      headings: notif.headings,
      contents: notif.contents,
      sent: notif.successful + notif.failed + notif.errored + notif.remaining,
      successful: notif.successful || 0,
      failed: notif.failed || 0,
      converted: notif.converted || 0,
      errored: notif.errored || 0,
      remaining: notif.remaining || 0,
      queued_at: notif.queued_at,
      send_after: notif.send_after,
      completed_at: notif.completed_at,
      platform_delivery_stats: notif.platform_delivery_stats
    }))

    return NextResponse.json({
      notifications,
      total_count: data.total_count || 0,
      offset: data.offset || 0,
      limit: data.limit || 0
    })
  } catch (error) {
    console.error('Error fetching OneSignal analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
