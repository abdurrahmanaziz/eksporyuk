/**
 * Backup database to Vercel Blob
 * Route: /api/cron/backup-to-blob
 * Called via Vercel Cron (set in vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Security: verify cron secret if provided (allow if not set, Vercel auto-validates cron calls)
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (process.env.CRON_SECRET && process.env.CRON_SECRET.length > 0 && token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Database path
    const dbPath = path.join(process.cwd(), '..', '..', 'database', 'dev.db')
    
    // Read database file
    const dbBuffer = fs.readFileSync(dbPath)
    const fileName = `database-backup-${new Date().toISOString().split('T')[0]}.db`

    // Upload to Vercel Blob
    const blob = await put(fileName, dbBuffer, {
      access: 'private',
      contentType: 'application/octet-stream',
    })

    console.log(`✅ Database backed up to Vercel Blob: ${blob.url}`)

    return NextResponse.json({
      success: true,
      message: `Database backup completed`,
      fileName,
      url: blob.url,
      size: dbBuffer.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Backup to Blob failed:', error)
    return NextResponse.json(
      {
        error: 'Backup failed',
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
