const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAffiliateMigrationGap() {
  console.log('🔍 ANALYZE AFFILIATE MIGRATION GAP');
  console.log('==================================');

  try {
    // 1. Load sejoli data  
    const sejoliFull = fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8');
    const sejoli = JSON.parse(sejoliFull);
    
    // 2. Get current database state
    const transactions = await prisma.transaction.findMany({
      include: {
        affiliateConversion: true
      }
    });
    
    const affiliateConversions = await prisma.affiliateConversion.findMany();
    
    console.log('📊 COMPARISON SEJOLI vs DATABASE:');
    console.log(`Sejoli total orders: ${sejoli.orders.length}`);
    console.log(`Database transactions: ${transactions.length}`);
    console.log(`Sejoli completed orders: ${sejoli.orders.filter(o => o.status === 'completed').length}`);
    console.log(`Database SUCCESS transactions: ${transactions.filter(t => t.status === 'SUCCESS').length}`);
    console.log(`Sejoli orders with affiliate: ${sejoli.orders.filter(o => o.affiliate_id && o.affiliate_id !== '0').length}`);
    console.log(`Sejoli completed with affiliate: ${sejoli.orders.filter(o => o.status === 'completed' && o.affiliate_id && o.affiliate_id !== '0').length}`);
    console.log(`Database AffiliateConversions: ${affiliateConversions.length}`);
    
    // 3. Calculate total commission from Sejoli data
    let totalCommissionSejoli = 0;
    const productCommissionMap = {
      "248999": 50000,
      "249999": 50000,
      "499000": 150000,
      "999000": 300000,
      // Add more based on your mapping
    };
    
    sejoli.orders.forEach(order => {
      if (order.status === 'completed' && order.affiliate_id && order.affiliate_id !== '0') {
        const commission = productCommissionMap[order.grand_total] || 0;
        totalCommissionSejoli += commission;
      }
    });
    
    console.log('\n💰 COMMISSION CALCULATION:');
    console.log(`Expected commission from Sejoli: Rp ${totalCommissionSejoli.toLocaleString('id-ID')}`);
    console.log(`Current commission in DB: Rp ${affiliateConversions.reduce((sum, ac) => sum + parseFloat(ac.commissionAmount), 0).toLocaleString('id-ID')}`);
    
    console.log('\n🚨 MASALAH UTAMA:');
    console.log('Sejoli punya 11,291 completed orders dengan affiliate');
    console.log('Database hanya punya 760 AffiliateConversions');
    console.log('GAP: 10,531 missing affiliate conversions!');
    
    console.log('\n🔍 SAMPLE CHECK - Apakah transaction ada tapi tidak ada affiliateConversion:');
    const transactionsWithoutConversion = transactions.filter(t => t.status === 'SUCCESS' && !t.affiliateConversion);
    console.log(`Transactions SUCCESS tanpa AffiliateConversion: ${transactionsWithoutConversion.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAffiliateMigrationGap().catch(console.error);