#!/usr/bin/env node
/**
 * EMERGENCY: Restore database from Vercel Blob backup
 * Usage: npx tsx restore-from-backup.mjs [backup-file.json]
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function restoreFromBackup(backupFile = 'latest-backup.json') {
  try {
    console.log('🚨 EMERGENCY DATABASE RESTORE')
    console.log('================================\n')
    
    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`)
      console.log('\n💡 Download backup first:')
      console.log('   npx tsx list-vercel-backups.mjs')
      console.log('   curl -o latest-backup.json "BACKUP_URL"')
      process.exit(1)
    }
    
    // Read backup
    console.log(`📂 Reading backup: ${backupFile}`)
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
    
    console.log('\n📊 Backup Info:')
    console.log(`   Created: ${backupData.createdAt}`)
    console.log(`   Version: ${backupData.version}`)
    
    console.log('\n📊 Records to restore:')
    Object.entries(backupData.metadata.recordsCount).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ${table}: ${count.toLocaleString()}`)
      }
    })
    
    // Confirmation
    console.log('\n⚠️  WARNING: This will DELETE ALL current data and restore from backup!')
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    console.log('🔄 Starting restore process...\n')
    
    // Order matters due to foreign key constraints
    const restoreOrder = [
      'Settings',
      'Integration', 
      'IntegrationConfig',
      'BrandedTemplate',
      'Coupon',
      'User',
      'Wallet',
      'WalletTransaction',
      'Membership',
      'UserMembership',
      'Transaction',
      'AffiliateProfile',
      'AffiliateConversion',
      'AffiliateCreditTransaction',
      'Course',
      'CourseModule',
      'CourseLesson',
      'CourseEnrollment',
      'Product',
      'Event',
      'Group',
      'GroupMember',
      'Post',
      'Notification',
      'Certificate',
    ]
    
    let totalRestored = 0
    
    for (const tableName of restoreOrder) {
      const tableData = backupData.tables[tableName]
      
      if (!tableData || tableData.length === 0) {
        console.log(`⏭️  ${tableName}: Skipped (no data)`)
        continue
      }
      
      try {
        // Get model name (first letter lowercase)
        const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1)
        
        // Delete existing data
        await prisma[modelName].deleteMany({})
        
        // Restore data in batches
        const batchSize = 100
        let restored = 0
        
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          await prisma[modelName].createMany({
            data: batch,
            skipDuplicates: true
          })
          restored += batch.length
        }
        
        totalRestored += restored
        console.log(`✅ ${tableName}: ${restored.toLocaleString()} records restored`)
        
      } catch (error) {
        console.error(`❌ ${tableName}: Failed - ${error.message}`)
      }
    }
    
    console.log(`\n✅ RESTORE COMPLETED!`)
    console.log(`   Total records restored: ${totalRestored.toLocaleString()}`)
    
    // Verify restore
    console.log('\n🔍 Verifying restore...')
    const userCount = await prisma.user.count()
    const transactionCount = await prisma.transaction.count()
    const affiliateCount = await prisma.affiliateProfile.count()
    
    console.log(`   Users: ${userCount.toLocaleString()}`)
    console.log(`   Transactions: ${transactionCount.toLocaleString()}`)
    console.log(`   Affiliates: ${affiliateCount.toLocaleString()}`)
    
    if (userCount > 0) {
      console.log('\n🎉 Database restored successfully!')
      console.log('\n⚠️  IMPORTANT: Data from Dec 17 - Dec 25 is LOST!')
      console.log('   Please check Neon Console for more recent backups.')
    } else {
      console.log('\n❌ Restore verification failed!')
    }
    
  } catch (error) {
    console.error('\n❌ RESTORE FAILED:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run restore
const backupFile = process.argv[2] || 'latest-backup.json'
restoreFromBackup(backupFile)
