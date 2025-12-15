import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('\n📊 SYNCING AFFILIATE PROFILE TOTALS (REAL DATA)\n');

// Get all profiles
const profiles = await prisma.affiliateProfile.findMany({
  select: { id: true, userId: true, user: { select: { name: true } } }
});

console.log(`Found ${profiles.length} profiles\n`);

let updated = 0;

for (const profile of profiles) {
  // Sum REAL commission from AffiliateConversion
  const conversionSum = await prisma.affiliateConversion.aggregate({
    where: { affiliateId: profile.id },
    _sum: { commissionAmount: true },
    _count: true
  });
  
  // Sum total sales from Transaction (where affiliate = this user)
  const salesSum = await prisma.transaction.aggregate({
    where: {
      affiliateId: profile.userId, // Transaction stores User.id
      status: 'SUCCESS'
    },
    _sum: { amount: true },
    _count: true
  });
  
  const totalEarnings = Number(conversionSum._sum.commissionAmount || 0);
  const totalConversions = conversionSum._count;
  const totalSales = Number(salesSum._sum.amount || 0);
  const totalClicks = totalConversions; // Use conversions as proxy for clicks
  
  // Update profile
  await prisma.affiliateProfile.update({
    where: { id: profile.id },
    data: {
      totalEarnings,
      totalConversions,
      totalSales,
      totalClicks: totalClicks > 0 ? totalClicks : profile.id === profile.userId ? 0 : 0
    }
  });
  
  updated++;
  
  if (totalEarnings > 0) {
    console.log(`✅ ${profile.user?.name}: Rp ${totalEarnings.toLocaleString('id-ID')} (${totalConversions} conv, Rp ${totalSales.toLocaleString('id-ID')} sales)`);
  }
}

console.log(`\n✅ Updated ${updated} profiles\n`);

// Verify totals
const totalCheck = await prisma.affiliateProfile.aggregate({
  _sum: {
    totalEarnings: true,
    totalSales: true,
    totalConversions: true
  }
});

console.log(`📊 TOTAL SUMMARY:`);
console.log(`  Total earnings: Rp ${Number(totalCheck._sum.totalEarnings).toLocaleString('id-ID')}`);
console.log(`  Total sales: Rp ${Number(totalCheck._sum.totalSales).toLocaleString('id-ID')}`);
console.log(`  Total conversions: ${totalCheck._sum.totalConversions}`);

await prisma.$disconnect();
