const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Get affiliate
  const affiliate = await prisma.affiliateProfile.findFirst({
    where: { affiliateCode: 'abdurrahmanaziz' }
  });
  
  if (!affiliate) {
    console.log('Affiliate not found');
    await prisma.$disconnect();
    return;
  }

  // Create link
  const link = await prisma.affiliateLink.create({
    data: {
      code: 'abdurrahmanaziz-mem-lifetime',
      fullUrl: 'https://eksporyuk.com/checkout/paket-lifetime?ref=abdurrahmanaziz-mem-lifetime',
      linkType: 'CHECKOUT',
      affiliateId: affiliate.id,
      membershipId: 'mem_lifetime_ekspor',
    }
  });
  
  console.log('✅ Link created successfully!');
  console.log('   Code:', link.code);
  console.log('   URL:', link.fullUrl);
  console.log('   ID:', link.id);
  
  // Verify
  const saved = await prisma.affiliateLink.findUnique({ where: { id: link.id } });
  console.log('   Verified:', saved ? '✅' : '❌');
  
  await prisma.$disconnect();
}
test().catch(console.error);
