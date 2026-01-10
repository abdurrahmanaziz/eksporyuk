const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix commission anomalies where commission exceeds reasonable limits
 * Specifically: Legalitas Ekspor should be 20% of 399,000 = 79,800
 */

async function fixCommissions() {
  console.log('=== Fixing Commission Anomalies ===\n');
  
  // Find all conversions where commission > transaction amount (clearly wrong)
  const allConversions = await prisma.affiliateConversion.findMany({
    include: {
      transaction: true,
      affiliate: {
        include: { user: true }
      }
    }
  });
  
  const anomalies = [];
  for (const c of allConversions) {
    const commission = Number(c.commissionAmount || 0);
    const txAmount = Number(c.transaction?.amount || 0);
    const productName = c.transaction?.metadata?.productName || '';
    
    // Flag as anomaly if commission > transaction amount
    if (commission > txAmount && txAmount > 0) {
      let correctCommission = commission;
      
      // Calculate correct commission based on product
      if (productName.toLowerCase().includes('legalitas')) {
        // Legalitas = 20%
        correctCommission = Math.round(txAmount * 0.20);
      } else if (productName.toLowerCase().includes('lifetime') || 
                 productName.toLowerCase().includes('paket ekspor')) {
        // Membership packages = 30%
        correctCommission = Math.round(txAmount * 0.30);
      } else {
        // Default = 30%
        correctCommission = Math.round(txAmount * 0.30);
      }
      
      anomalies.push({
        id: c.id,
        affiliate: c.affiliate?.user?.name,
        invoice: c.transaction?.invoiceNumber,
        product: productName,
        txAmount: txAmount,
        oldCommission: commission,
        newCommission: correctCommission,
        difference: commission - correctCommission
      });
    }
  }
  
  console.log('Total anomalies found:', anomalies.length);
  
  if (anomalies.length === 0) {
    console.log('No anomalies to fix!');
    await prisma.$disconnect();
    return;
  }
  
  // Show anomalies
  console.log('\nAnomalies to fix:');
  for (const a of anomalies) {
    console.log('\n---');
    console.log('Affiliate:', a.affiliate);
    console.log('Invoice:', a.invoice);
    console.log('Product:', a.product);
    console.log('TX Amount:', 'Rp', a.txAmount.toLocaleString('id-ID'));
    console.log('OLD Commission:', 'Rp', a.oldCommission.toLocaleString('id-ID'));
    console.log('NEW Commission:', 'Rp', a.newCommission.toLocaleString('id-ID'));
    console.log('Will REDUCE by:', 'Rp', a.difference.toLocaleString('id-ID'));
  }
  
  // Calculate total adjustment
  const totalOld = anomalies.reduce((sum, a) => sum + a.oldCommission, 0);
  const totalNew = anomalies.reduce((sum, a) => sum + a.newCommission, 0);
  const totalDiff = totalOld - totalNew;
  
  console.log('\n=== Summary ===');
  console.log('Total OLD commission:', 'Rp', totalOld.toLocaleString('id-ID'));
  console.log('Total NEW commission:', 'Rp', totalNew.toLocaleString('id-ID'));
  console.log('Total reduction:', 'Rp', totalDiff.toLocaleString('id-ID'));
  
  // Fix each anomaly
  console.log('\n=== Fixing Commissions ===');
  let fixed = 0;
  
  for (const a of anomalies) {
    try {
      // Update AffiliateConversion
      await prisma.affiliateConversion.update({
        where: { id: a.id },
        data: {
          commissionAmount: a.newCommission
        }
      });
      
      // Update Transaction metadata
      const tx = await prisma.transaction.findUnique({
        where: { id: (await prisma.affiliateConversion.findUnique({ where: { id: a.id } })).transactionId }
      });
      
      if (tx?.metadata) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            metadata: {
              ...tx.metadata,
              commissionAmount: a.newCommission
            }
          }
        });
      }
      
      fixed++;
      console.log(`Fixed ${fixed}/${anomalies.length}...`);
    } catch (err) {
      console.error('Error fixing', a.invoice, ':', err.message);
    }
  }
  
  console.log('\n=== Results ===');
  console.log('Fixed:', fixed);
  console.log('Failed:', anomalies.length - fixed);
  
  // Recalculate top affiliates
  console.log('\n=== Recalculated Top 10 Affiliates ===');
  const topAffiliates = await prisma.affiliateConversion.groupBy({
    by: ['affiliateId'],
    _sum: { commissionAmount: true },
    _count: true,
    orderBy: { _sum: { commissionAmount: 'desc' } },
    take: 10
  });
  
  for (const a of topAffiliates) {
    const profile = await prisma.affiliateProfile.findUnique({
      where: { id: a.affiliateId },
      include: { user: { select: { name: true } } }
    });
    console.log(profile?.user?.name + ':', a._count, 'sales, Rp', Number(a._sum.commissionAmount || 0).toLocaleString('id-ID'));
  }
  
  await prisma.$disconnect();
}

fixCommissions().catch(console.error);
