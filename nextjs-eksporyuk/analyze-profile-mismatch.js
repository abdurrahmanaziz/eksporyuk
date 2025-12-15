import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const distinctAffiliates = await prisma.transaction.findMany({
  where: { affiliateId: { not: null }, status: 'SUCCESS' },
  select: { affiliateId: true },
  distinct: ['affiliateId']
});

const affiliateIds = distinctAffiliates.map(a => a.affiliateId);

// Check profile existence for each
const profileCheck = await Promise.all(
  affiliateIds.map(async id => {
    const profile = await prisma.affiliateProfile.findUnique({ where: { id } });
    return { affiliateId: id, hasProfile: !!profile };
  })
);

const missing = profileCheck.filter(c => !c.hasProfile);
const existing = profileCheck.filter(c => c.hasProfile);

console.log(`\n📊 ANALYSIS\n`);
console.log(`Total affiliate IDs in transactions: ${affiliateIds.length}`);
console.log(`Has AffiliateProfile: ${existing.length}`);
console.log(`Missing AffiliateProfile: ${missing.length}\n`);

if (missing.length > 0) {
  console.log(`Missing profiles for these affiliate IDs:`);
  for (const m of missing.slice(0, 20)) {
    const user = await prisma.user.findUnique({
      where: { id: m.affiliateId },
      select: { name: true, email: true }
    });
    
    // Check if user already has a profile via userId
    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: m.affiliateId }
    });
    
    console.log(`  ${user?.name || user?.email} - ${existingProfile ? '✓ Profile exists via userId' : '❌ No profile'}`);
  }
}

await prisma.$disconnect();
