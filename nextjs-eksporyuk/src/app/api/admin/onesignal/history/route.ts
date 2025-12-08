import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getOneSignalNotificationHistory, getOneSignalAppInfo } from '@/lib/onesignal'

// GET - Get OneSignal notification history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admin can access
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get notification history from OneSignal
    const history = await getOneSignalNotificationHistory(limit, offset)

    // Get app info for context
    const appInfo = await getOneSignalAppInfo()

    return NextResponse.json({
      success: true,
      notifications: history.notifications || [],
      totalCount: history.total_count || 0,
      appInfo: appInfo ? {
        name: appInfo.name,
        players: appInfo.players,
        messageable_players: appInfo.messageable_players,
        created_at: appInfo.created_at
      } : null
    })
  } catch (error) {
    console.error('[Admin OneSignal History] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
