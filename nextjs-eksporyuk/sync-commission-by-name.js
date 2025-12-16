const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const sales = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
const commissionMap = JSON.parse(fs.readFileSync('product-commission-map.json', 'utf8'));

async function main() {
  console.log('=== SYNC COMMISSION BY NAME ===\n');
  
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
    
    let commission = 0;
    if (commissionMap[productId]) {
      commission = commissionMap[productId].commission;
    } else if (o.product?.affiliate) {
      const setting = o.product.affiliate['1'] || o.product.affiliate;
      commission = Number(setting?.fee) || 0;
    }
    
    if (!affiliateStats.has(affName)) {
      affiliateStats.set(affName, { 
        sejoliId: affId,
        totalEarnings: 0, 
        totalConversions: 0,
        totalSales: 0 
      });
    }
    const stats = affiliateStats.get(affName);
    stats.totalEarnings += commission;
    stats.totalConversions++;
    stats.totalSales += Number(o.grand_total) || 0;
  });
  
  console.log(`\nProcessing ${affiliateStats.size} affiliates...\n`);
  
  // Get all users with affiliate profile
  const allUsers = await prisma.user.findMany({
    include: { affiliateProfile: true }
  });
  
  // Create name -> user map (case insensitive, trim)
  const userByName = new Map();
  allUsers.forEach(u => {
    if (u.affiliateProfile) {
      userByName.set(u.name.toLowerCase().trim(), u);
    }
  });
  
  console.log(`Users dengan affiliate profile: ${userByName.size}`);
  
  let updated = 0;
  let notFound = 0;
  let foundList = [];
  let notFoundList = [];
  
  for (const [affName, stats] of affiliateStats) {
    const user = userByName.get(affName.toLowerCase().trim());
    
    if (!user) {
      notFound++;
      if (stats.totalEarnings > 1000000) {
        notFoundList.push({ name: affName, earnings: stats.totalEarnings });
      }
      continue;
    }
    
    try {
      // Update AffiliateProfile
      await prisma.affiliateProfile.update({
        where: { id: user.affiliateProfile.id },
        data: {
          totalEarnings: stats.totalEarnings,
          totalConversions: stats.totalConversions,
          totalSales: stats.totalSales
        }
      });
      
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
      
      if (stats.totalEarnings > 20000000) {
        foundList.push({ name: affName, earnings: stats.totalEarnings });
      }
    } catch (err) {
      console.error(`Error updating ${affName}:`, err.message);
    }
  }
  
  console.log('\n=== UPDATED (top earners) ===');
  foundList.sort((a, b) => b.earnings - a.earnings);
  foundList.forEach((f, i) => {
    console.log(`${i+1}. ${f.name} → Rp ${f.earnings.toLocaleString('id-ID')}`);
  });
  
  console.log('\n=== NOT FOUND (>1M earnings) ===');
  notFoundList.sort((a, b) => b.earnings - a.earnings);
  notFoundList.slice(0, 10).forEach((f, i) => {
    console.log(`${i+1}. ${f.name} → Rp ${f.earnings.toLocaleString('id-ID')}`);
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  
  // Tampilkan Top 10 di database setelah update
  console.log('\n=== TOP 10 DI DATABASE SETELAH UPDATE ===');
  const top10 = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    include: { user: true }
  });
  
  top10.forEach((a, i) => {
    console.log(`${i+1}. ${a.user.name} | Earnings: Rp ${Number(a.totalEarnings).toLocaleString('id-ID')} | Conv: ${a.totalConversions}`);
  });
  
  // Perbandingan dengan live
  console.log('\n=== PERBANDINGAN DENGAN LIVE ===');
  console.log('Live: Rahmat=169.6M, Asep=165M, Sutisna=132.8M, Hamid=131.6M, Yoga=93.6M');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

