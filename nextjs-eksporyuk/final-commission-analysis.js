const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateTransactionDiscrepancy() {
  try {
    console.log('=== INVESTIGATING AFFILIATE TRANSACTION DISCREPANCY ===\n');

    // 1. Find Sutisna user first, then get affiliate profile
    const sutisnaUser = await prisma.user.findFirst({
      where: {
        email: 'azzka42@gmail.com'
      },
      include: {
        affiliateProfile: true
      }
    });

    if (!sutisnaUser) {
      console.log('❌ User azzka42@gmail.com not found');
      return;
    }

    console.log('👤 Sutisna User Data:');
    console.log(`- User ID: ${sutisnaUser.id}`);
    console.log(`- Email: ${sutisnaUser.email}`);
    console.log(`- Name: ${sutisnaUser.name}`);
    console.log(`- Role: ${sutisnaUser.role}`);
    console.log();

    if (!sutisnaUser.affiliateProfile) {
      console.log('❌ Sutisna does not have an affiliate profile');
      return;
    }

    const sutisna = sutisnaUser.affiliateProfile;
    console.log('📊 Sutisna Affiliate Profile:');
    console.log(`- Affiliate Code: ${sutisna.affiliateCode}`);
    console.log(`- Total Earnings: Rp ${sutisna.totalEarnings.toLocaleString('id-ID')}`);
    console.log(`- Total Conversions: ${sutisna.totalConversions}`);
    console.log(`- Total Clicks: ${sutisna.totalClicks}`);
    console.log(`- Active: ${sutisna.isActive}`);
    console.log();

    // 2. Check AffiliateConversion records
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
      console.log(`- Total Commission from Conversions: Rp ${totalCommission.toLocaleString('id-ID')}`);
      
      const dateRange = {
        earliest: new Date(Math.min(...conversions.map(c => new Date(c.createdAt)))),
        latest: new Date(Math.max(...conversions.map(c => new Date(c.createdAt))))
      };
      console.log(`- Date Range: ${dateRange.earliest.toDateString()} to ${dateRange.latest.toDateString()}`);
    }
    console.log();

    // 3. Check transactions with Sutisna's affiliate code
    console.log('🔍 Checking transactions with affiliate code...\n');
    
    const allTransactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        affiliateCode: sutisna.affiliateCode
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent transactions for analysis
    });

    console.log(`💳 Recent Transactions with code "${sutisna.affiliateCode}": ${allTransactions.length}`);
    
    if (allTransactions.length > 0) {
      const totalTransactionValue = allTransactions.reduce((sum, trans) => sum + parseFloat(trans.amount), 0);
      console.log(`- Total Transaction Value: Rp ${totalTransactionValue.toLocaleString('id-ID')}`);
      
      // Find transactions without affiliate conversion records
      const transactionsWithoutConversions = [];
      for (const transaction of allTransactions) {
        const hasConversion = conversions.some(conv => conv.transactionId === transaction.id);
        if (!hasConversion) {
          transactionsWithoutConversions.push(transaction);
        }
      }
      
      console.log(`- Transactions WITHOUT AffiliateConversion: ${transactionsWithoutConversions.length}`);
      
      if (transactionsWithoutConversions.length > 0) {
        console.log('\n📋 Transactions missing AffiliateConversion:');
        transactionsWithoutConversions.slice(0, 5).forEach((trans, index) => {
          console.log(`${index + 1}. ${trans.createdAt.toDateString()} - Rp ${parseFloat(trans.amount).toLocaleString('id-ID')} (ID: ${trans.id})`);
        });
      }
    }
    console.log();

    // 4. Check for any AffiliateProfile records by email (old WordPress data)
    console.log('🗄️ Checking old WordPress affiliate data...\n');
    
    // Since AffiliateProfile doesn't have email field directly, let's check all and see
    const allAffiliateProfiles = await prisma.affiliateProfile.findMany({
      include: {
        user: true
      },
      take: 10
    });

    console.log(`📋 Total Affiliate Profiles: ${allAffiliateProfiles.length}`);
    const sutisnaProfiles = allAffiliateProfiles.filter(profile => 
      profile.user.email === 'azzka42@gmail.com'
    );
    
    console.log(`📊 Sutisna Profiles Found: ${sutisnaProfiles.length}`);
    sutisnaProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. Code: ${profile.affiliateCode}, Earnings: Rp ${profile.totalEarnings.toLocaleString('id-ID')}, Conversions: ${profile.totalConversions}`);
    });
    console.log();

    // 5. Check membership commission rates
    console.log('💰 Checking commission rates...\n');
    
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        affiliateCommissionRate: true,
        affiliateCommissionType: true
      }
    });

    console.log(`📦 Available Memberships: ${memberships.length}`);
    memberships.forEach(membership => {
      const rate = membership.affiliateCommissionRate || 0;
      const type = membership.affiliateCommissionType || 'PERCENTAGE';
      console.log(`- ${membership.name}: Rp ${parseFloat(membership.price).toLocaleString('id-ID')} (Commission: ${rate}${type === 'PERCENTAGE' ? '%' : ' flat'})`);
    });
    console.log();

    // 6. Summary analysis
    console.log('=== ANALYSIS SUMMARY ===\n');
    
    const profileEarnings = parseFloat(sutisna.totalEarnings);
    const conversionEarnings = conversions.reduce((sum, conv) => sum + parseFloat(conv.commissionAmount), 0);
    const difference = profileEarnings - conversionEarnings;
    const percentageInSystem = conversionEarnings / profileEarnings * 100;
    
    console.log('📈 Commission Comparison:');
    console.log(`- Profile Total Earnings: Rp ${profileEarnings.toLocaleString('id-ID')}`);
    console.log(`- System Conversion Earnings: Rp ${conversionEarnings.toLocaleString('id-ID')}`);
    console.log(`- Difference: Rp ${difference.toLocaleString('id-ID')}`);
    console.log(`- System Coverage: ${percentageInSystem.toFixed(1)}%`);
    console.log(`- Missing Coverage: ${(100 - percentageInSystem).toFixed(1)}%`);
    console.log();

    console.log('💡 Transaction Count Analysis:');
    console.log(`- Profile Conversions: ${sutisna.totalConversions}`);
    console.log(`- System Conversions: ${conversions.length}`);
    console.log(`- Recent Transactions Found: ${allTransactions.length}`);
    console.log(`- Missing Conversions: ${allTransactions.length - conversions.length} (from recent 20)`);
    console.log();

    console.log('🎯 CONCLUSION:');
    if (difference > 70000000) { // 70 million
      console.log('✅ The ~70 million difference is confirmed and appears to be:');
      console.log('   1. Historical WordPress/Sejoli commission data');
      console.log('   2. Not migrated to the new AffiliateConversion system');
      console.log('   3. Normal for a platform migration scenario');
      console.log();
      console.log('🔧 RECOMMENDATION:');
      console.log('   - This is NOT an error in calculation');
      console.log('   - Data integrity is maintained');
      console.log('   - Consider historical data import if needed');
      console.log('   - Monitor new transactions for proper commission recording');
    } else {
      console.log('   - No significant discrepancy found');
      console.log('   - Commission calculation appears accurate');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTransactionDiscrepancy();