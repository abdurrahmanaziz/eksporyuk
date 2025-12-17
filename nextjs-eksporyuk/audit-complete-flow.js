const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditCompleteFlow() {
  console.log('🔍 COMPREHENSIVE SYSTEM AUDIT - Eksporyuk Platform\n');
  console.log('='.repeat(80));
  
  const report = {
    issues: [],
    warnings: [],
    success: [],
  };

  // ==================== 1. MEMBERSHIP SYSTEM ====================
  console.log('\n📋 1. MEMBERSHIP SYSTEM AUDIT\n');
  
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { userMemberships: true }
      }
    }
  });
  
  console.log(`   Total Active Memberships: ${memberships.length}`);
  memberships.forEach(m => {
    console.log(`   - ${m.name}: Rp ${Number(m.price).toLocaleString()} (${m._count.userMemberships} users)`);
    console.log(`     Commission Rate: ${m.affiliateCommissionRate}% (${m.affiliateCommissionType})`);
    
    // Check commission config
    if (!m.affiliateCommissionRate || m.affiliateCommissionRate < 0) {
      report.issues.push(`Membership "${m.name}" has invalid commission rate: ${m.affiliateCommissionRate}`);
    } else {
      report.success.push(`Membership "${m.name}" commission configured correctly`);
    }
  });

  // ==================== 2. PAYMENT GATEWAY (XENDIT) ====================
  console.log('\n\n💳 2. XENDIT PAYMENT GATEWAY CHECK\n');
  
  // Check recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, name: true } },
    }
  });
  
  console.log(`   Recent Transactions (last 10):\n`);
  recentTransactions.forEach((tx, idx) => {
    console.log(`   ${idx + 1}. ${tx.createdAt.toISOString().split('T')[0]} - ${tx.user.email}`);
    console.log(`      Status: ${tx.status} | Amount: Rp ${Number(tx.amount).toLocaleString()}`);
    console.log(`      Type: ${tx.type} | Payment: ${tx.paymentMethod || 'N/A'}`);
    
    // Check for stuck transactions
    if (tx.status === 'PENDING' && tx.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      report.warnings.push(`Transaction ${tx.id} stuck in PENDING for >24h (${tx.user.email})`);
    }
  });
  
  // Transaction status breakdown
  const txStats = await prisma.transaction.groupBy({
    by: ['status'],
    _count: true,
  });
  
  console.log(`\n   Transaction Status Breakdown:`);
  txStats.forEach(stat => {
    console.log(`   - ${stat.status}: ${stat._count}`);
  });

  // ==================== 3. COMMISSION FLOW ====================
  console.log('\n\n💰 3. COMMISSION DISTRIBUTION FLOW\n');
  
  // Get sample successful transaction with affiliate
  const successTx = await prisma.transaction.findFirst({
    where: {
      status: 'SUCCESS',
      affiliateId: { not: null },
    },
    include: {
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (successTx) {
    console.log(`   Sample Transaction: ${successTx.id}`);
    console.log(`   Customer: ${successTx.user.email}`);
    console.log(`   Amount: Rp ${Number(successTx.amount).toLocaleString()}`);
    console.log(`   Affiliate ID: ${successTx.affiliateId || 'N/A'}`);
    console.log(`   Affiliate Share: Rp ${Number(successTx.affiliateShare || 0).toLocaleString()}`);
    console.log(`   Company Fee: Rp ${Number(successTx.companyFee || 0).toLocaleString()}`);
    console.log(`   Founder Share: Rp ${Number(successTx.founderShare || 0).toLocaleString()}`);
    console.log(`   Co-Founder Share: Rp ${Number(successTx.coFounderShare || 0).toLocaleString()}`);
    
    // Verify commission adds up
    const totalShares = Number(successTx.affiliateShare || 0) + 
                       Number(successTx.companyFee || 0) + 
                       Number(successTx.founderShare || 0) + 
                       Number(successTx.coFounderShare || 0);
    
    const totalAmount = Number(successTx.amount);
    const difference = Math.abs(totalAmount - totalShares);
    
    if (difference < 10) {
      report.success.push('Commission distribution adds up correctly');
    } else {
      report.issues.push(`Commission mismatch: Total ${totalAmount} vs Shares ${totalShares} (diff: ${difference})`);
    }
  } else {
    report.warnings.push('No successful transactions with affiliate found for audit');
  }
  
  // Check affiliate conversions
  const conversionStats = await prisma.affiliateConversion.groupBy({
    by: ['paidOut'],
    _count: true,
    _sum: { commissionAmount: true },
  });
  
  console.log(`\n   Affiliate Conversion Stats:`);
  conversionStats.forEach(stat => {
    console.log(`   - ${stat.paidOut ? 'Paid Out' : 'Pending'}: ${stat._count} conversions, Rp ${Number(stat._sum.commissionAmount || 0).toLocaleString()}`);
  });

  // ==================== 4. WALLET & BALANCE ====================
  console.log('\n\n💼 4. WALLET & BALANCE SYSTEM\n');
  
  const wallets = await prisma.wallet.findMany({
    where: {
      OR: [
        { balance: { gt: 0 } },
        { totalEarnings: { gt: 0 } },
        { balancePending: { gt: 0 } },
      ]
    },
    include: {
      user: { select: { email: true, role: true } }
    }
  });
  
  console.log(`   Wallets with Balance: ${wallets.length}\n`);
  
  let totalBalance = 0;
  let totalEarnings = 0;
  let totalPending = 0;
  
  wallets.forEach(w => {
    const balance = Number(w.balance || 0);
    const earnings = Number(w.totalEarnings || 0);
    const pending = Number(w.balancePending || 0);
    
    totalBalance += balance;
    totalEarnings += earnings;
    totalPending += pending;
    
    console.log(`   ${w.user.email} (${w.user.role})`);
    console.log(`     Balance: Rp ${balance.toLocaleString()}`);
    console.log(`     Total Earnings: Rp ${earnings.toLocaleString()}`);
    console.log(`     Pending: Rp ${pending.toLocaleString()}`);
    
    // Verify balance <= totalEarnings
    if (balance > earnings + 100) { // Allow small rounding
      report.issues.push(`${w.user.email}: Balance (${balance}) > TotalEarnings (${earnings})`);
    }
  });
  
  console.log(`\n   TOTALS:`);
  console.log(`   - Total Balance: Rp ${totalBalance.toLocaleString()}`);
  console.log(`   - Total Earnings: Rp ${totalEarnings.toLocaleString()}`);
  console.log(`   - Total Pending: Rp ${totalPending.toLocaleString()}`);

  // ==================== 5. WITHDRAWAL (PAYOUT) SYSTEM ====================
  console.log('\n\n💸 5. WITHDRAWAL (PAYOUT) SYSTEM\n');
  
  const payouts = await prisma.payout.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      wallet: {
        include: {
          user: { select: { email: true } }
        }
      }
    }
  });
  
  console.log(`   Recent Payouts (last 10):\n`);
  if (payouts.length === 0) {
    console.log(`   No payouts found in system`);
    report.warnings.push('No withdrawal history found');
  } else {
    payouts.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.wallet.user.email}`);
      console.log(`      Amount: Rp ${Number(p.amount).toLocaleString()}`);
      console.log(`      Status: ${p.status}`);
      console.log(`      Date: ${p.createdAt.toISOString().split('T')[0]}`);
      
      if (p.status === 'PENDING' && p.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        report.warnings.push(`Payout ${p.id} pending for >7 days (${p.wallet.user.email})`);
      }
    });
  }
  
  const payoutStats = await prisma.payout.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true },
  });
  
  console.log(`\n   Payout Status Breakdown:`);
  payoutStats.forEach(stat => {
    console.log(`   - ${stat.status}: ${stat._count} requests, Rp ${Number(stat._sum.amount || 0).toLocaleString()}`);
  });

  // ==================== 6. USER ACCESS & MEMBERSHIP ====================
  console.log('\n\n👥 6. USER ACCESS & MEMBERSHIP FEATURES\n');
  
  const userMemberships = await prisma.userMembership.findMany({
    where: { isActive: true },
    include: {
      user: { select: { email: true, role: true } },
      membership: { select: { name: true, features: true } }
    },
    take: 10,
  });
  
  console.log(`   Active User Memberships: ${userMemberships.length}\n`);
  
  userMemberships.forEach((um, idx) => {
    console.log(`   ${idx + 1}. ${um.user.email} (${um.user.role})`);
    console.log(`      Membership: ${um.membership.name}`);
    console.log(`      Status: ${um.status}`);
    console.log(`      Start: ${um.startDate ? um.startDate.toISOString().split('T')[0] : 'N/A'}`);
    console.log(`      End: ${um.endDate ? um.endDate.toISOString().split('T')[0] : 'Lifetime'}`);
    
    // Check if expired
    if (um.endDate && um.endDate < new Date() && um.isActive) {
      report.issues.push(`${um.user.email}: Membership expired but still marked active`);
    }
    
    // Check features
    if (um.membership.features && typeof um.membership.features === 'object') {
      const features = um.membership.features;
      console.log(`      Features: ${Object.keys(features).length} configured`);
    }
  });

  // ==================== 7. DATA INTEGRITY CHECKS ====================
  console.log('\n\n🔍 7. DATA INTEGRITY CHECKS\n');
  
  // Check for orphaned records
  const orphanedConversions = await prisma.affiliateConversion.count({
    where: {
      transaction: null,
    }
  });
  
  if (orphanedConversions > 0) {
    report.warnings.push(`${orphanedConversions} affiliate conversions without transaction link`);
  }
  
  // Check for duplicate transactions
  const duplicateTxCheck = await prisma.$queryRaw`
    SELECT reference, COUNT(*) as count 
    FROM "Transaction" 
    WHERE reference IS NOT NULL 
    GROUP BY reference 
    HAVING COUNT(*) > 1
  `;
  
  if (duplicateTxCheck && duplicateTxCheck.length > 0) {
    report.issues.push(`${duplicateTxCheck.length} duplicate transaction references found`);
  } else {
    report.success.push('No duplicate transactions detected');
  }
  
  // Check wallet consistency for all affiliates
  const affiliates = await prisma.user.findMany({
    where: { role: 'AFFILIATE' },
    include: {
      wallet: true,
      affiliateProfile: true,
    }
  });
  
  let consistentAffiliates = 0;
  for (const aff of affiliates) {
    if (!aff.affiliateProfile) continue;
    
    const actualEarnings = await prisma.affiliateConversion.aggregate({
      where: { affiliateId: aff.affiliateProfile.id },
      _sum: { commissionAmount: true },
    });
    
    const actual = Number(actualEarnings._sum.commissionAmount || 0);
    const wallet = Number(aff.wallet?.totalEarnings || 0);
    
    if (Math.abs(actual - wallet) < 10) {
      consistentAffiliates++;
    } else {
      report.warnings.push(`${aff.email}: Wallet (${wallet}) vs Actual (${actual}) mismatch`);
    }
  }
  
  console.log(`   Affiliate Wallet Consistency: ${consistentAffiliates}/${affiliates.length} OK`);

  // ==================== 8. SYSTEM CONFIGURATION ====================
  console.log('\n\n⚙️  8. SYSTEM CONFIGURATION\n');
  
  // Check critical settings
  const adminUsers = await prisma.user.count({ where: { role: 'ADMIN' } });
  const founderUsers = await prisma.user.count({ where: { role: 'FOUNDER' } });
  const cofounderUsers = await prisma.user.count({ where: { role: 'CO_FOUNDER' } });
  
  console.log(`   Role Distribution:`);
  console.log(`   - Admin: ${adminUsers}`);
  console.log(`   - Founder: ${founderUsers}`);
  console.log(`   - Co-Founder: ${cofounderUsers}`);
  
  if (adminUsers === 0) report.issues.push('No ADMIN users found in system!');
  if (founderUsers === 0) report.warnings.push('No FOUNDER users found for revenue split');
  if (cofounderUsers === 0) report.warnings.push('No CO_FOUNDER users found for revenue split');

  // ==================== FINAL REPORT ====================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 AUDIT SUMMARY REPORT\n');
  
  console.log(`✅ SUCCESS (${report.success.length}):`);
  if (report.success.length === 0) {
    console.log(`   No specific successes logged`);
  } else {
    report.success.forEach(s => console.log(`   ✓ ${s}`));
  }
  
  console.log(`\n⚠️  WARNINGS (${report.warnings.length}):`);
  if (report.warnings.length === 0) {
    console.log(`   No warnings`);
  } else {
    report.warnings.forEach(w => console.log(`   ! ${w}`));
  }
  
  console.log(`\n❌ CRITICAL ISSUES (${report.issues.length}):`);
  if (report.issues.length === 0) {
    console.log(`   No critical issues found`);
  } else {
    report.issues.forEach(i => console.log(`   ✗ ${i}`));
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (report.issues.length === 0 && report.warnings.length <= 2) {
    console.log('\n🎉 SYSTEM STATUS: HEALTHY');
    console.log('All critical flows are working correctly.');
  } else if (report.issues.length === 0) {
    console.log('\n✅ SYSTEM STATUS: GOOD (Minor Warnings)');
    console.log('No critical issues, but some improvements recommended.');
  } else {
    console.log('\n⚠️  SYSTEM STATUS: NEEDS ATTENTION');
    console.log('Critical issues detected that require fixing.');
  }
  
  console.log('\n' + '='.repeat(80));
  
  await prisma.$disconnect();
}

auditCompleteFlow().catch(console.error);
