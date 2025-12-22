const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeTransactionGaps() {
  console.log('🔍 DEEP DIVE ANALYSIS: MISSING TRANSACTION INVESTIGATION\n');
  
  try {
    // 1. Analyze transaction patterns to understand missing data
    console.log('📊 TRANSACTION PATTERN ANALYSIS:');
    
    const totalTx = await prisma.transaction.count();
    const successTx = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
    const failedTx = await prisma.transaction.count({ where: { status: 'FAILED' }});
    const pendingTx = await prisma.transaction.count({ where: { status: 'PENDING' }});
    
    console.log(`  Total Eksporyuk Transactions: ${totalTx.toLocaleString()}`);
    console.log(`  SUCCESS: ${successTx.toLocaleString()} (${((successTx/totalTx)*100).toFixed(1)}%)`);
    console.log(`  FAILED: ${failedTx.toLocaleString()} (${((failedTx/totalTx)*100).toFixed(1)}%)`);
    console.log(`  PENDING: ${pendingTx.toLocaleString()} (${((pendingTx/totalTx)*100).toFixed(1)}%)`);
    
    console.log('\n🎯 SEJOLI vs EKSPORYUK GAP ANALYSIS:');
    const sejoliSales = 12879;
    const eksporyukSuccess = successTx;
    const sejoliRevenue = 4158894962;
    const eksporyukRevenue = 3706031435;
    
    const salesGap = sejoliSales - eksporyukSuccess;
    const revenueGap = sejoliRevenue - eksporyukRevenue;
    
    console.log(`  Missing Transactions: ${salesGap.toLocaleString()}`);
    console.log(`  Missing Revenue: Rp. ${revenueGap.toLocaleString()}`);
    console.log(`  Average Missing Transaction Value: Rp. ${Math.round(revenueGap / salesGap).toLocaleString()}`);
    
    // 2. Analyze failed transactions - might be successful in Sejoli
    console.log('\n🔍 FAILED TRANSACTION ANALYSIS:');
    console.log(`  Total Failed Transactions: ${failedTx.toLocaleString()}`);
    
    if (failedTx > salesGap) {
      console.log(`  ⚠️  Failed transactions (${failedTx.toLocaleString()}) > Missing transactions (${salesGap.toLocaleString()})`);
      console.log(`  💡 HYPOTHESIS: Some FAILED transactions in Eksporyuk are SUCCESS in Sejoli`);
      
      // Check failed transaction revenue
      const failedRevenue = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'FAILED' }
      });
      
      console.log(`  Failed Transaction Total Value: Rp. ${(failedRevenue._sum.amount || 0).toLocaleString()}`);
      
      // If we convert failed to success, would it match?
      const potentialSuccess = successTx + failedTx;
      const potentialRevenue = eksporyukRevenue + (failedRevenue._sum.amount || 0);
      
      console.log('\n🧮 IF FAILED → SUCCESS CONVERSION:');
      console.log(`  New Success Count: ${potentialSuccess.toLocaleString()}`);
      console.log(`  New Revenue Total: Rp. ${potentialRevenue.toLocaleString()}`);
      console.log(`  Remaining Sales Gap: ${sejoliSales - potentialSuccess}`);
      console.log(`  Remaining Revenue Gap: Rp. ${(sejoliRevenue - potentialRevenue).toLocaleString()}`);
    }
    
    // 3. Monthly trend analysis
    console.log('\n📅 MONTHLY TRANSACTION TRENDS:');
    
    const monthlyStats = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as success_revenue,
        SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END) as failed_revenue
      FROM "Transaction"
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month DESC
    `;
    
    console.log('  Month     | Total | Success | Failed | Success Revenue | Failed Revenue');
    console.log('  ---------|-------|---------|--------|-----------------|--------------');
    monthlyStats.forEach(month => {
      const successRev = parseInt(month.success_revenue || 0);
      const failedRev = parseInt(month.failed_revenue || 0);
      console.log(`  ${month.month} |  ${month.total_transactions}   |   ${month.successful}    |   ${month.failed}   | Rp. ${successRev.toLocaleString().padStart(11)} | Rp. ${failedRev.toLocaleString().padStart(10)}`);
    });
    
    // 4. December specific deep dive
    console.log('\n🔍 DECEMBER 2025 DETAILED ANALYSIS:');
    
    const decemberStart = new Date('2025-12-01T00:00:00Z');
    const januaryStart = new Date('2026-01-01T00:00:00Z');
    
    const decemberStats = await prisma.$queryRaw`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM "Transaction"
      WHERE "createdAt" >= ${decemberStart} AND "createdAt" < ${januaryStart}
      GROUP BY status
      ORDER BY count DESC
    `;
    
    console.log('  December Status Breakdown:');
    decemberStats.forEach(stat => {
      console.log(`    ${stat.status}: ${stat.count} transactions, Rp. ${parseInt(stat.total_amount || 0).toLocaleString()} total, Rp. ${parseInt(stat.avg_amount || 0).toLocaleString()} avg`);
    });
    
    console.log('\n  📊 Sejoli December: 140 sales, Rp. 124,717,000');
    console.log('  📊 Eksporyuk December SUCCESS: 22 sales, Rp. 22,877,000');
    console.log('  📊 Gap: 118 missing sales, Rp. 101,840,000 missing revenue');
    
    // 5. Commission analysis
    console.log('\n💰 COMMISSION DISCREPANCY ANALYSIS:');
    
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true },
      _count: { id: true }
    });
    
    const sejoliCommission = 1256771000;
    const eksporyukCommission = totalCommission._sum.commissionAmount || 0;
    const commissionGap = sejoliCommission - eksporyukCommission;
    
    console.log(`  Sejoli Total Commission: Rp. ${sejoliCommission.toLocaleString()}`);
    console.log(`  Eksporyuk Commission Records: ${(totalCommission._count.id || 0).toLocaleString()}`);
    console.log(`  Eksporyuk Total Commission: Rp. ${eksporyukCommission.toLocaleString()}`);
    console.log(`  Commission Gap: Rp. ${commissionGap.toLocaleString()}`);
    console.log(`  Missing Commission %: ${((commissionGap/sejoliCommission)*100).toFixed(1)}%`);
    
    // 6. Transaction source analysis
    console.log('\n🔎 TRANSACTION SOURCE PATTERNS:');
    
    const withAffiliateCode = await prisma.transaction.count({
      where: { affiliateCode: { not: null }}
    });
    
    const withoutAffiliateCode = totalTx - withAffiliateCode;
    
    console.log(`  Transactions with Affiliate Code: ${withAffiliateCode.toLocaleString()}`);
    console.log(`  Transactions without Affiliate: ${withoutAffiliateCode.toLocaleString()}`);
    console.log(`  Affiliate Penetration: ${((withAffiliateCode/totalTx)*100).toFixed(1)}%`);
    
    // 7. Revenue per transaction analysis
    console.log('\n📈 REVENUE PER TRANSACTION ANALYSIS:');
    
    const avgRevenueEksporyuk = eksporyukRevenue / eksporyukSuccess;
    const avgRevenueSejoli = sejoliRevenue / sejoliSales;
    
    console.log(`  Eksporyuk Avg Revenue per Sale: Rp. ${Math.round(avgRevenueEksporyuk).toLocaleString()}`);
    console.log(`  Sejoli Avg Revenue per Sale: Rp. ${Math.round(avgRevenueSejoli).toLocaleString()}`);
    console.log(`  Difference: Rp. ${Math.round(avgRevenueSejoli - avgRevenueEksporyuk).toLocaleString()}`);
    
    if (avgRevenueSejoli > avgRevenueEksporyuk) {
      console.log('  💡 INSIGHT: Sejoli has higher-value transactions on average');
      console.log('     → Possible premium products not tracked in Eksporyuk');
    }
    
    // 8. Action plan based on analysis
    console.log('\n🎯 DATA-DRIVEN ACTION PLAN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('  📋 PHASE 1: Data Investigation & Recovery');
    console.log(`    1. Audit ${failedTx.toLocaleString()} FAILED transactions - check if SUCCESS in Sejoli`);
    console.log(`    2. Import missing ${salesGap.toLocaleString()} transactions from Sejoli API`);
    console.log(`    3. Reconcile ${(totalCommission._count.id || 0).toLocaleString()} commission records`);
    console.log(`    4. Fix December gap of 118 missing transactions`);
    
    console.log('\n  🔧 PHASE 2: System Integration');
    console.log('    1. Deploy working Orders API endpoints');
    console.log('    2. Setup real-time sync Sejoli → Eksporyuk');  
    console.log('    3. Implement status mapping validation');
    console.log('    4. Create commission auto-calculation');
    
    console.log('\n  📊 PHASE 3: Monitoring & Prevention');
    console.log('    1. Daily revenue reconciliation alerts');
    console.log('    2. Weekly transaction count verification');
    console.log('    3. Monthly commission audit process');
    console.log('    4. Real-time dashboard for sync status');
    
    console.log('\n💡 IMMEDIATE RECOMMENDATIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚨 CRITICAL: Review FAILED transactions first');
    console.log('  📥 URGENT: Import missing historical data');
    console.log('  🔄 HIGH: Setup automated sync processes');
    console.log('  📈 MEDIUM: Implement monitoring dashboards');
    
    console.log('\n✅ ANALYSIS COMPLETE');
    console.log(`🎯 SUMMARY: ${salesGap} missing transactions worth Rp. ${revenueGap.toLocaleString()} identified`);
    console.log(`💰 IMPACT: Rp. ${commissionGap.toLocaleString()} commission discrepancy requiring immediate attention`);
    
  } catch (error) {
    console.error('❌ Error in analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTransactionGaps();