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
    
    // 3. Count by each status
    const pendingTransactions = await prisma.transaction.count({
      where: { status: 'PENDING' }
    });
    console.log(`  Pending Transactions: ${pendingTransactions.toLocaleString()}`);
    
    const failedTransactions = await prisma.transaction.count({
      where: { status: 'FAILED' }
    });
    console.log(`  Failed Transactions: ${failedTransactions.toLocaleString()}`);
    
    const cancelledTransactions = await prisma.transaction.count({
      where: { status: 'CANCELLED' }
    });
    console.log(`  Cancelled Transactions: ${cancelledTransactions.toLocaleString()}`);
    
    // 4. Get membership vs product transactions
    const membershipTransactions = await prisma.transaction.count({
      where: {
        membershipId: {
          not: null
        }
      }
    });
    console.log(`  Membership Transactions: ${membershipTransactions.toLocaleString()}`);
    
    const productTransactions = await prisma.transaction.count({
      where: {
        productId: {
          not: null
        }
      }
    });
    console.log(`  Product Transactions: ${productTransactions.toLocaleString()}`);
    
    console.log('\n💰 REVENUE ANALYSIS:');
    
    // 5. Get total revenue
    const totalRevenue = await prisma.transaction.aggregate({
      _sum: {
        finalAmount: true
      },
      where: {
        status: 'SUCCESS'
      }
    });
    const revenueAmount = totalRevenue._sum.finalAmount || 0;
    console.log(`  Total Revenue: Rp. ${revenueAmount.toLocaleString()}`);
    
    // 6. Get total commission
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: {
        commissionAmount: true
      }
    });
    const commissionAmount = totalCommission._sum.commissionAmount || 0;
    console.log(`  Total Commission: Rp. ${commissionAmount.toLocaleString()}`);
    
    console.log('\n📅 DATE RANGE ANALYSIS:');
    
    // 7. Get date range
    const firstTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });
    
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    console.log(`  First Transaction: ${firstTransaction?.createdAt || 'None'}`);
    console.log(`  Last Transaction: ${lastTransaction?.createdAt || 'None'}`);
    
    console.log('\n🔍 DECEMBER 2025 DATA (from screenshot):');
    
    // 8. December 2025 data
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
        finalAmount: true
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
    console.log(`  December 2025 Revenue: Rp. ${(decemberRevenue._sum.finalAmount || 0).toLocaleString()}`);
    
    // 9. Get ALL transactions in December (including non-success)
    const decemberAll = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: decemberStart,
          lt: januaryStart
        }
      }
    });
    console.log(`  December 2025 All Status: ${decemberAll.toLocaleString()}`);
    
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
    console.log(`    December Revenue: Rp. ${(decemberRevenue._sum.finalAmount || 0).toLocaleString()}`);
    
    console.log('\n🚨 MAJOR DISCREPANCY FOUND:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const salesGap = 12879 - successfulTransactions;
    const revenueGap = 4158894962 - revenueAmount;
    const commissionGap = 1256771000 - commissionAmount;
    
    console.log(`  ❗ Sales Gap: ${salesGap.toLocaleString()} transactions`);
    console.log(`     Sejoli has ${Math.abs(salesGap).toLocaleString()} ${salesGap > 0 ? 'MORE' : 'LESS'} sales than Eksporyuk`);
    
    console.log(`  ❗ Revenue Gap: Rp. ${Math.abs(revenueGap).toLocaleString()}`);
    console.log(`     Sejoli has Rp. ${Math.abs(revenueGap).toLocaleString()} ${revenueGap > 0 ? 'MORE' : 'LESS'} revenue than Eksporyuk`);
    
    console.log(`  ❗ Commission Gap: Rp. ${Math.abs(commissionGap).toLocaleString()}`);
    console.log(`     Sejoli shows Rp. ${Math.abs(commissionGap).toLocaleString()} ${commissionGap > 0 ? 'MORE' : 'LESS'} commission than Eksporyuk`);
    
    console.log('\n🔎 POSSIBLE CAUSES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  1. Missing Transaction Import from Sejoli to Eksporyuk');
    console.log('  2. Different Transaction Status Definitions');
    console.log('  3. Sejoli counting transactions that Eksporyuk doesnt track');
    console.log('  4. Data sync issues between systems');
    console.log('  5. Different date range calculations');
    
    console.log('\n📋 RECOMMENDED ACTIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ 1. Sync missing transactions from Sejoli API');
    console.log('  ✅ 2. Verify transaction status mapping');
    console.log('  ✅ 3. Check if Orders API fix helps sync missing data');
    console.log('  ✅ 4. Audit transaction import process');
    console.log('  ✅ 5. Compare date ranges between systems');
    
    // 10. Check recent transactions to see if sync is working
    console.log('\n🔄 RECENT SYNC STATUS:');
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        finalAmount: true,
        createdAt: true
      }
    });
    
    console.log('  Last 5 transactions:');
    recentTransactions.forEach((tx, i) => {
      console.log(`    ${i+1}. ${tx.invoiceNumber} - ${tx.status} - Rp. ${tx.finalAmount?.toLocaleString()} - ${tx.createdAt.toISOString().substring(0, 19)}`);
    });
    
    console.log('\n✅ INVESTIGATION COMPLETE');
    console.log(`\n🎯 MAIN FINDING: Eksporyuk database is missing ~${salesGap.toLocaleString()} transactions compared to Sejoli`);
    console.log(`💰 Financial Impact: ~Rp. ${Math.abs(revenueGap).toLocaleString()} revenue gap`);
    
  } catch (error) {
    console.error('❌ Error investigating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateDataDiscrepancy();