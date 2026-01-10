/**
 * Backup Vercel Blob Storage
 * Download all files from Vercel Blob to local folder
 * 
 * Usage: node backup-vercel-blob.js
 */

import { list } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') })

const BACKUP_DIR = path.join(__dirname, 'vercel-blob-backup')
const BACKUP_TIMESTAMP = new Date().toISOString().replace(/:/g, '-').split('.')[0]
const BACKUP_FOLDER = path.join(BACKUP_DIR, BACKUP_TIMESTAMP)

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

if (!fs.existsSync(BACKUP_FOLDER)) {
  fs.mkdirSync(BACKUP_FOLDER, { recursive: true })
}

/**
 * Download file from URL
 */
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve()
      })
      
      file.on('error', (err) => {
        fs.unlinkSync(filepath)
        reject(err)
      })
    }).on('error', (err) => {
      fs.unlinkSync(filepath)
      reject(err)
    })
  })
}

/**
 * Sanitize filename for safe file system storage
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Backup all blobs
 */
async function backupVercelBlob() {
  try {
    console.log('🚀 Starting Vercel Blob backup...')
    console.log(`📁 Backup folder: ${BACKUP_FOLDER}`)
    console.log('')

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ Error: BLOB_READ_WRITE_TOKEN not found in environment variables')
      console.error('   Make sure .env.local exists in nextjs-eksporyuk folder')
      process.exit(1)
    }

    console.log('📋 Fetching blob list from Vercel...')
    
    // List all blobs
    const { blobs } = await list()
    
    console.log(`✅ Found ${blobs.length} files in Vercel Blob storage`)
    console.log('')

    if (blobs.length === 0) {
      console.log('ℹ️  No files to backup')
      return
    }

    // Create metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      totalFiles: blobs.length,
      files: []
    }

    // Download each blob
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i]
      
      try {
        // Extract original filename from pathname or use sanitized URL
        const originalName = blob.pathname || sanitizeFilename(blob.url)
        const filename = `${i + 1}_${originalName}`
        const filepath = path.join(BACKUP_FOLDER, filename)
        
        // Create subdirectories if needed
        const fileDir = path.dirname(filepath)
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true })
        }
        
        console.log(`📥 [${i + 1}/${blobs.length}] Downloading: ${originalName}`)
        console.log(`   URL: ${blob.url}`)
        console.log(`   Size: ${(blob.size / 1024).toFixed(2)} KB`)
        
        await downloadFile(blob.url, filepath)
        
        successCount++
        
        // Add to metadata
        metadata.files.push({
          index: i + 1,
          originalUrl: blob.url,
          pathname: blob.pathname,
          filename: filename,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          downloadedAt: new Date().toISOString()
        })
        
        console.log(`   ✅ Saved to: ${filename}`)
        console.log('')
        
      } catch (error) {
        errorCount++
        console.error(`   ❌ Error downloading: ${error.message}`)
        console.log('')
        
        metadata.files.push({
          index: i + 1,
          originalUrl: blob.url,
          pathname: blob.pathname,
          error: error.message,
          downloadedAt: new Date().toISOString()
        })
      }
    }

    // Save metadata
    const metadataPath = path.join(BACKUP_FOLDER, '_metadata.json')
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 Backup Summary:')
    console.log(`   Total files: ${blobs.length}`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`   📁 Location: ${BACKUP_FOLDER}`)
    console.log(`   📄 Metadata: ${metadataPath}`)
    console.log('═══════════════════════════════════════════════════════')
    
    if (errorCount > 0) {
      console.log('⚠️  Some files failed to download. Check the logs above.')
    } else {
      console.log('🎉 All files backed up successfully!')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run backup
backupVercelBlob().catch(console.error)
