const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create affiliate profiles for users from CSV that don't have one yet
 */
const missingAffiliates = [
  { name: 'Endang Nurdin', wpId: 127 },
  { name: 'Fadlul Rahmat', wpId: 5961 },
  { name: 'Andi Nugroho', wpId: 281 },
  { name: 'Supyanto', wpId: 10142 },
];

async function main() {
  console.log('=== CREATING MISSING AFFILIATE PROFILES ===\n');
  
  for (const aff of missingAffiliates) {
    const user = await prisma.user.findFirst({
      where: { name: { equals: aff.name, mode: 'insensitive' } },
      include: { affiliateProfile: true }
    });
    
    if (!user) {
      console.log(`❌ ${aff.name}: User not found`);
      continue;
    }
    
    if (user.affiliateProfile) {
      console.log(`⏭️  ${aff.name}: Already has affiliate profile`);
      continue;
    }
    
    // Create affiliate profile
    const affCode = `AFF${aff.wpId}`;
    const shortLinkUsername = aff.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    
    const profile = await prisma.affiliateProfile.create({
      data: {
        user: { connect: { id: user.id } },
        affiliateCode: affCode,
        shortLink: `https://eksy.id/${shortLinkUsername}`,
        shortLinkUsername,
        tier: 1,
        commissionRate: 30,
        totalEarnings: 0,
        totalConversions: 0,
        totalClicks: 0,
        isActive: true,
        approvedAt: new Date(),
      }
    });
    
    console.log(`✅ ${aff.name}: Created profile (ID: ${profile.id}, Code: ${affCode})`);
  }
  
  console.log('\n=== DONE ===');
  await prisma.$disconnect();
}

main().catch(console.error);
