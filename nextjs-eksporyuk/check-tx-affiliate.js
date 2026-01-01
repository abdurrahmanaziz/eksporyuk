const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check Transaction.affiliateId
  const txsWithAffiliate = await prisma.transaction.findMany({
    where: { affiliateId: { not: null } },
    select: { id: true, affiliateId: true, customerName: true },
    take: 10
  });
  
  console.log('=== Transactions with affiliateId ===');
  for (const tx of txsWithAffiliate) {
    console.log(`TX: ${tx.id}, affiliateId: ${tx.affiliateId}`);
    
    // Try to find user
    const user = await prisma.user.findUnique({
      where: { id: tx.affiliateId },
      select: { name: true, email: true }
    });
    if (user) {
      console.log(`  -> User: ${user.name} (${user.email})`);
    } else {
      console.log(`  -> User NOT FOUND`);
    }
  }
  
  // Get unique affiliateIds from Transaction
  const uniqueAffIds = await prisma.$queryRaw`
    SELECT DISTINCT "affiliateId" FROM "Transaction" 
    WHERE "affiliateId" IS NOT NULL
    LIMIT 20
  `;
  console.log('\n=== Unique affiliateIds in Transaction ===');
  for (const a of uniqueAffIds) {
    const user = await prisma.user.findUnique({
      where: { id: a.affiliateId },
      select: { name: true, email: true }
    });
    console.log(`${a.affiliateId} -> ${user ? user.name : 'NOT FOUND'}`);
  }
  
  // Compare with AffiliateConversion.affiliateId
  const convAffIds = await prisma.$queryRaw`
    SELECT DISTINCT "affiliateId", COUNT(*) as cnt, SUM("commissionAmount") as total
    FROM "AffiliateConversion"
    GROUP BY "affiliateId"
    ORDER BY total DESC
    LIMIT 10
  `;
  console.log('\n=== Top AffiliateConversion affiliateIds ===');
  for (const c of convAffIds) {
    // Check if this matches any Transaction.affiliateId
    const txMatch = await prisma.transaction.findFirst({
      where: { affiliateId: c.affiliateId },
      select: { id: true }
    });
    console.log(`${c.affiliateId}: ${c.cnt} conversions, Rp ${Number(c.total).toLocaleString()}`);
    console.log(`  Transaction match: ${txMatch ? 'YES' : 'NO'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
