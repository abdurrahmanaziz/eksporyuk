const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  // Get conversions
  const conversions = await prisma.affiliateConversion.findMany({
    select: { id: true, transactionId: true, commissionAmount: true }
  });
  console.log('Total conversions:', conversions.length);
  
  // Get unique transaction IDs from conversions
  const txIdsInConversions = new Set(conversions.map(c => c.transactionId));
  console.log('Unique tx IDs in conversions:', txIdsInConversions.size);
  
  // Get SUCCESS transactions
  const successTx = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { id: true, metadata: true }
  });
  console.log('\nSUCCESS transactions:', successTx.length);
  
  // Count how many SUCCESS tx have affiliate_id
  const withAffiliate = successTx.filter(tx => {
    const meta = tx.metadata;
    const affId = meta?.affiliate_id || meta?.original?.affiliate_id;
    return affId && affId !== '0' && affId !== 0;
  });
  console.log('SUCCESS tx with affiliate_id:', withAffiliate.length);
  
  // Check conversions that reference non-SUCCESS or non-affiliate transactions
  let extraConversions = 0;
  let noTxFound = 0;
  let noAffiliate = 0;
  
  const txIds = new Set(successTx.map(t => t.id));
  const txWithAffIds = new Set(withAffiliate.map(t => t.id));
  
  for (const c of conversions) {
    if (!txIds.has(c.transactionId)) {
      noTxFound++;
    } else if (!txWithAffIds.has(c.transactionId)) {
      noAffiliate++;
    } else {
      extraConversions++;
    }
  }
  
  console.log('\nConversions breakdown:');
  console.log('  Valid (SUCCESS tx with affiliate):', extraConversions);
  console.log('  No SUCCESS tx found:', noTxFound);
  console.log('  SUCCESS tx but no affiliate_id:', noAffiliate);
  
  // Check: conversions for transactions without affiliate_id
  // These are EXTRA and should be deleted
  const validConversionIds = [];
  const invalidConversionIds = [];
  
  for (const c of conversions) {
    if (txWithAffIds.has(c.transactionId)) {
      validConversionIds.push(c.id);
    } else {
      invalidConversionIds.push(c.id);
    }
  }
  
  console.log('\nValid conversions:', validConversionIds.length);
  console.log('Invalid conversions (should delete):', invalidConversionIds.length);
  
  // Delete invalid
  if (invalidConversionIds.length > 0) {
    console.log('\nDeleting invalid conversions...');
    const deleted = await prisma.affiliateConversion.deleteMany({
      where: { id: { in: invalidConversionIds } }
    });
    console.log('Deleted:', deleted.count);
  }
  
  // Final stats
  const final = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  console.log('\n=== FINAL ===');
  console.log('Total conversions:', final._count.id);
  console.log('Total commission:', 'Rp', Number(final._sum.commissionAmount || 0).toLocaleString('id-ID'));
  
  await prisma.$disconnect();
}
investigate();
