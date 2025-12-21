const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalSummary() {
  console.log('=== FINAL AFFILIATE DATA SUMMARY ===\n');
  
  // Get top affiliates
  console.log('Top 15 affiliates by conversions:');
  const topAffiliates = await prisma.affiliateProfile.findMany({
    include: {
      user: { select: { name: true } },
      _count: { select: { conversions: true } }
    },
    orderBy: {
      conversions: { _count: 'desc' }
    },
    take: 15
  });
  
  console.log('─'.repeat(60));
  topAffiliates.forEach((a, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${a.user.name.padEnd(30)} | ${a._count.conversions} conversions`);
  });
  
  // Transaction affiliate coverage
  console.log('\n=== Transaction Affiliate Coverage ===');
  const totalTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  const withAffiliate = await prisma.affiliateConversion.count();
  console.log(`Total SUCCESS transactions: ${totalTx.toLocaleString()}`);
  console.log(`Transactions with affiliate: ${withAffiliate.toLocaleString()}`);
  console.log(`Transactions without affiliate: ${(totalTx - withAffiliate).toLocaleString()}`);
  console.log(`Coverage: ${((withAffiliate / totalTx) * 100).toFixed(1)}%`);
  
  // Check some specific affiliates from Sejoli
  console.log('\n=== Verification: Specific Affiliates ===');
  const checkNames = ['Rahmat Al Fianto', 'Yoga Andrian', 'Sutisna', 'PintarEkspor', 'Fadlul Rahmat'];
  
  for (const name of checkNames) {
    const profile = await prisma.affiliateProfile.findFirst({
      where: {
        user: { name: { contains: name.split(' ')[0] } }
      },
      include: {
        user: { select: { name: true } },
        _count: { select: { conversions: true } }
      }
    });
    
    if (profile) {
      // Get total commission
      const totalCommission = await prisma.affiliateConversion.aggregate({
        where: { affiliateId: profile.id },
        _sum: { commissionAmount: true }
      });
      
      console.log(`${profile.user.name}: ${profile._count.conversions} conversions, Total Commission: Rp ${totalCommission._sum.commissionAmount?.toLocaleString() || '0'}`);
    }
  }
  
  await prisma.$disconnect();
}

finalSummary().catch(console.error);
