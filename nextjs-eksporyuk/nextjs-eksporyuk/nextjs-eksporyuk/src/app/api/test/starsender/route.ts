import { NextRequest, NextResponse } from 'next/server'
import { starsenderService } from '@/lib/starsender'
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
    const { to, message } = await request.json()

    if (!starsenderService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Starsender not configured. Check STARSENDER_API_KEY and STARSENDER_DEVICE_ID in .env'
      })
    }

    const result = await starsenderService.sendWhatsApp({
      to,
      message
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
