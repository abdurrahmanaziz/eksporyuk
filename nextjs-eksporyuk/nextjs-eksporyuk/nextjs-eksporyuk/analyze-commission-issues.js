const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCommissionIssues() {
  try {
    console.log('=== COMMISSION ISSUE ANALYSIS & FIX ===\n');

    // 1. Check the legalitas ekspor memberships that were found
    console.log('🔍 Analyzing found Ekspor Yuk memberships...\n');
    
    const eksporMemberships = await prisma.membership.findMany({
      where: {
        name: {
          contains: 'Ekspor Yuk',
          mode: 'insensitive'
        }
      }
    });

    console.log(`📦 Found ${eksporMemberships.length} Ekspor Yuk memberships:`);
    eksporMemberships.forEach((membership, index) => {
      const commissionAmount = parseFloat(membership.affiliateCommissionRate || 0);
      console.log(`${index + 1}. "${membership.name}"`);
      console.log(`   Price: Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: ${membership.affiliateCommissionType === 'PERCENTAGE' ? commissionAmount + '%' : 'Rp ' + commissionAmount.toLocaleString('id-ID')}`);
      console.log(`   Type: ${membership.affiliateCommissionType}`);
      console.log(`   ID: ${membership.id}`);
      console.log();
    });

    // 2. Look for high commission rates that might be errors
    console.log('🚨 Checking for suspicious commission rates...\n');
    
    const membershipsWithHighCommission = await prisma.membership.findMany({
      where: {
        affiliateCommissionRate: {
          gt: 50000000 // More than 50M
        }
      }
    });

    console.log(`⚠️ Found ${membershipsWithHighCommission.length} memberships with commission > 50M:`);
    membershipsWithHighCommission.forEach((membership, index) => {
      const commissionAmount = parseFloat(membership.affiliateCommissionRate || 0);
      console.log(`${index + 1}. "${membership.name}"`);
      console.log(`   Price: Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: Rp ${commissionAmount.toLocaleString('id-ID')}`);
      console.log(`   Type: ${membership.affiliateCommissionType}`);
      console.log(`   ID: ${membership.id}`);
      
      // Check if this could be the 79.8M issue
      if (commissionAmount >= 79000000 && commissionAmount <= 80000000) {
        console.log(`   🎯 POTENTIAL ISSUE: This could be the 79.8M commission problem!`);
        console.log(`   💡 Should be Rp 20,000 instead?`);
      }
      console.log();
    });

    // 3. Check for products with high commissions too
    const productsWithHighCommission = await prisma.product.findMany({
      where: {
        affiliateCommissionRate: {
          gt: 50000000
        }
      }
    });

    console.log(`⚠️ Found ${productsWithHighCommission.length} products with commission > 50M:`);
    productsWithHighCommission.forEach((product, index) => {
      const commissionAmount = parseFloat(product.affiliateCommissionRate || 0);
      console.log(`${index + 1}. "${product.name}"`);
      console.log(`   Price: Rp ${parseFloat(product.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: Rp ${commissionAmount.toLocaleString('id-ID')}`);
      console.log(`   Type: ${product.commissionType}`);
      console.log(`   ID: ${product.id}`);
      
      if (commissionAmount >= 79000000 && commissionAmount <= 80000000) {
        console.log(`   🎯 POTENTIAL ISSUE: This could be the 79.8M commission problem!`);
      }
      console.log();
    });

    // 4. Look for transactions with high affiliate shares that might be affected
    console.log('💳 Checking recent transactions with high affiliate shares...\n');
    
    const highAffiliateTransactions = await prisma.transaction.findMany({
      where: {
        affiliateShare: {
          gt: 1000000 // More than 1M
        },
        createdAt: {
          gte: new Date('2024-01-01')
        }
      },
      include: {
        user: true
      },
      orderBy: {
        affiliateShare: 'desc'
      },
      take: 10
    });

    console.log(`📊 Found ${highAffiliateTransactions.length} transactions with affiliate share > 1M in 2024:`);
    highAffiliateTransactions.forEach((trans, index) => {
      const shareAmount = parseFloat(trans.affiliateShare || 0);
      console.log(`${index + 1}. Transaction ID: ${trans.id}`);
      console.log(`   Amount: Rp ${parseFloat(trans.amount).toLocaleString('id-ID')}`);
      console.log(`   Affiliate Share: Rp ${shareAmount.toLocaleString('id-ID')}`);
      console.log(`   User: ${trans.user?.email || 'Unknown'}`);
      console.log(`   Date: ${trans.createdAt.toDateString()}`);
      
      if (shareAmount >= 79000000 && shareAmount <= 80000000) {
        console.log(`   🚨 FOUND IT! This transaction has the 79.8M affiliate share!`);
      }
      console.log();
    });

    // 5. Check affiliate migration completeness
    console.log('🔄 Checking affiliate migration completeness...\n');
    
    const affiliatesWithoutConversions = await prisma.affiliateProfile.findMany({
      where: {
        conversions: {
          none: {}
        }
      },
      include: {
        user: true
      }
    });

    console.log(`📋 Found ${affiliatesWithoutConversions.length} affiliates without conversion records:`);
    affiliatesWithoutConversions.forEach((affiliate, index) => {
      console.log(`${index + 1}. ${affiliate.user.name || affiliate.user.email}`);
      console.log(`   Total Earnings: Rp ${affiliate.totalEarnings.toLocaleString('id-ID')}`);
      console.log(`   Conversions: ${affiliate.totalConversions}`);
      console.log(`   Code: ${affiliate.affiliateCode}`);
      console.log();
    });

    // 6. Summary and action plan
    console.log('=== SUMMARY & ACTION PLAN ===\n');
    
    console.log('🎯 FINDINGS:');
    console.log(`- ${eksporMemberships.length} Ekspor Yuk memberships found`);
    console.log(`- ${membershipsWithHighCommission.length} memberships with >50M commission`);
    console.log(`- ${productsWithHighCommission.length} products with >50M commission`);
    console.log(`- ${highAffiliateTransactions.length} transactions with >1M affiliate share`);
    console.log(`- ${affiliatesWithoutConversions.length} affiliates need migration`);
    console.log();

    const totalIssues = membershipsWithHighCommission.length + productsWithHighCommission.length;
    
    if (totalIssues > 0) {
      console.log('🔧 RECOMMENDED FIXES:');
      console.log('1. Review and fix commission rates on identified products/memberships');
      console.log('2. Update commission from ~79.8M to 20,000 where applicable');
      console.log('3. Recalculate affected transactions if necessary');
      console.log('4. Complete affiliate migration for remaining affiliates');
      console.log();

      console.log('⚠️ SAFETY MEASURES:');
      console.log('- All changes will be logged');
      console.log('- No data will be deleted');
      console.log('- Backups recommended before making changes');
      console.log('- Test changes in staging first');
    } else {
      console.log('✅ No obvious commission issues found');
      console.log('- All commission rates appear reasonable');
      console.log('- Focus on completing affiliate migration');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Confirm which items need commission rate fixes');
    console.log('2. Prepare update scripts for commission corrections');
    console.log('3. Plan affiliate migration completion');
    console.log('4. Set up monitoring for future commission accuracy');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCommissionIssues();