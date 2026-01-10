import { NextRequest, NextResponse } from 'next/server'
import { checkEmailCredits } from '@/lib/email-credits-monitor'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * Cron Job: Check Email Credits Daily
 * 
 * Schedule: Daily at 9 AM
 * Purpose: Monitor Mailketing credits and alert if low
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-email-credits",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('❌ [CRON-CREDITS] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('⏰ [CRON-CREDITS] Starting daily email credits check...')

    // Check credits balance
    const result = await checkEmailCredits()

    console.log('✅ [CRON-CREDITS] Daily check completed:', {
      balance: result.balance,
      status: result.status,
      hasAlert: !!result.alert
    })

    return NextResponse.json({
      success: true,
      message: 'Daily email credits check completed',
      data: {
        balance: result.balance,
        status: result.status,
        alert: result.alert,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [CRON-CREDITS] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
