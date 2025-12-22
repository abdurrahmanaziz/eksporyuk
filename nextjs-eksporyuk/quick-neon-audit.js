const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickNeonAudit() {
  console.log('🔍 NEON DATABASE QUICK AUDIT - 14K+ TRANSACTIONS\n');
  
  try {
    // 1. Basic counts
    console.log('📊 MIGRATION STATUS:');
    const totalTransactions = await prisma.transaction.count();
    const totalCommissions = await prisma.affiliateConversion.count();
    const totalUsers = await prisma.user.count();
    console.log(`  Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`  Commission Records: ${totalCommissions.toLocaleString()}`);
    console.log(`  Users: ${totalUsers.toLocaleString()}`);
    
    // 2. Duplicate check (most critical)
    console.log('\n🔍 DUPLICATE INVOICE CHECK:');
    const duplicates = await prisma.$queryRaw`
      SELECT "invoiceNumber", COUNT(*) as count
      FROM "Transaction"
      WHERE "invoiceNumber" IS NOT NULL
      GROUP BY "invoiceNumber"
      HAVING COUNT(*) > 1
      LIMIT 5
    `;
    
    if (duplicates.length > 0) {
      console.log(`  🚨 FOUND ${duplicates.length} DUPLICATE INVOICES:`);
      duplicates.forEach(d => console.log(`    ${d.invoiceNumber}: ${d.count} copies`));
    } else {
      console.log('  ✅ NO DUPLICATES FOUND');
    }
    
    // 3. Status breakdown
    console.log('\n📊 TRANSACTION STATUS:');
    const statusBreakdown = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count, SUM(amount) as revenue
      FROM "Transaction"
      GROUP BY status
      ORDER BY count DESC
    `;
    
    statusBreakdown.forEach(s => {
      const pct = ((Number(s.count) / totalTransactions) * 100).toFixed(1);
      console.log(`  ${s.status}: ${Number(s.count).toLocaleString()} (${pct}%) - Rp. ${parseInt(s.revenue || 0).toLocaleString()}`);
    });
    
    // 4. Commission integrity (critical check)
    console.log('\n💰 COMMISSION INTEGRITY:');
    
    // Missing commissions for affiliate transactions
    const missingCommissions = await prisma.$queryRaw`
      SELECT COUNT(*) as missing
      FROM "Transaction" t
      WHERE t."affiliateId" IS NOT NULL
      AND t.status = 'SUCCESS'
      AND NOT EXISTS (
        SELECT 1 FROM "AffiliateConversion" ac
        WHERE ac."transactionId" = t.id
      )
    `;
    console.log(`  Missing Commission Records: ${Number(missingCommissions[0].missing)}`);
    
    // Orphan commissions
    const orphanCommissions = await prisma.$queryRaw`
      SELECT COUNT(*) as orphan
      FROM "AffiliateConversion" ac
      WHERE NOT EXISTS (
        SELECT 1 FROM "Transaction" t
        WHERE t.id = ac."transactionId"
      )
    `;
    console.log(`  Orphan Commission Records: ${Number(orphanCommissions[0].orphan)}`);
    
    // Commission amount stats
    const commissionStats = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true },
      _avg: { commissionAmount: true },
      _min: { commissionAmount: true },
      _max: { commissionAmount: true }
    });
    
    console.log(`  Total Commission: Rp. ${(commissionStats._sum.commissionAmount || 0).toLocaleString()}`);
    console.log(`  Average Commission: Rp. ${Math.round(commissionStats._avg.commissionAmount || 0).toLocaleString()}`);
    console.log(`  Max Commission: Rp. ${(commissionStats._max.commissionAmount || 0).toLocaleString()}`);
    
    // 5. Suspicious patterns
    console.log('\n🔍 SUSPICIOUS PATTERN CHECK:');
    
    // High commissions (> 1M)
    const highCommissions = await prisma.affiliateConversion.count({
      where: { commissionAmount: { gt: 1000000 }}
    });
    console.log(`  High Commissions (>1M): ${highCommissions}`);
    
    // Zero/negative commissions
    const badCommissions = await prisma.affiliateConversion.count({
      where: { commissionAmount: { lte: 0 }}
    });
    console.log(`  Zero/Negative Commissions: ${badCommissions}`);
    
    // Transactions without invoice
    const noInvoice = await prisma.transaction.count({
      where: { invoiceNumber: null }
    });
    console.log(`  Transactions without Invoice: ${noInvoice}`);
    
    // Zero amount transactions
    const zeroAmount = await prisma.transaction.count({
      where: { amount: 0 }
    });
    console.log(`  Zero Amount Transactions: ${zeroAmount}`);
    
    // 6. Recent data check
    console.log('\n📅 RECENT DATA:');
    const recentTx = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, invoiceNumber: true, status: true }
    });
    console.log(`  Latest Transaction: ${recentTx?.createdAt?.toISOString().substring(0, 19)} - ${recentTx?.invoiceNumber} - ${recentTx?.status}`);
    
    // 7. Commission rate distribution
    console.log('\n📊 COMMISSION RATES:');
    const rateDistribution = await prisma.$queryRaw`
      SELECT "commissionRate", COUNT(*) as count
      FROM "AffiliateConversion"
      WHERE "commissionRate" IS NOT NULL
      GROUP BY "commissionRate"
      ORDER BY count DESC
      LIMIT 5
    `;
    
    rateDistribution.forEach(rate => {
      console.log(`  Rate ${rate.commissionRate}%: ${Number(rate.count)} records`);
    });
    
    // 8. Summary assessment
    console.log('\n🎯 MIGRATION QUALITY ASSESSMENT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const issues = [];
    if (duplicates.length > 0) issues.push('Duplicate invoices');
    if (Number(missingCommissions[0].missing) > 0) issues.push(`${Number(missingCommissions[0].missing)} missing commissions`);
    if (Number(orphanCommissions[0].orphan) > 0) issues.push(`${Number(orphanCommissions[0].orphan)} orphan commissions`);
    if (badCommissions > 0) issues.push(`${badCommissions} bad commission amounts`);
    if (highCommissions > 10) issues.push(`${highCommissions} suspiciously high commissions`);
    if (noInvoice > 100) issues.push(`${noInvoice} transactions without invoices`);
    
    if (issues.length === 0) {
      console.log('  ✅ EXCELLENT - No major issues detected');
      console.log('  📊 Data integrity appears very good');
      console.log('  🎉 Migration quality: HIGH');
    } else if (issues.length <= 2) {
      console.log('  ⚠️  GOOD - Minor issues need attention:');
      issues.forEach(issue => console.log(`    - ${issue}`));
      console.log('  📊 Migration quality: MEDIUM');
    } else {
      console.log('  🚨 NEEDS ATTENTION - Multiple issues found:');
      issues.forEach(issue => console.log(`    ❌ ${issue}`));
      console.log('  📊 Migration quality: REQUIRES REVIEW');
    }
    
    console.log('\n📋 NEXT STEPS BASED ON AUDIT:');
    if (Number(missingCommissions[0].missing) > 0) {
      console.log(`  1. Fix ${Number(missingCommissions[0].missing)} missing commission records`);
    }
    if (Number(orphanCommissions[0].orphan) > 0) {
      console.log(`  2. Clean up ${Number(orphanCommissions[0].orphan)} orphan commission records`);
    }
    if (duplicates.length > 0) {
      console.log('  3. Remove duplicate invoice transactions');
    }
    console.log('  4. Verify commission calculation formulas');
    console.log('  5. Test API endpoints with production data');
    
    console.log('\n✅ QUICK AUDIT COMPLETE');
    
  } catch (error) {
    console.error('❌ Audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickNeonAudit();