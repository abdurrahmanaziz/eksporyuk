const { PrismaClient } = require('@prisma/client')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const backupDir = path.join(__dirname, 'backups')
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`)
  
  // Create backups directory if not exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  console.log(`🔄 Starting database backup: ${timestamp}`)
  
  try {
    // Get database URL from environment
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in environment')
    }
    
    // Parse connection string
    const url = new URL(dbUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1).split('?')[0]
    const username = url.username
    const password = url.password
    
    // Use pg_dump to backup
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${backupFile}`
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message)
        
        // Fallback: JSON backup via Prisma
        console.log('🔄 Attempting JSON backup...')
        performJsonBackup(timestamp)
        return
      }
      
      const stats = fs.statSync(backupFile)
      console.log(`✅ Backup completed: ${backupFile}`)
      console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
      
      // Clean old backups (keep last 24 hours)
      cleanOldBackups(backupDir)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    
    // Fallback: JSON backup
    performJsonBackup(timestamp)
  } finally {
    await prisma.$disconnect()
  }
}

async function performJsonBackup(timestamp) {
  const backupDir = path.join(__dirname, 'backups')
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
  
  try {
    console.log('📦 Creating JSON backup...')
    
    const data = {
      timestamp,
      users: await prisma.user.findMany(),
      memberships: await prisma.membership.findMany(),
      userMemberships: await prisma.userMembership.findMany(),
      groups: await prisma.group.findMany(),
      wallets: await prisma.wallet.findMany(),
      transactions: await prisma.transaction.findMany({ take: 1000 }), // Last 1000
      settings: await prisma.settings.findMany(),
      leadMagnets: await prisma.leadMagnet.findMany(),
      affiliateOptinForms: await prisma.affiliateOptinForm.findMany(),
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2))
    
    const stats = fs.statSync(backupFile)
    console.log(`✅ JSON Backup completed: ${backupFile}`)
    console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📊 Records: ${data.users.length} users, ${data.memberships.length} memberships`)
    
  } catch (error) {
    console.error('❌ JSON backup failed:', error.message)
  }
}

function cleanOldBackups(backupDir) {
  const files = fs.readdirSync(backupDir)
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  let deleted = 0
  
  files.forEach(file => {
    const filePath = path.join(backupDir, file)
    const stats = fs.statSync(filePath)
    
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath)
      deleted++
    }
  })
  
  if (deleted > 0) {
    console.log(`🗑️  Cleaned ${deleted} old backup(s)`)
  }
}

// Run backup
backupDatabase()
