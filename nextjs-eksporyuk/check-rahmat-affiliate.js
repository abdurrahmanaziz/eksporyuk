const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findRahmatAffiliate() {
  // Find Rahmat Al Fianto
  const user = await prisma.user.findFirst({
    where: {
      name: { contains: 'Rahmat' }
    },
    include: {
      affiliateProfile: true
    }
  });
  
  if (user) {
    console.log('Found Rahmat:', {
      id: user.id,
      name: user.name,
      email: user.email,
      hasAffiliateProfile: !!user.affiliateProfile,
      affiliateId: user.affiliateProfile?.id,
      affiliateCode: user.affiliateProfile?.affiliateCode
    });
    
    // Check conversions for this affiliate
    if (user.affiliateProfile) {
      const conversions = await prisma.affiliateConversion.count({
        where: { affiliateId: user.affiliateProfile.id }
      });
      console.log('Conversions for this affiliate:', conversions);
    }
  } else {
    console.log('Rahmat not found');
  }
  
  // Get top affiliates by conversion count
  console.log('\nTop 10 affiliates by conversions:');
  const topAffiliates = await prisma.affiliateProfile.findMany({
    include: {
      user: { select: { name: true } },
      _count: { select: { conversions: true } }
    },
    orderBy: {
      conversions: { _count: 'desc' }
    },
    take: 10
  });
  
  topAffiliates.forEach((a, i) => {
    console.log(`${i+1}. ${a.user.name} - ${a._count.conversions} conversions (code: ${a.affiliateCode})`);
  });
  
  // Check transactions with and without affiliate conversions
  console.log('\n=== Transaction Affiliate Status ===');
  const totalTx = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  const withAffiliate = await prisma.affiliateConversion.count();
  console.log(`Total SUCCESS transactions: ${totalTx}`);
  console.log(`Transactions with affiliate: ${withAffiliate}`);
  console.log(`Transactions without affiliate: ${totalTx - withAffiliate}`);
  console.log(`Coverage: ${((withAffiliate / totalTx) * 100).toFixed(1)}%`);
  
  await prisma.$disconnect();
}

findRahmatAffiliate().catch(console.error);
