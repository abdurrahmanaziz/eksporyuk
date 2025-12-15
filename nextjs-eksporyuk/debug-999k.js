const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function test() {
  const sejoli = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Get 999k transactions  
  const txs = await prisma.transaction.findMany({
    where: { amount: 999000 },
    take: 10,
    include: {
      affiliateConversion: true,
      user: { select: { name: true } }
    }
  });
  
  console.log('Found 999k transactions:', txs.length);
  console.log('\n');
  
  for (const t of txs) {
    const sejOrder = sejoli.orders.find(o => String(o.id) === String(t.externalId));
    console.log('---');
    console.log('User:', t.user?.name);
    console.log('External ID:', t.externalId);
    console.log('Has affiliateConversion in DB:', !!t.affiliateConversion);
    if (t.affiliateConversion) {
      console.log('DB Commission:', t.affiliateConversion.commissionAmount);
    }
    console.log('Sejoli match:', !!sejOrder);
    if (sejOrder) {
      console.log('Sejoli affiliate_id:', sejOrder.affiliate_id);
      console.log('Sejoli product_id:', sejOrder.product_id);
    }
  }
  
  await prisma.$disconnect();
}
test();
