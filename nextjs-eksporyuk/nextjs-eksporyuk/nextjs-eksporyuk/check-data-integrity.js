const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDataIntegrity() {
  console.log('🔍 DATABASE DATA INTEGRITY CHECK\n');
  
  const users = await prisma.user.count();
  const wallets = await prisma.wallet.count();
  const affiliateProfiles = await prisma.affiliateProfile.count();
  const conversions = await prisma.affiliateConversion.count();
  const transactions = await prisma.transaction.count();
  const memberships = await prisma.membership.count();
  const userMemberships = await prisma.userMembership.count();
  
  console.log('📊 TABLE COUNTS:');
  console.log(`Users: ${users}`);
  console.log(`Wallets: ${wallets}`);
  console.log(`AffiliateProfiles: ${affiliateProfiles}`);
  console.log(`AffiliateConversions: ${conversions}`);
  console.log(`Transactions: ${transactions}`);
  console.log(`Memberships: ${memberships}`);
  console.log(`UserMemberships: ${userMemberships}`);
  
  // Check orphaned conversions
  console.log('\n🔗 CHECKING ORPHANED RECORDS:');
  
  const orphanedConversions = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "AffiliateConversion"
    LEFT JOIN "AffiliateProfile" ON "AffiliateConversion"."affiliateId" = "AffiliateProfile"."id"
    WHERE "AffiliateProfile"."id" IS NULL
  `;
  
  console.log(`Orphaned AffiliateConversions: ${orphanedConversions[0].count}`);
  
  // Get sample of orphaned conversions
  const sampleOrphanedConversions = await prisma.$queryRaw`
    SELECT DISTINCT "AffiliateConversion"."affiliateId", COUNT(*) as count, SUM("commissionAmount") as total
    FROM "AffiliateConversion"
    LEFT JOIN "AffiliateProfile" ON "AffiliateConversion"."affiliateId" = "AffiliateProfile"."id"
    WHERE "AffiliateProfile"."id" IS NULL
    GROUP BY "AffiliateConversion"."affiliateId"
    LIMIT 10
  `;
  
  if (sampleOrphanedConversions.length > 0) {
    console.log('\nSample orphaned conversions:');
    for (const conv of sampleOrphanedConversions) {
      console.log(`  AffiliateID: ${conv.affiliateId}, Count: ${conv.count}, Total: Rp ${Number(conv.total).toLocaleString('id-ID')}`);
    }
  }
  
  // Check if there are any valid affiliate profiles
  if (affiliateProfiles > 0) {
    console.log('\n✓ There are valid AffiliateProfiles');
    const sample = await prisma.affiliateProfile.findFirst({
      select: { id: true, userId: true, totalEarnings: true },
    });
    console.log(`Sample: ${sample?.id}`);
  } else {
    console.log('\n❌ NO AffiliateProfiles found!');
  }
  
  await prisma.$disconnect();
}

checkDataIntegrity().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
