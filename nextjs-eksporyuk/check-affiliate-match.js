const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get AffiliateProfile users
  const profiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 5
  });
  
  console.log('=== AffiliateProfile users ===');
  for (const p of profiles) {
    console.log(`${p.user?.name} (${p.user?.email})`);
    console.log(`  userId: ${p.userId}`);
    console.log(`  affiliateCode: ${p.affiliateCode}`);
    
    // Check if there's AffiliateConversion with this userId
    const convByUserId = await prisma.affiliateConversion.count({
      where: { affiliateId: p.userId }
    });
    console.log(`  Conversions by userId: ${convByUserId}`);
    
    // Check if there's AffiliateConversion with affiliateCode
    const convByCode = await prisma.affiliateConversion.count({
      where: { affiliateId: p.affiliateCode }
    });
    console.log(`  Conversions by affiliateCode: ${convByCode}`);
  }
  
  // Check a sample AffiliateConversion affiliateId format
  const sampleConv = await prisma.affiliateConversion.findMany({
    select: { affiliateId: true },
    distinct: ['affiliateId'],
    take: 5
  });
  console.log('\n=== Sample AffiliateConversion affiliateIds ===');
  for (const c of sampleConv) {
    console.log(c.affiliateId);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
