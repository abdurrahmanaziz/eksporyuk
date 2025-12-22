const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateCommissionIssues() {
  try {
    console.log('=== INVESTIGATING COMMISSION ISSUES ===\n');

    // 1. Look for "legalitas ekspor" product with wrong commission
    console.log('🔍 Searching for Legalitas Ekspor product...\n');
    
    // Check in Product table
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'legalitas', mode: 'insensitive' } },
          { name: { contains: 'ekspor', mode: 'insensitive' } },
          { name: { contains: 'legal', mode: 'insensitive' } },
          { description: { contains: 'legalitas', mode: 'insensitive' } },
          { description: { contains: 'ekspor', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`📦 Found ${products.length} products related to legalitas/ekspor:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}" - Rp ${parseFloat(product.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: ${product.affiliateCommissionRate}${product.affiliateCommissionType === 'PERCENTAGE' ? '%' : ' flat'}`);
      console.log(`   ID: ${product.id}`);
      console.log();
    });

    // Check in Membership table
    const memberships = await prisma.membership.findMany({
      where: {
        OR: [
          { name: { contains: 'legalitas', mode: 'insensitive' } },
          { name: { contains: 'ekspor', mode: 'insensitive' } },
          { name: { contains: 'legal', mode: 'insensitive' } },
          { description: { contains: 'legalitas', mode: 'insensitive' } },
          { description: { contains: 'ekspor', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`🎫 Found ${memberships.length} memberships related to legalitas/ekspor:`);
    memberships.forEach((membership, index) => {
      console.log(`${index + 1}. "${membership.name}" - Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: ${membership.affiliateCommissionRate}${membership.affiliateCommissionType === 'PERCENTAGE' ? '%' : ' flat'}`);
      console.log(`   ID: ${membership.id}`);
      console.log();
    });

    // 2. Look for transactions with suspicious commission amounts (~79.8M)
    console.log('💰 Searching for transactions with ~79.8M commission...\n');
    
    const suspiciousTransactions = await prisma.transaction.findMany({
      where: {
        affiliateShare: {
          gte: 79000000, // 79 million
          lte: 80000000  // 80 million
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🚨 Found ${suspiciousTransactions.length} transactions with ~79.8M affiliate commission:`);
    suspiciousTransactions.forEach((trans, index) => {
      console.log(`${index + 1}. Transaction ID: ${trans.id}`);
      console.log(`   User: ${trans.user?.name || trans.user?.email || 'Unknown'}`);
      console.log(`   Amount: Rp ${parseFloat(trans.amount).toLocaleString('id-ID')}`);
      console.log(`   Affiliate Share: Rp ${parseFloat(trans.affiliateShare || 0).toLocaleString('id-ID')}`);
      console.log(`   Date: ${trans.createdAt}`);
      console.log(`   Status: ${trans.status}`);
      console.log();
    });

    // 3. Check AffiliateConversion records with high commission
    const highCommissions = await prisma.affiliateConversion.findMany({
      where: {
        commissionAmount: {
          gte: 79000000,
          lte: 80000000
        }
      },
      include: {
        affiliate: {
          include: {
            user: true
          }
        },
        transaction: true
      }
    });

    console.log(`📊 Found ${highCommissions.length} affiliate conversions with ~79.8M commission:`);
    highCommissions.forEach((conv, index) => {
      console.log(`${index + 1}. Conversion ID: ${conv.id}`);
      console.log(`   Affiliate: ${conv.affiliate.user.name || conv.affiliate.user.email}`);
      console.log(`   Commission: Rp ${parseFloat(conv.commissionAmount).toLocaleString('id-ID')}`);
      console.log(`   Transaction ID: ${conv.transactionId}`);
      console.log(`   Date: ${conv.createdAt}`);
      console.log();
    });

    // 4. Check for commission calculation issues
    console.log('🧮 Analyzing commission calculation patterns...\n');
    
    // Get recent transactions with affiliate shares
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        affiliateShare: {
          gt: 0
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

    console.log('💳 Top 10 transactions by affiliate share (2024+):');
    recentTransactions.forEach((trans, index) => {
      const commissionRate = trans.amount > 0 ? (parseFloat(trans.affiliateShare || 0) / parseFloat(trans.amount)) * 100 : 0;
      console.log(`${index + 1}. Rp ${parseFloat(trans.amount).toLocaleString('id-ID')} → Rp ${parseFloat(trans.affiliateShare || 0).toLocaleString('id-ID')} (${commissionRate.toFixed(1)}%)`);
      console.log(`   User: ${trans.user?.email || 'Unknown'} | ${trans.createdAt.toDateString()}`);
    });
    console.log();

    // 5. Check affiliate migration status
    console.log('🔄 Checking affiliate migration status...\n');
    
    const affiliateStats = {
      totalAffiliates: await prisma.affiliateProfile.count(),
      totalConversions: await prisma.affiliateConversion.count(),
      affiliatesWithConversions: await prisma.affiliateProfile.count({
        where: {
          conversions: {
            some: {}
          }
        }
      })
    };

    console.log('📈 Affiliate Migration Stats:');
    console.log(`- Total Affiliate Profiles: ${affiliateStats.totalAffiliates}`);
    console.log(`- Total AffiliateConversions: ${affiliateStats.totalConversions}`);
    console.log(`- Affiliates with Conversions: ${affiliateStats.affiliatesWithConversions}`);
    console.log(`- Affiliates without Conversions: ${affiliateStats.totalAffiliates - affiliateStats.affiliatesWithConversions}`);
    
    const migrationPercentage = (affiliateStats.affiliatesWithConversions / affiliateStats.totalAffiliates) * 100;
    console.log(`- Migration Coverage: ${migrationPercentage.toFixed(1)}%`);
    console.log();

    // 6. Find specific commission issues
    console.log('🚨 CHECKING FOR SPECIFIC ISSUES...\n');
    
    // Look for products where commission might be set as amount instead of percentage
    const productsWithHighCommission = await prisma.product.findMany({
      where: {
        OR: [
          {
            affiliateCommissionType: 'FLAT',
            affiliateCommissionRate: {
              gt: 1000000 // More than 1M flat commission
            }
          },
          {
            affiliateCommissionType: 'PERCENTAGE',
            affiliateCommissionRate: {
              gt: 50 // More than 50% commission
            }
          }
        ]
      }
    });

    console.log(`⚠️ Products with potentially incorrect commission rates: ${productsWithHighCommission.length}`);
    productsWithHighCommission.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}"`);
      console.log(`   Price: Rp ${parseFloat(product.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: ${product.affiliateCommissionRate}${product.affiliateCommissionType === 'PERCENTAGE' ? '%' : ' flat'}`);
      
      if (product.affiliateCommissionType === 'PERCENTAGE' && product.affiliateCommissionRate > 50) {
        console.log(`   🚨 ISSUE: Commission rate ${product.affiliateCommissionRate}% seems too high!`);
      }
      
      if (product.affiliateCommissionType === 'FLAT' && product.affiliateCommissionRate > 1000000) {
        console.log(`   🚨 ISSUE: Flat commission Rp ${product.affiliateCommissionRate.toLocaleString('id-ID')} seems too high!`);
        
        // Check if this could be the 79.8M issue
        if (product.affiliateCommissionRate >= 79000000 && product.affiliateCommissionRate <= 80000000) {
          console.log(`   🎯 FOUND THE ISSUE! This might be the 79.8M commission product!`);
          console.log(`   💡 Should this be Rp 20,000 instead of Rp ${product.affiliateCommissionRate.toLocaleString('id-ID')}?`);
        }
      }
      console.log();
    });

    // Same check for memberships
    const membershipsWithHighCommission = await prisma.membership.findMany({
      where: {
        OR: [
          {
            affiliateCommissionType: 'FLAT',
            affiliateCommissionRate: {
              gt: 1000000
            }
          },
          {
            affiliateCommissionType: 'PERCENTAGE',
            affiliateCommissionRate: {
              gt: 50
            }
          }
        ]
      }
    });

    console.log(`⚠️ Memberships with potentially incorrect commission rates: ${membershipsWithHighCommission.length}`);
    membershipsWithHighCommission.forEach((membership, index) => {
      console.log(`${index + 1}. "${membership.name}"`);
      console.log(`   Price: Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
      console.log(`   Commission: ${membership.affiliateCommissionRate}${membership.affiliateCommissionType === 'PERCENTAGE' ? '%' : ' flat'}`);
      
      if (membership.affiliateCommissionType === 'FLAT' && membership.affiliateCommissionRate > 1000000) {
        console.log(`   🚨 ISSUE: Flat commission Rp ${membership.affiliateCommissionRate.toLocaleString('id-ID')} seems too high!`);
        
        if (membership.affiliateCommissionRate >= 79000000 && membership.affiliateCommissionRate <= 80000000) {
          console.log(`   🎯 FOUND THE ISSUE! This might be the 79.8M commission membership!`);
          console.log(`   💡 Should this be Rp 20,000 instead of Rp ${membership.affiliateCommissionRate.toLocaleString('id-ID')}?`);
        }
      }
      console.log();
    });

    console.log('=== INVESTIGATION SUMMARY ===\n');
    
    console.log('🎯 KEY FINDINGS:');
    console.log(`- Found ${productsWithHighCommission.length + membershipsWithHighCommission.length} products/memberships with suspicious commission rates`);
    console.log(`- Found ${suspiciousTransactions.length} transactions with ~79.8M affiliate share`);
    console.log(`- Found ${highCommissions.length} affiliate conversions with ~79.8M commission`);
    console.log(`- Affiliate migration coverage: ${migrationPercentage.toFixed(1)}%`);
    console.log();

    if (productsWithHighCommission.length > 0 || membershipsWithHighCommission.length > 0) {
      console.log('🔧 NEXT STEPS NEEDED:');
      console.log('1. Review the identified products/memberships with high commission rates');
      console.log('2. Verify if the commission should be 20,000 (flat) instead of 79,800,000');
      console.log('3. Update the commission rates if confirmed incorrect');
      console.log('4. Check if any transactions need commission recalculation');
      console.log();
    }

    console.log('💡 RECOMMENDATIONS:');
    console.log('1. First verify the correct commission amount (Rp 20,000)');
    console.log('2. Update product/membership commission rates');
    console.log('3. Consider recalculating affected transactions (if any)');
    console.log('4. Ensure affiliate migration is working correctly for new transactions');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateCommissionIssues();