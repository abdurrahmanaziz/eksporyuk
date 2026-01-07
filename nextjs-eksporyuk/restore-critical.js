const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function downloadAndRestoreBackup() {
  console.log('🔄 Downloading backup...')
  
  const response = await fetch('https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/full-backup-1767414248776.json')
  if (!response.ok) {
    throw new Error('Failed to download backup')
  }
  
  const backup = await response.json()
  console.log(`📦 Backup from: ${new Date(backup.timestamp).toISOString()}`)
  console.log(`📊 Tables in backup: ${Object.keys(backup.tables).length}`)
  
  // Critical tables to restore first
  const priorityTables = [
    'settings',
    'user',
    'wallet', 
    'membership',
    'affiliateProfile',
    'mentorProfile',
    'payout'
  ]
  
  // Restore priority tables first
  for (const tableName of priorityTables) {
    if (backup.tables[tableName] && backup.tables[tableName].length > 0) {
      console.log(`📥 Restoring ${tableName}: ${backup.tables[tableName].length} records`)
      
      try {
        if (tableName === 'settings') {
          for (const record of backup.tables[tableName]) {
            await prisma.settings.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        } else if (tableName === 'user') {
          for (const record of backup.tables[tableName]) {
            await prisma.user.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        } else if (tableName === 'wallet') {
          for (const record of backup.tables[tableName]) {
            await prisma.wallet.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        } else if (tableName === 'membership') {
          for (const record of backup.tables[tableName]) {
            await prisma.membership.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        } else if (tableName === 'affiliateProfile') {
          for (const record of backup.tables[tableName]) {
            await prisma.affiliateProfile.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        } else if (tableName === 'mentorProfile') {
          for (const record of backup.tables[tableName]) {
            await prisma.mentorProfile.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        } else if (tableName === 'payout') {
          for (const record of backup.tables[tableName]) {
            await prisma.payout.upsert({
              where: { id: record.id },
              update: record,
              create: record
            })
          }
        }
        
        console.log(`✅ ${tableName} restored successfully`)
      } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error.message)
      }
    }
  }
  
  console.log('🎉 Priority tables restoration completed!')
  console.log('📝 You can now test the withdrawal feature')
}

downloadAndRestoreBackup()
  .catch(error => {
    console.error('💥 Restore failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })