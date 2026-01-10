/**
 * Execute Sejoli Transaction Sync
 * Apply the changes identified in sync analysis:
 * 1. Update status for changed transactions
 * 2. Import new transactions (will be done separately by import script)
 * 
 * SAFE MODE: Only updates existing records, does NOT delete anything
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function executeSync() {
  console.log('🚀 Executing Sejoli Transaction Sync...\n')

  // 1. Load sync data from latest report
  const syncFiles = fs.readdirSync('.').filter(f => f.startsWith('sync-data-'))
  if (syncFiles.length === 0) {
    console.error('❌ No sync data found. Run sync-sejoli-transactions.js first!')
    process.exit(1)
  }

  const latestFile = syncFiles.sort().reverse()[0]
  console.log(`📂 Loading sync data from: ${latestFile}`)
  
  const syncData = JSON.parse(fs.readFileSync(latestFile, 'utf8'))
  const { toUpdate, toCreate } = syncData

  console.log(`\n📊 Sync Plan:`)
  console.log(`   🔄 Transactions to update: ${toUpdate.length}`)
  console.log(`   ➕ Transactions to create: ${toCreate.length}`)
  console.log('')

  // 2. Update existing transactions
  if (toUpdate.length > 0) {
    console.log('🔄 Updating existing transactions...')
    
    for (const update of toUpdate) {
      try {
        await prisma.transaction.update({
          where: { id: update.id },
          data: {
            status: update.newStatus,
            updatedAt: new Date(),
            metadata: {
              ...(update.order.meta_data || {}),
              sejoli_order_id: update.sejoliId,
              sync_updated_at: new Date().toISOString(),
              status_changed_from: update.oldStatus
            }
          }
        })
        console.log(`   ✅ Updated TX ${update.id}: ${update.oldStatus} → ${update.newStatus}`)
      } catch (error) {
        console.error(`   ❌ Failed to update TX ${update.id}:`, error.message)
      }
    }
    console.log(`✅ Updated ${toUpdate.length} transactions\n`)
  } else {
    console.log('✅ No transactions need status update\n')
  }

  // 3. Info about new transactions
  if (toCreate.length > 0) {
    console.log(`ℹ️  ${toCreate.length} new transactions found`)
    console.log(`   These will be imported separately using the full import script`)
    console.log(`   to ensure proper commission calculation and user/membership setup\n`)
    
    // Save new orders for import
    const newOrdersFile = `new-sejoli-orders-${Date.now()}.json`
    fs.writeFileSync(newOrdersFile, JSON.stringify(toCreate, null, 2))
    console.log(`💾 New orders saved to: ${newOrdersFile}\n`)
  }

  console.log('✅ Sync execution completed!')
  
  // Summary
  console.log('\n📊 SUMMARY:')
  console.log(`   ✅ Updated: ${toUpdate.length}`)
  console.log(`   ➕ New (ready for import): ${toCreate.length}`)
  console.log(`   🔒 Database safe: No deletions performed`)
}

executeSync()
  .catch(error => {
    console.error('❌ Error executing sync:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
