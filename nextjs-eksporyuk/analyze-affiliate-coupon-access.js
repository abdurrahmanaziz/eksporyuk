#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAffiliateCouponAccess() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 AFFILIATE COUPON ACCESS ANALYSIS - MULTI-ROLE CHECK');
    console.log('═'.repeat(80) + '\n');

    // Get all users with their roles and wallet info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
            balancePending: true,
            totalEarnings: true,
          }
        }
      },
      take: 20
    });

    console.log(`📊 Total users found: ${users.length}\n`);

    // Check affiliate profiles
    const affiliateProfiles = await prisma.affiliateProfile.findMany({
      select: {
        userId: true,
        isActive: true,
      }
    });

    const activeAffiliateIds = new Set(
      affiliateProfiles.filter(p => p.isActive).map(p => p.userId)
    );

    console.log(`📌 AFFILIATE PROFILE STATUS:\n`);
    console.log(`Total affiliate profiles: ${affiliateProfiles.length}`);
    console.log(`Active affiliates: ${activeAffiliateIds.size}\n`);

    // Analyze each user
    console.log(`${'─'.repeat(80)}\n`);
    console.log(`USER COUPON ACCESS ANALYSIS:\n`);

    for (const user of users) {
      const hasActiveProfile = activeAffiliateIds.has(user.id);
      const hasCommissions = user.wallet && (Number(user.wallet.balance) > 0 || Number(user.wallet.totalEarnings) > 0);
      const isAdmin = user.role === 'ADMIN' || user.role === 'FOUNDER' || user.role === 'CO_FOUNDER';
      
      // Current logic (from code)
      const canCreateCouponCurrentLogic = hasActiveProfile || isAdmin;
      
      // Proposed logic (if user has received commissions)
      const canCreateCouponProposedLogic = hasActiveProfile || isAdmin || hasCommissions;

      console.log(`👤 ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Commission: ${hasCommissions}`);
      if (hasCommissions) {
        console.log(`      └─ Balance: ${user.wallet?.balance || 0}, Total Earnings: ${user.wallet?.totalEarnings || 0}`);
      }
      console.log(`   Active Affiliate Profile: ${hasActiveProfile ? '✅ YES' : '❌ NO'}`);
      console.log(`   Is Admin/Founder/Co-Founder: ${isAdmin ? '✅ YES' : '❌ NO'}`);
      console.log(`\n   🔑 CAN CREATE COUPON?`);
      console.log(`      Current Logic: ${canCreateCouponCurrentLogic ? '✅ YES' : '❌ NO'}`);
      console.log(`      Proposed Logic: ${canCreateCouponProposedLogic ? '✅ YES' : '❌ NO'}`);
      if (canCreateCouponCurrentLogic !== canCreateCouponProposedLogic) {
        console.log(`      ⚠️  DIFFERENCE FOUND - Proposed allows more users!`);
      }
      console.log(`\n${'-'.repeat(80)}\n`);
    }

    // Summary
    console.log(`${'═'.repeat(80)}\n`);
    console.log(`📋 SUMMARY OF ISSUES:\n`);

    let issueCount = 0;

    for (const user of users) {
      const hasActiveProfile = activeAffiliateIds.has(user.id);
      const hasCommissions = user.wallet && (Number(user.wallet.balance) > 0 || Number(user.wallet.totalEarnings) > 0);
      const isAdmin = user.role === 'ADMIN' || user.role === 'FOUNDER' || user.role === 'CO_FOUNDER';

      // Current logic check
      const canCreateCouponCurrentLogic = hasActiveProfile || isAdmin;
      
      // If they have commissions but can't create coupons - that's an issue
      if (hasCommissions && !canCreateCouponCurrentLogic) {
        issueCount++;
        console.log(`❌ ISSUE #${issueCount}: ${user.name} (${user.role})`);
        console.log(`   Problem: Has earned commissions but CANNOT create coupons`);
        console.log(`   Reason: No active affiliate profile`);
        console.log(`   Earnings: Balance=${user.wallet?.balance}, Total=${user.wallet?.totalEarnings}`);
        console.log(`\n`);
      }
    }

    if (issueCount === 0) {
      console.log('✅ No issues found - all users with commissions can create coupons');
    } else {
      console.log(`\n⚠️  FOUND ${issueCount} ISSUES\n`);
      console.log(`🔧 RECOMMENDED FIX:\n`);
      console.log(`Modify /src/app/api/affiliate/coupons/route.ts to check:
      
   1. User has active affiliate profile, OR
   2. User is ADMIN/FOUNDER/CO_FOUNDER, OR
   3. User has received commissions (check Wallet.balance or totalEarnings > 0)
   
   This way, any user who has earned affiliate commission automatically
   gets permission to create coupons without needing explicit affiliate signup.\n`);
    }

    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAffiliateCouponAccess();
