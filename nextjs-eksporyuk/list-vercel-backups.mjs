#!/usr/bin/env node
/**
 * List all database backups from Vercel Blob Storage
 */

import { list } from '@vercel/blob'
import 'dotenv/config'

const BACKUP_PREFIX = 'db-backups/'

async function listBackups() {
  try {
    console.log('🔍 Checking Vercel Blob for database backups...\n')
    
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment!')
      console.log('Please set it in .env.local:')
      console.log('BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx')
      process.exit(1)
    }

    // List all blobs with backup prefix
    const { blobs } = await list({ 
      prefix: BACKUP_PREFIX,
      limit: 100
    })
    
    if (blobs.length === 0) {
      console.log('⚠️  No backups found in Vercel Blob Storage')
      console.log(`   Prefix: ${BACKUP_PREFIX}`)
      return
    }
    
    console.log(`✅ Found ${blobs.length} backup(s):\n`)
    
    // Sort by upload date (newest first)
    const sortedBlobs = blobs.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    
    // Display backups
    sortedBlobs.forEach((blob, index) => {
      const filename = blob.pathname.replace(BACKUP_PREFIX, '')
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2)
      const uploadDate = new Date(blob.uploadedAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'long'
      })
      
      console.log(`${index + 1}. ${filename}`)
      console.log(`   Size: ${sizeMB} MB`)
      console.log(`   Date: ${uploadDate}`)
      console.log(`   URL: ${blob.url}`)
      console.log('')
    })
    
    console.log(`\n💡 To download a backup:`)
    console.log(`   curl -o backup.json "${sortedBlobs[0].url}"`)
    console.log(`\n💡 To restore from backup:`)
    console.log(`   node restore-from-backup.mjs backup.json`)
    
  } catch (error) {
    console.error('❌ Error listing backups:', error.message)
    
    if (error.message.includes('token')) {
      console.log('\n💡 Make sure BLOB_READ_WRITE_TOKEN is correct')
      console.log('   Get it from: https://vercel.com/storage')
    }
    
    process.exit(1)
  }
}

listBackups()
