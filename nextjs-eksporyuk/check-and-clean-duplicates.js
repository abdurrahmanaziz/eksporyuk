/**
 * Check and Remove Duplicates
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndCleanDuplicates() {
  console.log('\n🔍 CHECKING FOR DUPLICATES...\n');
  
  // Get all transactions with metadata
  const allTx = await prisma.transaction.findMany({
    select: { 
      id: true, 
      metadata: true, 
      invoiceNumber: true, 
      createdAt: true,
      amount: true,
      status: true
    }
  });
  
  console.log('Total transactions:', allTx.length);
  
  // Group by sejoli_order_id
  const bySejoliId = {};
  
  allTx.forEach(tx => {
    const meta = tx.metadata;
    if (meta && meta.sejoli_order_id) {
      const sid = String(meta.sejoli_order_id);
      if (!bySejoliId[sid]) bySejoliId[sid] = [];
      bySejoliId[sid].push(tx);
    }
  });
  
  // Find duplicates
  const duplicates = Object.entries(bySejoliId)
    .filter(([k, v]) => v.length > 1);
  
  console.log('Unique Sejoli IDs:', Object.keys(bySejoliId).length);
  console.log('Sejoli IDs with duplicates:', duplicates.length);
  
  if (duplicates.length === 0) {
    console.log('\n✅ No duplicates found!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('\nSample duplicates:');
  duplicates.slice(0, 5).forEach(([sejoliId, txs]) => {
    console.log(`\nSejoli ID ${sejoliId} has ${txs.length} transactions:`);
    txs.forEach(tx => {
      console.log(`  - ${tx.id.slice(0,8)} | ${tx.invoiceNumber} | Rp ${Number(tx.amount).toLocaleString()} | ${tx.createdAt.toISOString()}`);
    });
  });
  
  // Count how many to delete
  const toDelete = duplicates.reduce((sum, [k, v]) => sum + (v.length - 1), 0);
  console.log(`\n⚠️  Total duplicates to remove: ${toDelete}`);
  
  // Delete duplicates (keep the oldest one)
  console.log('\n🗑️  REMOVING DUPLICATES (keeping oldest)...');
  
  let deleted = 0;
  for (const [sejoliId, txs] of duplicates) {
    // Sort by createdAt, keep the oldest
    txs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Delete all except the first (oldest)
    for (let i = 1; i < txs.length; i++) {
      await prisma.transaction.delete({
        where: { id: txs[i].id }
      });
      deleted++;
    }
    
    if (deleted % 500 === 0) {
      console.log(`  Deleted ${deleted}...`);
    }
  }
  
  console.log(`\n✅ Deleted ${deleted} duplicate transactions`);
  
  // Final count
  const finalCount = await prisma.transaction.count();
  const finalSuccess = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  const finalRevenue = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  
  console.log('\n📊 FINAL STATE:');
  console.log(`- Total Transactions: ${finalCount}`);
  console.log(`- SUCCESS: ${finalSuccess}`);
  console.log(`- Revenue: Rp ${Number(finalRevenue._sum.amount || 0).toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
}

checkAndCleanDuplicates()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
