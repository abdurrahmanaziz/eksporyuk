/**
 * DETAILED ANALYSIS: Check sejoli data mapping
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  console.log('\n=== DETAILED SEJOLI ANALYSIS ===\n');
  
  try {
    // Get all SUCCESS transactions
    const allSuccess = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { id: true, metadata: true, invoiceNumber: true, amount: true, createdAt: true }
    });
    
    console.log('Total SUCCESS transactions:', allSuccess.length);
    
    // Categorize by metadata type
    const withSejoliOrderId = allSuccess.filter(tx => tx.metadata && tx.metadata.sejoliOrderId);
    const withSejoli_order_id = allSuccess.filter(tx => tx.metadata && tx.metadata.sejoli_order_id);
    const withBoth = allSuccess.filter(tx => tx.metadata && tx.metadata.sejoliOrderId && tx.metadata.sejoli_order_id);
    const withNeither = allSuccess.filter(tx => !tx.metadata || (!tx.metadata.sejoliOrderId && !tx.metadata.sejoli_order_id));
    
    console.log('\n📊 METADATA BREAKDOWN:');
    console.log(`- Has sejoliOrderId (camelCase): ${withSejoliOrderId.length}`);
    console.log(`- Has sejoli_order_id (snake): ${withSejoli_order_id.length}`);
    console.log(`- Has BOTH: ${withBoth.length}`);
    console.log(`- Has NEITHER: ${withNeither.length}`);
    
    // Check overlap by Sejoli ID value
    const sejoliIds = new Map();
    
    withSejoliOrderId.forEach(tx => {
      const id = String(tx.metadata.sejoliOrderId);
      if (!sejoliIds.has(id)) sejoliIds.set(id, []);
      sejoliIds.get(id).push({ ...tx, source: 'camelCase' });
    });
    
    withSejoli_order_id.forEach(tx => {
      const id = String(tx.metadata.sejoli_order_id);
      if (!sejoliIds.has(id)) sejoliIds.set(id, []);
      sejoliIds.get(id).push({ ...tx, source: 'snake_case' });
    });
    
    // Find duplicates by sejoli order ID
    const duplicatesBySejoli = [];
    for (const [sejoliId, txs] of sejoliIds.entries()) {
      if (txs.length > 1) {
        duplicatesBySejoli.push({ sejoliId, txs });
      }
    }
    
    console.log(`\n🔍 DUPLICATES BY SEJOLI ORDER ID: ${duplicatesBySejoli.length}`);
    
    if (duplicatesBySejoli.length > 0) {
      console.log('\nSample duplicates:');
      duplicatesBySejoli.slice(0, 5).forEach(({ sejoliId, txs }) => {
        console.log(`\nSejoli ID ${sejoliId}:`);
        txs.forEach(tx => {
          console.log(`  - ${tx.invoiceNumber} | ${tx.source} | Rp ${Number(tx.amount).toLocaleString()} | ${new Date(tx.createdAt).toLocaleDateString()}`);
        });
      });
      
      // Count how many to delete
      const toDelete = duplicatesBySejoli.reduce((sum, d) => sum + (d.txs.length - 1), 0);
      console.log(`\n⚠️  TOTAL TO DELETE: ${toDelete} duplicate transactions`);
      
      // Calculate amount
      let dupAmount = 0;
      duplicatesBySejoli.forEach(({ sejoliId, txs }) => {
        // All except first are duplicates
        for (let i = 1; i < txs.length; i++) {
          dupAmount += Number(txs[i].amount);
        }
      });
      console.log(`💰 Duplicate amount: Rp ${dupAmount.toLocaleString('id-ID')}`);
    }
    
    // Calculate what final should be
    const currentRevenue = allSuccess.reduce((sum, tx) => sum + Number(tx.amount), 0);
    console.log('\n📈 CURRENT STATE:');
    console.log(`- SUCCESS count: ${allSuccess.length}`);
    console.log(`- Revenue: Rp ${currentRevenue.toLocaleString('id-ID')}`);
    
    console.log('\n📸 EXPECTED (Sejoli):');
    console.log('- SUCCESS count: ~12,857');
    console.log('- Revenue: Rp 4,138,916,962');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

analyze()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
