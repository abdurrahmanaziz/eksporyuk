const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeRealDataGap() {
  console.log('🔍 REAL DATA GAP ANALYSIS: SEJOLI vs NEON\n');
  console.log('📊 SEJOLI DASHBOARD DATA:');
  console.log('  - Total Leads: 19,343');
  console.log('  - Total Sales: 12,879');
  console.log('  - Total Revenue: Rp. 4,158,894,962');
  console.log('  - December Sales: 140');
  console.log('  - December Revenue: Rp. 124,717,000\n');

  try {
    // 1. Current NEON database status
    console.log('📈 NEON DATABASE CURRENT STATUS:');
    
    const totalTransactions = await prisma.transaction.count();
    const successTransactions = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
    const totalRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' }
    });
    
    console.log(`  - Total Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`  - Success Transactions: ${successTransactions.toLocaleString()}`);
    console.log(`  - Total Revenue: Rp. ${(totalRevenue._sum.amount || 0).toLocaleString()}\n`);
    
    // 2. Calculate REAL gaps
    console.log('🚨 REAL DATA GAPS IDENTIFIED:');
    
    const salesGap = 12879 - successTransactions;
    const revenueGap = 4158894962 - (totalRevenue._sum.amount || 0);
    
    console.log(`  📊 MISSING SALES: ${salesGap.toLocaleString()} transactions`);
    console.log(`  💰 MISSING REVENUE: Rp. ${revenueGap.toLocaleString()}`);
    console.log(`  📈 Missing Percentage: ${((salesGap / 12879) * 100).toFixed(1)}% of total Sejoli sales\n`);
    
    // 3. December specific gap
    console.log('🗓️ DECEMBER 2025 SPECIFIC GAP:');
    
    const decemberStart = new Date('2025-12-01T00:00:00Z');
    const januaryStart = new Date('2026-01-01T00:00:00Z');
    
    const decemberNeon = await prisma.transaction.count({
      where: {
        createdAt: { gte: decemberStart, lt: januaryStart },
        status: 'SUCCESS'
      }
    });
    
    const decemberRevenueNeon = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: decemberStart, lt: januaryStart },
        status: 'SUCCESS'
      }
    });
    
    console.log(`  Sejoli December: 140 sales, Rp. 124,717,000`);
    console.log(`  NEON December: ${decemberNeon} sales, Rp. ${(decemberRevenueNeon._sum.amount || 0).toLocaleString()}`);
    console.log(`  December Gap: ${140 - decemberNeon} sales, Rp. ${(124717000 - (decemberRevenueNeon._sum.amount || 0)).toLocaleString()}\n`);
    
    // 4. What needs to be imported
    console.log('📥 IMPORT REQUIREMENTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`  🎯 TARGET: Import ${salesGap.toLocaleString()} missing transactions from Sejoli`);
    console.log(`  💰 VALUE: Rp. ${revenueGap.toLocaleString()} additional revenue to track`);
    console.log(`  📊 SCOPE: Historical data spanning multiple months`);
    console.log(`  🗓️ PRIORITY: December 2025 data (${140 - decemberNeon} transactions)\n`);
    
    // 5. Data quality after import projection
    console.log('📊 POST-IMPORT PROJECTION:');
    
    const projectedTotal = successTransactions + salesGap;
    const projectedRevenue = (totalRevenue._sum.amount || 0) + revenueGap;
    
    console.log(`  After Import:`);
    console.log(`    Total Sales: ${projectedTotal.toLocaleString()} (matches Sejoli ${12879})`);
    console.log(`    Total Revenue: Rp. ${projectedRevenue.toLocaleString()} (matches Sejoli)`);
    console.log(`    Data Completeness: 100%`);
    console.log(`    Commission Accuracy: Will need recalculation for new data\n`);
    
    // 6. Import strategy
    console.log('🔧 IMPORT STRATEGY REQUIRED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('  PHASE 1: Data Source Connection');
    console.log('    ✅ Orders API endpoints created (can access Sejoli data)');
    console.log('    ⏳ Need bulk import mechanism from Sejoli API');
    console.log('    ⏳ Data mapping: Sejoli format → NEON schema\n');
    
    console.log('  PHASE 2: Historical Data Import');
    console.log(`    📥 Import ${salesGap.toLocaleString()} missing transactions`);
    console.log('    💰 Create corresponding commission records');
    console.log('    👥 Update user wallets and balances');
    console.log('    🔍 Verify no duplicates during import\n');
    
    console.log('  PHASE 3: Data Validation');
    console.log('    📊 Verify final counts match Sejoli exactly');
    console.log('    💰 Validate revenue totals');
    console.log('    🧮 Recalculate commission distributions');
    console.log('    📈 Test dashboard consistency\n');
    
    // 7. Commission impact
    console.log('💰 COMMISSION IMPACT OF MISSING DATA:');
    
    // Estimate missing commissions (assuming 30% average rate)
    const estimatedMissingCommissions = revenueGap * 0.30;
    console.log(`  Estimated Missing Commissions: Rp. ${estimatedMissingCommissions.toLocaleString()}`);
    console.log(`  Impact: Significant under-reporting of affiliate earnings`);
    console.log(`  Action Required: Commission recalculation after import\n`);
    
    // 8. Business impact
    console.log('🎯 BUSINESS IMPACT OF DATA GAP:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('  📊 CURRENT STATE:');
    console.log(`    - NEON shows only ${((successTransactions/12879)*100).toFixed(1)}% of actual sales`);
    console.log('    - Dashboard reports incomplete business metrics');
    console.log('    - Commission payments may be inaccurate');
    console.log('    - Revenue tracking significantly understated\n');
    
    console.log('  🎯 AFTER DATA IMPORT:');
    console.log('    - Complete transaction visibility');
    console.log('    - Accurate commission calculations');
    console.log('    - Reliable business intelligence');
    console.log('    - Proper affiliate payouts\n');
    
    // 9. Immediate action plan
    console.log('🚀 IMMEDIATE ACTION PLAN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('  TODAY (HIGH PRIORITY):');
    console.log('    1. Deploy Orders API endpoints to access Sejoli data');
    console.log('    2. Create bulk import script for missing transactions');
    console.log('    3. Test import process with small batch first');
    console.log('    4. Verify data mapping accuracy\n');
    
    console.log('  THIS WEEK (CRITICAL):');
    console.log(`    1. Import all ${salesGap.toLocaleString()} missing transactions`);
    console.log('    2. Create corresponding commission records');
    console.log('    3. Update wallet balances for affected users');
    console.log('    4. Validate final data consistency\n');
    
    console.log('  NEXT STEPS:');
    console.log('    1. Set up ongoing sync to prevent future gaps');
    console.log('    2. Implement monitoring for data consistency');
    console.log('    3. Create automated reconciliation reports');
    console.log('    4. Fix payment webhook issues to prevent status problems\n');
    
    console.log('✅ ANALYSIS COMPLETE');
    console.log('🎯 PRIORITY: Data import is CRITICAL for business accuracy');
    console.log(`📊 SCOPE: ${salesGap.toLocaleString()} transactions worth Rp. ${revenueGap.toLocaleString()}`);
    console.log('⏱️ TIMELINE: Should be completed this week for data integrity\n');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRealDataGap();