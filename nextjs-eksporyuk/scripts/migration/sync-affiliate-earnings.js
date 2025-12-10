/**
 * SYNC AFFILIATE EARNINGS
 * ========================
 * Update totalEarnings and totalConversions in AffiliateProfile
 * based on actual data from AffiliateConversion
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🔄 SYNCING AFFILIATE EARNINGS');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Get all affiliates
  const affiliates = await prisma.affiliateProfile.findMany({
    select: { id: true, affiliateCode: true }
  });

  console.log(`📋 Found ${affiliates.length} affiliates\n`);
  console.log('📝 Updating earnings...\n');

  let updated = 0;
  let failed = 0;

  for (const affiliate of affiliates) {
    try {
      // Get actual data from conversions
      const stats = await prisma.affiliateConversion.aggregate({
        where: { affiliateId: affiliate.id },
        _sum: {
          commissionAmount: true
        },
        _count: true
      });

      const actualEarnings = Number(stats._sum.commissionAmount || 0);
      const conversionsCount = stats._count;

      // Update affiliate profile
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: {
          totalEarnings: actualEarnings,
          totalConversions: conversionsCount
        }
      });

      updated++;

      if (updated % 100 === 0) {
        console.log(`   ✅ Updated ${updated} affiliates...`);
      }
    } catch (e) {
      failed++;
      if (failed <= 3) {
        console.error(`   ⚠️  Error updating ${affiliate.affiliateCode}:`, e.message);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('📊 SYNC SUMMARY');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}\n`);

  // Show top 5 after sync
  const topAffiliates = await prisma.affiliateProfile.findMany({
    take: 5,
    where: {
      totalEarnings: { gt: 0 }
    },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: {
      totalEarnings: 'desc'
    }
  });

  console.log('🏆 Top 5 Affiliates by Commission:\n');
  topAffiliates.forEach((aff, i) => {
    console.log(`${i + 1}. ${aff.user.name}`);
    console.log(`   Komisi: Rp ${Number(aff.totalEarnings).toLocaleString()}`);
    console.log(`   Konversi: ${aff.totalConversions}`);
    console.log('');
  });

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('✅ COMPLETED!');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
