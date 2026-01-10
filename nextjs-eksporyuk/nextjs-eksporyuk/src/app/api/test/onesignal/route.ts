import { NextRequest, NextResponse } from 'next/server'
import { oneSignalService } from '@/lib/onesignal'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  // Require admin authentication
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { heading, content, url } = await request.json()

    if (!oneSignalService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'OneSignal not configured. Check ONESIGNAL_APP_ID and ONESIGNAL_API_KEY in .env'
      })
    }

    const result = await oneSignalService.sendToAll(heading, content, url)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
