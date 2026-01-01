const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CHECK AFFILIATE EARNINGS ===\n');
  
  // 1. Check AffiliateConversion totals
  const conversionStats = await prisma.$queryRaw`
    SELECT 
      "affiliateId",
      SUM("commissionAmount") as "totalEarnings",
      COUNT(*) as "totalConversions"
    FROM "AffiliateConversion"
    GROUP BY "affiliateId"
    ORDER BY "totalEarnings" DESC
    LIMIT 10
  `;
  
  console.log('Top 10 Affiliates by Commission (from AffiliateConversion):');
  console.log('-----------------------------------------------------------');
  
  for (const stat of conversionStats) {
    const user = await prisma.user.findUnique({
      where: { id: stat.affiliateId },
      select: { name: true, email: true }
    });
    console.log(`${user?.name || 'Unknown'} (${user?.email || '-'})`);
    console.log(`  Total Komisi: Rp ${Number(stat.totalEarnings).toLocaleString('id-ID')}`);
    console.log(`  Total Transaksi: ${stat.totalConversions}`);
    console.log('');
  }
  
  // 2. Check AffiliateProfile totals
  const profiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { totalEarnings: 'desc' },
    take: 10
  });
  
  console.log('\nTop 10 from AffiliateProfile:');
  console.log('-----------------------------');
  for (const p of profiles) {
    console.log(`${p.user?.name || 'Unknown'} - Rp ${Number(p.totalEarnings).toLocaleString('id-ID')} (${p.totalConversions} konversi)`);
  }
  
  // 3. Count totals
  const totalConversions = await prisma.affiliateConversion.count();
  const totalProfiles = await prisma.affiliateProfile.count();
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total AffiliateConversion records: ${totalConversions}`);
  console.log(`Total AffiliateProfile records: ${totalProfiles}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
