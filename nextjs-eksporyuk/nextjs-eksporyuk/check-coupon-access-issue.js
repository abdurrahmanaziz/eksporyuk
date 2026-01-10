#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCouponAccessIssue() {
  try {
    console.log('\n' + '═'.repeat(85));
    console.log('🔴 AFFILIATE COUPON ACCESS ISSUE - DETAILED REPORT');
    console.log('═'.repeat(85) + '\n');

    // Get users with actual earnings
    const usersWithEarnings = await prisma.wallet.findMany({
      where: {
        totalEarnings: { gt: 0 }
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      take: 20
    });

    // Get all affiliate profiles
    const allProfiles = await prisma.affiliateProfile.findMany({
      select: { userId: true, isActive: true }
    });

    const activeAffiliateMap = new Map();
    allProfiles.forEach(p => {
      activeAffiliateMap.set(p.userId, p.isActive);
    });

    console.log(`📊 ANALYSIS RESULTS:\n`);
    console.log(`Total users with earnings found: ${usersWithEarnings.length}\n`);

    let problemCount = 0;
    console.log(`${'─'.repeat(85)}\n`);
    console.log(`USER COUPON ACCESS CHECK:\n`);

    for (const w of usersWithEarnings) {
      const user = w.user;
      const hasActiveProfile = activeAffiliateMap.get(user.id);
      const isAdmin = ['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(user.role);
      const canCreateCouponNow = hasActiveProfile || isAdmin;

      if (!canCreateCouponNow) {
        problemCount++;
        console.log(`❌ PROBLEM #${problemCount}: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Total Earnings: Rp ${Number(w.totalEarnings).toLocaleString('id-ID')}`);
        console.log(`   Balance: Rp ${Number(w.balance).toLocaleString('id-ID')}`);
        console.log(`   Has Active Affiliate Profile: NO`);
        console.log(`   Is Admin/Founder/Co-Founder: NO`);
        console.log(`   Can Create Coupons (CURRENT LOGIC): ❌ NO`);
        console.log(`   Should Be Able To (PROPOSED): ✅ YES (has earned commissions)\n`);
      }
    }

    console.log(`${'─'.repeat(85)}\n`);
    console.log(`📋 SUMMARY:\n`);
    console.log(`Total users analyzed: ${usersWithEarnings.length}`);
    console.log(`Users with access problems: ${problemCount}`);
    console.log(`Success rate: ${((usersWithEarnings.length - problemCount) / usersWithEarnings.length * 100).toFixed(1)}%\n`);

    if (problemCount > 0) {
      console.log(`${'═'.repeat(85)}\n`);
      console.log(`⚠️  ISSUE IDENTIFIED:\n`);
      console.log(`Problem: Users who have earned affiliate commissions cannot create coupons`);
      console.log(`         because they don't have an active affiliate profile.\n`);
      console.log(`Reason: API checks for:`)
      console.log(`        ✓ Active affiliate profile, OR`);
      console.log(`        ✓ Admin/Founder/Co-Founder role\n`);
      console.log(`Missing Check:`);
      console.log(`        ✗ Whether user has earned affiliate commissions\n`);
      console.log(`Logic that should be there:`);
      console.log(`
        const canCreateCoupon = 
          hasActiveProfile || 
          isAdmin || 
          userHasEarnedCommissions;  // ← THIS IS MISSING\n`);
      console.log(`Where 'userHasEarnedCommissions' checks:\n`);
      console.log(`        wallet.balance > 0  OR  wallet.totalEarnings > 0\n`);
    } else {
      console.log(`✅ No access issues found!\n`);
    }

    console.log(`${'═'.repeat(85)}\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCouponAccessIssue();
