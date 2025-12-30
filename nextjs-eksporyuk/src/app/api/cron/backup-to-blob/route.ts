/**
 * Backup database to Vercel Blob
 * Route: /api/cron/backup-to-blob
 * Called via Vercel Cron (set in vercel.json) or manual trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('[BACKUP-TO-BLOB] Starting database backup...')
    
    const timestamp = new Date().toISOString()
    const dateStr = timestamp.split('T')[0]
    
    // Export critical data as JSON
    const [users, memberships, transactions, affiliates, settings] = await Promise.all([
      prisma.user.findMany({ take: 10000 }),
      prisma.membership.findMany({ take: 5000 }),
      prisma.transaction.findMany({ take: 10000, orderBy: { createdAt: 'desc' } }),
      prisma.affiliateProfile.findMany({ take: 5000 }),
      prisma.settings.findMany()
    ])
    
    const backupData = {
      metadata: {
        timestamp,
        version: '1.0',
        source: 'eksporyuk-production',
        counts: {
          users: users.length,
          memberships: memberships.length,
          transactions: transactions.length,
          affiliates: affiliates.length,
          settings: settings.length
        }
      },
      data: {
        users,
        memberships,
        transactions,
        affiliates,
        settings
      }
    }
    
    const backupJson = JSON.stringify(backupData, null, 2)
    const fileName = `database-backup-${dateStr}.json`
    
    // Upload to Vercel Blob
    const blob = await put(fileName, backupJson, {
      access: 'private',
      contentType: 'application/json',
    })
    
    console.log(`✅ Database backed up to Vercel Blob: ${blob.url}`)
    
    return NextResponse.json({
      success: true,
      message: 'Database backup completed',
      fileName,
      url: blob.url,
      size: backupJson.length,
      counts: backupData.metadata.counts,
      timestamp
    })

  } catch (error) {
    console.error('[BACKUP-TO-BLOB] Error:', error)
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
