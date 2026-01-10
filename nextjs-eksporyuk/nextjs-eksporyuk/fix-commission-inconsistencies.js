const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCommissionInconsistencies() {
  try {
    console.log('=== FIXING COMMISSION INCONSISTENCIES ===\n');

    // 1. Find all conversions with transactions that have 0 affiliateShare
    const inconsistentConversions = await prisma.affiliateConversion.findMany({
      where: {
        transaction: {
          affiliateShare: {
            lte: 0
          }
        }
      },
      include: {
        transaction: true,
        affiliate: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`🔍 Found ${inconsistentConversions.length} conversions with zero affiliate share in transactions\n`);

    if (inconsistentConversions.length > 0) {
      console.log('📊 Analyzing the pattern...\n');
      
      // Group by affiliate
      const groupedByAffiliate = {};
      inconsistentConversions.forEach(conv => {
        const email = conv.affiliate.user.email;
        if (!groupedByAffiliate[email]) {
          groupedByAffiliate[email] = {
            count: 0,
            totalCommission: 0,
            transactions: []
          };
        }
        groupedByAffiliate[email].count++;
        groupedByAffiliate[email].totalCommission += parseFloat(conv.commissionAmount);
        groupedByAffiliate[email].transactions.push({
          transactionId: conv.transaction.id,
          conversionId: conv.id,
          amount: parseFloat(conv.commissionAmount)
        });
      });

      console.log('👥 Breakdown by affiliate:');
      for (const [email, data] of Object.entries(groupedByAffiliate)) {
        console.log(`   ${email}: ${data.count} conversions, Rp ${data.totalCommission.toLocaleString('id-ID')} total`);
      }
      console.log();

      // 2. Fix the inconsistencies by updating transaction affiliateShare
      console.log('🔧 FIXING TRANSACTION AFFILIATE SHARES...\n');
      
      let fixedCount = 0;
      let totalFixed = 0;
      
      for (const conversion of inconsistentConversions) {
        try {
          const commissionAmount = parseFloat(conversion.commissionAmount);
          
          await prisma.transaction.update({
            where: { id: conversion.transaction.id },
            data: {
              affiliateShare: commissionAmount
            }
          });
          
          console.log(`✅ Fixed transaction ${conversion.transaction.id}: Set affiliateShare to Rp ${commissionAmount.toLocaleString('id-ID')}`);
          fixedCount++;
          totalFixed += commissionAmount;
          
        } catch (error) {
          console.log(`❌ Error fixing transaction ${conversion.transaction.id}: ${error.message}`);
        }
      }
      
      console.log(`\n📊 Fix Summary:`);
      console.log(`- Fixed transactions: ${fixedCount}`);
      console.log(`- Total commission fixed: Rp ${totalFixed.toLocaleString('id-ID')}`);
      console.log();
    }

    // 3. Verify the fixes
    console.log('✅ VERIFYING FIXES...\n');
    
    const remainingInconsistencies = await prisma.affiliateConversion.findMany({
      where: {
        transaction: {
          affiliateShare: {
            lte: 0
          }
        }
      },
      include: {
        transaction: true
      }
    });

    if (remainingInconsistencies.length === 0) {
      console.log('🎉 All inconsistencies have been resolved!\n');
    } else {
      console.log(`⚠️ Still have ${remainingInconsistencies.length} inconsistencies remaining\n`);
    }

    // 4. Check for other potential issues
    console.log('🔍 CHECKING FOR OTHER POTENTIAL ISSUES...\n');
    
    // Check for transactions with affiliate but no conversion
    const orphanTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateShare: { gt: 0 },
        affiliateConversion: { is: null }
      },
      include: {
        user: true
      }
    });

    if (orphanTransactions.length > 0) {
      console.log(`⚠️ Found ${orphanTransactions.length} transactions with affiliates but no conversion records:`);
      orphanTransactions.forEach(tx => {
        console.log(`   Transaction ${tx.id}: Rp ${parseFloat(tx.affiliateShare).toLocaleString('id-ID')} affiliate share`);
      });
      console.log();
    } else {
      console.log('✅ No orphan transactions found\n');
    }

    // Check for conversions without transactions
    const orphanConversions = await prisma.affiliateConversion.findMany({
      where: {
        transactionId: null
      }
    });

    if (orphanConversions.length > 0) {
      console.log(`⚠️ Found ${orphanConversions.length} conversions without transaction records`);
    } else {
      console.log('✅ No orphan conversions found');
    }

    console.log('\n=== COMMISSION SYSTEM STATUS ===\n');
    
    const finalStats = {
      totalTransactions: await prisma.transaction.count({ where: { status: 'SUCCESS' } }),
      transactionsWithAffiliates: await prisma.transaction.count({
        where: { 
          status: 'SUCCESS',
          affiliateId: { not: null },
          affiliateShare: { gt: 0 }
        }
      }),
      totalConversions: await prisma.affiliateConversion.count(),
      matchedConversions: await prisma.affiliateConversion.count({
        where: {
          transaction: {
            affiliateShare: { gt: 0 }
          }
        }
      })
    };

    console.log('📊 Final Statistics:');
    console.log(`- Total successful transactions: ${finalStats.totalTransactions}`);
    console.log(`- Transactions with affiliates: ${finalStats.transactionsWithAffiliates}`);
    console.log(`- Total conversions: ${finalStats.totalConversions}`);
    console.log(`- Matched conversions: ${finalStats.matchedConversions}`);
    console.log();

    const matchRate = finalStats.transactionsWithAffiliates > 0 ? 
      (finalStats.matchedConversions / finalStats.transactionsWithAffiliates) * 100 : 0;
    
    console.log(`✅ Match Rate: ${matchRate.toFixed(1)}%`);
    
    if (matchRate >= 95) {
      console.log('🎉 EXCELLENT: Commission system is working perfectly!');
    } else if (matchRate >= 90) {
      console.log('✅ GOOD: Commission system is working well');
    } else {
      console.log('⚠️ NEEDS ATTENTION: Commission system needs review');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
if (require.main === module) {
  fixCommissionInconsistencies()
    .then(() => {
      console.log('\n🎉 Commission inconsistency fix completed!');
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixCommissionInconsistencies };