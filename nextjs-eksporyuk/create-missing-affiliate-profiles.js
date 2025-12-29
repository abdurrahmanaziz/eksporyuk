const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate ID like Prisma
function generateId(prefix = '') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
}

async function createMissingAffiliateProfiles() {
  console.log('🔧 CREATING MISSING AFFILIATE PROFILES\n');
  
  try {
    // Get unique user IDs dari AffiliateConversion (yang sebenarnya adalah user IDs)
    const conversions = await prisma.affiliateConversion.findMany({
      select: { affiliateId: true },
      distinct: ['affiliateId']
    });
    
    console.log(`Found ${conversions.length} unique affiliate user IDs\n`);
    
    let created = 0;
    let alreadyExists = 0;
    let failed = 0;
    
    for (const conv of conversions) {
      const userId = conv.affiliateId;
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, username: true }
      });
      
      if (!user) {
        console.log(`⚠️  User ${userId} tidak ditemukan, skip`);
        failed++;
        continue;
      }
      
      // Check if AffiliateProfile already exists for this user
      const existingProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: userId }
      });
      
      if (existingProfile) {
        console.log(`✓ AffiliateProfile untuk ${user.name} sudah ada`);
        alreadyExists++;
        continue;
      }
      
      // Create new AffiliateProfile
      try {
        const newProfile = await prisma.affiliateProfile.create({
          data: {
            id: generateId('aff_'),
            userId: userId,
            affiliateCode: user.username || `aff_${userId.slice(0, 8)}`,
            shortLink: `https://eksporyuk.app/${user.username || userId.slice(0, 8)}`,
            tier: 1, // Changed from 'TIER_1' to 1 (Int type)
            commissionRate: 30, // Default 30%
            isActive: true,
            applicationStatus: 'APPROVED',
            approvedAt: new Date(),
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            trainingCompleted: true,
            trainingCompletedAt: new Date(),
            profileCompleted: true,
            profileCompletedAt: new Date(),
            updatedAt: new Date(),
          }
        });
        
        created++;
        console.log(`✨ Created: ${user.name} (${newProfile.id})`);
      } catch (err) {
        if (err.code === 'P2002') {
          console.log(`⚠️  Duplicate for ${user.name}, skip`);
          alreadyExists++;
        } else {
          console.log(`❌ Error creating profile for ${user.name}:`, err.message.slice(0, 100));
          failed++;
        }
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  ✨ Created: ${created}`);
    console.log(`  ✓ Already exists: ${alreadyExists}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Total: ${created + alreadyExists}`);
    
    // Now verify: update AffiliateConversion to reference correct affiliateId
    console.log(`\n🔗 UPDATING AFFILIATE CONVERSION REFERENCES...\n`);
    
    let updated = 0;
    
    for (const conv of conversions) {
      const userId = conv.affiliateId;
      
      // Get the new AffiliateProfile
      const profile = await prisma.affiliateProfile.findUnique({
        where: { userId: userId },
        select: { id: true }
      });
      
      if (profile) {
        // Update all conversions with old affiliateId to new profile ID
        const result = await prisma.affiliateConversion.updateMany({
          where: { affiliateId: userId },
          data: { affiliateId: profile.id }
        });
        
        if (result.count > 0) {
          updated += result.count;
          console.log(`✓ Updated ${result.count} conversions for user ${userId}`);
        }
      }
    }
    
    console.log(`\n✅ TOTAL CONVERSIONS UPDATED: ${updated}`);
    
    // Final verification
    console.log(`\n✅ VERIFICATION:`);
    const orphanedCount = await prisma.affiliateConversion.count({
      where: {
        affiliateId: {
          notIn: (await prisma.affiliateProfile.findMany({ select: { id: true } })).map(p => p.id)
        }
      }
    });
    
    console.log(`  Orphaned conversions: ${orphanedCount}`);
    
    const totalWithValidProfile = await prisma.affiliateConversion.count({
      where: {
        affiliateId: {
          in: (await prisma.affiliateProfile.findMany({ select: { id: true } })).map(p => p.id)
        }
      }
    });
    
    console.log(`  Conversions with valid profile: ${totalWithValidProfile}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingAffiliateProfiles();
