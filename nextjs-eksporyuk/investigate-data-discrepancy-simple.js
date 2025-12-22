const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateDataDiscrepancy() {
  console.log('🔍 INVESTIGATING DATA DISCREPANCY BETWEEN SEJOLI & EKSPORYUK\n');
  
  try {
    console.log('📊 BASIC TRANSACTION COUNTS:');
    
    // 1. Get total transactions
    const totalTransactions = await prisma.transaction.count();
    console.log(`  Total All Transactions: ${totalTransactions.toLocaleString()}`);
    
    // 2. Get successful transactions
    const successfulTransactions = await prisma.transaction.count({
      where: {
        status: 'SUCCESS'
      }
    });
    console.log(`  Successful Transactions: ${successfulTransactions.toLocaleString()}`);
    
    // 3. Get pending transactions
    const pendingTransactions = await prisma.transaction.count({
      where: { status: 'PENDING' }
    });
    console.log(`  Pending Transactions: ${pendingTransactions.toLocaleString()}`);
    
    // 4. Get failed transactions
    const failedTransactions = await prisma.transaction.count({
      where: { status: 'FAILED' }
    });
    console.log(`  Failed Transactions: ${failedTransactions.toLocaleString()}`);
    
    console.log('\n💰 REVENUE ANALYSIS:');
    
    // 5. Get total revenue from successful transactions
    const totalRevenue = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'SUCCESS'
      }
    });
    const revenueAmount = totalRevenue._sum.amount || 0;
    console.log(`  Total Revenue: Rp. ${revenueAmount.toLocaleString()}`);
    
    // 6. Get total commission
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: {
        commissionAmount: true
      }
    });
    const commissionAmount = totalCommission._sum.commissionAmount || 0;
    console.log(`  Total Commission: Rp. ${commissionAmount.toLocaleString()}`);
    
    console.log('\n🔍 DECEMBER 2025 DATA (matching screenshot):');
    
    // 7. December 2025 data
    const decemberStart = new Date('2025-12-01T00:00:00Z');
    const januaryStart = new Date('2026-01-01T00:00:00Z');
    
    const decemberSuccessful = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: decemberStart,
          lt: januaryStart
        },
        status: 'SUCCESS'
      }
    });
    
    const decemberRevenue = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        createdAt: {
          gte: decemberStart,
          lt: januaryStart
        },
        status: 'SUCCESS'
      }
    });
    
    console.log(`  December 2025 Sales: ${decemberSuccessful.toLocaleString()}`);
    console.log(`  December 2025 Revenue: Rp. ${(decemberRevenue._sum.amount || 0).toLocaleString()}`);
    
    console.log('\n🆚 COMPARISON WITH SEJOLI DATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📊 SEJOLI Dashboard (from screenshot):');
    console.log('    Total Lead: 19,343');
    console.log('    Total Sales: 12,879');
    console.log('    Total Revenue: Rp. 4,158,894,962');
    console.log('    Total Commission: Rp. 1,256,771,000');
    console.log('    December Sales: 140');
    console.log('    December Revenue: Rp. 124,717,000');
    console.log('    December Commission: Rp. 38,675,000');
    
    console.log('\n  🏢 EKSPORYUK Database:');
    console.log(`    Total Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`    Total Sales (SUCCESS): ${successfulTransactions.toLocaleString()}`);
    console.log(`    Total Revenue: Rp. ${revenueAmount.toLocaleString()}`);
    console.log(`    Total Commission: Rp. ${commissionAmount.toLocaleString()}`);
    console.log(`    December Sales: ${decemberSuccessful.toLocaleString()}`);
    console.log(`    December Revenue: Rp. ${(decemberRevenue._sum.amount || 0).toLocaleString()}`);
    
    console.log('\n🚨 CRITICAL DATA DISCREPANCY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const salesGap = 12879 - successfulTransactions;
    const revenueGap = 4158894962 - revenueAmount;
    const commissionGap = 1256771000 - commissionAmount;
    
    console.log(`  ❗ Sales Gap: ${salesGap.toLocaleString()} transactions`);
    console.log(`     Sejoli shows ${Math.abs(salesGap).toLocaleString()} ${salesGap > 0 ? 'MORE' : 'LESS'} sales than Eksporyuk database`);
    
    console.log(`  ❗ Revenue Gap: Rp. ${Math.abs(revenueGap).toLocaleString()}`);
    console.log(`     Sejoli shows Rp. ${Math.abs(revenueGap).toLocaleString()} ${revenueGap > 0 ? 'MORE' : 'LESS'} revenue than Eksporyuk`);
    
    console.log(`  ❗ Commission Gap: Rp. ${Math.abs(commissionGap).toLocaleString()}`);
    console.log(`     Sejoli shows Rp. ${Math.abs(commissionGap).toLocaleString()} ${commissionGap > 0 ? 'MORE' : 'LESS'} commission than Eksporyuk`);
    
    // Calculate percentages
    console.log('\n📊 GAP PERCENTAGE:');
    const salesPercentage = ((salesGap / 12879) * 100).toFixed(1);
    const revenuePercentage = ((revenueGap / 4158894962) * 100).toFixed(1);
    const commissionPercentage = ((commissionGap / 1256771000) * 100).toFixed(1);
    
    console.log(`  Sales Missing: ${salesPercentage}% of total Sejoli data`);
    console.log(`  Revenue Missing: ${revenuePercentage}% of total Sejoli revenue`);
    console.log(`  Commission Missing: ${commissionPercentage}% of total Sejoli commission`);
    
    console.log('\n🔎 ROOT CAUSE ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎯 MAJOR FINDING: Eksporyuk database is missing significant transaction data');
    console.log(`  💀 MISSING: ~${Math.abs(salesGap).toLocaleString()} transactions worth Rp. ${Math.abs(revenueGap).toLocaleString()}`);
    console.log('  🔗 LIKELY CAUSES:');
    console.log('    1. Incomplete data sync from Sejoli to Eksporyuk');
    console.log('    2. Historical transactions not imported');
    console.log('    3. Different transaction counting methods');
    console.log('    4. Missing API imports over time');
    console.log('    5. System migration data loss');
    
    // Get recent transaction sample to see current pattern
    console.log('\n🔄 RECENT TRANSACTION SAMPLE:');
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        amount: true,
        createdAt: true,
        membershipId: true,
        productId: true
      }
    });
    
    console.log('  Last 5 transactions in Eksporyuk:');
    recentTransactions.forEach((tx, i) => {
      const type = tx.membershipId ? 'Membership' : tx.productId ? 'Product' : 'Other';
      console.log(`    ${i+1}. ${tx.invoiceNumber} | ${tx.status} | ${type} | Rp. ${tx.amount?.toLocaleString()} | ${tx.createdAt.toISOString().substring(0, 19)}`);
    });
    
    // Check date ranges
    console.log('\n📅 DATA DATE RANGES:');
    const firstTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, invoiceNumber: true }
    });
    
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, invoiceNumber: true }
    });
    
    console.log(`  First Transaction: ${firstTransaction?.createdAt?.toISOString().substring(0, 10)} (${firstTransaction?.invoiceNumber})`);
    console.log(`  Last Transaction: ${lastTransaction?.createdAt?.toISOString().substring(0, 10)} (${lastTransaction?.invoiceNumber})`);
    
    // Check membership vs product breakdown
    console.log('\n📦 TRANSACTION TYPE BREAKDOWN:');
    const membershipCount = await prisma.transaction.count({
      where: { 
        membershipId: { not: null },
        status: 'SUCCESS'
      }
    });
    
    const productCount = await prisma.transaction.count({
      where: { 
        productId: { not: null },
        status: 'SUCCESS'
      }
    });
    
    console.log(`  Membership Transactions: ${membershipCount.toLocaleString()}`);
    console.log(`  Product Transactions: ${productCount.toLocaleString()}`);
    console.log(`  Other/Unknown: ${(successfulTransactions - membershipCount - productCount).toLocaleString()}`);
    
    console.log('\n🚨 CRITICAL ISSUE SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ⚠️  EKSPORYUK DATABASE IS MISSING ${Math.abs(salesGap).toLocaleString()} TRANSACTIONS`);
    console.log(`  💰 MISSING REVENUE: Rp. ${Math.abs(revenueGap).toLocaleString()}`);
    console.log(`  🎯 IMPACT: ${salesPercentage}% of total business data not tracked in Eksporyuk`);
    console.log('\n  📋 IMMEDIATE ACTIONS NEEDED:');
    console.log('  ✅ 1. Import missing historical transactions from Sejoli');
    console.log('  ✅ 2. Set up proper ongoing sync from Sejoli to Eksporyuk');
    console.log('  ✅ 3. Verify commission calculations after import');
    console.log('  ✅ 4. Audit revenue distribution accuracy');
    console.log('  ✅ 5. Test Orders API endpoints with complete data');
    
    console.log('\n✅ INVESTIGATION COMPLETE');
    console.log(`🎯 STATUS: CRITICAL - Major data gap identified requiring immediate sync`);
    
  } catch (error) {
    console.error('❌ Error investigating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateDataDiscrepancy();