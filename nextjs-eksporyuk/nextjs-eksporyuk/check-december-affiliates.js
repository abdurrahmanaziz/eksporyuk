const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDecemberAffiliates() {
  // Get December SUCCESS transactions
  const decTx = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: new Date('2025-12-01'),
        lt: new Date('2026-01-01')
      },
      status: 'SUCCESS'
    },
    select: {
      id: true,
      amount: true,
      metadata: true,
      createdAt: true
    }
  });
  
  console.log('December 2025 SUCCESS transactions:', decTx.length);
  
  // Filter yang ada sejoliAffiliateId
  const withAffiliate = decTx.filter(tx => 
    tx.metadata?.sejoliAffiliateId && tx.metadata.sejoliAffiliateId !== '0'
  );
  
  console.log('With affiliate ID:', withAffiliate.length);
  
  // Check berapa yang sudah ada conversion
  const existingConv = await prisma.affiliateConversion.findMany({
    where: {
      transaction: {
        createdAt: {
          gte: new Date('2025-12-01'),
          lt: new Date('2026-01-01')
        }
      }
    },
    select: { transactionId: true }
  });
  
  console.log('Existing conversions:', existingConv.length);
  
  const existingTxIds = new Set(existingConv.map(c => c.transactionId));
  
  const needConversion = withAffiliate.filter(tx => {
    return !existingTxIds.has(tx.id);
  });
  
  console.log('Need conversion creation:', needConversion.length);
  
  if (needConversion.length > 0) {
    console.log('\nSample (first 5):');
    needConversion.slice(0, 5).forEach(tx => {
      console.log('  Tx', tx.id, '- Amount:', tx.amount, '- AffiliateId:', tx.metadata.sejoliAffiliateId);
    });
  }
  
  await prisma.$disconnect();
}

checkDecemberAffiliates();
