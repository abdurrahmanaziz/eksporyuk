const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAffiliateConversions() {
  console.log('🔍 Testing Affiliate Conversions Relations');
  console.log('==========================================\n');

  try {
    // Test if we can query transactions with affiliate conversions
    console.log('Testing Transaction -> AffiliateConversion relation...');
    
    const transactionWithConversion = await prisma.transaction.findFirst({
      include: {
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      },
      where: {
        affiliateConversion: {
          isNot: null
        }
      }
    });

    if (transactionWithConversion) {
      console.log('✅ SUCCESS: Found transaction with affiliate conversion');
      console.log(`Invoice: ${transactionWithConversion.invoiceNumber}`);
      console.log(`Amount: Rp ${Number(transactionWithConversion.amount).toLocaleString('id-ID')}`);
      
      if (transactionWithConversion.affiliateConversion) {
        console.log(`Commission: Rp ${Number(transactionWithConversion.affiliateConversion.commissionAmount).toLocaleString('id-ID')}`);
        if (transactionWithConversion.affiliateConversion.affiliate?.user) {
          console.log(`Affiliate: ${transactionWithConversion.affiliateConversion.affiliate.user.name}`);
        }
      }
      console.log();
    } else {
      console.log('❌ No transactions with affiliate conversions found');
    }

    // Count total transactions vs conversions
    const totalTransactions = await prisma.transaction.count({
      where: { status: 'SUCCESS' }
    });
    
    const totalConversions = await prisma.affiliateConversion.count();
    
    console.log('📊 Database Stats:');
    console.log(`Total SUCCESS Transactions: ${totalTransactions}`);
    console.log(`Total Affiliate Conversions: ${totalConversions}`);
    console.log(`Coverage: ${((totalConversions / totalTransactions) * 100).toFixed(1)}%`);

    console.log('\n✅ Prisma relations are working correctly!');
    console.log('The admin/sales API should now display affiliate and commission data.');

  } catch (error) {
    console.error('❌ Error testing relations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAffiliateConversions();