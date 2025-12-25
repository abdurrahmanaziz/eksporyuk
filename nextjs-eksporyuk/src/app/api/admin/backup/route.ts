/**
 * Database Backup API
 * POST - Create new backup
 * GET - List all backups
 * DELETE - Delete a backup
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { databaseBackupService } from '@/lib/services/database-backup-service'

// POST - Create backup (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    console.log('[BACKUP API] Creating backup requested by:', session.user.email)
    
    const result = await databaseBackupService.createBackup()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backup: result.backup
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Backup failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[BACKUP API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List backups (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    const backups = await databaseBackupService.listBackups()
    const stats = await databaseBackupService.getBackupStats()
    
    return NextResponse.json({
      backups,
      stats
    })
  } catch (error) {
    console.error('[BACKUP API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a backup (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }
    
    const success = await databaseBackupService.deleteBackup(filename)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete backup' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[BACKUP API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
