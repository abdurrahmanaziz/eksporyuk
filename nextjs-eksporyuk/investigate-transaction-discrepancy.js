const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateTransactionDiscrepancy() {
  try {
    console.log('=== INVESTIGATING AFFILIATE TRANSACTION DISCREPANCY ===\n');

    // 1. Check Sutisna's data
    const sutisna = await prisma.affiliateProfile.findFirst({
      where: {
        email: 'azzka42@gmail.com'
      }
    });

    if (!sutisna) {
      console.log('❌ Sutisna not found in AffiliateProfile');
      return;
    }

    console.log('👤 Sutisna Data:');
    console.log(`- Email: ${sutisna.email}`);
    console.log(`- Code: ${sutisna.code}`);
    console.log(`- Total Earnings: Rp ${sutisna.totalEarnings.toLocaleString('id-ID')}`);
    console.log(`- Total Conversions: ${sutisna.totalConversions}`);
    console.log(`- Total Clicks: ${sutisna.totalClicks}`);
    console.log();

    // 2. Check AffiliateConversion records
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliate: {
          email: 'azzka42@gmail.com'
        }
      },
      include: {
        transaction: true
      }
    });

    console.log(`📊 AffiliateConversion Records: ${conversions.length}`);
    
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

    // 3. Check if there are transactions without affiliate conversions
    console.log('🔍 Checking for missing affiliate conversions...\n');
    
    // Get all transactions that should have affiliate commissions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        affiliateCode: sutisna.code
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`💳 Total Transactions with Sutisna's affiliate code: ${allTransactions.length}`);
    
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
        const missingCommissionValue = transactionsWithoutConversions.reduce((sum, trans) => sum + parseFloat(trans.amount), 0);
        console.log(`- Missing Transaction Value: Rp ${missingCommissionValue.toLocaleString('id-ID')}`);
        console.log('\n📋 Missing Transactions (First 10):');
        transactionsWithoutConversions.slice(0, 10).forEach((trans, index) => {
          console.log(`${index + 1}. ${trans.createdAt.toDateString()} - Rp ${parseFloat(trans.amount).toLocaleString('id-ID')} (ID: ${trans.id})`);
        });
      }
    }
    console.log();

    // 4. Check if affiliate commission calculation is correct
    console.log('🧮 Commission Calculation Analysis...\n');
    
    // Get membership/product commission rates
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

    // 5. Calculate expected commission from all transactions
    if (allTransactions.length > 0 && memberships.length > 0) {
      console.log('💰 Expected Commission Calculation:\n');
      
      let totalExpectedCommission = 0;
      
      for (const transaction of allTransactions.slice(0, 10)) { // Check first 10 for analysis
        // Find the membership for this transaction
        const membership = memberships.find(m => {
          // You might need to adjust this logic based on your transaction structure
          return transaction.membershipId === m.id;
        });
        
        if (membership) {
          const transactionAmount = parseFloat(transaction.amount);
          let commission = 0;
          
          if (membership.affiliateCommissionType === 'PERCENTAGE') {
            commission = transactionAmount * (membership.affiliateCommissionRate / 100);
          } else {
            commission = membership.affiliateCommissionRate;
          }
          
          totalExpectedCommission += commission;
          console.log(`- Transaction ${transaction.id}: Rp ${transactionAmount.toLocaleString('id-ID')} → Commission: Rp ${commission.toLocaleString('id-ID')}`);
        }
      }
      
      console.log(`\n📊 Sample Expected Commission (10 transactions): Rp ${totalExpectedCommission.toLocaleString('id-ID')}`);
    }

    // 6. Summary and recommendations
    console.log('\n=== SUMMARY & RECOMMENDATIONS ===\n');
    
    const profileEarnings = parseFloat(sutisna.totalEarnings);
    const conversionEarnings = conversions.reduce((sum, conv) => sum + parseFloat(conv.commissionAmount), 0);
    const difference = profileEarnings - conversionEarnings;
    
    console.log('📈 Data Summary:');
    console.log(`- AffiliateProfile Earnings: Rp ${profileEarnings.toLocaleString('id-ID')} (WordPress/Sejoli data)`);
    console.log(`- AffiliateConversion Earnings: Rp ${conversionEarnings.toLocaleString('id-ID')} (Next.js system data)`);
    console.log(`- Difference: Rp ${difference.toLocaleString('id-ID')}`);
    console.log(`- Conversion Count Difference: ${sutisna.totalConversions} vs ${conversions.length}`);
    
    if (difference > 0) {
      console.log('\n💡 Analysis:');
      console.log('- The discrepancy is normal for a migrated system');
      console.log('- AffiliateProfile contains historical WordPress data');
      console.log('- AffiliateConversion contains new Next.js system data');
      console.log('- Missing commissions are from historical transactions');
    }
    
    console.log('\n🔧 Recommendations:');
    console.log('1. Verify that new transactions are creating AffiliateConversion records');
    console.log('2. Consider historical data import if full synchronization is needed');
    console.log('3. Monitor commission calculation for new transactions');
    console.log('4. The 70M difference is historical data, not a calculation error');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTransactionDiscrepancy();