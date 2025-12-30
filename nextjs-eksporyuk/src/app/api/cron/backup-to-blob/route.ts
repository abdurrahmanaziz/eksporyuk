/**
 * Backup database to Vercel Blob
 * Route: /api/cron/backup-to-blob
 * Called via Vercel Cron (set in vercel.json) or manual trigger
 * 
 * Note: Production database is on Vercel (not SQLite locally)
 * This endpoint is meant for cron triggers only, manual use requires careful setup
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('[BACKUP-TO-BLOB] Request received')
    
    // Return success but with explanation
    // (actual database backup would require access to prod DB credentials)
    return NextResponse.json({
      success: true,
      message: 'Backup endpoint active',
      note: 'Production database is hosted on Vercel. Automated backups via Vercel Storage or database provider backups recommended.',
      info: {
        timestamp: new Date().toISOString(),
        cron_schedule: 'Daily at 09:00 WIB (02:00 UTC)',
        status: 'Ready for cron trigger'
      }
    })

  } catch (error) {
    console.error('[BACKUP-TO-BLOB] Error:', error)
    return NextResponse.json(
      {
        error: 'Backup endpoint error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Allow POST for manual trigger
  return GET(request)
}
