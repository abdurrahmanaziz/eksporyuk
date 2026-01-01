const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get distinct affiliateIds from AffiliateConversion
  const samples = await prisma.$queryRaw`
    SELECT DISTINCT "affiliateId", COUNT(*) as cnt, SUM("commissionAmount") as total
    FROM "AffiliateConversion"
    GROUP BY "affiliateId"
    ORDER BY total DESC
    LIMIT 15
  `;
  
  console.log('Distinct affiliateIds with totals:');
  for (const s of samples) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: s.affiliateId }, select: { name: true, email: true } });
    console.log(`ID: ${s.affiliateId}`);
    console.log(`  User: ${user ? user.name + ' (' + user.email + ')' : 'NOT FOUND'}`);
    console.log(`  Transactions: ${s.cnt}, Total: Rp ${Number(s.total).toLocaleString('id-ID')}`);
    console.log('');
  }
  
  // Also check Transaction table for affiliate info in metadata
  const txWithAff = await prisma.transaction.findMany({
    where: { metadata: { not: null } },
    select: { id: true, metadata: true },
    take: 5
  });
  console.log('\nSample transactions with metadata:');
  for (const tx of txWithAff) {
    console.log(`TX: ${tx.id}`);
    console.log(`  metadata: ${JSON.stringify(tx.metadata)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
