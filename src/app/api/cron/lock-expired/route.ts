import { NextRequest, NextResponse } from 'next/server'
import { checkAndLockExpiredAccess } from '@/lib/membership-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/cron/lock-expired - Lock expired memberships and courses
// This should be called daily by a cron job
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await checkAndLockExpiredAccess()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron lock expired error:', error)
    return NextResponse.json(
      { error: 'Failed to lock expired access' },
      { status: 500 }
    )
  }
}
