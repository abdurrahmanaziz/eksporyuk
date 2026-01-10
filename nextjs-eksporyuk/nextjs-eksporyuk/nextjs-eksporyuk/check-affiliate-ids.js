const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get sample affiliateIds from AffiliateConversion
  const samples = await prisma.affiliateConversion.findMany({
    select: { affiliateId: true, affiliateName: true },
    distinct: ['affiliateId'],
    take: 10
  });
  
  console.log('Sample AffiliateConversion data:');
  for (const s of samples) {
    console.log(`  affiliateId: ${s.affiliateId}, name: ${s.affiliateName}`);
  }
  
  // Check if affiliateName field has data
  const withNames = await prisma.affiliateConversion.findMany({
    where: { affiliateName: { not: null } },
    select: { affiliateId: true, affiliateName: true, commissionAmount: true },
    distinct: ['affiliateId'],
    orderBy: { commissionAmount: 'desc' },
    take: 10
  });
  
  console.log('\nAffiliates with names (top 10 by commission):');
  for (const w of withNames) {
    console.log(`  ${w.affiliateName} (ID: ${w.affiliateId}) - Rp ${Number(w.commissionAmount).toLocaleString('id-ID')}`);
  }
  
  // Get totals grouped by affiliateName
  const byName = await prisma.$queryRaw`
    SELECT 
      "affiliateName",
      SUM("commissionAmount") as "totalEarnings",
      COUNT(*) as "totalConversions"
    FROM "AffiliateConversion"
    WHERE "affiliateName" IS NOT NULL
    GROUP BY "affiliateName"
    ORDER BY "totalEarnings" DESC
    LIMIT 15
  `;
  
  console.log('\n=== TOP 15 AFFILIATES BY NAME ===');
  for (const b of byName) {
    console.log(`${b.affiliateName}: Rp ${Number(b.totalEarnings).toLocaleString('id-ID')} (${b.totalConversions} transaksi)`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
