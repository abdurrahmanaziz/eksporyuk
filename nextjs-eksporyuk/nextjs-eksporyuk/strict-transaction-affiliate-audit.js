const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function strictTransactionAffiliateAudit() {
  try {
    console.log('=== STRICT TRANSACTION & AFFILIATE AUDIT ===\n');
    console.log('📅 Audit Date: 22 Desember 2025\n');

    // 1. CRITICAL DATA INTEGRITY CHECKS
    console.log('🔍 CRITICAL DATA INTEGRITY CHECKS...\n');
    
    // Check for transactions without proper affiliate tracking
    const criticalIssues = {
      transactionsWithAffiliateButNoShare: await prisma.transaction.count({
        where: {
          status: 'SUCCESS',
          affiliateId: { not: null },
          affiliateShare: { lte: 0 }
        }
      }),
      transactionsWithShareButNoAffiliate: await prisma.transaction.count({
        where: {
          status: 'SUCCESS',
          affiliateId: null,
          affiliateShare: { gt: 0 }
        }
      }),
      conversionsWithoutTransactions: await prisma.affiliateConversion.count({
        where: {
          transactionId: null
        }
      }),
      transactionsWithoutConversions: await prisma.transaction.count({
        where: {
          status: 'SUCCESS',
          affiliateId: { not: null },
          affiliateShare: { gt: 0 },
          affiliateConversion: { is: null }
        }
      })
    };

    console.log('🚨 Critical Issues Found:');
    console.log(`- Transactions with affiliate but no share: ${criticalIssues.transactionsWithAffiliateButNoShare}`);
    console.log(`- Transactions with share but no affiliate: ${criticalIssues.transactionsWithShareButNoAffiliate}`);
    console.log(`- Conversions without transactions: ${criticalIssues.conversionsWithoutTransactions}`);
    console.log(`- Transactions without conversions: ${criticalIssues.transactionsWithoutConversions}`);
    console.log();

    // 2. COMMISSION CALCULATION VERIFICATION
    console.log('💰 COMMISSION CALCULATION VERIFICATION...\n');
    
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      include: {
        affiliateConversion: true,
        product: true,
        membership: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Sample recent transactions
    });

    console.log(`📊 Analyzing ${recentTransactions.length} recent affiliate transactions...\n`);

    const commissionAnalysis = {
      total: recentTransactions.length,
      withConversions: 0,
      withoutConversions: 0,
      correctCommissions: 0,
      incorrectCommissions: 0,
      totalTransactionValue: 0,
      totalCommissionPaid: 0,
      totalCommissionCalculated: 0
    };

    const commissionErrors = [];

    for (const transaction of recentTransactions) {
      const transactionAmount = parseFloat(transaction.amount);
      const affiliateShare = parseFloat(transaction.affiliateShare || 0);
      
      commissionAnalysis.totalTransactionValue += transactionAmount;
      commissionAnalysis.totalCommissionPaid += affiliateShare;

      // Calculate expected commission
      let expectedCommission = 0;
      let commissionRate = 0;
      let commissionType = 'PERCENTAGE';

      if (transaction.product && transaction.product.affiliateCommissionRate) {
        commissionRate = parseFloat(transaction.product.affiliateCommissionRate);
        commissionType = transaction.product.affiliateCommissionType || 'PERCENTAGE';
      } else if (transaction.membership && transaction.membership.affiliateCommissionRate) {
        commissionRate = parseFloat(transaction.membership.affiliateCommissionRate);
        commissionType = transaction.membership.affiliateCommissionType || 'PERCENTAGE';
      }

      if (commissionType === 'PERCENTAGE') {
        expectedCommission = (transactionAmount * commissionRate) / 100;
      } else if (commissionType === 'FLAT') {
        expectedCommission = commissionRate;
      }

      commissionAnalysis.totalCommissionCalculated += expectedCommission;

      // Check conversion record
      if (transaction.affiliateConversion) {
        commissionAnalysis.withConversions++;
        
        const conversionAmount = parseFloat(transaction.affiliateConversion.commissionAmount);
        const expectedVsActual = Math.abs(expectedCommission - affiliateShare);
        const conversionVsTransaction = Math.abs(conversionAmount - affiliateShare);
        
        if (expectedVsActual < 100 && conversionVsTransaction < 100) { // 100 rupiah tolerance
          commissionAnalysis.correctCommissions++;
        } else {
          commissionAnalysis.incorrectCommissions++;
          
          commissionErrors.push({
            transactionId: transaction.id,
            expected: expectedCommission,
            affiliateShare: affiliateShare,
            conversionAmount: conversionAmount,
            difference: expectedVsActual,
            item: transaction.product?.name || transaction.membership?.name || 'Unknown'
          });
        }
      } else {
        commissionAnalysis.withoutConversions++;
        
        const expectedVsActual = Math.abs(expectedCommission - affiliateShare);
        if (expectedVsActual < 100) {
          commissionAnalysis.correctCommissions++;
        } else {
          commissionAnalysis.incorrectCommissions++;
          
          commissionErrors.push({
            transactionId: transaction.id,
            expected: expectedCommission,
            affiliateShare: affiliateShare,
            conversionAmount: 0,
            difference: expectedVsActual,
            item: transaction.product?.name || transaction.membership?.name || 'Unknown'
          });
        }
      }
    }

    console.log('📊 Commission Analysis Results:');
    console.log(`- Total Transactions: ${commissionAnalysis.total}`);
    console.log(`- With Conversions: ${commissionAnalysis.withConversions}`);
    console.log(`- Without Conversions: ${commissionAnalysis.withoutConversions}`);
    console.log(`- Correct Commissions: ${commissionAnalysis.correctCommissions}`);
    console.log(`- Incorrect Commissions: ${commissionAnalysis.incorrectCommissions}`);
    console.log(`- Total Transaction Value: Rp ${commissionAnalysis.totalTransactionValue.toLocaleString('id-ID')}`);
    console.log(`- Total Commission Paid: Rp ${commissionAnalysis.totalCommissionPaid.toLocaleString('id-ID')}`);
    console.log(`- Total Commission Expected: Rp ${commissionAnalysis.totalCommissionCalculated.toLocaleString('id-ID')}`);
    
    const commissionDifference = commissionAnalysis.totalCommissionCalculated - commissionAnalysis.totalCommissionPaid;
    console.log(`- Commission Difference: Rp ${commissionDifference.toLocaleString('id-ID')}`);
    console.log();

    // Show commission errors if any
    if (commissionErrors.length > 0) {
      console.log('⚠️ COMMISSION CALCULATION ERRORS:');
      console.log();
      
      commissionErrors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. Transaction ${error.transactionId}`);
        console.log(`   Item: ${error.item}`);
        console.log(`   Expected: Rp ${error.expected.toLocaleString('id-ID')}`);
        console.log(`   Actual: Rp ${error.affiliateShare.toLocaleString('id-ID')}`);
        console.log(`   Difference: Rp ${error.difference.toLocaleString('id-ID')}`);
        console.log();
      });
      
      if (commissionErrors.length > 10) {
        console.log(`... and ${commissionErrors.length - 10} more errors\n`);
      }
    }

    // 3. AFFILIATE PERFORMANCE AUDIT
    console.log('👥 AFFILIATE PERFORMANCE AUDIT...\n');
    
    const affiliateAudit = await prisma.affiliateProfile.findMany({
      include: {
        user: true,
        conversions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      },
      orderBy: {
        totalEarnings: 'desc'
      },
      take: 20
    });

    console.log('🏆 Top 20 Affiliates Performance:');
    console.log();
    
    for (const affiliate of affiliateAudit) {
      const recentEarnings = affiliate.conversions.reduce((sum, conv) => 
        sum + parseFloat(conv.commissionAmount), 0
      );
      
      console.log(`📊 ${affiliate.user.name || affiliate.user.email}`);
      console.log(`   Total Earnings: Rp ${parseFloat(affiliate.totalEarnings).toLocaleString('id-ID')}`);
      console.log(`   Recent Earnings (30d): Rp ${recentEarnings.toLocaleString('id-ID')}`);
      console.log(`   Total Conversions: ${affiliate.totalConversions}`);
      console.log(`   Recent Conversions: ${affiliate.conversions.length}`);
      console.log(`   Status: ${affiliate.isActive ? 'Active' : 'Inactive'}`);
      console.log();
    }

    // 4. BUSINESS RULE COMPLIANCE
    console.log('📋 BUSINESS RULE COMPLIANCE CHECK...\n');
    
    const complianceChecks = {
      productsWithoutCommission: await prisma.product.count({
        where: {
          OR: [
            { affiliateCommissionRate: null },
            { affiliateCommissionRate: 0 }
          ]
        }
      }),
      membershipsWithoutCommission: await prisma.membership.count({
        where: {
          OR: [
            { affiliateCommissionRate: null },
            { affiliateCommissionRate: 0 }
          ]
        }
      }),
      inactiveAffiliatesWithRecentActivity: await prisma.affiliateProfile.count({
        where: {
          isActive: false,
          conversions: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
      transactionsWithoutStatus: await prisma.transaction.count({
        where: {
          OR: [
            { status: null },
            { status: '' }
          ]
        }
      })
    };

    console.log('⚖️ Business Rule Violations:');
    console.log(`- Products without commission: ${complianceChecks.productsWithoutCommission}`);
    console.log(`- Memberships without commission: ${complianceChecks.membershipsWithoutCommission}`);
    console.log(`- Inactive affiliates with recent activity: ${complianceChecks.inactiveAffiliatesWithRecentActivity}`);
    console.log(`- Transactions without status: ${complianceChecks.transactionsWithoutStatus}`);
    console.log();

    // 5. GENERATE COMPLIANCE SCORE
    console.log('🎯 COMPLIANCE SCORE CALCULATION...\n');
    
    const totalIssues = Object.values(criticalIssues).reduce((a, b) => a + b, 0) +
                       commissionAnalysis.incorrectCommissions +
                       Object.values(complianceChecks).reduce((a, b) => a + b, 0);
    
    const totalTransactions = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
    const complianceRate = totalTransactions > 0 ? ((totalTransactions - totalIssues) / totalTransactions) * 100 : 0;

    console.log(`📊 Overall System Health:`);
    console.log(`- Total Issues Found: ${totalIssues}`);
    console.log(`- Total Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`- Compliance Rate: ${complianceRate.toFixed(2)}%`);
    console.log();

    if (complianceRate >= 99) {
      console.log('🎉 EXCELLENT: System is highly compliant');
    } else if (complianceRate >= 95) {
      console.log('✅ GOOD: System is mostly compliant with minor issues');
    } else if (complianceRate >= 90) {
      console.log('⚠️ WARNING: System has compliance issues that need attention');
    } else {
      console.log('🚨 CRITICAL: System has major compliance issues requiring immediate action');
    }

    // 6. RECOMMENDED ACTIONS
    console.log('\n💡 RECOMMENDED ACTIONS:\n');
    
    const actions = [];
    
    if (criticalIssues.transactionsWithAffiliateButNoShare > 0) {
      actions.push(`Fix ${criticalIssues.transactionsWithAffiliateButNoShare} transactions with affiliate but no commission`);
    }
    
    if (criticalIssues.transactionsWithoutConversions > 0) {
      actions.push(`Create ${criticalIssues.transactionsWithoutConversions} missing conversion records`);
    }
    
    if (commissionAnalysis.incorrectCommissions > 0) {
      actions.push(`Correct ${commissionAnalysis.incorrectCommissions} commission calculation errors`);
    }
    
    if (complianceChecks.productsWithoutCommission > 0) {
      actions.push(`Set commission rates for ${complianceChecks.productsWithoutCommission} products`);
    }
    
    if (complianceChecks.membershipsWithoutCommission > 0) {
      actions.push(`Set commission rates for ${complianceChecks.membershipsWithoutCommission} memberships`);
    }

    if (actions.length === 0) {
      console.log('✅ No critical actions required - system is operating correctly');
    } else {
      actions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
    }

    return {
      criticalIssues,
      commissionAnalysis,
      complianceChecks,
      complianceRate,
      recommendedActions: actions,
      affiliateCount: affiliateAudit.length
    };

  } catch (error) {
    console.error('❌ Error in audit:', error.message);
    console.error('Stack:', error.stack);
    return { error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  strictTransactionAffiliateAudit()
    .then((result) => {
      if (result.error) {
        console.log('\n❌ Audit failed');
      } else {
        console.log('\n=== AUDIT COMPLETE ===');
        console.log(`✅ Compliance Rate: ${result.complianceRate.toFixed(2)}%`);
        console.log(`📊 ${result.recommendedActions.length} actions recommended`);
      }
    })
    .catch((error) => {
      console.error('\n💥 Audit crashed:', error.message);
      process.exit(1);
    });
}

module.exports = { strictTransactionAffiliateAudit };