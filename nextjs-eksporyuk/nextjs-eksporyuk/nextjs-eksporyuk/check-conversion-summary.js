const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Total semua AffiliateConversion untuk azizbiasa
  const aff = await prisma.affiliateProfile.findFirst({
    where: { user: { email: 'azizbiasa@gmail.com' } }
  });
  
  if (!aff) {
    console.log('No affiliate profile found');
    return;
  }
  
  const conversions = await prisma.affiliateConversion.aggregate({
    where: { affiliateId: aff.id },
    _sum: { commissionAmount: true },
    _count: true
  });
  
  const paidConversions = await prisma.affiliateConversion.aggregate({
    where: { affiliateId: aff.id, paidOut: true },
    _sum: { commissionAmount: true }
  });
  
  const pendingConversions = await prisma.affiliateConversion.aggregate({
    where: { affiliateId: aff.id, paidOut: false },
    _sum: { commissionAmount: true }
  });
  
  console.log('=== AFFILIATE CONVERSION SUMMARY ===');
  console.log('Total Count:', conversions._count);
  console.log('Total Commission:', Number(conversions._sum.commissionAmount || 0));
  console.log('Paid Out:', Number(paidConversions._sum.commissionAmount || 0));
  console.log('Pending:', Number(pendingConversions._sum.commissionAmount || 0));
  console.log('Available (total - paidout):', Number(conversions._sum.commissionAmount || 0) - Number(paidConversions._sum.commissionAmount || 0));
  
  await prisma.$disconnect();
}
check();
