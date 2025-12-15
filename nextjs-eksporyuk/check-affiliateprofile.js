import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const profileCount = await prisma.affiliateProfile.count();
const distinctAffiliates = await prisma.transaction.findMany({
  where: { 
    affiliateId: { not: null },
    status: 'SUCCESS'
  },
  select: { affiliateId: true },
  distinct: ['affiliateId']
});

console.log(`\n📊 AffiliateProfile count: ${profileCount}`);
console.log(`Distinct affiliate IDs in transactions: ${distinctAffiliates.length}\n`);

// Check which affiliates have no profile
for (const aff of distinctAffiliates.slice(0, 10)) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { id: aff.affiliateId }
  });
  
  if (!profile) {
    console.log(`❌ Missing profile for affiliate: ${aff.affiliateId}`);
  }
}

await prisma.$disconnect();
