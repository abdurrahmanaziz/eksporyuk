/**
 * Deep Analysis - Find Duplicate Transactions
 * Periksa transaksi yang duplikat dan identifikasi pola duplikasi
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeDuplicates() {
  console.log('🔍 Deep Analysis - Mencari Duplikasi Transaksi...\n')

  // 1. Get all transactions grouped by potential duplicate keys
  const allTransactions = await prisma.transaction.findMany({
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      type: true,
      createdAt: true,
      externalId: true,
      invoiceNumber: true,
      metadata: true,
      productId: true,
      courseId: true,
      affiliateId: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`📊 Total Transactions in DB: ${allTransactions.length}\n`)

  // 2. Group by userId + amount + date (potential duplicates)
  const duplicateGroups = {}
  const sejoliTransactions = []
  const nonSejoliTransactions = []

  allTransactions.forEach(tx => {
    const date = new Date(tx.createdAt).toISOString().split('T')[0]
    const key = `${tx.userId}-${tx.amount}-${date}`
    
    if (!duplicateGroups[key]) {
      duplicateGroups[key] = []
    }
    duplicateGroups[key].push(tx)

    // Categorize
    const hasSejoli = tx.metadata?.sejoli_order_id || 
                     tx.externalId?.includes('sejoli') || 
                     tx.id?.includes('sejoliimport')
    
    if (hasSejoli) {
      sejoliTransactions.push(tx)
    } else {
      nonSejoliTransactions.push(tx)
    }
  })

  console.log('📋 Breakdown by Source:')
  console.log(`   Sejoli Import: ${sejoliTransactions.length}`)
  console.log(`   Non-Sejoli: ${nonSejoliTransactions.length}\n`)

  // 3. Find actual duplicates (same user, amount, date)
  const duplicates = Object.entries(duplicateGroups)
    .filter(([_, txs]) => txs.length > 1)
    .map(([key, txs]) => ({ key, count: txs.length, transactions: txs }))

  console.log(`⚠️  Duplicate Groups Found: ${duplicates.length}`)
  console.log(`   Total Duplicate Transactions: ${duplicates.reduce((sum, d) => sum + d.count, 0)}\n`)

  if (duplicates.length > 0) {
    console.log('📋 Sample Duplicate Groups (first 5):\n')
    duplicates.slice(0, 5).forEach((dup, idx) => {
      console.log(`${idx + 1}. Key: ${dup.key} (${dup.count} transactions)`)
      dup.transactions.forEach(tx => {
        const source = tx.metadata?.sejoli_order_id ? 
          `Sejoli #${tx.metadata.sejoli_order_id}` : 
          tx.id.includes('sejoliimport') ? 'Sejoli Import' : 'Platform'
        console.log(`   - ${tx.id} | ${tx.status} | ${source} | ${new Date(tx.createdAt).toLocaleString('id-ID')}`)
      })
      console.log('')
    })
  }

  // 4. Check for ID-based duplicates (same sejoli_order_id)
  const sejoliIdMap = {}
  sejoliTransactions.forEach(tx => {
    const sejoliId = tx.metadata?.sejoli_order_id || tx.externalId
    if (sejoliId) {
      if (!sejoliIdMap[sejoliId]) {
        sejoliIdMap[sejoliId] = []
      }
      sejoliIdMap[sejoliId].push(tx)
    }
  })

  const idDuplicates = Object.entries(sejoliIdMap)
    .filter(([_, txs]) => txs.length > 1)

  console.log(`\n🔑 Sejoli ID Duplicates: ${idDuplicates.length}`)
  if (idDuplicates.length > 0) {
    console.log('   Sample ID Duplicates (first 5):\n')
    idDuplicates.slice(0, 5).forEach(([sejoliId, txs], idx) => {
      console.log(`${idx + 1}. Sejoli Order #${sejoliId} (${txs.length}x)`)
      txs.forEach(tx => {
        console.log(`   - ${tx.id} | ${tx.status} | ${new Date(tx.createdAt).toLocaleString('id-ID')}`)
      })
      console.log('')
    })
  }

  // 5. Summary statistics
  console.log('\n📊 SUMMARY:')
  console.log(`   Total Transactions: ${allTransactions.length}`)
  console.log(`   Sejoli Transactions: ${sejoliTransactions.length}`)
  console.log(`   Non-Sejoli Transactions: ${nonSejoliTransactions.length}`)
  console.log(`   Duplicate Groups (user+amount+date): ${duplicates.length}`)
  console.log(`   Sejoli ID Duplicates: ${idDuplicates.length}`)
  
  const totalDuplicateTx = duplicates.reduce((sum, d) => sum + (d.count - 1), 0) // Keep 1, remove rest
  console.log(`   Transactions to Remove: ${totalDuplicateTx}`)
  console.log(`   Expected After Cleanup: ${allTransactions.length - totalDuplicateTx}`)

  // 6. Save duplicate IDs for removal
  const duplicateIds = []
  
  // From duplicate groups, keep the one with sejoli_order_id in metadata
  // If none have it, keep the oldest one
  duplicates.forEach(dup => {
    const withSejoliMetadata = dup.transactions.filter(tx => tx.metadata?.sejoli_order_id)
    
    if (withSejoliMetadata.length > 0) {
      // Keep first with metadata, remove all without metadata
      const withoutMetadata = dup.transactions.filter(tx => !tx.metadata?.sejoli_order_id)
      duplicateIds.push(...withoutMetadata.map(tx => tx.id))
      
      // If multiple with metadata, keep oldest
      if (withSejoliMetadata.length > 1) {
        const sorted = withSejoliMetadata.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        duplicateIds.push(...sorted.slice(1).map(tx => tx.id))
      }
    } else {
      // No sejoli metadata in any, keep oldest
      const sorted = dup.transactions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      duplicateIds.push(...sorted.slice(1).map(tx => tx.id))
    }
  })

  // From Sejoli ID duplicates, keep the one with sejoli_order_id in metadata
  idDuplicates.forEach(([sejoliId, txs]) => {
    const withMetadata = txs.filter(tx => tx.metadata?.sejoli_order_id)
    const withoutMetadata = txs.filter(tx => !tx.metadata?.sejoli_order_id)
    
    if (withMetadata.length > 0) {
      // Keep first with metadata, remove all without metadata
      duplicateIds.push(...withoutMetadata.map(tx => tx.id))
      // If multiple with metadata, keep oldest
      if (withMetadata.length > 1) {
        const sorted = withMetadata.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        duplicateIds.push(...sorted.slice(1).map(tx => tx.id))
      }
    }
  })

  // Remove duplicates from list
  const uniqueDuplicateIds = [...new Set(duplicateIds)]

  console.log(`\n🗑️  Unique Transaction IDs to Remove: ${uniqueDuplicateIds.length}`)

  // Save to file
  const fs = require('fs')
  fs.writeFileSync('duplicate-transaction-ids.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalDuplicates: uniqueDuplicateIds.length,
    duplicateIds: uniqueDuplicateIds,
    duplicateGroups: duplicates.map(d => ({
      key: d.key,
      count: d.count,
      ids: d.transactions.map(tx => tx.id)
    })),
    sejoliIdDuplicates: idDuplicates.map(([sejoliId, txs]) => ({
      sejoliId,
      count: txs.length,
      ids: txs.map(tx => tx.id)
    }))
  }, null, 2))

  console.log('💾 Duplicate IDs saved to: duplicate-transaction-ids.json')
  console.log('\n✅ Analysis complete!')
}

analyzeDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
