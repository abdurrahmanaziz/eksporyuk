/**
 * FINAL VERIFICATION: Check database state after cleanup
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('\n=== FINAL VERIFICATION ===\n');
  console.log('Date:', new Date().toISOString());
  
  try {
    // Total counts
    const totalUsers = await prisma.user.count();
    const totalTx = await prisma.transaction.count();
    const successTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    const pendingTx = await prisma.transaction.count({ where: { status: 'PENDING' } });
    const failedTx = await prisma.transaction.count({ where: { status: 'FAILED' } });
    
    // Revenue
    const revenue = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    
    // Commission
    const commission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    // Max invoice
    const allInvoices = await prisma.transaction.findMany({
      where: { invoiceNumber: { startsWith: 'INV' } },
      select: { invoiceNumber: true }
    });
    
    let maxInvoice = 0;
    allInvoices.forEach(tx => {
      const match = tx.invoiceNumber?.match(/^INV(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxInvoice) maxInvoice = num;
      }
    });
    
    // Membership count
    const totalMemberships = await prisma.userMembership.count();
    const activeMemberships = await prisma.userMembership.count({ 
      where: { status: 'ACTIVE' }
    });
    
    // Affiliate stats
    const totalAffiliates = await prisma.affiliateProfile.count();
    const totalConversions = await prisma.affiliateConversion.count();
    
    console.log('📊 DATABASE SUMMARY (AFTER CLEANUP):');
    console.log('━'.repeat(50));
    
    console.log('\n👥 USERS:');
    console.log(`  Total: ${totalUsers.toLocaleString()}`);
    
    console.log('\n💳 TRANSACTIONS:');
    console.log(`  Total: ${totalTx.toLocaleString()}`);
    console.log(`  SUCCESS: ${successTx.toLocaleString()}`);
    console.log(`  PENDING: ${pendingTx.toLocaleString()}`);
    console.log(`  FAILED: ${failedTx.toLocaleString()}`);
    
    console.log('\n💰 REVENUE:');
    console.log(`  Total: Rp ${Number(revenue._sum.amount || 0).toLocaleString('id-ID')}`);
    
    console.log('\n🎯 AFFILIATE:');
    console.log(`  Profiles: ${totalAffiliates}`);
    console.log(`  Conversions: ${totalConversions.toLocaleString()}`);
    console.log(`  Total Commission: Rp ${Number(commission._sum.commissionAmount || 0).toLocaleString('id-ID')}`);
    
    console.log('\n🎫 MEMBERSHIPS:');
    console.log(`  Total: ${totalMemberships.toLocaleString()}`);
    console.log(`  Active: ${activeMemberships.toLocaleString()}`);
    
    console.log('\n📄 INVOICE SYSTEM:');
    console.log(`  Highest Invoice: INV${maxInvoice}`);
    console.log(`  Next Invoice: INV${maxInvoice + 1}`);
    
    console.log('\n━'.repeat(50));
    
    // Compare with Sejoli screenshot
    console.log('\n📸 COMPARISON WITH SEJOLI SCREENSHOT:');
    console.log('━'.repeat(50));
    console.log(`                  Database    Sejoli     Diff`);
    console.log(`  SUCCESS:        ${String(successTx).padEnd(8)}    12,857     ${successTx - 12857 > 0 ? '+' : ''}${successTx - 12857}`);
    console.log(`  Revenue:        Rp ${(Number(revenue._sum.amount || 0) / 1000000000).toFixed(2)}B  Rp 4.14B   Rp ${((Number(revenue._sum.amount || 0) - 4138916962) / 1000000).toFixed(1)}M`);
    
    // Check all transactions have sejoliOrderId
    const allTx = await prisma.transaction.findMany({
      select: { metadata: true }
    });
    
    const withSejoliId = allTx.filter(tx => {
      const meta = tx.metadata || {};
      return meta.sejoliOrderId || meta.sejoli_order_id || meta.wp_order_id;
    }).length;
    
    console.log('\n✅ DATA INTEGRITY:');
    console.log(`  Transactions with sejoliOrderId: ${withSejoliId}/${totalTx} (${((withSejoliId/totalTx)*100).toFixed(1)}%)`);
    
    if (withSejoliId === totalTx) {
      console.log('  ✅ All transactions are from Sejoli import');
    } else {
      console.log(`  ⚠️  ${totalTx - withSejoliId} transactions without sejoliOrderId`);
    }
    
    console.log('\n✅ CLEANUP COMPLETE!');
    console.log('━'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
