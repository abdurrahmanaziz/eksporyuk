const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreTransactionData() {
  console.log('🔄 Downloading backup for transaction data...')
  
  const response = await fetch('https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/full-backup-1767414248776.json')
  const backup = await response.json()
  
  // Transaction-related tables
  const transactionTables = [
    'userInvoice',
    'userMembership', 
    'walletTransaction',
    'commissionTransaction',
    'payout',
    'pendingRevenue',
    'affiliateCredit',
    'affiliateCreditTransaction',
    'transaction',
    'membershipTransaction'
  ]
  
  for (const tableName of transactionTables) {
    if (backup.tables[tableName] && backup.tables[tableName].length > 0) {
      console.log(`📥 Restoring ${tableName}: ${backup.tables[tableName].length} records`)
      
      try {
        const records = backup.tables[tableName]
        let restored = 0
        
        for (const record of records) {
          try {
            if (tableName === 'userInvoice') {
              await prisma.userInvoice.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'userMembership') {
              await prisma.userMembership.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'walletTransaction') {
              await prisma.walletTransaction.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'commissionTransaction') {
              await prisma.commissionTransaction.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'payout') {
              await prisma.payout.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'pendingRevenue') {
              await prisma.pendingRevenue.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'affiliateCredit') {
              await prisma.affiliateCredit.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'affiliateCreditTransaction') {
              await prisma.affiliateCreditTransaction.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'transaction') {
              await prisma.transaction.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            } else if (tableName === 'membershipTransaction') {
              await prisma.membershipTransaction.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
            }
            
            restored++
            
            if (restored % 500 === 0) {
              console.log(`  ✓ ${tableName}: ${restored}/${records.length}`)
            }
          } catch (error) {
            // Skip individual record errors (missing dependencies, etc)
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
  
  // Check restored data
  const counts = await Promise.all([
    prisma.userInvoice.count(),
    prisma.userMembership.count(),
    prisma.walletTransaction.count(),
    prisma.payout.count(),
    prisma.transaction.count()
  ])
  
  console.log('\n📊 Restored data summary:')
  console.log(`  - User Invoices: ${counts[0]}`)
  console.log(`  - User Memberships: ${counts[1]}`)
  console.log(`  - Wallet Transactions: ${counts[2]}`)
  console.log(`  - Payouts: ${counts[3]}`)
  console.log(`  - Transactions: ${counts[4]}`)
}

restoreTransactionData()
  .catch(error => {
    console.error('💥 Restore failed:', error.message)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })