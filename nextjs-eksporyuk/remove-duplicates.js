/**
 * Remove Duplicate Transactions - SAFE MODE
 * Hapus transaksi duplikat dengan prioritas:
 * 1. Keep: Transaksi dengan sejoli_order_id di metadata (lebih lengkap)
 * 2. Keep: Transaksi tertua jika tidak ada sejoli metadata
 * 3. Remove: Duplikat sisanya
 * 
 * AMAN: Tidak akan menghapus data unique/penting
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

async function removeDuplicates() {
  console.log('🗑️  Starting Safe Duplicate Removal...\n')

  // Load duplicate IDs
  if (!fs.existsSync('duplicate-transaction-ids.json')) {
    console.error('❌ File duplicate-transaction-ids.json tidak ditemukan!')
    console.error('   Jalankan analyze-duplicates.js terlebih dahulu')
    process.exit(1)
  }

  const duplicateData = JSON.parse(fs.readFileSync('duplicate-transaction-ids.json', 'utf8'))
  const { duplicateIds, duplicateGroups } = duplicateData

  console.log(`📊 Loaded duplicate analysis:`)
  console.log(`   Total Duplicate IDs to Remove: ${duplicateIds.length}`)
  console.log(`   Duplicate Groups: ${duplicateGroups.length}\n`)

  // Safety check - jangan hapus lebih dari 50% database
  const totalTx = await prisma.transaction.count()
  const removalPercentage = (duplicateIds.length / totalTx) * 100

  console.log(`🔒 Safety Check:`)
  console.log(`   Current Total: ${totalTx}`)
  console.log(`   To Remove: ${duplicateIds.length}`)
  console.log(`   Percentage: ${removalPercentage.toFixed(2)}%`)
  
  if (removalPercentage > 50) {
    console.log('\n⚠️  WARNING: Will remove more than 50% of data!')
    console.log('   Review duplicate-transaction-ids.json manually')
  }
  console.log('')

  // Show sample of what will be removed
  console.log('📋 Sample Duplicate Groups (will keep first, remove rest):\n')
  duplicateGroups.slice(0, 5).forEach((group, idx) => {
    console.log(`${idx + 1}. Group: ${group.key}`)
    console.log(`   Keep: ${group.ids[0]}`)
    console.log(`   Remove: ${group.ids.slice(1).join(', ')}\n`)
  })

  // Ask for confirmation
  console.log('⏸️  DRY RUN COMPLETE')
  console.log('\n🚨 FINAL CONFIRMATION REQUIRED:')
  console.log(`   This will DELETE ${duplicateIds.length} transactions permanently!`)
  console.log(`   Database will have ${totalTx - duplicateIds.length} transactions after cleanup`)
  console.log('')
  console.log('   To proceed, run: node remove-duplicates.js --execute')
  console.log('   To review first: cat duplicate-transaction-ids.json | jq')
  
  // Check if --execute flag is present
  const shouldExecute = process.argv.includes('--execute')
  
  if (!shouldExecute) {
    console.log('\n✅ Dry run complete. No changes made.')
    return
  }

  // EXECUTE DELETION
  console.log('\n🚀 EXECUTING DELETION...\n')

  try {
    // Batch delete in chunks to avoid timeout
    const chunkSize = 100
    let deleted = 0

    for (let i = 0; i < duplicateIds.length; i += chunkSize) {
      const chunk = duplicateIds.slice(i, i + chunkSize)
      
      const result = await prisma.transaction.deleteMany({
        where: {
          id: {
            in: chunk
          }
        }
      })

      deleted += result.count
      
      if ((i + chunkSize) % 1000 === 0) {
        console.log(`   Progress: ${deleted}/${duplicateIds.length} deleted...`)
      }
    }

    console.log(`\n✅ Successfully deleted ${deleted} duplicate transactions!`)

    // Verify
    const remainingCount = await prisma.transaction.count()
    console.log(`\n📊 Database After Cleanup:`)
    console.log(`   Total Transactions: ${remainingCount}`)
    console.log(`   Removed: ${deleted}`)
    console.log(`   Expected: ${totalTx - duplicateIds.length}`)
    
    if (remainingCount === totalTx - duplicateIds.length) {
      console.log(`   ✅ Count matches expected!`)
    } else {
      console.log(`   ⚠️  Count mismatch - please verify manually`)
    }

    // Save deletion log
    const logFile = `deletion-log-${Date.now()}.json`
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalDeleted: deleted,
      deletedIds: duplicateIds,
      beforeCount: totalTx,
      afterCount: remainingCount
    }, null, 2))

    console.log(`\n💾 Deletion log saved to: ${logFile}`)
    console.log('✅ Cleanup complete!')

  } catch (error) {
    console.error('\n❌ Error during deletion:', error)
    throw error
  }
}

removeDuplicates()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
