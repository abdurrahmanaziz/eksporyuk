const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAffiliateData() {
  console.log('🔍 Checking Affiliate & Commission Data in Transactions...\n');

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        invoiceNumber: { startsWith: 'INV' }
      },
      take: 10,
      include: {
        user: { select: { email: true, name: true } },
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: { select: { name: true, email: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Checking ${transactions.length} sample transactions\n`);
    console.log('═'.repeat(100) + '\n');

    transactions.forEach((tx, idx) => {
      const metadata = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
      
      console.log(`${idx + 1}. ${tx.invoiceNumber} - ${tx.user.email}`);
      console.log(`   Amount: Rp ${tx.amount.toLocaleString()}`);
      console.log(`   Type: ${tx.type}`);
      
      console.log(`\n   📋 Transaction Fields:`);
      console.log(`   - affiliateId: ${tx.affiliateId || 'NULL'}`);
      console.log(`   - affiliateShare: ${tx.affiliateShare ? `Rp ${tx.affiliateShare.toLocaleString()}` : 'NULL'}`);
      console.log(`   - founderShare: ${tx.founderShare ? `Rp ${tx.founderShare.toLocaleString()}` : 'NULL'}`);
      console.log(`   - coFounderShare: ${tx.coFounderShare ? `Rp ${tx.coFounderShare.toLocaleString()}` : 'NULL'}`);
      
      console.log(`\n   🔗 AffiliateConversion:`);
      if (tx.affiliateConversion) {
        console.log(`   ✅ ${tx.affiliateConversion.affiliate.user.name} - Rp ${tx.affiliateConversion.commissionAmount?.toLocaleString() || '0'}`);
      } else {
        console.log(`   ❌ NO RELATION`);
      }
      
      console.log('\n');
    });

    const stats = {
      total: transactions.length,
      withAffiliateId: transactions.filter(tx => tx.affiliateId).length,
      withAffiliateShare: transactions.filter(tx => tx.affiliateShare).length,
      withAffiliateConversion: transactions.filter(tx => tx.affiliateConversion).length,
    };
    
    console.log('📊 SUMMARY:');
    console.log(`Total: ${stats.total}, With Affiliate: ${stats.withAffiliateId}, With Commission: ${stats.withAffiliateShare}, With Conversion: ${stats.withAffiliateConversion}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAffiliateData();
