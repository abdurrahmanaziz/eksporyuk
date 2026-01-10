const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAffiliateProfiles() {
  console.log('🧹 Cleaning up affiliate profiles - Only keep those with actual sales');
  console.log('====================================================================\n');

  try {
    // Get all affiliate profiles
    const allProfiles = await prisma.affiliateProfile.findMany();
    console.log(`Found ${allProfiles.length} affiliate profiles`);

    // Get all conversions to see which affiliates actually have sales
    const allConversions = await prisma.affiliateConversion.findMany();
    const affiliatesWithSales = new Set(allConversions.map(c => c.affiliateId));
    console.log(`${affiliatesWithSales.size} affiliates have actual sales/conversions`);

    // Get users for profiles (separate query)
    const userIds = allProfiles.map(p => p.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Find profiles without sales
    const profilesWithoutSales = allProfiles.filter(p => !affiliatesWithSales.has(p.id));
    const profilesWithSales = allProfiles.filter(p => affiliatesWithSales.has(p.id));

    console.log(`\n📊 ANALYSIS:`);
    console.log(`✅ Profiles WITH sales: ${profilesWithSales.length}`);
    console.log(`❌ Profiles WITHOUT sales: ${profilesWithoutSales.length}`);

    if (profilesWithoutSales.length > 0) {
      console.log(`\n🗑️ PROFILES TO DELETE (no sales):`);
      profilesWithoutSales.forEach((profile, index) => {
        const user = userMap.get(profile.userId);
        console.log(`${index + 1}. ${user?.name || 'Unknown'} (${user?.email || 'no email'})`);
      });

      // Delete profiles without sales
      const deleteResult = await prisma.affiliateProfile.deleteMany({
        where: {
          id: {
            in: profilesWithoutSales.map(p => p.id)
          }
        }
      });

      console.log(`\n✅ Deleted ${deleteResult.count} affiliate profiles without sales`);

      // Remove affiliate role from users who lost their profile
      const usersToUpdate = profilesWithoutSales.map(p => p.userId).filter(Boolean);
      if (usersToUpdate.length > 0) {
        const updateResult = await prisma.user.updateMany({
          where: {
            id: { in: usersToUpdate },
            role: 'AFFILIATE'
          },
          data: {
            role: 'MEMBER_FREE'
          }
        });

        console.log(`✅ Removed AFFILIATE role from ${updateResult.count} users`);
      }
    }

    // Ensure users with sales have correct AFFILIATE role
    const usersWithSales = profilesWithSales.map(p => p.userId).filter(Boolean);
    if (usersWithSales.length > 0) {
      const affiliateRoleUpdate = await prisma.user.updateMany({
        where: {
          id: { in: usersWithSales },
          role: { not: 'AFFILIATE' }
        },
        data: {
          role: 'AFFILIATE'
        }
      });

      console.log(`✅ Gave AFFILIATE role to ${affiliateRoleUpdate.count} users with sales`);
    }

    console.log(`\n📊 FINAL VALID AFFILIATES (with sales):`);
    profilesWithSales.forEach((profile, index) => {
      const conversions = allConversions.filter(c => c.affiliateId === profile.id);
      const totalCommission = conversions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const user = userMap.get(profile.userId);
      console.log(`${index + 1}. ${user?.name || 'Unknown'} - ${conversions.length} sales - Rp ${totalCommission.toLocaleString('id-ID')}`);
    });

    console.log(`\n✅ CLEANUP COMPLETE:`);
    console.log(`- Valid affiliates: ${profilesWithSales.length}`);
    console.log(`- Removed profiles: ${profilesWithoutSales.length}`);
    console.log(`- Total conversions: ${allConversions.length}`);

    // Double check - verify no orphaned conversions
    const orphanedConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: {
          notIn: profilesWithSales.map(p => p.id)
        }
      }
    });

    if (orphanedConversions.length > 0) {
      console.log(`\n⚠️ WARNING: ${orphanedConversions.length} orphaned conversions found!`);
    } else {
      console.log(`\n✅ No orphaned conversions - all data consistent`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAffiliateProfiles();