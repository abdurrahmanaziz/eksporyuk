const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createStatusReconciliationPlan() {
  console.log('🔧 STATUS RECONCILIATION PLAN CREATION\n');
  console.log('🎯 GOAL: Fix 2,469 FAILED transactions to match Sejoli status\n');
  
  try {
    // 1. Analyze current status distribution
    console.log('📊 CURRENT STATUS DISTRIBUTION:');
    const statusStats = await prisma.$queryRaw`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM "Transaction"
      GROUP BY status
      ORDER BY count DESC
    `;
    
    statusStats.forEach(stat => {
      console.log(`  ${stat.status}: ${Number(stat.count).toLocaleString()} transactions, Rp. ${parseInt(stat.total_amount || 0).toLocaleString()} total`);
    });
    
    // 2. Identify candidates for status change
    console.log('\n🔍 FAILED TRANSACTION RECONCILIATION ANALYSIS:');
    
    // Check recent failed transactions that might be success
    const recentFailedSample = await prisma.transaction.findMany({
      where: { 
        status: 'FAILED',
        createdAt: {
          gte: new Date('2025-06-01') // Recent failures more likely to be reconcilable
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        paymentMethod: true,
        paymentProvider: true,
        createdAt: true,
        notes: true,
        externalId: true,
        paidAt: true
      }
    });
    
    console.log('  Recent FAILED transaction sample for analysis:');
    recentFailedSample.forEach((tx, i) => {
      console.log(`    ${i+1}. ${tx.invoiceNumber} | Rp. ${tx.amount?.toLocaleString()} | ${tx.paymentMethod} | ${tx.createdAt.toISOString().substring(0, 10)}`);
      console.log(`       ExternalId: ${tx.externalId || 'NULL'} | PaidAt: ${tx.paidAt ? tx.paidAt.toISOString().substring(0, 10) : 'NULL'}`);
      if (tx.notes) console.log(`       Notes: ${tx.notes.substring(0, 80)}...`);
    });
    
    // 3. Create reconciliation strategy
    console.log('\n📋 RECONCILIATION STRATEGY:');
    
    // Strategy 1: Transactions with paidAt date should be SUCCESS
    const failedWithPaidAt = await prisma.transaction.count({
      where: {
        status: 'FAILED',
        paidAt: { not: null }
      }
    });
    console.log(`  Strategy 1: ${failedWithPaidAt} FAILED transactions with paidAt → should be SUCCESS`);
    
    // Strategy 2: Transactions with specific external IDs pattern
    const failedWithExternalId = await prisma.transaction.count({
      where: {
        status: 'FAILED',
        externalId: { not: null }
      }
    });
    console.log(`  Strategy 2: ${failedWithExternalId} FAILED transactions with externalId → need payment verification`);
    
    // Strategy 3: Manual payment method might be legitimate failures or successes
    const failedManualPayments = await prisma.transaction.count({
      where: {
        status: 'FAILED',
        paymentMethod: 'manual'
      }
    });
    console.log(`  Strategy 3: ${failedManualPayments} FAILED manual payments → need manual verification`);
    
    // 4. Safe reconciliation candidates
    console.log('\n✅ SAFE RECONCILIATION CANDIDATES:');
    
    // High confidence candidates: Have paidAt date
    if (failedWithPaidAt > 0) {
      console.log(`  High Confidence: ${failedWithPaidAt} transactions with paidAt dates`);
      
      const samplePaidButFailed = await prisma.transaction.findMany({
        where: {
          status: 'FAILED',
          paidAt: { not: null }
        },
        take: 5,
        select: {
          invoiceNumber: true,
          amount: true,
          paidAt: true,
          paymentMethod: true
        }
      });
      
      console.log('  Sample candidates:');
      samplePaidButFailed.forEach(tx => {
        console.log(`    ${tx.invoiceNumber}: Rp. ${tx.amount?.toLocaleString()} paid on ${tx.paidAt?.toISOString().substring(0, 10)}`);
      });
    }
    
    // 5. Calculate reconciliation impact
    console.log('\n📊 RECONCILIATION IMPACT PROJECTION:');
    
    const currentSuccess = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
    const currentSuccessRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' }
    });
    
    // Project impact of converting high-confidence failed to success
    const highConfidenceRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'FAILED',
        paidAt: { not: null }
      }
    });
    
    console.log('  Current Status:');
    console.log(`    SUCCESS: ${currentSuccess.toLocaleString()} transactions, Rp. ${(currentSuccessRevenue._sum.amount || 0).toLocaleString()}`);
    
    console.log('  After High-Confidence Reconciliation:');
    const projectedSuccess = currentSuccess + failedWithPaidAt;
    const projectedRevenue = (currentSuccessRevenue._sum.amount || 0) + (highConfidenceRevenue._sum.amount || 0);
    console.log(`    SUCCESS: ${projectedSuccess.toLocaleString()} transactions, Rp. ${projectedRevenue.toLocaleString()}`);
    
    // Compare with Sejoli target
    const sejoliSales = 12879;
    const sejoliRevenue = 4158894962;
    console.log('\n  Compared to Sejoli Target:');
    console.log(`    Sales Gap: ${sejoliSales - projectedSuccess} transactions (${projectedSuccess >= sejoliSales ? 'CLOSED' : 'REMAINING'})`);
    console.log(`    Revenue Gap: Rp. ${Math.abs(sejoliRevenue - projectedRevenue).toLocaleString()} (${projectedRevenue >= sejoliRevenue ? 'EXCEEDED' : 'REMAINING'})`);
    
    // 6. Commission recalculation impact
    console.log('\n💰 COMMISSION RECALCULATION IMPACT:');
    
    const failedWithAffiliate = await prisma.transaction.count({
      where: {
        status: 'FAILED',
        affiliateId: { not: null },
        paidAt: { not: null }
      }
    });
    
    console.log(`  FAILED→SUCCESS with affiliates: ${failedWithAffiliate} transactions need commission creation`);
    
    if (failedWithAffiliate > 0) {
      const projectedCommissionRevenue = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'FAILED',
          affiliateId: { not: null },
          paidAt: { not: null }
        }
      });
      
      // Estimate commission (assuming 30% average rate)
      const estimatedCommission = (projectedCommissionRevenue._sum.amount || 0) * 0.30;
      console.log(`  Estimated additional commission: Rp. ${estimatedCommission.toLocaleString()}`);
    }
    
    // 7. Create step-by-step execution plan
    console.log('\n🗓️ STEP-BY-STEP EXECUTION PLAN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('  PHASE 1: Preparation (Day 1)');
    console.log('    1. Backup current transaction statuses');
    console.log('    2. Create staging table for reconciliation candidates');
    console.log('    3. Export current commission data');
    console.log('    4. Verify payment provider APIs for status checking');
    
    console.log('\n  PHASE 2: Safe Reconciliation (Day 2)');
    console.log(`    1. Update ${failedWithPaidAt} transactions with paidAt dates to SUCCESS`);
    console.log('    2. Create missing commission records for affiliate transactions');
    console.log('    3. Update wallet balances for affected users');
    console.log('    4. Verify commission calculations are correct');
    
    console.log('\n  PHASE 3: Payment Verification (Day 3-4)');
    console.log('    1. Check payment status via Xendit/Moota APIs for remaining failed');
    console.log('    2. Update verified paid transactions to SUCCESS');
    console.log('    3. Keep legitimately failed transactions as FAILED');
    console.log('    4. Update commission records for newly converted transactions');
    
    console.log('\n  PHASE 4: Validation & Monitoring (Day 5)');
    console.log('    1. Verify final transaction counts match expectations');
    console.log('    2. Validate commission calculations are accurate');
    console.log('    3. Test API endpoints with updated data');
    console.log('    4. Set up monitoring to prevent future status sync issues');
    
    // 8. Risk assessment
    console.log('\n⚠️  RISK ASSESSMENT:');
    
    const riskFactors = [];
    
    if (failedWithPaidAt > 100) {
      riskFactors.push(`High volume reconciliation: ${failedWithPaidAt} transactions`);
    }
    
    if (failedWithAffiliate > 50) {
      riskFactors.push(`Commission impact: ${failedWithAffiliate} affiliate transactions`);
    }
    
    if (projectedRevenue > sejoliRevenue * 1.2) {
      riskFactors.push('Revenue projection exceeds Sejoli by >20%');
    }
    
    console.log('  Risk Factors:');
    if (riskFactors.length > 0) {
      riskFactors.forEach(risk => console.log(`    ⚠️  ${risk}`));
    } else {
      console.log('    ✅ Low risk reconciliation');
    }
    
    console.log('\n  Mitigation Strategies:');
    console.log('    1. Test on staging environment first');
    console.log('    2. Process in small batches (100 transactions at a time)');
    console.log('    3. Implement rollback capability');
    console.log('    4. Monitor system performance during updates');
    console.log('    5. Verify each batch before proceeding');
    
    console.log('\n🎯 RECOMMENDED IMMEDIATE ACTION:');
    if (failedWithPaidAt > 0) {
      console.log(`  ✅ START: Convert ${failedWithPaidAt} transactions with paidAt dates`);
      console.log('  📊 IMPACT: Safe and high-confidence reconciliation');
      console.log('  ⏱️  TIME: Can be completed today');
    } else {
      console.log('  🔍 INVESTIGATE: Need payment provider API verification first');
    }
    
    console.log('\n✅ STATUS RECONCILIATION PLAN COMPLETE');
    
  } catch (error) {
    console.error('❌ Reconciliation planning error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStatusReconciliationPlan();