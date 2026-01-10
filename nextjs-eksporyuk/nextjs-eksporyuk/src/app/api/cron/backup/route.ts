/**
 * Cron Job - Auto Database Backup
 * Runs daily at 00:00 UTC (07:00 WIB)
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/backup",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseBackupService } from '@/lib/services/database-backup-service'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Allow in development or with valid secret
    const isDev = process.env.NODE_ENV === 'development'
    const isValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
    
    if (!isDev && !isValidSecret) {
      console.log('[CRON BACKUP] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[CRON BACKUP] Starting scheduled backup...')
    
    const result = await databaseBackupService.createBackup()
    
    if (result.success) {
      console.log('[CRON BACKUP] Scheduled backup completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Scheduled backup completed',
        backup: result.backup
      })
    } else {
      console.error('[CRON BACKUP] Scheduled backup failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Backup failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[CRON BACKUP] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
