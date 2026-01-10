const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreTransactionTables() {
  console.log('🔄 Downloading backup...')
  
  const response = await fetch('https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/full-backup-1767414248776.json')
  const backup = await response.json()
  
  // Actual available transaction tables
  const tables = [
    'walletTransaction',
    'payout', 
    'pointTransaction',
    'affiliateCreditTransaction'
  ]
  
  for (const tableName of tables) {
    if (backup.tables[tableName] && backup.tables[tableName].length > 0) {
      console.log(`📥 Restoring ${tableName}: ${backup.tables[tableName].length} records`)
      
      try {
        const records = backup.tables[tableName]
        let restored = 0
        
        for (const record of records) {
          try {
            if (tableName === 'walletTransaction') {
              // Check if wallet exists first
              const walletExists = await prisma.wallet.findUnique({
                where: { id: record.walletId }
              })
              
              if (walletExists) {
                await prisma.walletTransaction.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              }
            } else if (tableName === 'payout') {
              const walletExists = await prisma.wallet.findUnique({
                where: { id: record.walletId }
              })
              
              if (walletExists) {
                await prisma.payout.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              }
            } else if (tableName === 'pointTransaction') {
              const userExists = await prisma.user.findUnique({
                where: { id: record.userId }
              })
              
              if (userExists) {
                await prisma.pointTransaction.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              }
            } else if (tableName === 'affiliateCreditTransaction') {
              const userExists = await prisma.user.findUnique({
                where: { id: record.userId }
              })
              
              if (userExists) {
                await prisma.affiliateCreditTransaction.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              }
            }
            
            if (restored % 100 === 0 && restored > 0) {
              console.log(`  ✓ ${tableName}: ${restored}/${records.length}`)
            }
          } catch (error) {
            // Skip individual record errors
          }
        }
        
        console.log(`✅ ${tableName}: ${restored}/${records.length} restored`)
        
      } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error.message)
      }
    } else {
      console.log(`⚠️  ${tableName}: No data to restore`)
    }
  }
  
  console.log('🎉 Transaction data restoration completed!')
  
  // Show final counts
  try {
    const walletTxCount = await prisma.walletTransaction.count()
    const payoutCount = await prisma.payout.count()
    const pointTxCount = await prisma.pointTransaction.count()
    const affiliateTxCount = await prisma.affiliateCreditTransaction.count()
    
    console.log('\n📊 Final transaction data counts:')
    console.log(`  - Wallet Transactions: ${walletTxCount}`)
    console.log(`  - Payouts: ${payoutCount}`)
    console.log(`  - Point Transactions: ${pointTxCount}`)
    console.log(`  - Affiliate Credit Transactions: ${affiliateTxCount}`)
  } catch (error) {
    console.log('⚠️  Could not get final counts')
  }
}

restoreTransactionTables()
  .catch(error => {
    console.error('💥 Restore failed:', error.message)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })