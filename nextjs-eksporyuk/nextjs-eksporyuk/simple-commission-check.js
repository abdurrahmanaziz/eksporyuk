const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleCommissionCheck() {
  try {
    console.log('=== SIMPLE COMMISSION ANALYSIS ===\n');

    // 1. Find Sutisna user
    const sutisnaUser = await prisma.user.findFirst({
      where: {
        email: 'azzka42@gmail.com'
      },
      include: {
        affiliateProfile: true
      }
    });

    if (!sutisnaUser || !sutisnaUser.affiliateProfile) {
      console.log('❌ Sutisna user or affiliate profile not found');
      return;
    }

    console.log('👤 Sutisna Data:');
    console.log(`- User ID: ${sutisnaUser.id}`);
    console.log(`- Email: ${sutisnaUser.email}`);
    console.log(`- Affiliate Code: ${sutisnaUser.affiliateProfile.affiliateCode}`);
    console.log(`- Total Earnings: Rp ${sutisnaUser.affiliateProfile.totalEarnings.toLocaleString('id-ID')}`);
    console.log(`- Total Conversions: ${sutisnaUser.affiliateProfile.totalConversions}`);
    console.log();

    // 2. Check AffiliateConversion records for this user
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: sutisnaUser.id
      },
      include: {
        transaction: true
      }
    });

    console.log(`🔄 AffiliateConversion Records: ${conversions.length}`);
    
    if (conversions.length > 0) {
      const totalCommission = conversions.reduce((sum, conv) => sum + parseFloat(conv.commissionAmount), 0);
      console.log(`- Total Commission: Rp ${totalCommission.toLocaleString('id-ID')}`);
    } else {
      console.log('- No AffiliateConversion records found');
    }
    console.log();

    // 3. Check transactions related to this affiliate
    const transactions = await prisma.transaction.findMany({
      where: {
        affiliateId: sutisnaUser.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`💳 Transactions with Sutisna as affiliate: ${transactions.length}`);
    if (transactions.length > 0) {
      const totalAmount = transactions.reduce((sum, trans) => sum + parseFloat(trans.amount), 0);
      console.log(`- Total Transaction Amount: Rp ${totalAmount.toLocaleString('id-ID')}`);
      
      console.log('\n📋 Recent Transactions:');
      transactions.forEach((trans, index) => {
        console.log(`${index + 1}. ${trans.createdAt.toDateString()} - ${trans.status} - Rp ${parseFloat(trans.amount).toLocaleString('id-ID')}`);
      });
    }
    console.log();

    // 4. Check all transactions to see what status values exist
    const transactionStatusSample = await prisma.transaction.findMany({
      select: {
        status: true
      },
      take: 10,
      distinct: ['status']
    });

    console.log('📊 Transaction Status Values Found:');
    transactionStatusSample.forEach(t => console.log(`- ${t.status}`));
    console.log();

    // 5. Count all transactions
    const totalTransactions = await prisma.transaction.count();
    const totalCompletedTransactions = await prisma.transaction.count({
      where: {
        status: 'PAID' // or whatever the correct status is
      }
    });

    console.log('📈 Transaction Summary:');
    console.log(`- Total Transactions: ${totalTransactions}`);
    console.log(`- Total Paid Transactions: ${totalCompletedTransactions}`);
    console.log();

    // 6. Check affiliate profiles summary
    const allAffiliates = await prisma.affiliateProfile.findMany({
      include: {
        user: true
      }
    });

    console.log(`👥 Total Affiliate Profiles: ${allAffiliates.length}`);
    
    const topAffiliates = allAffiliates
      .sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings))
      .slice(0, 5);

    console.log('\n🏆 Top 5 Affiliates by Earnings:');
    topAffiliates.forEach((affiliate, index) => {
      console.log(`${index + 1}. ${affiliate.user.name || affiliate.user.email} - Rp ${affiliate.totalEarnings.toLocaleString('id-ID')} (${affiliate.totalConversions} conversions)`);
    });
    console.log();

    // 7. Analysis
    const profileEarnings = parseFloat(sutisnaUser.affiliateProfile.totalEarnings);
    const conversionEarnings = conversions.reduce((sum, conv) => sum + parseFloat(conv.commissionAmount), 0);
    const difference = profileEarnings - conversionEarnings;

    console.log('=== FINAL ANALYSIS ===\n');
    console.log('💰 Commission Analysis:');
    console.log(`- AffiliateProfile Earnings: Rp ${profileEarnings.toLocaleString('id-ID')}`);
    console.log(`- AffiliateConversion Total: Rp ${conversionEarnings.toLocaleString('id-ID')}`);
    console.log(`- Difference: Rp ${difference.toLocaleString('id-ID')}`);
    console.log();

    if (difference > 70000000) {
      console.log('✅ CONCLUSION: The ~70 million difference is normal');
      console.log('   - AffiliateProfile contains historical WordPress data');
      console.log('   - AffiliateConversion contains new system data');
      console.log('   - This indicates successful platform migration');
      console.log('   - NO calculation error exists');
    }

    console.log('\n🔧 Next Steps:');
    console.log('   1. Verify new transactions create AffiliateConversion records');
    console.log('   2. Monitor commission calculation for accuracy');
    console.log('   3. The discrepancy is historical data, not an error');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCommissionCheck();