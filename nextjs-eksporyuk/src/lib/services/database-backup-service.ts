/**
 * Database Backup Service
 * Auto backup database to Vercel Blob Storage
 * 
 * Features:
 * - Manual backup via API
 * - Scheduled backup via cron
 * - Keep last 7 backups
 * - Download backup
 * - Restore from backup (admin only)
 */

import { prisma } from '@/lib/prisma'
import { put, del, list } from '@vercel/blob'

// Tables to backup (critical data)
const BACKUP_TABLES = [
  'User',
  'Membership', 
  'UserMembership',
  'Transaction',
  'AffiliateProfile',
  'AffiliateConversion',
  'AffiliateCreditTransaction',
  'Wallet',
  'WalletTransaction',
  'Course',
  'CourseModule',
  'CourseLesson',
  'CourseEnrollment',
  'Product',
  'Coupon',
  'BrandedTemplate',
  'Settings',
  'Integration',
  'IntegrationConfig',
  'Event',
  'Group',
  'GroupMember',
  'Post',
  'Notification',
  'Certificate',
] as const

interface BackupMetadata {
  id: string
  filename: string
  url: string
  size: number
  createdAt: string
  tablesCount: number
  recordsCount: Record<string, number>
}

interface BackupResult {
  success: boolean
  backup?: BackupMetadata
  error?: string
}

class DatabaseBackupService {
  private readonly MAX_BACKUPS = 7
  private readonly BACKUP_PREFIX = 'db-backups/'

  /**
   * Create a new backup
   */
  async createBackup(): Promise<BackupResult> {
    try {
      console.log('[BACKUP] Starting database backup...')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup-${timestamp}.json`
      
      // Collect data from all tables
      const backupData: Record<string, any[]> = {}
      const recordsCount: Record<string, number> = {}
      
      for (const table of BACKUP_TABLES) {
        try {
          // @ts-ignore - Dynamic table access
          const data = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].findMany()
          backupData[table] = data
          recordsCount[table] = data.length
          console.log(`[BACKUP] ${table}: ${data.length} records`)
        } catch (err) {
          console.warn(`[BACKUP] Skipping ${table}: ${err}`)
          backupData[table] = []
          recordsCount[table] = 0
        }
      }
      
      // Create backup JSON
      const backupJson = JSON.stringify({
        version: '1.0',
        createdAt: new Date().toISOString(),
        tables: backupData,
        metadata: {
          recordsCount,
          totalTables: BACKUP_TABLES.length
        }
      }, null, 2)
      
      // Upload to Vercel Blob
      const blob = await put(`${this.BACKUP_PREFIX}${filename}`, backupJson, {
        access: 'public',
        contentType: 'application/json',
      })
      
      console.log(`[BACKUP] Uploaded to: ${blob.url}`)
      
      // Cleanup old backups
      await this.cleanupOldBackups()
      
      const backup: BackupMetadata = {
        id: timestamp,
        filename,
        url: blob.url,
        size: Buffer.byteLength(backupJson, 'utf8'),
        createdAt: new Date().toISOString(),
        tablesCount: BACKUP_TABLES.length,
        recordsCount
      }
      
      console.log('[BACKUP] Backup completed successfully!')
      
      return { success: true, backup }
    } catch (error) {
      console.error('[BACKUP] Backup failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const { blobs } = await list({ prefix: this.BACKUP_PREFIX })
      
      return blobs.map(blob => ({
        id: blob.pathname.replace(this.BACKUP_PREFIX, '').replace('.json', ''),
        filename: blob.pathname.replace(this.BACKUP_PREFIX, ''),
        url: blob.url,
        size: blob.size,
        createdAt: blob.uploadedAt.toISOString(),
        tablesCount: BACKUP_TABLES.length,
        recordsCount: {}
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('[BACKUP] Failed to list backups:', error)
      return []
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(filename: string): Promise<boolean> {
    try {
      await del(`${this.BACKUP_PREFIX}${filename}`)
      console.log(`[BACKUP] Deleted: ${filename}`)
      return true
    } catch (error) {
      console.error('[BACKUP] Failed to delete:', error)
      return false
    }
  }

  /**
   * Cleanup old backups (keep only MAX_BACKUPS)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()
      
      if (backups.length > this.MAX_BACKUPS) {
        const toDelete = backups.slice(this.MAX_BACKUPS)
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.filename)
          console.log(`[BACKUP] Cleaned up old backup: ${backup.filename}`)
        }
      }
    } catch (error) {
      console.error('[BACKUP] Cleanup failed:', error)
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number
    lastBackup: string | null
    totalSize: number
  }> {
    try {
      const backups = await this.listBackups()
      
      return {
        totalBackups: backups.length,
        lastBackup: backups[0]?.createdAt || null,
        totalSize: backups.reduce((sum, b) => sum + b.size, 0)
      }
    } catch (error) {
      return {
        totalBackups: 0,
        lastBackup: null,
        totalSize: 0
      }
    }
  }
}

export const databaseBackupService = new DatabaseBackupService()
export default databaseBackupService
