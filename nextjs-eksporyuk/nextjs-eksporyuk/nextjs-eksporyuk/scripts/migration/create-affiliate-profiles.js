/**
 * CREATE AFFILIATE PROFILES FROM SEJOLI DATA
 * 
 * Script ini membuat AffiliateProfile untuk users yang jadi affiliate di Sejoli
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sejoliData = require('./wp-data/sejolisa-full-18000users-1765279985617.json');

async function createAffiliateProfiles() {
  console.log('🚀 MEMBUAT AFFILIATE PROFILES DARI DATA SEJOLI');
  console.log('='.repeat(80));
  
  const stats = {
    created: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Get all users for mapping
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
    
    console.log(`\n📊 Found ${allUsers.length} users in database`);
    console.log(`📊 Found ${sejoliData.affiliates.length} affiliates in Sejoli data\n`);

    for (const affiliateData of sejoliData.affiliates) {
      try {
        // Get user by email
        const userId = userEmailMap.get(affiliateData.user_email);
        if (!userId) {
          stats.skipped++;
          continue;
        }
        
        // Check if affiliate profile already exists
        const existingAffiliate = await prisma.affiliateProfile.findUnique({
          where: { userId: userId }
        });
        
        if (existingAffiliate) {
          stats.skipped++;
          continue;
        }
        
        // Create affiliate profile
        await prisma.affiliateProfile.create({
          data: {
            userId: userId,
            affiliateCode: affiliateData.affiliate_code || `AFF-${userId.slice(0, 8)}`,
            commissionRate: 30, // Default commission rate
            isActive: true,
            createdAt: new Date()
          }
        });
        
        stats.created++;
        
        if (stats.created % 500 === 0) {
          console.log(`   ✓ ${stats.created} affiliate profiles created...`);
        }
      } catch (error) {
        stats.skipped++;
        stats.errors.push(`Affiliate ${affiliateData.user_email}: ${error.message}`);
      }
    }

    console.log(`\n✅ Affiliate profiles created: ${stats.created}`);
    console.log(`⏭️  Affiliate profiles skipped: ${stats.skipped}`);

    // Verify
    console.log('\n🔍 VERIFICATION:');
    const totalAffiliates = await prisma.affiliateProfile.count();
    console.log(`   Total Affiliate Profiles in DB: ${totalAffiliates}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SELESAI!');

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length} total, showing first 10):`);
      stats.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
if (require.main === module) {
  createAffiliateProfiles()
    .then(() => {
      console.log('\n🎉 Affiliate profiles berhasil dibuat!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Affiliate profiles gagal:', error);
      process.exit(1);
    });
}

module.exports = { createAffiliateProfiles };
