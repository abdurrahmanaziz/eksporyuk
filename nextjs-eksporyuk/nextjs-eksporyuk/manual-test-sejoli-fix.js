/**
 * 🔧 MANUAL TEST SEJOLI ORDERS API FIX
 * 
 * Manual verification script untuk fix Sejoli Orders API
 * Tidak memerlukan development server running
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manualTestSejoliOrdersFix() {
  console.log('🔧 ===== MANUAL VERIFICATION - SEJOLI ORDERS API FIX =====\n');
  console.log('📊 Testing data availability for API endpoints');
  console.log('🎯 Verifying 76M discrepancy fix potential\n');

  try {
    // Test 1: Verify API files exist
    console.log('📁 Test 1: API Files Verification');
    await testAPIFilesExist();

    // Test 2: Database data availability
    console.log('\n💾 Test 2: Database Data Verification');
    await testDatabaseData();

    // Test 3: Commission discrepancy analysis
    console.log('\n🎯 Test 3: Commission Discrepancy Analysis');
    await analyzeCommissionDiscrepancy();

    // Test 4: Simulate fix for missing commissions
    console.log('\n🔧 Test 4: Simulate Commission Fix');
    await simulateCommissionFix();

    console.log('\n✅ ===== MANUAL VERIFICATION COMPLETED =====');

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testAPIFilesExist() {
  const fs = require('fs');
  const path = require('path');

  const apiFiles = [
    'src/app/api/admin/sejoli/orders/route.js',
    'src/app/api/wp-json/sejoli-api/v1/orders/route.js'
  ];

  console.log('   📁 Checking API endpoint files...');

  for (const file of apiFiles) {
    const fullPath = path.join(process.cwd(), file);
    const exists = fs.existsSync(fullPath);
    
    console.log(`      ${exists ? '✅' : '❌'} ${file}`);
    
    if (exists) {
      const stats = fs.statSync(fullPath);
      console.log(`         Size: ${(stats.size / 1024).toFixed(1)} KB`);
      console.log(`         Modified: ${stats.mtime.toISOString().split('T')[0]}`);
    }
  }

  console.log('   ✅ API file verification completed');
}

async function testDatabaseData() {
  try {
    // Get basic counts
    const counts = {
      totalTransactions: await prisma.transaction.count(),
      membershipTransactions: await prisma.transaction.count({
        where: { type: 'MEMBERSHIP' }
      }),
      successfulTransactions: await prisma.transaction.count({
        where: { 
          type: 'MEMBERSHIP',
          status: 'SUCCESS'
        }
      }),
      transactionsWithAffiliate: await prisma.transaction.count({
        where: {
          type: 'MEMBERSHIP',
          status: 'SUCCESS',
          affiliateId: { not: null }
        }
      }),
      affiliateConversions: await prisma.affiliateConversion.count(),
      totalCommissionAmount: await prisma.affiliateConversion.aggregate({
        _sum: { commissionAmount: true }
      })
    };

    console.log('   📊 Database Statistics:');
    console.log(`      Total Transactions: ${counts.totalTransactions.toLocaleString()}`);
    console.log(`      Membership Transactions: ${counts.membershipTransactions.toLocaleString()}`);
    console.log(`      Successful Membership: ${counts.successfulTransactions.toLocaleString()}`);
    console.log(`      With Affiliate: ${counts.transactionsWithAffiliate.toLocaleString()}`);
    console.log(`      Commission Records: ${counts.affiliateConversions.toLocaleString()}`);
    console.log(`      Total Commission Paid: Rp ${(counts.totalCommissionAmount._sum.commissionAmount || 0).toLocaleString()}`);

    // Sample data for API
    const sampleTransactions = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS'
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        affiliateConversion: {
          select: { commissionAmount: true, paidOut: true }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n   📄 Sample Transactions (Latest 5):`);
    sampleTransactions.forEach((tx, index) => {
      const commission = tx.affiliateConversion;
      console.log(`      ${index + 1}. ${tx.invoiceNumber}`);
      console.log(`         Customer: ${tx.customerEmail}`);
      console.log(`         Amount: Rp ${tx.amount.toLocaleString()}`);
      console.log(`         Affiliate ID: ${tx.affiliateId || 'None'}`);
      console.log(`         Commission: Rp ${commission?.commissionAmount?.toLocaleString() || 0}`);
      console.log('');
    });

    console.log('   ✅ Database data verification completed');
    return counts;

  } catch (error) {
    console.log(`   ❌ Database verification failed: ${error.message}`);
    return null;
  }
}

async function analyzeCommissionDiscrepancy() {
  try {
    console.log('   🔍 Analyzing commission discrepancies...');

    // Find transactions with missing commission records
    const transactionsWithMissingCommissions = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateConversion: {
          is: null
        }
      }
    });

    console.log(`      🔍 Transactions with missing commission records: ${transactionsWithMissingCommissions.length}`);

    if (transactionsWithMissingCommissions.length > 0) {
      let potentialCommissionLoss = 0;
      const affiliateBreakdown = {};

      for (const tx of transactionsWithMissingCommissions) {
        // Estimate commission (assuming 30% average rate)
        const estimatedCommission = Math.round(tx.amount * 0.30);
        potentialCommissionLoss += estimatedCommission;

        const affiliateId = tx.affiliateId || 'unknown';
        if (!affiliateBreakdown[affiliateId]) {
          affiliateBreakdown[affiliateId] = {
            transactions: 0,
            estimatedCommission: 0
          };
        }
        affiliateBreakdown[affiliateId].transactions++;
        affiliateBreakdown[affiliateId].estimatedCommission += estimatedCommission;
      }

      console.log(`      💰 Potential commission loss: Rp ${potentialCommissionLoss.toLocaleString()}`);
      console.log(`      📊 This could explain part of the 76M discrepancy!`);

      // Show top affected affiliates
      const sortedAffiliates = Object.entries(affiliateBreakdown)
        .sort(([,a], [,b]) => b.estimatedCommission - a.estimatedCommission)
        .slice(0, 5);

      console.log(`\n      🎯 Top Affected Affiliate IDs:`);
      sortedAffiliates.forEach(([affiliateId, data], index) => {
        console.log(`         ${index + 1}. Affiliate ID: ${affiliateId}`);
        console.log(`            Missing: ${data.transactions} commissions`);
        console.log(`            Estimated loss: Rp ${data.estimatedCommission.toLocaleString()}`);
      });

      // Find Sutisna's affiliate ID
      const sutisnaUser = await prisma.user.findFirst({
        where: { email: 'azzka42@gmail.com' },
        select: { id: true, name: true }
      });

      if (sutisnaUser) {
        const sutisnaData = affiliateBreakdown[sutisnaUser.id];
        if (sutisnaData) {
          console.log(`\n      🎯 SUTISNA SPECIFIC ANALYSIS:`);
          console.log(`         Missing commission records: ${sutisnaData.transactions}`);
          console.log(`         Estimated missing amount: Rp ${sutisnaData.estimatedCommission.toLocaleString()}`);
          console.log(`         This could be part of the 76M discrepancy!`);
        }
      }

    } else {
      console.log('      ✅ No missing commission records found');
    }

    console.log('   ✅ Commission discrepancy analysis completed');
    return transactionsWithMissingCommissions.length;

  } catch (error) {
    console.log(`   ❌ Discrepancy analysis failed: ${error.message}`);
    return 0;
  }
}

async function simulateCommissionFix() {
  try {
    console.log('   🔧 Simulating commission fix (DRY RUN - no data changes)...');

    // Find missing commissions
    const missingCommissions = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateConversion: {
          is: null
        }
      },
      take: 10 // Limit for simulation
    });

    console.log(`      🔍 Found ${missingCommissions.length} transactions to fix`);

    if (missingCommissions.length > 0) {
      let totalFixAmount = 0;
      let fixCount = 0;

      console.log(`\n      💡 Simulation Results:`);
      
      for (const tx of missingCommissions) {
        // Use default 30% commission rate for simulation
        const commissionRate = 30;
        const commissionAmount = Math.round(tx.amount * commissionRate / 100);

        if (commissionAmount > 0) {
          totalFixAmount += commissionAmount;
          fixCount++;

          console.log(`         ${fixCount}. ${tx.invoiceNumber}`);
          console.log(`            Affiliate ID: ${tx.affiliateId}`);
          console.log(`            Amount: Rp ${tx.amount.toLocaleString()}`);
          console.log(`            Commission: Rp ${commissionAmount.toLocaleString()} (${commissionRate}%)`);
          console.log('');

          if (fixCount >= 5) break; // Limit output
        }
      }

      console.log(`      📊 Simulation Summary:`);
      console.log(`         Commissions to create: ${fixCount}`);
      console.log(`         Total commission amount: Rp ${totalFixAmount.toLocaleString()}`);
      console.log(`         Average per commission: Rp ${Math.round(totalFixAmount / fixCount).toLocaleString()}`);

      if (totalFixAmount > 50000000) { // 50M+
        console.log(`         🎯 SIGNIFICANT AMOUNT - This could significantly impact the 76M discrepancy!`);
      }

    } else {
      console.log('      ✅ No commissions need fixing');
    }

    console.log('   ✅ Commission fix simulation completed');

  } catch (error) {
    console.log(`   ❌ Commission fix simulation failed: ${error.message}`);
  }
}

// Export for module use
module.exports = { manualTestSejoliOrdersFix };

// Run if called directly
if (require.main === module) {
  manualTestSejoliOrdersFix().catch(console.error);
}