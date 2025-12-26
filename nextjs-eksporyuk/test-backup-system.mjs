#!/usr/bin/env node
/**
 * Manual Backup Trigger
 * Test backup system sebelum deploy
 */

import { databaseBackupService } from './src/lib/services/database-backup-service.js'

async function testBackup() {
  try {
    console.log('🔄 Testing backup system...\n')
    
    // Check env
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not set!')
      console.log('Please add to .env.local:')
      console.log('BLOB_READ_WRITE_TOKEN=your_token_here\n')
      process.exit(1)
    }
    
    console.log('✅ BLOB_READ_WRITE_TOKEN found')
    
    // Create backup
    console.log('\n📦 Creating backup...')
    const result = await databaseBackupService.createBackup()
    
    if (!result.success) {
      console.error('\n❌ Backup failed:', result.error)
      process.exit(1)
    }
    
    console.log('\n✅ Backup created successfully!')
    console.log('\n📊 Backup Info:')
    console.log(`   ID: ${result.backup!.id}`)
    console.log(`   Filename: ${result.backup!.filename}`)
    console.log(`   Size: ${(result.backup!.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   URL: ${result.backup!.url}`)
    console.log(`   Tables: ${result.backup!.tablesCount}`)
    
    console.log('\n📋 Records per table:')
    Object.entries(result.backup!.recordsCount)
      .filter(([, count]) => count > 0)
      .forEach(([table, count]) => {
        console.log(`   ${table}: ${count.toLocaleString()}`)
      })
    
    // List all backups
    console.log('\n📚 All backups:')
    const backups = await databaseBackupService.listBackups()
    console.log(`   Total: ${backups.length} backup(s)`)
    
    backups.slice(0, 5).forEach((backup, i) => {
      const date = new Date(backup.createdAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta'
      })
      console.log(`   ${i + 1}. ${backup.filename} - ${date}`)
    })
    
    // Stats
    const stats = await databaseBackupService.getBackupStats()
    console.log('\n📊 Backup Statistics:')
    console.log(`   Total backups: ${stats.totalBackups}`)
    console.log(`   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Last backup: ${stats.lastBackup ? new Date(stats.lastBackup).toLocaleString('id-ID') : 'None'}`)
    
    console.log('\n🎉 Backup system working correctly!')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

testBackup()
