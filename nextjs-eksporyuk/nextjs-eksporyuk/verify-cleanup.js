/**
 * Final Verification After Cleanup
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  console.log('✅ Final Verification After Duplicate Cleanup\n')

  // Count by status
  const byStatus = await prisma.transaction.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true }
  })

  console.log('📊 Transactions by Status:')
  byStatus.forEach(s => {
    console.log(`   ${s.status}: ${s._count} (Rp ${Number(s._sum.amount || 0).toLocaleString('id-ID')})`)
  })

  const total = await prisma.transaction.count()
  console.log(`\n📊 Total Transactions: ${total}`)

  // Check Sejoli data
  const allTx = await prisma.transaction.findMany({
    select: { id: true, metadata: true }
  })

  const withSejoli = allTx.filter(tx => 
    tx.metadata?.sejoli_order_id || tx.id.includes('sejoliimport')
  ).length

  console.log(`   With Sejoli Data: ${withSejoli}`)
  console.log(`   Non-Sejoli: ${total - withSejoli}`)

  // Date range
  const oldest = await prisma.transaction.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true }
  })
  
  const newest = await prisma.transaction.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  })

  console.log(`\n📅 Date Range:`)
  console.log(`   Oldest: ${new Date(oldest.createdAt).toLocaleString('id-ID')}`)
  console.log(`   Newest: ${new Date(newest.createdAt).toLocaleString('id-ID')}`)

  console.log('\n✅ Verification complete!')
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
