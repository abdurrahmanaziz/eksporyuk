/**
 * Local backup script - backup database dari lokal ke Vercel Blob
 * Gunakan saat dev atau dari CI/CD
 */

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

// Pastikan .env.local sudah set BLOB_READ_WRITE_TOKEN
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function backupToBlob() {
  try {
    console.log('🔄 Memulai backup database lokal ke Vercel Blob...')

    const dbPath = path.join(__dirname, '..', '..', 'database', 'dev.db')
    
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file tidak ditemukan:', dbPath)
      process.exit(1)
    }

    const dbBuffer = fs.readFileSync(dbPath)
    const fileName = `database-backup-${new Date().toISOString().split('T')[0]}.db`
    
    console.log(`📦 Database size: ${(dbBuffer.length / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📝 Backup name: ${fileName}`)

    // Manual upload ke Vercel Blob menggunakan API
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) {
      console.error('❌ BLOB_READ_WRITE_TOKEN tidak ditemukan di environment')
      console.log('💡 Set BLOB_READ_WRITE_TOKEN di .env.local atau sistem')
      process.exit(1)
    }

    // Upload via Vercel Blob API
    const formData = new FormData()
    formData.append('file', new Blob([dbBuffer]), fileName)

    const response = await fetch('https://blob.vercel-storage.com', {
      method: 'PUT',
      headers: {
        'authorization': `Bearer ${blobToken}`,
      },
      body: dbBuffer,
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Backup berhasil dikirim ke Vercel Blob!')
      console.log('📍 URL:', result.url || 'Stored in Vercel Blob')
      console.log('⏰ Timestamp:', new Date().toISOString())
    } else {
      console.error('❌ Upload failed:', response.statusText)
      const text = await response.text()
      console.error('Detail:', text)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

backupToBlob()
