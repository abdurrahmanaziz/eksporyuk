/**
 * Check Sejoli Import Status in Database
 * Memeriksa data transaksi Sejoli yang sudah terimport
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Memeriksa status import transaksi Sejoli...\n')

  // 1. Total transaksi Sejoli
  const allTransactions = await prisma.transaction.findMany({
    select: {
      id: true,
      status: true,
      amount: true,
      createdAt: true,
      metadata: true,
      affiliateId: true,
    }
  })

  // Filter yang punya sejoli_order_id
  const sejoliTransactions = allTransactions.filter(tx => 
    tx.metadata && typeof tx.metadata === 'object' && tx.metadata.sejoli_order_id
  )

  console.log(`📊 Total Transaksi Sejoli di DB: ${sejoliTransactions.length}`)

  // 2. Group by status
  const statusGroups = sejoliTransactions.reduce((acc, tx) => {
    acc[tx.status] = (acc[tx.status] || 0) + 1
    return acc
  }, {})

  console.log('\n📈 Breakdown by Status:')
  Object.entries(statusGroups).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`)
  })

  // 3. Date range
  const dates = sejoliTransactions.map(tx => new Date(tx.createdAt).getTime())
  const oldest = new Date(Math.min(...dates))
  const newest = new Date(Math.max(...dates))

  console.log('\n📅 Date Range:')
  console.log(`   Oldest: ${oldest.toLocaleDateString('id-ID')}`)
  console.log(`   Newest: ${newest.toLocaleDateString('id-ID')}`)

  // 4. With affiliate
  const withAffiliate = sejoliTransactions.filter(tx => tx.affiliateId).length
  console.log(`\n👥 With Affiliate: ${withAffiliate}`)

  // 5. Total amount
  const totalAmount = sejoliTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
  console.log(`\n💰 Total Amount: Rp ${totalAmount.toLocaleString('id-ID')}`)

  // 6. Sample sejoli_order_ids (first 10)
  const sejoliOrderIds = sejoliTransactions
    .map(tx => tx.metadata?.sejoli_order_id)
    .filter(id => id)
    .slice(0, 10)

  console.log('\n🔑 Sample Sejoli Order IDs (first 10):')
  sejoliOrderIds.forEach(id => console.log(`   ${id}`))

  // 7. Check for potential duplicates by sejoli_order_id
  const orderIdCounts = {}
  sejoliTransactions.forEach(tx => {
    const orderId = tx.metadata?.sejoli_order_id
    if (orderId) {
      orderIdCounts[orderId] = (orderIdCounts[orderId] || 0) + 1
    }
  })

  const duplicates = Object.entries(orderIdCounts).filter(([_, count]) => count > 1)
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  DUPLIKAT DITEMUKAN: ${duplicates.length} order IDs`)
    console.log('   Sejoli Order IDs yang duplikat:')
    duplicates.forEach(([orderId, count]) => {
      console.log(`   - ${orderId}: ${count}x`)
    })
  } else {
    console.log('\n✅ Tidak ada duplikat sejoli_order_id')
  }

  console.log('\n✅ Selesai!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
