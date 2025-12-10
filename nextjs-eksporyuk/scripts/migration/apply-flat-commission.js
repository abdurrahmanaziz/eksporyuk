/**
 * APPLY FLAT COMMISSION TO DATABASE
 * ==================================
 * Updates affiliate earnings with correct flat commission rates
 * to match WordPress Sejoli data (Rp 1.229.746.000 total)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, 'flat-commission-final.json');

async function main() {
  console.log('========================================');
  console.log('APPLYING FLAT COMMISSION RATES');
  console.log('========================================\n');

  // Load calculated data
  if (!fs.existsSync(DATA_FILE)) {
    console.error('ERROR: flat-commission-final.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  console.log('Loaded commission data:');
  console.log('- Affiliates to update:', data.affiliates.length);
  console.log('- Target commission: Rp', data.stats.targetCommission.toLocaleString('id-ID'));
  console.log('- Calculated commission: Rp', data.stats.totalCommission.toLocaleString('id-ID'));

  const stats = {
    updated: 0,
    created: 0,
    errors: [],
    skipped: 0
  };

  console.log('\n--- Updating affiliate earnings ---\n');

  for (const aff of data.affiliates) {
    try {
      // Find user by email
      const user = await prisma.user.findFirst({
        where: { email: aff.email },
        include: { affiliateProfile: true, wallet: true }
      });

      if (!user) {
        stats.skipped++;
        continue;
      }

      // Update or create affiliate profile
      if (user.affiliateProfile) {
        await prisma.affiliateProfile.update({
          where: { id: user.affiliateProfile.id },
          data: {
            totalEarnings: aff.totalCommission,
            totalConversions: aff.orderCount,
            isActive: true
          }
        });
        stats.updated++;
      } else {
        // Create new profile
        const code = generateAffiliateCode(user.name || user.email);
        await prisma.affiliateProfile.create({
          data: {
            userId: user.id,
            affiliateCode: code,
            shortLink: code,
            totalEarnings: aff.totalCommission,
            totalConversions: aff.orderCount,
            isActive: true
          }
        });
        stats.created++;
      }

      // Update wallet
      await prisma.wallet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          balance: aff.totalCommission,
          balancePending: 0
        },
        update: {
          balance: aff.totalCommission
        }
      });

      // Ensure user has AFFILIATE role
      if (user.role !== 'AFFILIATE') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'AFFILIATE' }
        });
      }

      console.log(`✓ ${aff.name}: Rp ${aff.totalCommission.toLocaleString('id-ID')}`);

    } catch (err) {
      stats.errors.push(`${aff.email}: ${err.message}`);
    }
  }

  // Final Summary
  console.log('\n========================================');
  console.log('UPDATE COMPLETE');
  console.log('========================================');
  console.log('Updated:', stats.updated);
  console.log('Created:', stats.created);
  console.log('Skipped:', stats.skipped);
  console.log('Errors:', stats.errors.length);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.slice(0, 10).forEach(e => console.log('  -', e));
  }

  // Verify final state
  console.log('\n--- Final Database State ---');
  const totalEarnings = await prisma.affiliateProfile.aggregate({
    _sum: { totalEarnings: true }
  });
  const affiliateCount = await prisma.affiliateProfile.count();

  console.log('Total Affiliate Profiles:', affiliateCount);
  console.log('Total Earnings: Rp', Number(totalEarnings._sum.totalEarnings || 0).toLocaleString('id-ID'));
  console.log('Target: Rp', data.stats.targetCommission.toLocaleString('id-ID'));

  await prisma.$disconnect();
}

function generateAffiliateCode(name) {
  const clean = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  return `${clean}${Date.now().toString(36).slice(-4)}`;
}

main().catch(console.error);
