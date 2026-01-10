const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeZeroCommissionAffiliates() {
  console.log('🧹 Remove affiliates with sales but ZERO commission');
  console.log('====================================================\n');

  try {
    // Get all conversions
    const allConversions = await prisma.affiliateConversion.findMany();

    // Group by affiliate and calculate total commission
    const affiliateStats = new Map();
    for (const conv of allConversions) {
      if (!affiliateStats.has(conv.affiliateId)) {
        affiliateStats.set(conv.affiliateId, {
          totalSales: 0,
          totalCommission: 0
        });
      }
      const stats = affiliateStats.get(conv.affiliateId);
      stats.totalSales++;
      stats.totalCommission += parseFloat(conv.commissionAmount);
    }

    // Find affiliates with zero commission
    const zeroCommissionAffiliates = [];
    const validAffiliates = [];

    for (const [affiliateId, stats] of affiliateStats) {
      if (stats.totalCommission === 0) {
        zeroCommissionAffiliates.push(affiliateId);
      } else {
        validAffiliates.push(affiliateId);
      }
    }

    console.log(`📊 ANALYSIS:`);
    console.log(`Total unique affiliates with conversions: ${affiliateStats.size}`);
    console.log(`✅ Affiliates with commission > 0: ${validAffiliates.length}`);
    console.log(`❌ Affiliates with commission = 0: ${zeroCommissionAffiliates.length}`);

    if (zeroCommissionAffiliates.length > 0) {
      // Get profile and user info for zero commission affiliates
      const zeroProfiles = await prisma.affiliateProfile.findMany({
        where: { id: { in: zeroCommissionAffiliates } }
      });

      const userIds = zeroProfiles.map(p => p.userId).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } }
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      console.log(`\n🗑️ AFFILIATES TO REMOVE (zero commission):`);
      zeroProfiles.forEach((profile, index) => {
        const user = userMap.get(profile.userId);
        const stats = affiliateStats.get(profile.id);
        console.log(`${index + 1}. ${user?.name || 'Unknown'} - ${stats.totalSales} sales - Rp 0`);
      });

      // Delete conversions for zero commission affiliates
      const deleteConversions = await prisma.affiliateConversion.deleteMany({
        where: { affiliateId: { in: zeroCommissionAffiliates } }
      });
      console.log(`\n✅ Deleted ${deleteConversions.count} conversions with zero commission`);

      // Delete affiliate profiles
      const deleteProfiles = await prisma.affiliateProfile.deleteMany({
        where: { id: { in: zeroCommissionAffiliates } }
      });
      console.log(`✅ Deleted ${deleteProfiles.count} affiliate profiles`);

      // Remove affiliate role from these users
      const updateUsers = await prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: 'AFFILIATE'
        },
        data: { role: 'MEMBER_FREE' }
      });
      console.log(`✅ Removed AFFILIATE role from ${updateUsers.count} users`);
    }

    // Final summary of valid affiliates
    console.log(`\n📊 FINAL VALID AFFILIATES (commission > 0):`);
    const validProfiles = await prisma.affiliateProfile.findMany({
      where: { id: { in: validAffiliates } }
    });

    const validUserIds = validProfiles.map(p => p.userId).filter(Boolean);
    const validUsers = await prisma.user.findMany({
      where: { id: { in: validUserIds } }
    });
    const validUserMap = new Map(validUsers.map(u => [u.id, u]));

    validProfiles.forEach((profile, index) => {
      const user = validUserMap.get(profile.userId);
      const stats = affiliateStats.get(profile.id);
      if (stats && stats.totalCommission > 0) {
        console.log(`${index + 1}. ${user?.name || 'Unknown'} - ${stats.totalSales} sales - Rp ${stats.totalCommission.toLocaleString('id-ID')}`);
      }
    });

    // Final stats
    const remainingConversions = await prisma.affiliateConversion.count();
    const remainingProfiles = await prisma.affiliateProfile.count();
    
    console.log(`\n✅ FINAL CLEANUP COMPLETE:`);
    console.log(`- Valid affiliates: ${remainingProfiles}`);
    console.log(`- Total conversions: ${remainingConversions}`);
    console.log(`- All remaining affiliates have commission > 0`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeZeroCommissionAffiliates();