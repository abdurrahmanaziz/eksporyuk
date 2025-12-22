const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deepSearchCommissionIssue() {
  try {
    console.log('=== DEEP SEARCH FOR 79.8M COMMISSION ISSUE ===\n');

    // 1. Search in all possible places where 79.8M might appear
    console.log('🔍 Searching for 79.8M commission in all tables...\n');

    // Check specific range around 79.8M
    const targetAmount = 79800000; // 79.8M
    const tolerance = 200000; // 200K tolerance
    const minAmount = targetAmount - tolerance;
    const maxAmount = targetAmount + tolerance;

    console.log(`🎯 Searching for amounts between Rp ${minAmount.toLocaleString('id-ID')} and Rp ${maxAmount.toLocaleString('id-ID')}\n`);

    // 1. Check Product table
    const productsWithTarget = await prisma.product.findMany({
      where: {
        OR: [
          {
            affiliateCommissionRate: {
              gte: minAmount,
              lte: maxAmount
            }
          },
          {
            mentorCommission: {
              gte: minAmount,
              lte: maxAmount
            }
          },
          {
            price: {
              gte: minAmount,
              lte: maxAmount
            }
          }
        ]
      }
    });

    console.log(`📦 Products with ~79.8M values: ${productsWithTarget.length}`);
    productsWithTarget.forEach(product => {
      console.log(`- "${product.name}" (ID: ${product.id})`);
      console.log(`  Price: Rp ${parseFloat(product.price).toLocaleString('id-ID')}`);
      console.log(`  Affiliate Commission: Rp ${parseFloat(product.affiliateCommissionRate).toLocaleString('id-ID')}`);
      console.log(`  Mentor Commission: Rp ${parseFloat(product.mentorCommission).toLocaleString('id-ID')}`);
      console.log();
    });

    // 2. Check Membership table
    const membershipsWithTarget = await prisma.membership.findMany({
      where: {
        OR: [
          {
            affiliateCommissionRate: {
              gte: minAmount,
              lte: maxAmount
            }
          },
          {
            price: {
              gte: minAmount,
              lte: maxAmount
            }
          }
        ]
      }
    });

    console.log(`🎫 Memberships with ~79.8M values: ${membershipsWithTarget.length}`);
    membershipsWithTarget.forEach(membership => {
      console.log(`- "${membership.name}" (ID: ${membership.id})`);
      console.log(`  Price: Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
      console.log(`  Commission: Rp ${parseFloat(membership.affiliateCommissionRate || 0).toLocaleString('id-ID')}`);
      console.log();
    });

    // 3. Check Transaction table
    const transactionsWithTarget = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            amount: {
              gte: minAmount,
              lte: maxAmount
            }
          },
          {
            affiliateShare: {
              gte: minAmount,
              lte: maxAmount
            }
          },
          {
            founderShare: {
              gte: minAmount,
              lte: maxAmount
            }
          },
          {
            coFounderShare: {
              gte: minAmount,
              lte: maxAmount
            }
          }
        ]
      },
      include: {
        user: true
      }
    });

    console.log(`💳 Transactions with ~79.8M values: ${transactionsWithTarget.length}`);
    transactionsWithTarget.forEach(trans => {
      console.log(`- Transaction ${trans.id} (${trans.user?.email || 'Unknown'})`);
      console.log(`  Amount: Rp ${parseFloat(trans.amount).toLocaleString('id-ID')}`);
      console.log(`  Affiliate Share: Rp ${parseFloat(trans.affiliateShare || 0).toLocaleString('id-ID')}`);
      console.log(`  Founder Share: Rp ${parseFloat(trans.founderShare || 0).toLocaleString('id-ID')}`);
      console.log(`  Co-Founder Share: Rp ${parseFloat(trans.coFounderShare || 0).toLocaleString('id-ID')}`);
      console.log(`  Date: ${trans.createdAt}`);
      console.log();
    });

    // 4. Check AffiliateConversion table
    const conversionsWithTarget = await prisma.affiliateConversion.findMany({
      where: {
        commissionAmount: {
          gte: minAmount,
          lte: maxAmount
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

    console.log(`🔄 Affiliate conversions with ~79.8M commission: ${conversionsWithTarget.length}`);
    conversionsWithTarget.forEach(conv => {
      console.log(`- Conversion ${conv.id}`);
      console.log(`  Affiliate: ${conv.affiliate.user.name || conv.affiliate.user.email}`);
      console.log(`  Commission: Rp ${parseFloat(conv.commissionAmount).toLocaleString('id-ID')}`);
      console.log(`  Transaction: ${conv.transactionId}`);
      console.log(`  Date: ${conv.createdAt}`);
      console.log();
    });

    // 5. Check AffiliateProfile for total earnings around 79.8M
    const profilesWithTarget = await prisma.affiliateProfile.findMany({
      where: {
        totalEarnings: {
          gte: minAmount,
          lte: maxAmount
        }
      },
      include: {
        user: true
      }
    });

    console.log(`👥 Affiliate profiles with ~79.8M total earnings: ${profilesWithTarget.length}`);
    profilesWithTarget.forEach(profile => {
      console.log(`- ${profile.user.name || profile.user.email}`);
      console.log(`  Total Earnings: Rp ${parseFloat(profile.totalEarnings).toLocaleString('id-ID')}`);
      console.log(`  Conversions: ${profile.totalConversions}`);
      console.log(`  Code: ${profile.affiliateCode}`);
      console.log();
    });

    // 6. Search in text fields for "legalitas" or "legal"
    console.log('🔎 Searching text fields for legalitas/legal references...\n');

    const allProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'legal', mode: 'insensitive' } },
          { description: { contains: 'legal', mode: 'insensitive' } },
          { name: { contains: 'legalitas', mode: 'insensitive' } },
          { description: { contains: 'legalitas', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`📦 Products mentioning 'legal/legalitas': ${allProducts.length}`);
    allProducts.forEach(product => {
      console.log(`- "${product.name}"`);
      console.log(`  Price: Rp ${parseFloat(product.price).toLocaleString('id-ID')}`);
      console.log(`  Commission: Rp ${parseFloat(product.affiliateCommissionRate).toLocaleString('id-ID')}`);
      if (product.description.toLowerCase().includes('legal')) {
        console.log(`  📝 Description mentions 'legal'`);
      }
      console.log();
    });

    const allMemberships = await prisma.membership.findMany({
      where: {
        OR: [
          { name: { contains: 'legal', mode: 'insensitive' } },
          { description: { contains: 'legal', mode: 'insensitive' } },
          { name: { contains: 'legalitas', mode: 'insensitive' } },
          { description: { contains: 'legalitas', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`🎫 Memberships mentioning 'legal/legalitas': ${allMemberships.length}`);
    allMemberships.forEach(membership => {
      console.log(`- "${membership.name}"`);
      console.log(`  Price: Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
      console.log(`  Commission: Rp ${parseFloat(membership.affiliateCommissionRate || 0).toLocaleString('id-ID')}`);
      console.log();
    });

    // 7. Check all commission rates to see patterns
    console.log('📊 Analyzing all commission rate patterns...\n');

    const highCommissionProducts = await prisma.product.findMany({
      where: {
        affiliateCommissionRate: {
          gt: 10000 // > 10K
        }
      },
      orderBy: {
        affiliateCommissionRate: 'desc'
      },
      take: 10
    });

    console.log('🏆 Top 10 products by commission rate:');
    highCommissionProducts.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}"`);
      console.log(`   Commission: Rp ${parseFloat(product.affiliateCommissionRate).toLocaleString('id-ID')}`);
      console.log(`   Price: Rp ${parseFloat(product.price).toLocaleString('id-ID')}`);
    });
    console.log();

    const highCommissionMemberships = await prisma.membership.findMany({
      where: {
        affiliateCommissionRate: {
          gt: 10000
        }
      },
      orderBy: {
        affiliateCommissionRate: 'desc'
      },
      take: 10
    });

    console.log('🏆 Top 10 memberships by commission rate:');
    highCommissionMemberships.forEach((membership, index) => {
      console.log(`${index + 1}. "${membership.name}"`);
      console.log(`   Commission: Rp ${parseFloat(membership.affiliateCommissionRate || 0).toLocaleString('id-ID')}`);
      console.log(`   Price: Rp ${parseFloat(membership.price).toLocaleString('id-ID')}`);
    });
    console.log();

    // 8. Summary
    console.log('=== DEEP SEARCH SUMMARY ===\n');
    
    const totalFound = productsWithTarget.length + membershipsWithTarget.length + 
                     transactionsWithTarget.length + conversionsWithTarget.length + 
                     profilesWithTarget.length;

    console.log('🎯 SEARCH RESULTS:');
    console.log(`- Products with ~79.8M: ${productsWithTarget.length}`);
    console.log(`- Memberships with ~79.8M: ${membershipsWithTarget.length}`);
    console.log(`- Transactions with ~79.8M: ${transactionsWithTarget.length}`);
    console.log(`- Affiliate conversions with ~79.8M: ${conversionsWithTarget.length}`);
    console.log(`- Affiliate profiles with ~79.8M: ${profilesWithTarget.length}`);
    console.log(`- Total items found: ${totalFound}`);
    console.log();

    if (totalFound === 0) {
      console.log('🤔 NO 79.8M COMMISSION FOUND!');
      console.log();
      console.log('💭 POSSIBLE EXPLANATIONS:');
      console.log('1. The issue might have been already fixed');
      console.log('2. The amount might be different than 79.8M');
      console.log('3. It could be in a different field or calculation');
      console.log('4. The data might be in a different format');
      console.log();
      console.log('🔍 RECOMMENDATIONS:');
      console.log('1. Check if the issue was reported correctly');
      console.log('2. Look for other suspicious commission amounts');
      console.log('3. Review recent commission changes');
      console.log('4. Check system logs for any commission-related errors');
    } else {
      console.log('✅ FOUND POTENTIAL ISSUES!');
      console.log('🔧 Next step: Review the found items and determine correct commission amounts');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deepSearchCommissionIssue();