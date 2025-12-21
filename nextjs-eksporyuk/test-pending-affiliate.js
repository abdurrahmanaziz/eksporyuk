const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Test to verify PENDING transactions show affiliate from metadata
 */
async function testPendingAffiliateDisplay() {
  console.log('=== Testing PENDING Transactions Affiliate Display ===\n');
  
  // Get some PENDING transactions with affiliate data in metadata
  const pendingTx = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
    },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      status: true,
      metadata: true,
      affiliateConversion: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Found ${pendingTx.length} PENDING transactions`);
  
  if (pendingTx.length === 0) {
    console.log('No PENDING transactions found. Let\'s check SUCCESS transactions with affiliate in metadata.');
    
    // Check SUCCESS transactions that have affiliate in metadata
    const successTx = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
      },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        status: true,
        metadata: true,
        affiliateConversion: {
          include: {
            affiliate: {
              include: { user: { select: { name: true } } }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    console.log('\nSUCCESS Transactions:');
    successTx.forEach(tx => {
      const meta = tx.metadata || {};
      const metaAffiliate = meta.affiliate_name || meta.affiliateName || null;
      const convAffiliate = tx.affiliateConversion?.affiliate?.user?.name || null;
      
      console.log(`${tx.invoiceNumber} | Status: ${tx.status}`);
      console.log(`  - Affiliate from conversion: ${convAffiliate || 'N/A'}`);
      console.log(`  - Affiliate from metadata: ${metaAffiliate || 'N/A'}`);
      console.log(`  - Commission: ${tx.affiliateConversion?.commissionAmount || 'N/A'}`);
    });
  } else {
    console.log('\nPENDING Transactions:');
    pendingTx.forEach(tx => {
      const meta = tx.metadata || {};
      const metaAffiliate = meta.affiliate_name || meta.affiliateName || null;
      
      console.log(`${tx.invoiceNumber || tx.id.slice(0, 8)} | Rp ${Number(tx.amount).toLocaleString()}`);
      console.log(`  - Has affiliateConversion: ${!!tx.affiliateConversion}`);
      console.log(`  - Affiliate from metadata: ${metaAffiliate || 'N/A'}`);
      console.log(`  - Affiliate ID in metadata: ${meta.affiliate_id || meta.affiliateId || 'N/A'}`);
      console.log(`  - Note: Commission shows "Setelah bayar" for PENDING`);
    });
  }
  
  // Summary of what the UI should show
  console.log('\n=== Expected UI Behavior ===');
  console.log('1. SUCCESS transactions:');
  console.log('   - Affiliate: Name from affiliateConversion OR metadata');
  console.log('   - Komisi: Amount from affiliateConversion');
  console.log('');
  console.log('2. PENDING transactions:');
  console.log('   - Affiliate: Name from metadata (with "pending" label)');
  console.log('   - Komisi: "Setelah bayar" (not shown until paid)');
  
  await prisma.$disconnect();
}

testPendingAffiliateDisplay().catch(console.error);
