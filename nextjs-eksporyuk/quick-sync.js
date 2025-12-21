/**
 * SYNC MISSING CONVERSIONS - SIMPLIFIED
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCT_COMMISSION = {
  28: 100000, 93: 150000, 179: 250000, 1529: 200000, 3840: 300000,
  4684: 250000, 6068: 280000, 6810: 250000, 11207: 280000, 13401: 325000,
  15234: 300000, 16956: 280000, 17920: 250000, 19296: 280000, 20852: 280000,
  8683: 300000, 13399: 250000, 8684: 250000, 13400: 200000,
  8910: 0, 8914: 0, 8915: 0,
  397: 0, 488: 0, 12994: 50000, 13039: 50000, 13045: 50000,
  16130: 50000, 16860: 50000, 16963: 50000, 17227: 50000, 17322: 50000,
  17767: 50000, 18358: 50000, 18528: 20000, 18705: 50000, 18893: 50000,
  19042: 50000, 20130: 50000, 20336: 50000, 21476: 50000,
  2910: 0, 3764: 85000, 4220: 50000, 8686: 0,
  5928: 150000, 5932: 100000, 5935: 100000, 16581: 0, 16587: 0, 16592: 0,
  300: 0, 16826: 0
};

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('    SYNC MISSING CONVERSIONS - SAFE & FAST');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check current stats
  const currentComm = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: true
  });
  
  console.log(`📊 Current database:`)
  console.log(`   Conversions: ${currentComm._count.toLocaleString()}`);
  console.log(`   Total commission: Rp ${Number(currentComm._sum.commissionAmount).toLocaleString()}\n`);
  
  // Find all transactions with affiliate code pattern but no conversions
  const missingTx = await prisma.$queryRaw`
    SELECT t.id, t."externalId", u.name as userName, up."affiliateCode"
    FROM "Transaction" t
    JOIN "User" u ON t."userId" = u.id
    JOIN "AffiliateProfile" up ON u.id = up."userId"
    LEFT JOIN "AffiliateConversion" ac ON t.id = ac."transactionId"
    WHERE t.status = 'SUCCESS' 
      AND ac.id IS NULL
      AND t."externalId" ~ '^sejoli-[0-9]+$'
    LIMIT 100
  `;
  
  console.log(`🔍 Found ${missingTx.length} transactions with affiliate users but no conversions\n`);
  
  if (missingTx.length === 0) {
    console.log('✅ No missing conversions found');
    await prisma.$disconnect();
    return;
  }
  
  // Create conversions for these
  let created = 0;
  const toCreate = [];
  
  for (const tx of missingTx) {
    // Extract order ID from externalId 
    const orderId = tx.externalId.replace('sejoli-', '');
    
    // Get commission from file data
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    const order = data.orders.find(o => o.id?.toString() === orderId);
    
    if (order && order.product_id) {
      const commission = PRODUCT_COMMISSION[order.product_id] || 0;
      
      if (commission > 0) {
        // Get affiliate profile ID
        const affProfile = await prisma.affiliateProfile.findFirst({
          where: { affiliateCode: tx.affiliateCode }
        });
        
        if (affProfile) {
          toCreate.push({
            affiliateId: affProfile.id,
            transactionId: tx.id,
            commissionAmount: commission,
            commissionRate: 0,
            paidOut: false
          });
        }
      }
    }
  }
  
  if (toCreate.length > 0) {
    console.log(`📥 Creating ${toCreate.length} missing conversions...`);
    
    await prisma.affiliateConversion.createMany({
      data: toCreate,
      skipDuplicates: true
    });
    
    created = toCreate.length;
    console.log(`✅ Created ${created} conversions\n`);
  }
  
  // Final stats
  const finalComm = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: true
  });
  
  const newTotal = Number(finalComm._sum.commissionAmount);
  const gain = newTotal - Number(currentComm._sum.commissionAmount);
  
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│ FINAL RESULT                                       │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│ Total conversions: ${finalComm._count.toLocaleString().padStart(10)}`);
  console.log(`│ Total commission : Rp ${newTotal.toLocaleString().padStart(15)}`);
  console.log(`│ Gain from sync   : Rp ${gain.toLocaleString().padStart(15)}`);
  console.log(`│ Target (Sejoli)  : Rp   1,249,646,000`);
  console.log(`│ Accuracy         : ${((newTotal/1249646000)*100).toFixed(2)}%`);
  console.log('└────────────────────────────────────────────────────┘');
  
  await prisma.$disconnect();
}

main().catch(console.error);