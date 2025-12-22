const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditCommissionSystem() {
  console.log('💰 COMMISSION SYSTEM AUDIT\n');
  console.log('🎯 GOAL: Verify 6,810 zero commissions are legitimate\n');
  
  try {
    // 1. Commission breakdown analysis
    console.log('📊 COMMISSION BREAKDOWN ANALYSIS:');
    
    const totalCommissions = await prisma.affiliateConversion.count();
    const zeroCommissions = await prisma.affiliateConversion.count({
      where: { commissionAmount: 0 }
    });
    const positiveCommissions = totalCommissions - zeroCommissions;
    
    console.log(`  Total Commission Records: ${totalCommissions.toLocaleString()}`);
    console.log(`  Zero Commissions: ${zeroCommissions.toLocaleString()} (${((zeroCommissions/totalCommissions)*100).toFixed(1)}%)`);
    console.log(`  Positive Commissions: ${positiveCommissions.toLocaleString()} (${((positiveCommissions/totalCommissions)*100).toFixed(1)}%)`);
    
    // 2. Commission rate distribution
    console.log('\n📈 COMMISSION RATE DISTRIBUTION:');
    const rateDistribution = await prisma.$queryRaw`
      SELECT 
        "commissionRate",
        COUNT(*) as count,
        SUM("commissionAmount") as total_amount,
        AVG("commissionAmount") as avg_amount
      FROM "AffiliateConversion"
      GROUP BY "commissionRate"
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('  Rate   | Count  | Total Amount      | Avg Amount');
    console.log('  -------|--------|-------------------|------------');
    rateDistribution.forEach(rate => {
      console.log(`  ${rate.commissionRate ? Number(rate.commissionRate).toFixed(1).padStart(5) : 'NULL'.padStart(5)}% | ${Number(rate.count).toLocaleString().padStart(6)} | Rp. ${parseInt(rate.total_amount || 0).toLocaleString().padStart(13)} | Rp. ${parseInt(rate.avg_amount || 0).toLocaleString().padStart(8)}`);
    });
    
    // 3. Zero commission analysis - are they legitimate?
    console.log('\n🔍 ZERO COMMISSION LEGITIMACY CHECK:');
    
    // Check if zero commissions have corresponding transactions
    const zeroCommissionWithTx = await prisma.$queryRaw`
      SELECT 
        COUNT(ac.id) as zero_with_transaction,
        COUNT(CASE WHEN t.status = 'SUCCESS' THEN 1 END) as zero_success,
        COUNT(CASE WHEN t.status = 'FAILED' THEN 1 END) as zero_failed
      FROM "AffiliateConversion" ac
      LEFT JOIN "Transaction" t ON ac."transactionId" = t.id
      WHERE ac."commissionAmount" = 0
    `;
    
    const zeroStats = zeroCommissionWithTx[0];
    console.log(`  Zero commissions with transactions: ${Number(zeroStats.zero_with_transaction)}`);
    console.log(`  Zero commissions from SUCCESS: ${Number(zeroStats.zero_success)}`);
    console.log(`  Zero commissions from FAILED: ${Number(zeroStats.zero_failed)}`);
    
    // Check transaction types for zero commissions
    const zeroCommissionTxTypes = await prisma.$queryRaw`
      SELECT 
        t.type as transaction_type,
        t.status as transaction_status,
        COUNT(*) as count,
        AVG(t.amount) as avg_transaction_amount
      FROM "AffiliateConversion" ac
      JOIN "Transaction" t ON ac."transactionId" = t.id
      WHERE ac."commissionAmount" = 0
      GROUP BY t.type, t.status
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('\n  Transaction types with zero commissions:');
    zeroCommissionTxTypes.forEach(type => {
      console.log(`    ${type.transaction_type} (${type.transaction_status}): ${Number(type.count)} records, Avg Rp. ${parseInt(type.avg_transaction_amount || 0).toLocaleString()}`);
    });
    
    // 4. Commission calculation validation
    console.log('\n🧮 COMMISSION CALCULATION VALIDATION:');
    
    // Check if commission amounts match expected calculation
    const calculationCheck = await prisma.$queryRaw`
      SELECT 
        ac.id,
        ac."commissionRate",
        ac."commissionAmount",
        t.amount as transaction_amount,
        ROUND(t.amount * (ac."commissionRate" / 100), 0) as expected_commission,
        (ac."commissionAmount" - ROUND(t.amount * (ac."commissionRate" / 100), 0)) as difference
      FROM "AffiliateConversion" ac
      JOIN "Transaction" t ON ac."transactionId" = t.id
      WHERE ac."commissionRate" > 0 
        AND ac."commissionAmount" > 0
        AND t.amount > 0
      ORDER BY ABS(ac."commissionAmount" - ROUND(t.amount * (ac."commissionRate" / 100), 0)) DESC
      LIMIT 10
    `;
    
    console.log('  Commission calculation accuracy check (top 10 discrepancies):');
    calculationCheck.forEach((calc, i) => {
      console.log(`    ${i+1}. Rate: ${Number(calc.commissionRate).toFixed(1)}%, Tx: Rp. ${parseInt(calc.transaction_amount).toLocaleString()}, Expected: Rp. ${parseInt(calc.expected_commission).toLocaleString()}, Actual: Rp. ${parseInt(calc.commissionAmount).toLocaleString()}, Diff: Rp. ${parseInt(calc.difference)}`);
    });
    
    // 5. Missing commissions for affiliate transactions
    console.log('\n🔍 MISSING COMMISSION DETECTION:');
    
    const missingCommissionCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as missing_count
      FROM "Transaction" t
      WHERE t."affiliateId" IS NOT NULL
        AND t.status = 'SUCCESS'
        AND NOT EXISTS (
          SELECT 1 FROM "AffiliateConversion" ac
          WHERE ac."transactionId" = t.id
        )
    `;
    
    console.log(`  Transactions with affiliate but NO commission: ${Number(missingCommissionCheck[0].missing_count)}`);
    
    if (Number(missingCommissionCheck[0].missing_count) > 0) {
      // Sample missing commissions
      const missingCommissionSample = await prisma.$queryRaw`
        SELECT 
          t."invoiceNumber",
          t.amount,
          t."affiliateId",
          t.status,
          t."createdAt"
        FROM "Transaction" t
        WHERE t."affiliateId" IS NOT NULL
          AND t.status = 'SUCCESS'
          AND NOT EXISTS (
            SELECT 1 FROM "AffiliateConversion" ac
            WHERE ac."transactionId" = t.id
          )
        ORDER BY t."createdAt" DESC
        LIMIT 5
      `;
      
      console.log('  Sample missing commission transactions:');
      missingCommissionSample.forEach(tx => {
        console.log(`    ${tx.invoiceNumber}: Rp. ${parseInt(tx.amount).toLocaleString()} (Affiliate: ${tx.affiliateId})`);
      });
    }
    
    // 6. Affiliate conversion integrity
    console.log('\n👥 AFFILIATE CONVERSION INTEGRITY:');
    
    const affiliateStats = await prisma.$queryRaw`
      SELECT 
        ac."affiliateId",
        u.email as affiliate_email,
        COUNT(*) as conversion_count,
        SUM(ac."commissionAmount") as total_commission,
        AVG(ac."commissionAmount") as avg_commission
      FROM "AffiliateConversion" ac
      LEFT JOIN "User" u ON ac."affiliateId" = u.id
      WHERE ac."commissionAmount" > 0
      GROUP BY ac."affiliateId", u.email
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `;
    
    console.log('  Top affiliate performers:');
    affiliateStats.forEach(affiliate => {
      console.log(`    ${affiliate.affiliate_email || 'Unknown'}: ${Number(affiliate.conversion_count)} conversions, Rp. ${parseInt(affiliate.total_commission || 0).toLocaleString()} total`);
    });
    
    // 7. Commission system health score
    console.log('\n🎯 COMMISSION SYSTEM HEALTH ASSESSMENT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const healthMetrics = [];
    
    // Metric 1: Commission coverage
    const affiliateTransactions = await prisma.transaction.count({
      where: { affiliateId: { not: null }, status: 'SUCCESS' }
    });
    const coverageRate = ((totalCommissions / affiliateTransactions) * 100).toFixed(1);
    console.log(`  Commission Coverage: ${coverageRate}% (${totalCommissions}/${affiliateTransactions})`);
    healthMetrics.push(Number(coverageRate));
    
    // Metric 2: Zero commission legitimacy 
    const zeroLegitimacyRate = ((Number(zeroStats.zero_failed) / zeroCommissions) * 100).toFixed(1);
    console.log(`  Zero Commission Legitimacy: ${zeroLegitimacyRate}% are from FAILED transactions`);
    healthMetrics.push(Number(zeroLegitimacyRate));
    
    // Metric 3: Calculation accuracy (sample-based)
    const accurateCalculations = calculationCheck.filter(calc => Math.abs(Number(calc.difference)) < 100).length;
    const calculationAccuracy = ((accurateCalculations / calculationCheck.length) * 100).toFixed(1);
    console.log(`  Calculation Accuracy: ${calculationAccuracy}% (${accurateCalculations}/${calculationCheck.length} sample)`);
    healthMetrics.push(Number(calculationAccuracy));
    
    // Overall health score
    const overallHealth = (healthMetrics.reduce((a, b) => a + b, 0) / healthMetrics.length).toFixed(1);
    console.log(`\n  🏥 Overall Commission Health: ${overallHealth}%`);
    
    if (Number(overallHealth) >= 85) {
      console.log('  ✅ EXCELLENT - Commission system is healthy');
    } else if (Number(overallHealth) >= 70) {
      console.log('  ⚠️  GOOD - Minor improvements needed');
    } else {
      console.log('  🚨 NEEDS ATTENTION - Commission system requires fixes');
    }
    
    // 8. Recommendations
    console.log('\n📋 COMMISSION SYSTEM RECOMMENDATIONS:');
    
    if (Number(missingCommissionCheck[0].missing_count) > 0) {
      console.log(`  1. Create commission records for ${Number(missingCommissionCheck[0].missing_count)} missing affiliate transactions`);
    }
    
    const highZeroRate = (zeroCommissions / totalCommissions) > 0.6;
    if (highZeroRate) {
      console.log('  2. Investigate high zero commission rate - verify business rules');
    }
    
    if (Number(calculationAccuracy) < 90) {
      console.log('  3. Review and fix commission calculation formulas');
    }
    
    console.log('  4. Implement automated commission validation rules');
    console.log('  5. Set up monitoring for commission calculation accuracy');
    console.log('  6. Create commission reconciliation reports');
    
    console.log('\n✅ COMMISSION SYSTEM AUDIT COMPLETE');
    
  } catch (error) {
    console.error('❌ Commission audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditCommissionSystem();