/**
 * Upload Database Backup to Vercel Blob
 * Upload local database backup file to Vercel Blob storage
 * 
 * Usage: node upload-backup-to-blob.js <file-path>
 * Example: node upload-backup-to-blob.js vercel-blob-backup/2026-01-03T04-09-44/33_database-backup-2026-01-01-OXimCL0d9sK7xHqJa3naM1AfdIdkwo.json
 */

import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') })

/**
 * Upload file to Vercel Blob
 */
async function uploadToBlob(filePath) {
  try {
    console.log('\n📤 Uploading to Vercel Blob...')
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not found in environment')
    }
    
    // Read file
    const fileContent = fs.readFileSync(filePath)
    const filename = path.basename(filePath)
    const fileSize = (fileContent.length / 1024 / 1024).toFixed(2)
    
    console.log(`   File: ${filename}`)
    console.log(`   Size: ${fileSize} MB`)
    console.log('   Uploading...')
    
    // Upload to Vercel Blob
    const blob = await put(`db-backups/${filename}`, fileContent, {
      access: 'public',
      addRandomSuffix: false
    })
    
    console.log('\n✅ Upload successful!')
    console.log(`   URL: ${blob.url}`)
    console.log(`   Pathname: ${blob.pathname}`)
    console.log(`   Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
    
    return blob
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Upload Backup to Vercel Blob')
    console.log('═══════════════════════════════════════════════════════\n')
    
    // Get file path from arguments
    const backupPath = process.argv[2]
    
    if (!backupPath) {
      console.error('❌ Error: Please provide a file path')
      console.log('\nUsage: node upload-backup-to-blob.js <file-path>')
      console.log('Example: node upload-backup-to-blob.js vercel-blob-backup/2026-01-03T04-09-44/33_database-backup.json')
      process.exit(1)
    }
    
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`File not found: ${backupPath}`)
    }
    
    console.log('📁 File to upload:')
    console.log(`   ${backupPath}`)
    console.log(`   Size: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB\n`)
    
    // Upload to Vercel Blob
    const blob = await uploadToBlob(backupPath)
    
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('🎉 Backup uploaded to Vercel Blob successfully!')
    console.log(`   Access URL: ${blob.url}`)
    console.log('═══════════════════════════════════════════════════════\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run
main().catch(console.error)
