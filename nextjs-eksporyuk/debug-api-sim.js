const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// Same logic as API
const PRODUCT_COMMISSION_MAP = {
  28: 0, 93: 0, 179: 250000, 300: 0, 558: 0, 1529: 0, 3840: 300000,
  4684: 250000, 6068: 250000, 6810: 250000, 11207: 300000, 13401: 325000,
  15234: 210000, 16956: 210000, 17920: 250000, 19296: 225000, 20852: 280000,
  8683: 300000, 13399: 250000, 8684: 250000, 13400: 200000,
  8910: 0, 8914: 0, 8915: 0,
  397: 0, 488: 0, 12994: 50000, 13039: 50000, 13045: 50000,
  16130: 0, 16860: 0, 16963: 0, 17227: 0, 17322: 0, 17767: 0, 18358: 0,
  18528: 20000, 18705: 0, 18893: 0, 19042: 50000, 20130: 50000, 20336: 100000, 21476: 50000,
  2910: 0, 3764: 75000, 4220: 0, 8686: 85000,
  5928: 0, 5932: 20000, 5935: 150000, 16581: 0, 16587: 30000, 16592: 0,
  16826: 0
};

function getCommissionBySejolProductId(productId) {
  return PRODUCT_COMMISSION_MAP[productId] || 0;
}

async function test() {
  const sejoli = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
  
  // Get transactions with affiliate "Rahmat Al Fianto"
  const txs = await prisma.transaction.findMany({
    where: { amount: 999000, status: 'SUCCESS' },
    take: 5,
    include: {
      affiliateConversion: {
        include: {
          affiliate: {
            include: {
              user: { select: { name: true } }
            }
          }
        }
      }
    }
  });
  
  console.log('Simulating API enrichment for 999k SUCCESS transactions:\n');
  
  for (const tx of txs) {
    // Same logic as API route
    const sejOrder = sejoli.orders.find(o => o.id == tx.externalId);
    
    let affiliateInfo = null;
    
    if (sejOrder && sejOrder.affiliate_id && sejOrder.status === 'completed') {
      const sejAffiliate = sejoli.affiliates.find(a => a.user_id == sejOrder.affiliate_id);
      if (sejAffiliate) {
        const commissionAmount = getCommissionBySejolProductId(sejOrder.product_id);
        affiliateInfo = {
          name: sejAffiliate.display_name,
          commissionAmount: commissionAmount,
          productId: sejOrder.product_id
        };
      }
    }
    
    console.log('---');
    console.log('External ID:', tx.externalId);
    console.log('affiliateInfo (from API):', affiliateInfo);
    console.log('affiliateConversion (from DB):', tx.affiliateConversion ? {
      name: tx.affiliateConversion.affiliate?.user?.name,
      commission: tx.affiliateConversion.commissionAmount
    } : null);
  }
  
  await prisma.$disconnect();
}
test();
