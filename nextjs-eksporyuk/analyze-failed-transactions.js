const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeFailedTransactionPattern() {
  console.log('🔍 FAILED TRANSACTION PATTERN ANALYSIS\n');
  console.log('🎯 GOAL: Understand 2,469 FAILED vs Sejoli SUCCESS discrepancy\n');
  
  try {
    // 1. Failed transaction breakdown
    console.log('📊 FAILED TRANSACTION ANALYSIS:');
    const failedCount = await prisma.transaction.count({ where: { status: 'FAILED' }});
    const failedRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'FAILED' }
    });
    
    console.log(`  Total FAILED Transactions: ${failedCount.toLocaleString()}`);
    console.log(`  Total FAILED Revenue: Rp. ${(failedRevenue._sum.amount || 0).toLocaleString()}`);
    console.log(`  Average FAILED Amount: Rp. ${Math.round((failedRevenue._sum.amount || 0) / failedCount).toLocaleString()}`);
    
    // 2. Monthly failed transaction pattern
    console.log('\n📅 FAILED TRANSACTION TRENDS:');
    const monthlyFailed = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as failed_count,
        SUM(amount) as failed_revenue
      FROM "Transaction"
      WHERE status = 'FAILED'
        AND "createdAt" >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month DESC
    `;
    
    console.log('  Month    | Failed Count | Failed Revenue');
    console.log('  ---------|--------------|---------------');
    monthlyFailed.forEach(month => {
      console.log(`  ${month.month} |      ${Number(month.failed_count).toLocaleString().padStart(6)}   | Rp. ${parseInt(month.failed_revenue || 0).toLocaleString().padStart(12)}`);
    });
    
    // 3. Failed transaction user pattern
    console.log('\n👥 FAILED TRANSACTION USER ANALYSIS:');
    const failedUserPattern = await prisma.$queryRaw`
      SELECT 
        u.email,
        u.username,
        COUNT(t.id) as failed_count,
        SUM(t.amount) as failed_amount
      FROM "Transaction" t
      JOIN "User" u ON t."userId" = u.id
      WHERE t.status = 'FAILED'
      GROUP BY u.id, u.email, u.username
      HAVING COUNT(t.id) > 5
      ORDER BY COUNT(t.id) DESC
      LIMIT 10
    `;
    
    if (failedUserPattern.length > 0) {
      console.log('  Users with >5 failed transactions:');
      failedUserPattern.forEach(user => {
        console.log(`    ${user.email}: ${Number(user.failed_count)} failed, Rp. ${parseInt(user.failed_amount || 0).toLocaleString()}`);
      });
    } else {
      console.log('  ✅ No users with excessive failed transactions');
    }
    
    // 4. Payment method analysis for failed transactions
    console.log('\n💳 FAILED TRANSACTION PAYMENT METHODS:');
    const paymentMethodFailed = await prisma.$queryRaw`
      SELECT 
        "paymentMethod",
        "paymentProvider",
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM "Transaction"
      WHERE status = 'FAILED'
      GROUP BY "paymentMethod", "paymentProvider"
      ORDER BY count DESC
      LIMIT 10
    `;
    
    paymentMethodFailed.forEach(method => {
      console.log(`  ${method.paymentMethod || 'NULL'} (${method.paymentProvider || 'NULL'}): ${Number(method.count)} failures, Rp. ${parseInt(method.total_amount || 0).toLocaleString()}`);
    });
    
    // 5. Failed vs Success comparison
    console.log('\n⚖️  FAILED vs SUCCESS COMPARISON:');
    
    const successStats = await prisma.transaction.aggregate({
      _count: { id: true },
      _sum: { amount: true },
      _avg: { amount: true },
      where: { status: 'SUCCESS' }
    });
    
    console.log('  SUCCESS Transactions:');
    console.log(`    Count: ${successStats._count.id?.toLocaleString()}`);
    console.log(`    Revenue: Rp. ${(successStats._sum.amount || 0).toLocaleString()}`);
    console.log(`    Average: Rp. ${Math.round(successStats._avg.amount || 0).toLocaleString()}`);
    
    console.log('\n  FAILED Transactions:');
    console.log(`    Count: ${failedCount.toLocaleString()}`);
    console.log(`    Revenue: Rp. ${(failedRevenue._sum.amount || 0).toLocaleString()}`);
    console.log(`    Average: Rp. ${Math.round((failedRevenue._sum.amount || 0) / failedCount).toLocaleString()}`);
    
    // 6. Hypothesis testing
    console.log('\n🔬 HYPOTHESIS TESTING:');
    
    const totalPotential = successStats._count.id + failedCount;
    const totalPotentialRevenue = (successStats._sum.amount || 0) + (failedRevenue._sum.amount || 0);
    
    console.log(`  If ALL failed → success:`);
    console.log(`    Total Sales: ${totalPotential.toLocaleString()}`);
    console.log(`    Total Revenue: Rp. ${totalPotentialRevenue.toLocaleString()}`);
    
    // Compare with Sejoli data
    const sejoliSales = 12879;
    const sejoliRevenue = 4158894962;
    
    console.log('\n  Compared to Sejoli:');
    console.log(`    Sejoli Sales: ${sejoliSales.toLocaleString()}`);
    console.log(`    Our Potential: ${totalPotential.toLocaleString()}`);
    console.log(`    Gap: ${sejoliSales - totalPotential} transactions`);
    
    console.log(`\n    Sejoli Revenue: Rp. ${sejoliRevenue.toLocaleString()}`);
    console.log(`    Our Potential: Rp. ${totalPotentialRevenue.toLocaleString()}`);
    console.log(`    Gap: Rp. ${(sejoliRevenue - totalPotentialRevenue).toLocaleString()}`);
    
    // 7. Recent failed transactions sample
    console.log('\n🔍 RECENT FAILED TRANSACTION SAMPLE:');
    const recentFailed = await prisma.transaction.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        invoiceNumber: true,
        amount: true,
        paymentMethod: true,
        paymentProvider: true,
        createdAt: true,
        notes: true
      }
    });
    
    recentFailed.forEach((tx, i) => {
      console.log(`  ${i+1}. ${tx.invoiceNumber} | Rp. ${tx.amount?.toLocaleString()} | ${tx.paymentMethod} | ${tx.createdAt.toISOString().substring(0, 10)}`);
      if (tx.notes) console.log(`      Note: ${tx.notes.substring(0, 50)}...`);
    });
    
    // 8. Action recommendations
    console.log('\n🎯 RECOMMENDATIONS BASED ON ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalPotential >= sejoliSales * 0.95) {
      console.log('  ✅ GOOD NEWS: Failed→Success conversion could close the gap');
      console.log('  🎯 RECOMMENDATION: Investigate payment webhook failures');
      console.log('  🔧 ACTION: Fix payment status update mechanism');
    } else {
      console.log('  ⚠️  PARTIAL: Failed→Success helps but not complete solution');
      console.log('  📊 Need additional data import from Sejoli');
    }
    
    const failedPercentage = ((failedCount / totalPotential) * 100).toFixed(1);
    console.log(`\n  📈 Failed Transaction Rate: ${failedPercentage}%`);
    
    if (Number(failedPercentage) > 15) {
      console.log('  🚨 HIGH FAILURE RATE - Payment integration needs immediate attention');
      console.log('  🔧 Priority: Fix webhook handling, status updates, error handling');
    } else {
      console.log('  ✅ Normal failure rate - Focus on specific payment method issues');
    }
    
    console.log('\n📋 IMMEDIATE ACTION PLAN:');
    console.log('  1. Check Xendit webhook logs for failed status updates');
    console.log('  2. Verify payment provider response handling');
    console.log('  3. Test status reconciliation with sample failed transactions');
    console.log('  4. Implement automatic retry mechanism for webhook failures');
    console.log('  5. Create monitoring for real-time payment status tracking');
    
    console.log('\n✅ FAILED TRANSACTION ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeFailedTransactionPattern();