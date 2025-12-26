/**
 * AUTO BACKUP CRON - Every 30 minutes
 * Automatically backs up critical database data to Vercel Blob Storage
 * 
 * Schedule: */30 * * * * (every 30 minutes)
 * Retention: Keep last 48 backups (24 hours worth)
 */

import { NextRequest, NextResponse } from 'next/server'
import { databaseBackupService } from '@/lib/services/database-backup-service'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[AUTO-BACKUP] Unauthorized attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[AUTO-BACKUP] Starting automatic backup...')
    const startTime = Date.now()

    // Create backup
    const result = await databaseBackupService.createBackup()

    if (!result.success) {
      console.error('[AUTO-BACKUP] Backup failed:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          duration: Date.now() - startTime
        },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime

    console.log('[AUTO-BACKUP] Backup completed successfully!')
    console.log(`[AUTO-BACKUP] Duration: ${duration}ms`)
    console.log(`[AUTO-BACKUP] Size: ${(result.backup!.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`[AUTO-BACKUP] Records: ${JSON.stringify(result.backup!.recordsCount)}`)

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
      backup: {
        id: result.backup!.id,
        filename: result.backup!.filename,
        url: result.backup!.url,
        size: result.backup!.size,
        sizeMB: (result.backup!.size / 1024 / 1024).toFixed(2),
        createdAt: result.backup!.createdAt,
        tablesCount: result.backup!.tablesCount,
        recordsCount: result.backup!.recordsCount,
      },
      duration,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[AUTO-BACKUP] Fatal error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
