const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditNeonDatabaseMigration() {
  console.log('🔍 NEON DATABASE MIGRATION AUDIT - 14K+ TRANSACTIONS\n');
  console.log('🎯 CHECKING: Duplicates, Errors, Commission Integrity\n');
  
  try {
    // 1. Basic transaction count verification
    console.log('📊 MIGRATION STATUS OVERVIEW:');
    const totalTransactions = await prisma.transaction.count();
    const totalCommissions = await prisma.affiliateConversion.count();
    const totalWallets = await prisma.wallet.count();
    const totalUsers = await prisma.user.count();
    
    console.log(`  ✅ Total Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`  ✅ Total Commission Records: ${totalCommissions.toLocaleString()}`);
    console.log(`  ✅ Total User Wallets: ${totalWallets.toLocaleString()}`);
    console.log(`  ✅ Total Users: ${totalUsers.toLocaleString()}`);
    
    // 2. Check for duplicate transactions by invoice number
    console.log('\n🔍 DUPLICATE TRANSACTION DETECTION:');
    const duplicateInvoices = await prisma.$queryRaw`
      SELECT "invoiceNumber", COUNT(*) as duplicate_count
      FROM "Transaction"
      WHERE "invoiceNumber" IS NOT NULL
      GROUP BY "invoiceNumber"
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      LIMIT 10
    `;
    
    if (duplicateInvoices.length > 0) {
      console.log(`  ⚠️  FOUND ${duplicateInvoices.length} DUPLICATE INVOICE NUMBERS:`);
      duplicateInvoices.forEach(dup => {
        console.log(`    Invoice ${dup.invoiceNumber}: ${dup.duplicate_count} duplicates`);
      });
      
      // Get total duplicated transactions
      const totalDuplicates = await prisma.$queryRaw`
        SELECT COUNT(*) as total_duplicates
        FROM "Transaction" t1
        WHERE t1."invoiceNumber" IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM "Transaction" t2 
          WHERE t2."invoiceNumber" = t1."invoiceNumber" 
          AND t2.id != t1.id
        )
      `;
      console.log(`  🚨 TOTAL DUPLICATE TRANSACTIONS: ${totalDuplicates[0].total_duplicates}`);
    } else {
      console.log(`  ✅ NO DUPLICATE INVOICE NUMBERS FOUND`);
    }
    
    // 3. Check for orphan/incomplete transaction data
    console.log('\n🔍 ORPHAN DATA DETECTION:');
    
    // Transactions without users
    const orphanTransactions = await prisma.transaction.count({
      where: {
        user: null
      }
    });
    console.log(`  Transactions without Users: ${orphanTransactions}`);
    
    // Transactions without invoice numbers
    const noInvoiceTransactions = await prisma.transaction.count({
      where: {
        invoiceNumber: null
      }
    });
    console.log(`  Transactions without Invoice Numbers: ${noInvoiceTransactions}`);
    
    // Transactions with zero amount
    const zeroAmountTransactions = await prisma.transaction.count({
      where: {
        amount: 0
      }
    });
    console.log(`  Transactions with Zero Amount: ${zeroAmountTransactions}`);
    
    // 4. Status distribution analysis
    console.log('\n📊 TRANSACTION STATUS ANALYSIS:');
    const statusStats = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count, SUM(amount) as total_amount
      FROM "Transaction"
      GROUP BY status
      ORDER BY count DESC
    `;
    
    statusStats.forEach(stat => {
      const percentage = ((stat.count / totalTransactions) * 100).toFixed(1);
      console.log(`  ${stat.status}: ${stat.count.toLocaleString()} (${percentage}%) - Rp. ${parseInt(stat.total_amount || 0).toLocaleString()}`);
    });
    
    // 5. Commission integrity check
    console.log('\n💰 COMMISSION INTEGRITY AUDIT:');
    
    // Check for commission records without transactions
    const orphanCommissions = await prisma.$queryRaw`
      SELECT COUNT(*) as orphan_count
      FROM "AffiliateConversion" ac
      LEFT JOIN "Transaction" t ON ac."transactionId" = t.id
      WHERE t.id IS NULL
    `;
    console.log(`  Orphan Commission Records: ${orphanCommissions[0].orphan_count}`);
    
    // Check for transactions with affiliate but no commission
    const missingCommissions = await prisma.$queryRaw`
      SELECT COUNT(*) as missing_count
      FROM "Transaction" t
      WHERE t."affiliateId" IS NOT NULL
      AND t.status = 'SUCCESS'
      AND NOT EXISTS (
        SELECT 1 FROM "AffiliateConversion" ac
        WHERE ac."transactionId" = t.id
      )
    `;
    console.log(`  Missing Commission Records: ${missingCommissions[0].missing_count}`);
    
    // Commission amount validation
    const commissionStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_commissions,
        SUM("commissionAmount") as total_commission_amount,
        AVG("commissionAmount") as avg_commission,
        MIN("commissionAmount") as min_commission,
        MAX("commissionAmount") as max_commission
      FROM "AffiliateConversion"
    `;
    
    const commissionData = commissionStats[0];
    console.log(`  Total Commission Amount: Rp. ${parseInt(commissionData.total_commission_amount || 0).toLocaleString()}`);
    console.log(`  Average Commission: Rp. ${parseInt(commissionData.avg_commission || 0).toLocaleString()}`);
    console.log(`  Min Commission: Rp. ${parseInt(commissionData.min_commission || 0).toLocaleString()}`);
    console.log(`  Max Commission: Rp. ${parseInt(commissionData.max_commission || 0).toLocaleString()}`);
    
    // 6. Check for suspicious commission patterns
    console.log('\n🔍 SUSPICIOUS COMMISSION PATTERN DETECTION:');
    
    // Extremely high commissions (> 1M)
    const highCommissions = await prisma.affiliateConversion.count({
      where: {
        commissionAmount: {
          gt: 1000000
        }
      }
    });
    console.log(`  High Commissions (>1M): ${highCommissions}`);
    
    // Zero/negative commissions
    const zeroCommissions = await prisma.affiliateConversion.count({
      where: {
        commissionAmount: {
          lte: 0
        }
      }
    });
    console.log(`  Zero/Negative Commissions: ${zeroCommissions}`);
    
    // Commission rates analysis
    const commissionRateStats = await prisma.$queryRaw`
      SELECT 
        ac."commissionRate",
        COUNT(*) as count,
        AVG(ac."commissionAmount") as avg_amount
      FROM "AffiliateConversion" ac
      WHERE ac."commissionRate" IS NOT NULL
      GROUP BY ac."commissionRate"
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('\n  Commission Rate Distribution:');
    commissionRateStats.forEach(rate => {
      console.log(`    Rate ${rate.commissionRate}%: ${rate.count} records, Avg Rp. ${parseInt(rate.avg_amount || 0).toLocaleString()}`);
    });
    
    // 7. Date integrity check
    console.log('\n📅 DATE INTEGRITY VERIFICATION:');
    
    const dateRange = await prisma.$queryRaw`
      SELECT 
        MIN("createdAt") as first_transaction,
        MAX("createdAt") as last_transaction,
        MAX("updatedAt") as last_update
      FROM "Transaction"
    `;
    
    const firstTx = new Date(dateRange[0].first_transaction);
    const lastTx = new Date(dateRange[0].last_transaction);
    const lastUpdate = new Date(dateRange[0].last_update);
    
    console.log(`  First Transaction: ${firstTx.toISOString().substring(0, 10)}`);
    console.log(`  Last Transaction: ${lastTx.toISOString().substring(0, 10)}`);
    console.log(`  Last Update: ${lastUpdate.toISOString().substring(0, 19)}`);
    
    // Future-dated transactions (suspicious)
    const futureTransactions = await prisma.transaction.count({
      where: {
        createdAt: {
          gt: new Date()
        }
      }
    });
    console.log(`  Future-dated Transactions: ${futureTransactions}`);
    
    // 8. User-transaction relationship integrity
    console.log('\n👥 USER-TRANSACTION RELATIONSHIP AUDIT:');
    
    // Users without transactions
    const usersWithoutTx = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "User" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "Transaction" t WHERE t."userId" = u.id
      )
    `;
    console.log(`  Users without Transactions: ${usersWithoutTx[0].count}`);
    
    // High-volume transaction users (potential duplicates)
    const highVolumeUsers = await prisma.$queryRaw`
      SELECT 
        u.email,
        u.username,
        COUNT(t.id) as transaction_count,
        SUM(t.amount) as total_amount
      FROM "User" u
      JOIN "Transaction" t ON u.id = t."userId"
      GROUP BY u.id, u.email, u.username
      HAVING COUNT(t.id) > 50
      ORDER BY COUNT(t.id) DESC
      LIMIT 10
    `;
    
    if (highVolumeUsers.length > 0) {
      console.log('\n  High-volume Users (>50 transactions):');
      highVolumeUsers.forEach(user => {
        console.log(`    ${user.email}: ${user.transaction_count} transactions, Rp. ${parseInt(user.total_amount || 0).toLocaleString()}`);
      });
    }
    
    // 9. Wallet integrity check
    console.log('\n💳 WALLET INTEGRITY VERIFICATION:');
    
    // Users without wallets
    const usersWithoutWallet = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "User" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "Wallet" w WHERE w."userId" = u.id
      )
    `;
    console.log(`  Users without Wallets: ${usersWithoutWallet[0].count}`);
    
    // Negative wallet balances
    const negativeBalances = await prisma.wallet.count({
      where: {
        OR: [
          { balance: { lt: 0 } },
          { balancePending: { lt: 0 } }
        ]
      }
    });
    console.log(`  Negative Wallet Balances: ${negativeBalances}`);
    
    // 10. Generate summary report
    console.log('\n📋 MIGRATION INTEGRITY SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const criticalIssues = [];
    const warnings = [];
    const goodFindings = [];
    
    // Critical issues
    if (duplicateInvoices.length > 0) {
      criticalIssues.push(`${duplicateInvoices.length} duplicate invoice numbers`);
    }
    if (orphanCommissions[0].orphan_count > 0) {
      criticalIssues.push(`${orphanCommissions[0].orphan_count} orphan commission records`);
    }
    if (missingCommissions[0].missing_count > 0) {
      criticalIssues.push(`${missingCommissions[0].missing_count} missing commission records`);
    }
    if (futureTransactions > 0) {
      criticalIssues.push(`${futureTransactions} future-dated transactions`);
    }
    
    // Warnings
    if (noInvoiceTransactions > 0) {
      warnings.push(`${noInvoiceTransactions} transactions without invoice numbers`);
    }
    if (zeroAmountTransactions > 0) {
      warnings.push(`${zeroAmountTransactions} zero-amount transactions`);
    }
    if (highCommissions > 0) {
      warnings.push(`${highCommissions} high-value commissions (>1M)`);
    }
    if (zeroCommissions > 0) {
      warnings.push(`${zeroCommissions} zero/negative commissions`);
    }
    
    // Good findings
    if (duplicateInvoices.length === 0) {
      goodFindings.push('No duplicate invoice numbers');
    }
    if (orphanCommissions[0].orphan_count === 0) {
      goodFindings.push('No orphan commission records');
    }
    if (usersWithoutWallet[0].count === 0) {
      goodFindings.push('All users have wallets');
    }
    
    console.log('\n🚨 CRITICAL ISSUES:');
    if (criticalIssues.length > 0) {
      criticalIssues.forEach(issue => console.log(`  ❌ ${issue}`));
    } else {
      console.log('  ✅ No critical issues found');
    }
    
    console.log('\n⚠️  WARNINGS:');
    if (warnings.length > 0) {
      warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    } else {
      console.log('  ✅ No warnings');
    }
    
    console.log('\n✅ GOOD FINDINGS:');
    goodFindings.forEach(finding => console.log(`  ✅ ${finding}`));
    
    console.log('\n🎯 MIGRATION QUALITY SCORE:');
    const totalChecks = criticalIssues.length + warnings.length + goodFindings.length;
    const score = ((goodFindings.length / totalChecks) * 100).toFixed(1);
    console.log(`  Migration Integrity: ${score}%`);
    
    if (criticalIssues.length === 0 && warnings.length <= 2) {
      console.log('  🎉 EXCELLENT - Migration data integrity is very good');
    } else if (criticalIssues.length <= 2) {
      console.log('  ⚠️  GOOD - Minor issues need attention');
    } else {
      console.log('  🚨 NEEDS ATTENTION - Critical issues require immediate fix');
    }
    
    console.log('\n✅ NEON DATABASE AUDIT COMPLETE');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditNeonDatabaseMigration();