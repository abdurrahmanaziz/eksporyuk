#!/usr/bin/env node
/**
 * Manual Database Backup Script
 * Backup database ke Vercel Blob Storage
 * 
 * Usage: node manual-backup.js
 */

require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const { put } = require('@vercel/blob')

const prisma = new PrismaClient()

// Tabel yang akan di-backup
const BACKUP_TABLES = [
  'user',
  'membership', 
  'userMembership',
  'transaction',
  'affiliateProfile',
  'affiliateConversion',
  'affiliateCommission',
  'affiliateCreditTransaction',
  'affiliateLink',
  'affiliateShortLink',
  'wallet',
  'walletTransaction',
  'pendingRevenue',
  'course',
  'courseModule',
  'courseLesson',
  'courseEnrollment',
  'product',
  'coupon',
  'settings',
  'integration',
  'event',
  'eventRegistration',
  'group',
  'groupMember',
  'post',
  'notification',
  'certificate',
  'leadMagnet',
  'optInPage',
  'mentorProfile',
]

async function createBackup() {
  console.log('🔄 Starting manual backup...\n')
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${timestamp}.json`
    
    const backupData = {}
    const recordsCount = {}
    
    // Backup setiap tabel
    for (const table of BACKUP_TABLES) {
      try {
        process.stdout.write(`📦 Backing up ${table}...`)
        
        const data = await prisma[table].findMany()
        backupData[table] = data
        recordsCount[table] = data.length
        
        console.log(` ✓ ${data.length} records`)
      } catch (err) {
        console.log(` ⚠️  Skipped (${err.message})`)
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
    
    const sizeMB = (Buffer.byteLength(backupJson, 'utf8') / 1024 / 1024).toFixed(2)
    console.log(`\n📊 Backup size: ${sizeMB} MB`)
    
    // Upload ke Vercel Blob
    console.log('☁️  Uploading to Vercel Blob...')
    
    const blob = await put(`db-backups/${filename}`, backupJson, {
      access: 'public',
      contentType: 'application/json',
    })
    
    console.log(`\n✅ Backup completed successfully!`)
    console.log(`📁 Filename: ${filename}`)
    console.log(`🔗 URL: ${blob.url}`)
    console.log(`📦 Size: ${sizeMB} MB`)
    console.log(`📊 Total tables: ${BACKUP_TABLES.length}`)
    console.log(`📝 Total records:`, Object.values(recordsCount).reduce((a, b) => a + b, 0))
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message)
    process.exit(1)
  }
}

// Run backup
createBackup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
