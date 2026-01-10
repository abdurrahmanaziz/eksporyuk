/**
 * FIX AFFILIATE DATA - PROPER CALCULATION
 * ========================================
 * 1. Calculate real commissions from completed orders
 * 2. Only keep affiliates who earned commission
 * 3. Fix roles - no double MEMBER + AFFILIATE
 * 4. Update earnings accurately
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

// Commission rate from WordPress Sejoli
const COMMISSION_RATE = 0.30; // 30%

async function main() {
  console.log('========================================');
  console.log('FIXING AFFILIATE DATA - PROPER CALCULATION');
  console.log('========================================\n');

  // Load WordPress data
  console.log('Loading WordPress data...');
  const wpData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  const completedOrders = wpData.orders.filter(o => o.status === 'completed');
  console.log('Completed orders:', completedOrders.length);

  // Step 1: Calculate REAL affiliate stats from completed orders
  console.log('\n--- Step 1: Calculate Real Affiliate Stats ---');
  
  const realAffiliateStats = {};
  
  completedOrders.forEach(order => {
    const affId = order.affiliate_id;
    if (affId && affId > 0) {
      if (!realAffiliateStats[affId]) {
        realAffiliateStats[affId] = {
          wpUserId: affId,
          totalSales: 0,
          totalCommission: 0,
          orderCount: 0,
          orders: []
        };
      }
      
      const grandTotal = parseFloat(order.grand_total || 0);
      const commission = grandTotal * COMMISSION_RATE;
      
      realAffiliateStats[affId].totalSales += grandTotal;
      realAffiliateStats[affId].totalCommission += commission;
      realAffiliateStats[affId].orderCount++;
      realAffiliateStats[affId].orders.push({
        orderId: order.id,
        amount: grandTotal,
        commission: commission,
        date: order.created_at
      });
    }
  });

  const affiliatesWithCommission = Object.values(realAffiliateStats).filter(a => a.totalCommission > 0);
  console.log('Affiliates with actual commission:', affiliatesWithCommission.length);
  
  const totalCommissions = affiliatesWithCommission.reduce((sum, a) => sum + a.totalCommission, 0);
  console.log('Total commissions to distribute: Rp', totalCommissions.toLocaleString('id-ID'));

  // Map WP user IDs to emails for lookup
  const wpUserMap = {};
  wpData.users.forEach(u => {
    wpUserMap[u.id] = {
      email: u.user_email,
      name: u.display_name
    };
  });

  // Enrich affiliate stats with user info
  affiliatesWithCommission.forEach(aff => {
    const wpUser = wpUserMap[aff.wpUserId];
    if (wpUser) {
      aff.email = wpUser.email;
      aff.name = wpUser.name;
    }
  });

  // Step 2: Get current DB state
  console.log('\n--- Step 2: Current Database State ---');
  
  const currentAffiliates = await prisma.affiliateProfile.count();
  const currentUsers = await prisma.user.count();
  
  console.log('Current affiliate profiles:', currentAffiliates);
  console.log('Current users:', currentUsers);

  // Step 3: Show what will be fixed
  console.log('\n--- Step 3: Preview Changes ---');
  
  // Find affiliates to KEEP (have commission)
  const affiliatesToKeep = [];
  const affiliatesToRemove = [];
  
  for (const aff of affiliatesWithCommission) {
    if (aff.email) {
      const dbUser = await prisma.user.findFirst({
        where: { email: aff.email },
        include: { affiliateProfile: true }
      });
      
      if (dbUser) {
        affiliatesToKeep.push({
          ...aff,
          dbUserId: dbUser.id,
          hasProfile: !!dbUser.affiliateProfile,
          currentEarnings: dbUser.affiliateProfile?.totalEarnings || 0,
          currentRole: dbUser.role
        });
      }
    }
  }

  console.log('\nAffiliates to KEEP (have commission):', affiliatesToKeep.length);
  
  // Show top 20
  const sorted = affiliatesToKeep.sort((a, b) => b.totalCommission - a.totalCommission);
  console.log('\nTop 20 Real Affiliates:');
  sorted.slice(0, 20).forEach((a, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${(a.name || 'Unknown').padEnd(30)} | Sales: Rp ${a.totalSales.toLocaleString('id-ID').padStart(15)} | Commission: Rp ${Math.round(a.totalCommission).toLocaleString('id-ID').padStart(12)} | Orders: ${a.orderCount}`);
  });

  // Find profiles to REMOVE (no commission in WP data)
  const allDbAffiliates = await prisma.affiliateProfile.findMany({
    include: { user: { select: { email: true, name: true, role: true } } }
  });

  const emailsWithCommission = new Set(affiliatesToKeep.map(a => a.email?.toLowerCase()));
  
  for (const dbAff of allDbAffiliates) {
    const email = dbAff.user?.email?.toLowerCase();
    if (!emailsWithCommission.has(email)) {
      affiliatesToRemove.push({
        id: dbAff.id,
        email: dbAff.user?.email,
        name: dbAff.user?.name,
        currentEarnings: dbAff.totalEarnings,
        role: dbAff.user?.role
      });
    }
  }

  console.log('\nAffiliate profiles to REMOVE (no commission):', affiliatesToRemove.length);
  
  // Show some examples
  if (affiliatesToRemove.length > 0) {
    console.log('\nSample of profiles to remove:');
    affiliatesToRemove.slice(0, 10).forEach(a => {
      console.log(`  - ${a.name} (${a.email}) - Current earnings: Rp ${a.currentEarnings.toLocaleString('id-ID')}`);
    });
  }

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY OF CHANGES');
  console.log('========================================');
  console.log('Affiliates with REAL commission:', affiliatesToKeep.length);
  console.log('Profiles to REMOVE (fake/no commission):', affiliatesToRemove.length);
  console.log('Total commission to record: Rp', Math.round(totalCommissions).toLocaleString('id-ID'));
  
  // Save data for next step
  const fixData = {
    affiliatesToKeep: affiliatesToKeep.map(a => ({
      email: a.email,
      name: a.name,
      dbUserId: a.dbUserId,
      totalSales: a.totalSales,
      totalCommission: Math.round(a.totalCommission),
      orderCount: a.orderCount,
      hasProfile: a.hasProfile
    })),
    affiliatesToRemove: affiliatesToRemove.map(a => ({
      id: a.id,
      email: a.email,
      name: a.name
    })),
    stats: {
      totalRealAffiliates: affiliatesToKeep.length,
      totalToRemove: affiliatesToRemove.length,
      totalCommission: Math.round(totalCommissions)
    }
  };

  fs.writeFileSync(
    path.join(__dirname, 'affiliate-fix-data.json'),
    JSON.stringify(fixData, null, 2)
  );
  console.log('\nSaved fix data to: scripts/migration/affiliate-fix-data.json');
  console.log('\nRun "node scripts/migration/apply-affiliate-fix.js" to apply changes');

  await prisma.$disconnect();
}

main().catch(console.error);
