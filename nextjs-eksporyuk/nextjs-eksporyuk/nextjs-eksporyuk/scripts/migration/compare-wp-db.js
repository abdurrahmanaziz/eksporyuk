/**
 * Compare WordPress export data with Next.js database
 * Find missing affiliates and verify earnings
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

async function main() {
  console.log('Loading WordPress data...');
  const wpData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  const completedOrders = wpData.orders.filter(o => o.status === 'completed');
  
  // Calculate WordPress affiliate stats
  const wpAffStats = {};
  completedOrders.forEach(o => {
    if (o.affiliate_id && o.affiliate_id > 0) {
      if (!wpAffStats[o.affiliate_id]) {
        wpAffStats[o.affiliate_id] = { sales: 0, count: 0 };
      }
      wpAffStats[o.affiliate_id].sales += parseFloat(o.grand_total || 0);
      wpAffStats[o.affiliate_id].count++;
    }
  });

  console.log('\n========================================');
  console.log('=== COMPARING TOP AFFILIATES ===');
  console.log('========================================');
  
  // Get top WP affiliates
  const topWpAff = Object.entries(wpAffStats)
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 30);

  console.log('Rank | WP Name                         | WP Sales          | DB Earnings       | Diff');
  console.log('-----|--------------------------------|-------------------|-------------------|--------');
  
  for (let i = 0; i < topWpAff.length; i++) {
    const [wpUserId, stats] = topWpAff[i];
    const wpUser = wpData.users.find(u => u.id == wpUserId);
    const wpName = wpUser?.display_name || 'Unknown';
    const wpEmail = wpUser?.user_email;
    
    // Find in Next.js DB
    let dbAff = null;
    if (wpEmail) {
      const dbUser = await prisma.user.findFirst({
        where: { email: wpEmail },
        include: { affiliateProfile: true }
      });
      dbAff = dbUser?.affiliateProfile;
    }
    
    const dbEarnings = dbAff?.totalEarnings || 0;
    const wpCommission = stats.sales * 0.30; // Assuming 30% commission
    const diff = dbEarnings - wpCommission;
    
    console.log(
      `${(i+1).toString().padStart(4)} | ${wpName.slice(0, 30).padEnd(30)} | Rp ${stats.sales.toLocaleString('id-ID').padStart(14)} | Rp ${dbEarnings.toLocaleString('id-ID').padStart(14)} | ${diff > 0 ? '+' : ''}${(diff/1000000).toFixed(1)}M`
    );
  }

  // Check specific cases
  console.log('\n========================================');
  console.log('=== SPECIFIC AFFILIATES CHECK ===');
  console.log('========================================');
  
  const checkEmails = [
    'asep.abdurrahman.w@gmail.com',
    'rahmatalfianto@gmail.com', // Rahmat Al Fianto
    'sutisna@mail.com',
    'yogaandrian@mail.com'
  ];
  
  for (const email of checkEmails) {
    const wpUser = wpData.users.find(u => u.user_email === email);
    if (wpUser) {
      const wpOrders = completedOrders.filter(o => o.affiliate_id === wpUser.id);
      const wpSales = wpOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
      
      const dbUser = await prisma.user.findFirst({
        where: { email },
        include: { affiliateProfile: true }
      });
      
      console.log(`\n${wpUser.display_name} (${email})`);
      console.log(`  WP User ID: ${wpUser.id}`);
      console.log(`  WP Orders: ${wpOrders.length}`);
      console.log(`  WP Sales: Rp ${wpSales.toLocaleString('id-ID')}`);
      console.log(`  WP Est. Commission (30%): Rp ${(wpSales * 0.30).toLocaleString('id-ID')}`);
      console.log(`  DB Has Affiliate: ${dbUser?.affiliateProfile ? 'YES' : 'NO'}`);
      if (dbUser?.affiliateProfile) {
        console.log(`  DB Earnings: Rp ${dbUser.affiliateProfile.totalEarnings.toLocaleString('id-ID')}`);
        console.log(`  DB Conversions: ${dbUser.affiliateProfile.totalConversions}`);
      }
    }
  }

  // Find affiliates in WP that have NO profile in DB
  console.log('\n========================================');
  console.log('=== AFFILIATES MISSING FROM DB ===');
  console.log('========================================');
  
  let missingCount = 0;
  let missingWithSales = 0;
  let missingSalesTotal = 0;
  
  for (const [wpUserId, stats] of Object.entries(wpAffStats)) {
    if (stats.sales > 0) {
      const wpUser = wpData.users.find(u => u.id == wpUserId);
      if (wpUser?.user_email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: wpUser.user_email },
          include: { affiliateProfile: true }
        });
        
        if (!dbUser?.affiliateProfile) {
          missingWithSales++;
          missingSalesTotal += stats.sales;
          if (missingWithSales <= 20) {
            console.log(`- ${wpUser.display_name} (${wpUser.user_email}) - ${stats.count} sales - Rp ${stats.sales.toLocaleString('id-ID')}`);
          }
        }
      }
    }
  }
  
  console.log(`\nTotal missing with sales: ${missingWithSales}`);
  console.log(`Total missing sales: Rp ${missingSalesTotal.toLocaleString('id-ID')}`);

  // Check products mapping
  console.log('\n========================================');
  console.log('=== PRODUCT/MEMBERSHIP MAPPING ===');
  console.log('========================================');
  
  const productIds = [...new Set(completedOrders.map(o => o.product_id))];
  console.log('Unique products in WP orders:', productIds.length);
  
  // Check memberships in DB
  const memberships = await prisma.membership.findMany({
    select: { id: true, name: true, price: true, duration: true }
  });
  console.log('Memberships in DB:', memberships.length);
  memberships.forEach(m => {
    console.log(`  - ${m.name}: Rp ${m.price.toLocaleString('id-ID')} (${m.duration} days)`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
