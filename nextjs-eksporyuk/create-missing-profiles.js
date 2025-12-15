import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all distinct affiliate IDs from transactions
const distinctAffiliates = await prisma.transaction.findMany({
  where: { 
    affiliateId: { not: null },
    status: 'SUCCESS'
  },
  select: { affiliateId: true },
  distinct: ['affiliateId']
});

console.log(`\n📊 Found ${distinctAffiliates.length} unique affiliates in transactions\n`);

let created = 0;
let existing = 0;

for (const { affiliateId } of distinctAffiliates) {
  // Check if profile exists
  const profile = await prisma.affiliateProfile.findUnique({
    where: { id: affiliateId }
  });
  
  if (!profile) {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: affiliateId },
      select: { name: true, email: true }
    });
    
    if (user) {
      // Create affiliate profile
      await prisma.affiliateProfile.create({
        data: {
          id: affiliateId,
          user: { connect: { id: affiliateId } },
          affiliateCode: user.email?.split('@')[0] || `affiliate${Date.now()}`,
          shortLink: `https://eksporyuk.com/go/${user.email?.split('@')[0] || affiliateId}`,
          isActive: true
        }
      });
      
      created++;
      console.log(`✅ Created profile for: ${user.name || user.email}`);
    }
  } else {
    existing++;
  }
}

console.log(`\n✅ Created ${created} new AffiliateProfile records`);
console.log(`✓ Already exists: ${existing}`);
console.log(`📊 Total: ${created + existing}`);

await prisma.$disconnect();
