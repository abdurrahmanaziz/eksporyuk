/**
 * Create FULL Database Backup and Upload to Vercel Blob
 * Backup SEMUA data dari database production
 */

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

// Get all model names from Prisma
const getAllModels = () => {
  return Object.keys(prisma).filter(key => {
    return !key.startsWith('_') && 
           !key.startsWith('$') && 
           typeof prisma[key] === 'object' &&
           typeof prisma[key].findMany === 'function'
  })
}

async function createFullBackup() {
  try {
    console.log('🚀 Starting FULL database backup...')
    console.log('')

    const timestamp = new Date().toISOString()
    const backup = {
      timestamp,
      version: '1.0',
      database: 'production',
      tables: {}
    }

    const models = getAllModels()
    console.log(`📋 Found ${models.length} tables to backup`)
    console.log('')

    let totalRecords = 0

    // Backup SEMUA table
    for (const modelName of models) {
      try {
        console.log(`📦 Backing up ${modelName}...`)
        
        const data = await prisma[modelName].findMany()
        backup.tables[modelName] = data
        
        console.log(`   ✅ ${data.length} records`)
        totalRecords += data.length
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)
        backup.tables[modelName] = { error: error.message, data: [] }
      }
    }

    console.log('')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`📊 Backup completed: ${totalRecords} total records from ${models.length} tables`)
    console.log('═══════════════════════════════════════════════════════')
    console.log('')

    // Convert to JSON
    const jsonData = JSON.stringify(backup, null, 2)
    const sizeInMB = (jsonData.length / 1024 / 1024).toFixed(2)
    
    console.log(`💾 Backup size: ${sizeInMB} MB`)
    console.log('')

    // Save to local file
    const localFilename = `full-backup-${timestamp.replace(/:/g, '-').split('.')[0]}.json`
    const localPath = path.join(__dirname, 'backups', localFilename)
    
    // Create backups directory if not exists
    const backupsDir = path.join(__dirname, 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }
    
    fs.writeFileSync(localPath, jsonData)
    console.log(`✅ Saved locally: ${localPath}`)
    console.log('')

    // Upload to Vercel Blob
    console.log('☁️  Uploading to Vercel Blob...')
    
    const blob = await put(`db-backups/full-backup-${Date.now()}.json`, jsonData, {
      access: 'public',
      contentType: 'application/json'
    })

    console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`)
    console.log('')
    console.log('═══════════════════════════════════════════════════════')
    console.log('🎉 Full backup completed successfully!')
    console.log(`   📁 Local: ${localPath}`)
    console.log(`   ☁️  Cloud: ${blob.url}`)
    console.log(`   📊 Size: ${sizeInMB} MB`)
    console.log(`   📝 Records: ${totalRecords}`)
    console.log(`   🗂️  Tables: ${models.length}`)
    console.log('═══════════════════════════════════════════════════════')

    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

createFullBackup()
