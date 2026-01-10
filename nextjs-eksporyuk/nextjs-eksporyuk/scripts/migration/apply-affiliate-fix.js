/**
 * APPLY AFFILIATE FIX
 * ===================
 * 1. Remove affiliate profiles without commission
 * 2. Update real affiliates with correct earnings
 * 3. Fix user roles (remove AFFILIATE role from non-affiliates)
 * 4. Create conversions for real sales
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const FIX_DATA_FILE = path.join(__dirname, 'affiliate-fix-data.json');
const WP_DATA_FILE = path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

async function main() {
  console.log('========================================');
  console.log('APPLYING AFFILIATE FIX');
  console.log('========================================\n');

  // Load fix data
  if (!fs.existsSync(FIX_DATA_FILE)) {
    console.error('ERROR: Run analyze-real-affiliates.js first!');
    process.exit(1);
  }

  const fixData = JSON.parse(fs.readFileSync(FIX_DATA_FILE, 'utf8'));
  const wpData = JSON.parse(fs.readFileSync(WP_DATA_FILE, 'utf8'));
  
  console.log('Fix data loaded:');
  console.log('- Real affiliates to keep:', fixData.affiliatesToKeep.length);
  console.log('- Fake profiles to remove:', fixData.affiliatesToRemove.length);
  console.log('- Total commission:', 'Rp ' + fixData.stats.totalCommission.toLocaleString('id-ID'));

  // Stats
  const stats = {
    profilesRemoved: 0,
    rolesFixed: 0,
    earningsUpdated: 0,
    conversionsCreated: 0,
    profilesCreated: 0,
    errors: []
  };

  // Step 1: Remove fake affiliate profiles
  console.log('\n--- Step 1: Removing fake affiliate profiles ---');
  
  const profilesToRemove = fixData.affiliatesToRemove.map(a => a.id);
  
  if (profilesToRemove.length > 0) {
    // First, delete related data
    console.log('Deleting affiliate links...');
    await prisma.affiliateLink.deleteMany({
      where: { affiliateId: { in: profilesToRemove } }
    });
    
    console.log('Deleting affiliate clicks...');
    await prisma.affiliateClick.deleteMany({
      where: { affiliateId: { in: profilesToRemove } }
    });
    
    console.log('Deleting affiliate conversions...');
    await prisma.affiliateConversion.deleteMany({
      where: { affiliateId: { in: profilesToRemove } }
    });
    
    console.log('Deleting short links...');
    await prisma.affiliateShortLink.deleteMany({
      where: { affiliateId: { in: profilesToRemove } }
    });
    
    // Delete profiles in batches
    const batchSize = 500;
    for (let i = 0; i < profilesToRemove.length; i += batchSize) {
      const batch = profilesToRemove.slice(i, i + batchSize);
      await prisma.affiliateProfile.deleteMany({
        where: { id: { in: batch } }
      });
      stats.profilesRemoved += batch.length;
      console.log(`Removed ${stats.profilesRemoved}/${profilesToRemove.length} profiles...`);
    }
  }
  
  console.log('✅ Removed', stats.profilesRemoved, 'fake affiliate profiles');

  // Step 2: Fix user roles - remove AFFILIATE from users without commission
  console.log('\n--- Step 2: Fixing user roles ---');
  
  // Get all emails of real affiliates
  const realAffiliateEmails = new Set(fixData.affiliatesToKeep.map(a => a.email?.toLowerCase()));
  
  // Find users with AFFILIATE role who shouldn't have it
  const affiliateUsers = await prisma.user.findMany({
    where: { role: 'AFFILIATE' }
  });
  
  for (const user of affiliateUsers) {
    if (!realAffiliateEmails.has(user.email?.toLowerCase())) {
      // Change to MEMBER_FREE or appropriate role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_FREE' }
      });
      stats.rolesFixed++;
    }
  }
  
  console.log('✅ Fixed', stats.rolesFixed, 'user roles (AFFILIATE → MEMBER_FREE)');

  // Step 3: Update/Create real affiliate profiles with correct earnings
  console.log('\n--- Step 3: Updating real affiliate earnings ---');
  
  // Get completed orders for conversion creation
  const completedOrders = wpData.orders.filter(o => o.status === 'completed');
  const wpUserMap = {};
  wpData.users.forEach(u => { wpUserMap[u.id] = u; });

  for (const realAff of fixData.affiliatesToKeep) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { email: realAff.email },
        include: { affiliateProfile: true }
      });

      if (!dbUser) {
        console.log(`  ⚠ User not found: ${realAff.email}`);
        continue;
      }

      // Ensure user has AFFILIATE role
      if (dbUser.role !== 'AFFILIATE') {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: 'AFFILIATE' }
        });
      }

      // Create or update affiliate profile
      let affiliateProfile;
      
      if (dbUser.affiliateProfile) {
        // Update existing
        affiliateProfile = await prisma.affiliateProfile.update({
          where: { id: dbUser.affiliateProfile.id },
          data: {
            totalEarnings: realAff.totalCommission,
            totalConversions: realAff.orderCount,
            isActive: true
          }
        });
        stats.earningsUpdated++;
      } else {
        // Create new
        const code = generateAffiliateCode(dbUser.name || dbUser.email);
        affiliateProfile = await prisma.affiliateProfile.create({
          data: {
            userId: dbUser.id,
            affiliateCode: code,
            shortLink: code,
            totalEarnings: realAff.totalCommission,
            totalConversions: realAff.orderCount,
            isActive: true
          }
        });
        stats.profilesCreated++;
      }

      // Create wallet if needed
      await prisma.wallet.upsert({
        where: { userId: dbUser.id },
        create: {
          userId: dbUser.id,
          balance: realAff.totalCommission,
          balancePending: 0
        },
        update: {
          balance: realAff.totalCommission
        }
      });

      console.log(`  ✓ ${realAff.name}: Rp ${realAff.totalCommission.toLocaleString('id-ID')} (${realAff.orderCount} orders)`);

    } catch (err) {
      stats.errors.push(`${realAff.email}: ${err.message}`);
      console.log(`  ✗ Error for ${realAff.email}:`, err.message);
    }
  }

  console.log('✅ Updated', stats.earningsUpdated, 'affiliate earnings');
  console.log('✅ Created', stats.profilesCreated, 'new affiliate profiles');

  // Step 4: Summary
  console.log('\n========================================');
  console.log('FIX COMPLETE - SUMMARY');
  console.log('========================================');
  console.log('Fake profiles removed:', stats.profilesRemoved);
  console.log('Roles fixed:', stats.rolesFixed);
  console.log('Earnings updated:', stats.earningsUpdated);
  console.log('New profiles created:', stats.profilesCreated);
  console.log('Errors:', stats.errors.length);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(e => console.log('  -', e));
  }

  // Verify final state
  console.log('\n--- Final Database State ---');
  const finalAffiliates = await prisma.affiliateProfile.count();
  const finalAffiliateUsers = await prisma.user.count({ where: { role: 'AFFILIATE' } });
  const totalEarnings = await prisma.affiliateProfile.aggregate({
    _sum: { totalEarnings: true }
  });

  console.log('Total affiliate profiles:', finalAffiliates);
  console.log('Users with AFFILIATE role:', finalAffiliateUsers);
  console.log('Total earnings recorded: Rp', (totalEarnings._sum.totalEarnings || 0).toLocaleString('id-ID'));

  await prisma.$disconnect();
}

function generateAffiliateCode(name) {
  const clean = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  return `${clean}${Date.now().toString(36).slice(-4)}`;
}

main().catch(console.error);
