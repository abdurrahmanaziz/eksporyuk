const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function test() {
  const sejoli = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Count affiliateConversions
  const totalAff = await prisma.affiliateConversion.count();
  console.log('Total AffiliateConversion records:', totalAff);
  
  // Sample
  const samples = await prisma.affiliateConversion.findMany({
    take: 5,
    include: {
      transaction: {
        select: { amount: true, externalId: true }
      }
    }
  });
  
  console.log('\nSamples:');
  for (const s of samples) {
    const sejOrder = sejoli.orders.find(o => String(o.id) === String(s.transaction.externalId));
    console.log({
      txAmount: s.transaction.amount,
      dbCommission: s.commissionAmount,
      productId: sejOrder?.product_id,
      calculated30pct: Math.round(s.transaction.amount * 0.3)
    });
  }
  
  await prisma.$disconnect();
}
test();
