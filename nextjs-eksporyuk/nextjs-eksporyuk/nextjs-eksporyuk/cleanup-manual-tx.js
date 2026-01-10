/**
 * CLEANUP: Remove manual transactions (no sejoliOrderId)
 * Keep only Sejoli-imported transactions
 * Invoice will continue from max Sejoli invoice + 1
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupManualTransactions() {
  console.log('\n=== CLEANUP MANUAL TRANSACTIONS ===\n');
  console.log('Date:', new Date().toISOString());
  
  try {
    // Get all transactions and filter manually (since JSON field filtering is tricky)
    const allTx = await prisma.transaction.findMany({
      select: { id: true, invoiceNumber: true, metadata: true, status: true, amount: true }
    });
    
    console.log('Total transactions:', allTx.length);
    
    // Find transactions WITHOUT sejoliOrderId
    const toDelete = allTx.filter(tx => {
      const meta = tx.metadata || {};
      const hasSejoliId = meta.sejoliOrderId || meta.sejoli_order_id || meta.wp_order_id;
      return !hasSejoliId;
    });
    
    console.log('Transactions to delete (no sejoliOrderId):', toDelete.length);
    
    if (toDelete.length === 0) {
      console.log('✅ No manual transactions to delete');
      await prisma.$disconnect();
      return;
    }
    
    // Show what will be deleted
    const deleteSuccess = toDelete.filter(tx => tx.status === 'SUCCESS');
    const deleteRevenue = deleteSuccess.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    console.log('\n⚠️  WILL DELETE:');
    console.log(`- Total: ${toDelete.length}`);
    console.log(`- SUCCESS: ${deleteSuccess.length}`);
    console.log(`- Revenue: Rp ${deleteRevenue.toLocaleString('id-ID')}`);
    
    // Show samples
    console.log('\nSample to delete:');
    toDelete.slice(0, 5).forEach(tx => {
      console.log(`  - ${tx.invoiceNumber} | ${tx.status} | Rp ${Number(tx.amount).toLocaleString()}`);
    });
    
    // Delete in batches
    console.log('\n🗑️  DELETING...');
    
    const ids = toDelete.map(tx => tx.id);
    const batchSize = 500;
    let deleted = 0;
    let affDeleted = 0;
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      
      // First delete related AffiliateConversion records
      const affResult = await prisma.affiliateConversion.deleteMany({
        where: { transactionId: { in: batch } }
      });
      affDeleted += affResult.count;
      
      // Then delete transactions
      const result = await prisma.transaction.deleteMany({
        where: { id: { in: batch } }
      });
      
      deleted += result.count;
      console.log(`  Deleted ${deleted}/${ids.length} transactions, ${affDeleted} conversions...`);
    }
    
    console.log(`\n✅ Deleted ${deleted} manual transactions`);
    console.log(`✅ Deleted ${affDeleted} related affiliate conversions`);
    
    // Verify final state
    console.log('\n📊 FINAL STATE:');
    const finalTotal = await prisma.transaction.count();
    const finalSuccess = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    const finalRevenue = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    
    console.log(`- Total Transactions: ${finalTotal}`);
    console.log(`- SUCCESS: ${finalSuccess}`);
    console.log(`- Revenue: Rp ${Number(finalRevenue._sum.amount || 0).toLocaleString('id-ID')}`);
    
    // Get max invoice for reference
    const allInvoices = await prisma.transaction.findMany({
      where: { invoiceNumber: { startsWith: 'INV' } },
      select: { invoiceNumber: true }
    });
    
    let maxNum = 0;
    allInvoices.forEach(tx => {
      const match = tx.invoiceNumber?.match(/^INV(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    
    console.log(`\n📈 MAX INVOICE: INV${maxNum}`);
    console.log(`Next invoice will be: INV${maxNum + 1}`);
    
    // Compare with expected
    console.log('\n📸 EXPECTED (Sejoli):');
    console.log('- SUCCESS: 12,857');
    console.log('- Revenue: Rp 4,138,916,962');
    
    const diff = finalSuccess - 12857;
    const revDiff = Number(finalRevenue._sum.amount || 0) - 4138916962;
    console.log(`\nDifference: ${diff > 0 ? '+' : ''}${diff} transactions, Rp ${revDiff.toLocaleString('id-ID')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupManualTransactions()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
