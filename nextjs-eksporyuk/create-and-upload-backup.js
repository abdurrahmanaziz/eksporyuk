/**
 * Create and Upload Database Backup to Vercel Blob
 * Creates fresh backup from production database and uploads to Vercel Blob
 * 
 * Usage: node create-and-upload-backup.js
 */

import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') })

const prisma = new PrismaClient()

/**
 * Create JSON backup from database
 */
async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const backupFilename = `database-backup-${timestamp}.json`
  const backupPath = path.join(__dirname, backupFilename)
  
  console.log('📊 Creating database backup from production...')
  console.log(`   Timestamp: ${timestamp}`)
  console.log('')
  
  try {
    // Critical tables to backup
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      database: 'production',
      tables: {}
    }
    
    // Backup each table
    console.log('📋 Backing up tables...')
    
    // Define tables to backup
    const tablesToBackup = [
      'user', 'membership', 'userMembership', 'transaction',
      'affiliateProfile', 'affiliateConversion', 'affiliateCommission', 
      'affiliateLink', 'affiliateShortLink', 'affiliateCreditTransaction',
      'wallet', 'walletTransaction', 'pendingRevenue',
      'course', 'courseModule', 'courseLesson', 'courseEnrollment',
      'product', 'coupon', 'brandedTemplate', 'settings', 'integration',
      'event', 'eventRegistration', 'group', 'groupMember',
      'post', 'postComment', 'notification'
    ]
    
    // Backup each table with error handling
    for (const tableName of tablesToBackup) {
      try {
        if (prisma[tableName]) {
          const data = await prisma[tableName].findMany()
          backup.tables[tableName] = data
          console.log(`   ✓ ${tableName}: ${data.length} records`)
        }
      } catch (error) {
        console.log(`   ⚠️  ${tableName}: skipped (${error.message})`)
      }
    }
    
    // Write to file
    console.log('\n💾 Writing backup file...')
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    
    const fileSize = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)
    console.log(`   ✅ Backup created: ${backupFilename}`)
    console.log(`   Size: ${fileSize} MB`)
    
    await prisma.$disconnect()
    
    return { path: backupPath, filename: backupFilename, size: fileSize }
  } catch (error) {
    await prisma.$disconnect()
    throw error
  }
}

/**
 * Upload to Vercel Blob
 */
async function uploadToBlob(backupInfo) {
  console.log('\n📤 Uploading to Vercel Blob...')
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not found')
  }
  
  const fileContent = fs.readFileSync(backupInfo.path)
  
  console.log(`   File: ${backupInfo.filename}`)
  console.log(`   Size: ${backupInfo.size} MB`)
  console.log('   Uploading...')
  
  const blob = await put(`db-backups/${backupInfo.filename}`, fileContent, {
    access: 'public',
    addRandomSuffix: false
  })
  
  console.log('\n✅ Upload successful!')
  console.log(`   URL: ${blob.url}`)
  console.log(`   Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
  
  return blob
}

/**
 * Main
 */
async function main() {
  try {
    console.log('🚀 Create and Upload Database Backup')
    console.log('═══════════════════════════════════════════════════════\n')
    
    // Create backup
    const backupInfo = await createDatabaseBackup()
    
    // Upload to blob
    const blob = await uploadToBlob(backupInfo)
    
    // Cleanup local file
    console.log('\n🗑️  Cleaning up local file...')
    fs.unlinkSync(backupInfo.path)
    console.log('   ✅ Local file deleted')
    
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('🎉 Backup created and uploaded successfully!')
    console.log(`   URL: ${blob.url}`)
    console.log('═══════════════════════════════════════════════════════\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
