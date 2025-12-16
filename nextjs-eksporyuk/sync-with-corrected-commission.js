const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
const commissionMap = JSON.parse(fs.readFileSync('product-commission-map.json', 'utf8'));

async function main() {
  console.log('=== SYNC DATABASE DENGAN COMMISSION MAP YANG BENAR ===\n');
  
  // HANYA COMPLETED ORDERS dengan affiliate
  const completed = sales.orders.filter(o => 
    o.status === 'completed' && 
    o.affiliate_id && 
    o.affiliate_id > 0
  );
  
  console.log(`Total completed orders dengan affiliate: ${completed.length}`);
  
  // Hitung totals per affiliate
  const affiliateStats = new Map();
  
  completed.forEach(o => {
    const affId = o.affiliate_id;
    const affName = o.affiliate_name || 'Unknown';
    const productId = String(o.product_id);
    
    // Prioritas: commission map > product.affiliate.fee
    let commission = 0;
    if (commissionMap[productId]) {
      commission = commissionMap[productId].commission;
    } else if (o.product?.affiliate) {
      const setting = o.product.affiliate['1'] || o.product.affiliate;
      commission = Number(setting?.fee) || 0;
    }
    
    if (!affiliateStats.has(affId)) {
      affiliateStats.set(affId, { 
        name: affName, 
        totalEarnings: 0, 
        totalConversions: 0,
        totalSales: 0 
      });
    }
    const stats = affiliateStats.get(affId);
    stats.totalEarnings += commission;
    stats.totalConversions++;
    stats.totalSales += Number(o.grand_total) || 0;
  });
  
  console.log(`\nProcessing ${affiliateStats.size} affiliates...\n`);
  
  // Update AffiliateProfile dan Wallet di database
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const [sejoliId, stats] of affiliateStats) {
    try {
      // Cari user berdasarkan sejoliId
      const user = await prisma.user.findFirst({
        where: { sejoliId: sejoliId },
        include: { affiliateProfile: true, wallet: true }
      });
      
      if (!user) {
        notFound++;
        continue;
      }
      
      // Update AffiliateProfile
      if (user.affiliateProfile) {
        await prisma.affiliateProfile.update({
          where: { id: user.affiliateProfile.id },
          data: {
            totalEarnings: stats.totalEarnings,
            totalConversions: stats.totalConversions,
            totalSales: stats.totalSales
          }
        });
      }
      
      // Update Wallet
      await prisma.wallet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          balance: stats.totalEarnings,
          balancePending: 0,
          totalWithdrawn: 0
        },
        update: {
          balance: stats.totalEarnings
        }
      });
      
      updated++;
      
      if (updated <= 10 || stats.totalEarnings > 50000000) {
        console.log(`✓ ${stats.name} (sejoli:${sejoliId}) → Earnings: Rp ${stats.totalEarnings.toLocaleString('id-ID')}, Conversions: ${stats.totalConversions}`);
      }
    } catch (err) {
      errors++;
      console.error(`Error updating ${stats.name}:`, err.message);
    }
  }
  
  console.log('\n=== HASIL ===');
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
  
  // Tampilkan Top 10 di database setelah update
  console.log('\n=== TOP 10 DI DATABASE SETELAH UPDATE ===');
  const top10 = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    include: { user: true }
  });
  
  top10.forEach((a, i) => {
    console.log(`${i+1}. ${a.user.name} | Earnings: Rp ${a.totalEarnings.toLocaleString('id-ID')} | Conversions: ${a.totalConversions}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

